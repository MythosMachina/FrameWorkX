#!/usr/bin/env python3
import argparse
import json
import os
import random
import re
import shutil
import subprocess
import sys
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Optional, Tuple

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
VIDEO_EXTS = {".mp4", ".mov", ".mkv"}

DEFAULT_SETTINGS = {
    "capping_fps": 8,
    "capping_jpeg_quality": 2,
    "selection_target_per_character": 40,
    "selection_face_quota": 10,
    "selection_hamming_threshold": 6,
    "selection_hamming_relaxed": 4,
    "output_max_images": 600,
    "autotag_general_threshold": 0.55,
    "autotag_character_threshold": 0.4,
    "autotag_max_tags": 30,
    "autotag_model_id": "SmilingWolf/wd-eva02-large-tagger-v3",
}


@dataclass
class PipelinePaths:
    run_root: Path
    input_root: Path
    frames_root: Path
    raw_root: Path
    work_root: Path
    ready_root: Path
    output_root: Path
    archive_mp4: Path
    exports_root: Path


@dataclass
class TaggerSettings:
    model_id: str
    general_threshold: float
    character_threshold: float
    max_tags: int


@dataclass
class TaggerModel:
    model: object
    labels: List[str]
    general_index: List[int]
    character_index: List[int]
    config_input_size: Optional[Tuple[int, int, int]] = None


def build_paths(storage_root: str, user_id: str, run_id: str) -> PipelinePaths:
    run_root = Path(storage_root) / "users" / user_id / "datasets" / run_id
    input_root = run_root / "input"
    frames_root = run_root / "workflow" / "capped"
    raw_root = run_root / "workflow" / "raw"
    work_root = run_root / "workflow" / "work"
    ready_root = run_root / "workflow" / "ready"
    output_root = run_root / "outputs" / "datasets"
    archive_mp4 = run_root / "archive" / "mp4"
    exports_root = run_root / "exports"
    return PipelinePaths(
        run_root=run_root,
        input_root=input_root,
        frames_root=frames_root,
        raw_root=raw_root,
        work_root=work_root,
        ready_root=ready_root,
        output_root=output_root,
        archive_mp4=archive_mp4,
        exports_root=exports_root,
    )

def resolve_face_model_path(storage_root: str, run_root: Path) -> Path:
    shared = Path(storage_root) / "models" / "ftp" / "yolov12n-face.pt"
    if shared.exists():
        return shared
    return run_root / "models" / "face" / "yolov12n-face.pt"


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def ensure_dir_empty(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path, ignore_errors=True)
    path.mkdir(parents=True, exist_ok=True)


def iter_videos(root: Path) -> Iterable[Path]:
    for path in root.rglob("*"):
        if path.is_file() and path.suffix.lower() in VIDEO_EXTS:
            yield path


def rename_files_in_hierarchy(root_dir: Path) -> None:
    for dirpath, _, filenames in os.walk(root_dir):
        if not filenames:
            continue
        folder_name = os.path.basename(dirpath)
        for i, filename in enumerate(sorted(filenames), start=1):
            old_path = Path(dirpath) / filename
            if not old_path.is_file():
                continue
            name, ext = os.path.splitext(filename)
            new_name = f"{folder_name}_{i}{ext}"
            new_path = Path(dirpath) / new_name
            if new_path == old_path:
                continue
            os.rename(old_path, new_path)
            print(f"renamed: {old_path} -> {new_path}")


def cap_video(src: Path, out_dir: Path, fps: int, jpeg_quality: int) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    if any(out_dir.iterdir()):
        print(f"[skip] frames already exist: {out_dir}")
        return
    output_pattern = out_dir / "%06d.jpg"
    cmd = [
        "ffmpeg",
        "-loglevel",
        "warning",
        "-i",
        str(src),
        "-vf",
        f"fps={fps}",
        "-qscale:v",
        str(jpeg_quality),
        str(output_pattern),
    ]
    print(f"[cap] {src} -> {out_dir}")
    subprocess.run(cmd, check=True)


def ensure_face_model(model_path: Path) -> Optional[Path]:
    model_path.parent.mkdir(parents=True, exist_ok=True)
    if model_path.exists():
        return model_path
    url = "https://github.com/YapaLab/yolo-face/releases/download/v0.0.0/yolov12n-face.pt"
    try:
        from urllib.request import urlretrieve

        print(f"[face] downloading model to {model_path}")
        urlretrieve(url, model_path)
        return model_path
    except Exception as exc:
        print(f"[face] download failed: {exc}")
        return None


def load_face_detector(model_path: Path):
    try:
        from ultralytics import YOLO
    except Exception:
        return None
    resolved = ensure_face_model(model_path)
    if not resolved:
        return None
    try:
        return YOLO(resolved)
    except Exception as exc:
        print(f"[face] failed to load detector: {exc}")
        return None


def detect_faces(detector, image) -> list[Tuple[float, float, float, float]]:
    if detector is None:
        return []
    results = detector.predict(image, verbose=False)
    boxes: list[Tuple[float, float, float, float]] = []
    for result in results:
        if not hasattr(result, "boxes"):
            continue
        for box in result.boxes:
            if box.conf is not None and float(box.conf) < 0.25:
                continue
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            boxes.append((x1, y1, x2, y2))
    return boxes


def crop_faces(detector, frames_dir: Path, max_crops: int = 200, stride: int = 3) -> int:
    from PIL import Image
    import numpy as np

    face_dir = frames_dir / "face"
    face_dir.mkdir(parents=True, exist_ok=True)
    written = 0
    frames = sorted(p for p in frames_dir.iterdir() if p.is_file() and p.suffix.lower() in IMAGE_EXTS)
    for idx, frame_path in enumerate(frames):
        if idx % stride != 0:
            continue
        if written >= max_crops:
            break
        try:
            img = Image.open(frame_path)
        except Exception:
            continue
        boxes = detect_faces(detector, np.array(img))
        for box in boxes:
            if written >= max_crops:
                break
            w, h = img.size
            x1, y1, x2, y2 = box
            pad_x = (x2 - x1) * 0.2
            pad_y = (y2 - y1) * 0.2
            cx1 = max(0, int(x1 - pad_x))
            cy1 = max(0, int(y1 - pad_y))
            cx2 = min(w, int(x2 + pad_x))
            cy2 = min(h, int(y2 + pad_y))
            crop = img.crop((cx1, cy1, cx2, cy2))
            out_name = face_dir / f"{frame_path.stem}_face{written+1}{frame_path.suffix.lower()}"
            try:
                crop.save(out_name)
                written += 1
            except Exception:
                continue
    return written


def cap_all(source_root: Path, capping_root: Path, fps: int, jpeg_quality: int, facecap: bool, model_path: Path) -> List[Path]:
    produced: List[Path] = []
    detector = load_face_detector(model_path) if facecap else None
    for video in sorted(iter_videos(source_root)):
        rel_parent = video.parent.relative_to(source_root)
        out_dir = capping_root / rel_parent / video.stem
        cap_video(video, out_dir, fps=fps, jpeg_quality=jpeg_quality)
        if facecap and detector is not None:
            crops = crop_faces(detector, out_dir)
            if crops:
                print(f"[face] {video} -> {crops} crops")
        produced.append(out_dir)
    return produced


def move_videos_flat(videos: Iterable[Path], src_root: Path, dest_root: Path) -> None:
    ensure_dir(dest_root)
    for video in videos:
        dest = dest_root / video.name
        counter = 1
        while dest.exists():
            dest = dest_root / f"{video.stem}_{counter}{video.suffix}"
            counter += 1
        shutil.move(str(video), dest)


def move_capping_to_raw(frames_root: Path, raw_root: Path) -> None:
    if not frames_root.exists():
        return
    ensure_dir(raw_root)
    for entry in sorted(frames_root.iterdir()):
        if not entry.is_dir():
            continue
        dst = raw_root / entry.name
        if dst.exists():
            shutil.rmtree(dst, ignore_errors=True)
        shutil.move(str(entry), dst)


def move_images_to_raw(source_root: Path, raw_root: Path) -> None:
    ensure_dir(raw_root)
    for path in source_root.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in IMAGE_EXTS:
            continue
        rel = path.relative_to(source_root)
        dest = raw_root / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, dest)


def move_source_dirs_to_raw(source_root: Path, raw_root: Path) -> None:
    ensure_dir(raw_root)
    for entry in sorted(source_root.iterdir()):
        if entry.name in {".DS_Store"}:
            continue
        if entry.is_dir():
            dst = raw_root / entry.name
            if dst.exists():
                shutil.rmtree(dst, ignore_errors=True)
            shutil.move(str(entry), dst)


def iter_images(folder: Path) -> Iterable[Path]:
    for path in folder.rglob("*"):
        if path.is_file() and path.suffix.lower() in IMAGE_EXTS:
            yield path


def character_key(folder_name: str) -> str:
    if "_" in folder_name:
        base, last = folder_name.rsplit("_", 1)
        if last.isdigit():
            return base
    return folder_name


def phash(path: Path, size: int = 8):
    import numpy as np
    from PIL import Image

    img = Image.open(path).convert("L").resize((size * 4, size * 4), Image.LANCZOS)
    dct = np.fft.fft2(np.asarray(img, dtype=np.float32))
    dct_low = np.real(dct)[:size, :size]
    median = np.median(dct_low)
    bits = (dct_low > median).astype(np.uint8).flatten()
    return bits


def hamming(a, b) -> int:
    import numpy as np

    return int(np.count_nonzero(a != b))


def select_diverse(
    paths: List[Path],
    limit: int,
    seed_hashes: List[object] | None = None,
    threshold: int = 6,
    relaxed: int = 4,
) -> List[Tuple[Path, object]]:
    selected: List[Tuple[Path, object]] = []
    used_paths: set[Path] = set()

    def run_with_threshold(thresh: int, seeds: List[object]) -> None:
        hashes: List[object] = list(seeds)
        nonlocal selected, used_paths
        for p in sorted(paths):
            if p in used_paths:
                continue
            try:
                h = phash(p)
            except Exception:
                continue
            if all(hamming(h, prev_hash) >= thresh for prev_hash in hashes):
                hashes.append(h)
                selected.append((p, h))
                used_paths.add(p)
            if len(selected) >= limit:
                break

    seeds = list(seed_hashes) if seed_hashes else []
    run_with_threshold(threshold, seeds)
    if len(selected) < limit:
        run_with_threshold(relaxed, seeds)
    return selected


def run_selection(
    src_root: Path,
    dest_root: Path,
    face_quota: int,
    target_per_char: int,
    hamming_threshold: int,
    hamming_relaxed: int,
) -> None:
    if not src_root.exists():
        print(f"[warn] source root not found: {src_root}")
        return
    dest_root.mkdir(parents=True, exist_ok=True)

    top_level_images = sorted(
        p for p in src_root.iterdir() if p.is_file() and p.suffix.lower() in IMAGE_EXTS
    )
    folders: List[Path] = sorted(p for p in src_root.iterdir() if p.is_dir() and p.name != "00")
    if top_level_images:
        # Image-only runs may place files directly in raw root (without character subfolders).
        folders = [src_root] + folders

    for folder in folders:
        char = "input" if folder == src_root else character_key(folder.name)
        all_images: List[Path] = top_level_images if folder == src_root else list(iter_images(folder))
        face_imgs = [p for p in all_images if any("face" in part.lower() for part in p.parts)]
        other_imgs = [p for p in all_images if p not in face_imgs]

        def source_key(path: Path) -> str:
            rel = path.relative_to(folder)
            return rel.parts[0] if len(rel.parts) > 1 else "_root"

        def group_by_source(paths: List[Path]) -> dict[str, List[Path]]:
            grouped: dict[str, List[Path]] = {}
            for p in paths:
                grouped.setdefault(source_key(p), []).append(p)
            return {k: sorted(v) for k, v in grouped.items()}

        chosen_pairs: List[Tuple[Path, object]] = []

        face_groups = group_by_source(face_imgs)
        face_selected: List[Tuple[Path, object]] = []
        face_hashes: List[object] = []
        for paths in face_groups.values():
            if len(face_selected) >= face_quota:
                break
            picked = select_diverse(paths, limit=1, seed_hashes=face_hashes, threshold=hamming_threshold, relaxed=hamming_relaxed)
            face_selected.extend(picked)
            face_hashes.extend([h for _, h in picked])
        remaining_face = max(face_quota - len(face_selected), 0)
        if remaining_face > 0:
            all_faces_sorted = sorted(face_imgs)
            extra_faces = select_diverse(all_faces_sorted, limit=remaining_face, seed_hashes=face_hashes, threshold=hamming_threshold, relaxed=hamming_relaxed)
            face_selected.extend(extra_faces)
            face_hashes.extend([h for _, h in extra_faces])
        if len(face_selected) > face_quota:
            face_selected = face_selected[:face_quota]
        chosen_pairs.extend(face_selected)

        remaining = target_per_char - len(chosen_pairs)
        if remaining > 0 and other_imgs:
            other_groups = group_by_source(other_imgs)
            current_hashes = list(face_hashes)
            for paths in other_groups.values():
                if remaining <= 0:
                    break
                picked = select_diverse(paths, limit=1, seed_hashes=current_hashes, threshold=hamming_threshold, relaxed=hamming_relaxed)
                chosen_pairs.extend(picked)
                current_hashes.extend([h for _, h in picked])
                remaining = target_per_char - len(chosen_pairs)

            if remaining > 0:
                sorted_other = sorted(other_imgs)
                third = max(1, len(sorted_other) // 3)
                quadrants = [
                    sorted_other[:third],
                    sorted_other[third:2 * third],
                    sorted_other[2 * third:],
                ]
                for quad in quadrants:
                    if remaining <= 0:
                        break
                    if not quad:
                        continue
                    per_quad_limit = min(8, remaining)
                    sample = random.sample(quad, min(len(quad), per_quad_limit))
                    quad_selected = select_diverse(sample, limit=per_quad_limit, seed_hashes=current_hashes, threshold=hamming_threshold, relaxed=hamming_relaxed)
                    chosen_pairs.extend(quad_selected)
                    current_hashes.extend([h for _, h in quad_selected])
                    remaining = target_per_char - len(chosen_pairs)

        if len(chosen_pairs) < target_per_char:
            chosen_paths = {c[0] for c in chosen_pairs}
            for p in sorted(other_imgs):
                if p in chosen_paths:
                    continue
                chosen_pairs.append((p, object()))
                if len(chosen_pairs) >= target_per_char:
                    break

        if len(chosen_pairs) > target_per_char:
            chosen_pairs = chosen_pairs[:target_per_char]

        chosen = [p for p, _ in chosen_pairs]
        if not chosen:
            print(f"[skip] {char}: no images found")
            continue

        out_dir = dest_root / char
        out_dir.mkdir(parents=True, exist_ok=True)
        for idx, src in enumerate(chosen, start=1):
            dest = out_dir / f"{idx}{src.suffix.lower()}"
            counter = 1
            while dest.exists():
                dest = out_dir / f"{idx}_{counter}{src.suffix.lower()}"
                counter += 1
            shutil.copy2(src, dest)
        print(f"[ok] {char}: copied {len(chosen)} images to {out_dir}")


def crop_and_flip_folder(folder: Path) -> None:
    from PIL import Image

    pattern = re.compile(r"^[1-9][0-9]*\.(jpg|jpeg|png|bmp|webp)$", re.IGNORECASE)
    for file in sorted(folder.iterdir()):
        if not file.is_file() or not pattern.match(file.name):
            continue
        with Image.open(file) as original:
            w, h = original.size
            outputs = []
            base = file.stem
            ext = file.suffix.lower()
            def save(img: Image.Image, path: Path) -> None:
                counter = 1
                target = path
                while target.exists():
                    target = target.with_name(f"{path.stem}_{counter}{path.suffix}")
                    counter += 1
                img.save(target)
                outputs.append(target)

            save(original, folder / f"{base}_original{ext}")
            crops = {
                "top_half": (0, 0, w, h // 2),
                "bottom_half": (0, h // 2, w, h),
                "center": ((w - min(w, h)) // 2, (h - min(w, h)) // 2, (w + min(w, h)) // 2, (h + min(w, h)) // 2),
            }
            for name, box in crops.items():
                cropped = original.crop(box)
                save(cropped, folder / f"{base}_{name}{ext}")

            for path in list(outputs):
                with Image.open(path) as img:
                    flipped = img.transpose(Image.FLIP_LEFT_RIGHT)
                    save(flipped, path.with_name(f"{path.stem}_flip{path.suffix}"))


def cap_total_outputs(folder: Path, max_total: int) -> None:
    images = [p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in IMAGE_EXTS]
    if len(images) <= max_total:
        return
    overflow_dir = folder / "_overflow"
    overflow_dir.mkdir(parents=True, exist_ok=True)
    keep = set(random.sample(images, max_total))
    for img in images:
        if img in keep:
            continue
        shutil.move(str(img), overflow_dir / img.name)
    print(f"[cap] {folder.name}: trimmed to {len(keep)} images")


def run_crop_and_flip(target_dirs: List[Path], max_total: int) -> None:
    for folder in target_dirs:
        if not folder.is_dir() or folder.name.startswith("_"):
            continue
        crop_and_flip_folder(folder)
        cap_total_outputs(folder, max_total=max_total)


def load_tagger_settings(settings: dict) -> TaggerSettings:
    return TaggerSettings(
        model_id=str(settings.get("autotag_model_id") or DEFAULT_SETTINGS["autotag_model_id"]),
        general_threshold=float(settings.get("autotag_general_threshold", DEFAULT_SETTINGS["autotag_general_threshold"])),
        character_threshold=float(settings.get("autotag_character_threshold", DEFAULT_SETTINGS["autotag_character_threshold"])),
        max_tags=int(settings.get("autotag_max_tags", DEFAULT_SETTINGS["autotag_max_tags"])),
    )


def resolve_tagger_model_id(storage_root: str, model_id: str) -> str:
    if not model_id:
        return model_id
    local_path = Path(model_id)
    if local_path.exists():
        return str(local_path)
    candidate = Path(storage_root) / "tagger_models" / model_id
    if candidate.exists():
        return str(candidate)
    return model_id


def _load_model_files(model_id: str) -> Tuple[Path, Path, Path]:
    from huggingface_hub import hf_hub_download

    local_path = Path(model_id)
    if local_path.exists():
        weights = local_path / "model.safetensors"
        config = local_path / "config.json"
        tags = local_path / "selected_tags.csv"
        if weights.exists() and config.exists() and tags.exists():
            return weights, config, tags
    weights_path = hf_hub_download(model_id, "model.safetensors")
    config_path = hf_hub_download(model_id, "config.json")
    tags_path = hf_hub_download(model_id, "selected_tags.csv")
    return Path(weights_path), Path(config_path), Path(tags_path)


def load_tagger_model(settings: TaggerSettings) -> TaggerModel:
    import timm
    import torch
    from safetensors.torch import load_file as load_safetensors

    weights_path, config_path, tags_path = _load_model_files(settings.model_id)
    config = json.loads(config_path.read_text(encoding="utf-8"))
    labels: List[str] = []
    categories: List[int] = []
    try:
        with tags_path.open("r", encoding="utf-8") as handle:
            next(handle, None)
            for line in handle:
                parts = line.strip().split(",")
                if len(parts) < 3:
                    continue
                _, name, category, *_ = parts
                labels.append(name)
                categories.append(int(category))
    except Exception:
        labels = config.get("labels") or []
        categories = config.get("tag_categories") or []

    general_index = [i for i, cat in enumerate(categories) if cat == 0]
    character_index = [i for i, cat in enumerate(categories) if cat == 4]
    config_input_size = None
    pretrained_cfg = config.get("pretrained_cfg") or {}
    cfg_size = pretrained_cfg.get("input_size")
    if isinstance(cfg_size, (list, tuple)) and len(cfg_size) == 3:
        config_input_size = tuple(int(x) for x in cfg_size)

    model = timm.create_model(
        config.get("architecture") or "eva02_large_patch14_448",
        pretrained=False,
        num_classes=len(labels),
    )
    weights = load_safetensors(weights_path)
    try:
        model.load_state_dict(weights, strict=True)
    except RuntimeError:
        model_state = model.state_dict()
        filtered = {k: v for k, v in weights.items() if k in model_state}
        model.load_state_dict(filtered, strict=False)
    model.eval()
    if torch.cuda.is_available():
        model = model.to("cuda")
    return TaggerModel(
        model=model,
        labels=labels,
        general_index=general_index,
        character_index=character_index,
        config_input_size=config_input_size,
    )


def build_transform(model, config_input_size: Optional[Tuple[int, int, int]] = None):
    from timm.data import resolve_data_config
    from timm.data.transforms_factory import create_transform

    cfg = resolve_data_config({}, model=model, use_test_size=False)

    def _normalize_input_size(val: object) -> Optional[Tuple[int, int, int]]:
        if isinstance(val, (list, tuple)) and len(val) == 3:
            return tuple(int(x) for x in val)
        return None

    def _model_input_size() -> Tuple[int, int, int]:
        default_cfg = getattr(model, "default_cfg", None) or getattr(model, "pretrained_cfg", None) or {}
        cfg_input = _normalize_input_size(default_cfg.get("input_size"))
        if cfg_input:
            return cfg_input
        img_size = getattr(model, "img_size", None)
        if img_size is not None:
            if isinstance(img_size, (list, tuple)) and len(img_size) == 2:
                return (3, int(img_size[0]), int(img_size[1]))
            return (3, int(img_size), int(img_size))
        patch = getattr(model, "patch_embed", None)
        patch_size = getattr(patch, "img_size", None) if patch is not None else None
        if patch_size is not None:
            if isinstance(patch_size, (list, tuple)) and len(patch_size) == 2:
                return (3, int(patch_size[0]), int(patch_size[1]))
            return (3, int(patch_size), int(patch_size))
        return cfg["input_size"]

    expected_input = _model_input_size()
    cfg_input = _normalize_input_size(config_input_size)
    input_size = cfg_input if cfg_input == expected_input else expected_input
    cfg["input_size"] = input_size
    return create_transform(**cfg)


def _use_bgr_for_model(model_id: str) -> bool:
    """
    WD taggers are often trained with BGR channel order; swap channels to match.
    Accept both repo-style (org/wd-*) and local-id variants (org_wd-*).
    """
    lowered = model_id.lower()
    return "wd-" in lowered or "wd_" in lowered


def tag_image(image_path: Path, tagger: TaggerModel, settings: TaggerSettings, autochar_patterns: List[str], verify_colors: bool) -> str:
    import numpy as np
    import torch
    from PIL import Image

    model = tagger.model
    labels = tagger.labels
    if not labels:
        return ""
    transform = build_transform(model, tagger.config_input_size)
    use_bgr = _use_bgr_for_model(settings.model_id)

    img = Image.open(image_path).convert("RGB")
    input_tensor = transform(img).unsqueeze(0)
    if use_bgr:
        input_tensor = input_tensor[:, [2, 1, 0], :, :]
    if torch.cuda.is_available():
        input_tensor = input_tensor.to("cuda")
    with torch.no_grad():
        preds = model(input_tensor).squeeze(0)
        preds = torch.sigmoid(preds).cpu().numpy()

    general = []
    character = []
    for idx in tagger.general_index:
        if preds[idx] >= settings.general_threshold:
            general.append(labels[idx])
    for idx in tagger.character_index:
        if preds[idx] >= settings.character_threshold:
            character.append(labels[idx])

    tags = character + general
    tags = tags[: settings.max_tags]

    if autochar_patterns:
        regexes = [re.compile(pat, re.IGNORECASE) for pat in autochar_patterns]
        tags = [t for t in tags if not any(rx.search(t) for rx in regexes)]

    if verify_colors:
        tags = filter_color_tags(img, tags)

    return ", ".join(tags)


def filter_color_tags(img, tags: List[str]) -> List[str]:
    import numpy as np

    COLOR_RULES = {
        "blue": {"ranges": [(190, 255)], "sat_min": 0.25, "val_min": 0.15},
        "red": {"ranges": [(0, 25), (335, 360)], "sat_min": 0.25, "val_min": 0.15},
        "green": {"ranges": [(90, 150)], "sat_min": 0.2, "val_min": 0.15},
        "purple": {"ranges": [(260, 300)], "sat_min": 0.2, "val_min": 0.15},
        "pink": {"ranges": [(300, 340)], "sat_min": 0.2, "val_min": 0.2},
        "orange": {"ranges": [(20, 45)], "sat_min": 0.2, "val_min": 0.2},
        "yellow": {"ranges": [(45, 75)], "sat_min": 0.2, "val_min": 0.2},
        "gold": {"ranges": [(35, 65)], "sat_min": 0.25, "val_min": 0.2},
        "brown": {"ranges": [(10, 50)], "sat_min": 0.2, "val_min": 0.1, "val_max": 0.7},
        "black": {"ranges": [(0, 360)], "sat_max": 0.35, "val_max": 0.25},
        "white": {"ranges": [(0, 360)], "sat_max": 0.15, "val_min": 0.85},
        "gray": {"ranges": [(0, 360)], "sat_max": 0.2, "val_min": 0.2, "val_max": 0.9},
    }
    COLOR_PIXEL_FRACTION = 0.03

    hsv = np.array(img.convert("HSV"), dtype=np.float32)
    h = hsv[:, :, 0] * 2.0
    s = hsv[:, :, 1] / 255.0
    v = hsv[:, :, 2] / 255.0
    total = h.size

    def matches_color(color: str) -> bool:
        rules = COLOR_RULES.get(color)
        if not rules:
            return False
        mask = np.zeros(h.shape, dtype=bool)
        for low, high in rules.get("ranges", []):
            mask |= (h >= low) & (h <= high)
        if "sat_min" in rules:
            mask &= s >= rules["sat_min"]
        if "sat_max" in rules:
            mask &= s <= rules["sat_max"]
        if "val_min" in rules:
            mask &= v >= rules["val_min"]
        if "val_max" in rules:
            mask &= v <= rules["val_max"]
        return mask.sum() / total >= COLOR_PIXEL_FRACTION

    filtered: List[str] = []
    for tag in tags:
        base = tag.split(" ")[0].lower()
        if base in COLOR_RULES:
            if matches_color(base):
                filtered.append(tag)
        else:
            filtered.append(tag)
    return filtered


def normalize_trigger(raw: str) -> str:
    cleaned = " ".join(str(raw or "").strip().split())
    cleaned = cleaned.replace(",", " ").strip()
    lowered = cleaned.lower()
    for suffix in (".tar.gz", ".tgz", ".zip", ".rar", ".7z", ".tar"):
        if lowered.endswith(suffix):
            cleaned = cleaned[: -len(suffix)].strip()
            break
    return cleaned


def tag_folder(
    root: Path, settings: TaggerSettings, autochar_patterns: List[str], verify_colors: bool, trigger: str
) -> None:
    tagger = load_tagger_model(settings)
    trigger = normalize_trigger(trigger)
    for image in iter_images(root):
        tag_text = tag_image(image, tagger, settings, autochar_patterns, verify_colors)
        if trigger:
            tag_text = f"{trigger}, {tag_text}" if tag_text else trigger
        caption_path = image.with_suffix(".txt")
        caption_path.write_text(tag_text, encoding="utf-8")


def zip_folder(src: Path, dest_zip: Path) -> None:
    dest_zip.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(dest_zip, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, _, files in os.walk(src):
            for f in files:
                full = Path(root) / f
                arc = full.relative_to(src)
                zf.write(full, arcname=str(arc))


def run_step(step: str, payload: dict) -> dict:
    storage_root = payload["storage_root"]
    run_id = payload["run_id"]
    user_id = payload["user_id"]
    flags = payload.get("flags") or {}
    settings = dict(DEFAULT_SETTINGS)
    settings.update(payload.get("settings") or {})
    settings["autotag_model_id"] = resolve_tagger_model_id(
        storage_root, str(settings.get("autotag_model_id") or "")
    )
    autochar_patterns = payload.get("autochar_patterns") or []
    run_name = payload.get("run_name") or ""

    paths = build_paths(storage_root, user_id, run_id)
    images_only = bool(flags.get("imagesOnly"))

    if step == "rename":
        if paths.input_root.exists():
            rename_files_in_hierarchy(paths.input_root)
        return {}

    if step == "cap":
        if images_only:
            print("images_only: skip cap")
            return {}
        ensure_dir(paths.frames_root)
        cap_all(
            paths.input_root,
            paths.frames_root,
            fps=int(settings.get("capping_fps", DEFAULT_SETTINGS["capping_fps"])),
            jpeg_quality=int(settings.get("capping_jpeg_quality", DEFAULT_SETTINGS["capping_jpeg_quality"])),
            facecap=bool(flags.get("facecap")),
            model_path=resolve_face_model_path(storage_root, paths.run_root),
        )
        return {}

    if step == "archive":
        if images_only:
            print("images_only: skip archive")
            return {}
        videos = list(iter_videos(paths.input_root))
        move_videos_flat(videos, paths.input_root, paths.archive_mp4)
        return {}

    if step == "move_capped":
        if images_only:
            print("images_only: skip move_capped")
            return {}
        move_capping_to_raw(paths.frames_root, paths.raw_root)
        return {}

    if step == "merge_inputs":
        ensure_dir(paths.raw_root)
        move_source_dirs_to_raw(paths.input_root, paths.raw_root)
        if images_only:
            move_images_to_raw(paths.input_root, paths.raw_root)
        return {}

    if step == "select":
        run_selection(
            paths.raw_root,
            paths.work_root,
            face_quota=int(settings.get("selection_face_quota", DEFAULT_SETTINGS["selection_face_quota"])),
            target_per_char=int(settings.get("selection_target_per_character", DEFAULT_SETTINGS["selection_target_per_character"])),
            hamming_threshold=int(settings.get("selection_hamming_threshold", DEFAULT_SETTINGS["selection_hamming_threshold"])),
            hamming_relaxed=int(settings.get("selection_hamming_relaxed", DEFAULT_SETTINGS["selection_hamming_relaxed"])),
        )
        return {}

    if step == "cropflip":
        target_dirs = [p for p in paths.work_root.iterdir() if p.is_dir() and not p.name.startswith("_")]
        run_crop_and_flip(target_dirs, max_total=int(settings.get("output_max_images", DEFAULT_SETTINGS["output_max_images"])))
        return {}

    if step == "move_final":
        dest_root = paths.ready_root if flags.get("autotag") else paths.output_root
        ensure_dir(dest_root)
        for folder in paths.work_root.iterdir() if paths.work_root.exists() else []:
            if not folder.is_dir() or folder.name.startswith("_"):
                continue
            dst = dest_root / folder.name
            if dst.exists():
                shutil.rmtree(dst, ignore_errors=True)
            shutil.move(str(folder), dst)
        return {}

    if step == "autotag":
        tag_root = paths.ready_root if paths.ready_root.exists() else paths.output_root
        if not tag_root.exists():
            return {}
        tagger_settings = load_tagger_settings(settings)
        tag_folder(tag_root, tagger_settings, autochar_patterns, bool(flags.get("tagverify")), run_name)
        if tag_root != paths.output_root:
            ensure_dir(paths.output_root)
            for folder in tag_root.iterdir():
                if not folder.is_dir():
                    continue
                dst = paths.output_root / folder.name
                if dst.exists():
                    shutil.rmtree(dst, ignore_errors=True)
                shutil.move(str(folder), dst)
        return {}

    if step == "autochar":
        return {}

    if step == "package_dataset":
        ensure_dir(paths.exports_root)
        dataset_zip = paths.exports_root / f"{run_id}.zip"
        if paths.output_root.exists():
            zip_folder(paths.output_root, dataset_zip)
        return {"dataset_zip": str(dataset_zip)}

    return {}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    args = parser.parse_args()

    payload = json.loads(Path(args.input).read_text(encoding="utf-8"))
    step = payload.get("step")
    if not step:
        print("missing_step", file=sys.stderr)
        return 2
    result = run_step(step, payload)
    output_path = payload.get("output_path")
    if output_path:
        Path(output_path).write_text(json.dumps(result, indent=2), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
