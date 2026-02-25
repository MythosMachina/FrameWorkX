#!/usr/bin/env python3
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path
from typing import Dict, Iterable, List, Tuple

IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}

DEFAULT_SETTINGS = {
    "trainer_resolution": 1024,
    "trainer_batch_size": 1,
    "trainer_grad_accum": 4,
    "trainer_epochs": 10,
    "trainer_max_train_steps": 0,
    "trainer_learning_rate": 1e-4,
    "trainer_te_learning_rate": 5e-5,
    "trainer_lr_scheduler": "cosine",
    "trainer_lr_warmup_steps": 0,
    "trainer_lora_rank": 32,
    "trainer_lora_alpha": 32,
    "trainer_clip_skip": 2,
    "trainer_network_dropout": 0.0,
    "trainer_caption_dropout": 0.0,
    "trainer_shuffle_caption": True,
    "trainer_min_snr_gamma": 5.0,
    "trainer_noise_offset": 0.0,
    "trainer_weight_decay": 0.01,
    "trainer_use_8bit_adam": True,
    "trainer_gradient_checkpointing": True,
    "trainer_optimizer": "adamw",
    "trainer_enable_bucket": True,
    "trainer_bucket_no_upscale": True,
    "trainer_random_crop": False,
}

DEFAULT_SAMPLE_NEGATIVE_PROMPT = (
    "worst quality, low quality, lowres, blurry, jpeg artifacts, text, watermark, logo, signature, "
    "deformed, bad anatomy, bad hands, extra digits, fewer digits, cropped"
)



def as_int(val, default):
    try:
        return int(val)
    except Exception:
        return default


def as_float(val, default):
    try:
        return float(val)
    except Exception:
        return default


def as_bool(val, default=False):
    if isinstance(val, bool):
        return val
    if val is None:
        return default
    if isinstance(val, (int, float)):
        return bool(val)
    return str(val).strip().lower() in {"1", "true", "yes", "on"}


def find_trainer_root() -> Path:
    override = os.environ.get("FRAMEWORKX_TRAINER_ROOT")
    if override:
        return Path(override)
    return Path("/ai/dockercenter/FrameWorkX/apps/trainer")


def find_accelerate_bin() -> Path:
    env_bin = os.environ.get("FRAMEWORKX_TRAINER_VENV")
    if env_bin:
        path = Path(env_bin)
        if path.is_file():
            path = path.parent
        candidate = path / "accelerate"
        if candidate.exists():
            return candidate
        candidate = path / "bin" / "accelerate"
        if candidate.exists():
            return candidate
    return Path("/ai/dockercenter/FrameWorkX/.venv/bin/accelerate")


def find_train_script(trainer_root: Path, is_xl: bool) -> Path:
    if is_xl:
        candidate = trainer_root / "sd-scripts" / "sdxl_train_network.py"
        if candidate.exists():
            return candidate
    for candidate in [
        trainer_root / "sd-scripts" / "train_network.py",
        trainer_root / "train_network.py",
    ]:
        if candidate.exists():
            return candidate
    raise FileNotFoundError(f"trainer script not found under {trainer_root}")


def extract_zip(src: Path, dst: Path) -> None:
    dst.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(src, "r") as zf:
        zf.extractall(dst)


def collect_images(src: Path, dst: Path, min_size: int = 64) -> int:
    from PIL import Image

    dst.mkdir(parents=True, exist_ok=True)
    count = 0
    for path in src.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() in IMAGE_EXTS:
            try:
                with Image.open(path) as img:
                    w, h = img.size
                if w < min_size or h < min_size:
                    continue
            except Exception:
                continue
            target = dst / path.name
            shutil.copy2(path, target)
            caption = path.with_suffix(".txt")
            if caption.exists():
                shutil.copy2(caption, target.with_suffix(".txt"))
            count += 1
    return count


def dataset_image_bounds(root: Path) -> Tuple[int | None, int | None]:
    from PIL import Image

    min_side = None
    max_side = None
    for path in root.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in IMAGE_EXTS:
            continue
        try:
            with Image.open(path) as img:
                w, h = img.size
        except Exception:
            continue
        current_min = min(w, h)
        current_max = max(w, h)
        min_side = current_min if min_side is None else min(min_side, current_min)
        max_side = current_max if max_side is None else max(max_side, current_max)
    return min_side, max_side


def build_args(settings: Dict[str, object], base_model: str, train_root: Path, output_dir: Path, output_name: str) -> List[str]:
    cfg = dict(DEFAULT_SETTINGS)
    cfg.update(settings or {})
    resolution = as_int(cfg.get("trainer_resolution"), 1024)
    lr = as_float(cfg.get("trainer_learning_rate"), 1e-4)
    te_lr = as_float(cfg.get("trainer_te_learning_rate"), lr)
    weight_decay = as_float(cfg.get("trainer_weight_decay"), 0.0)
    args = [
        "--pretrained_model_name_or_path",
        base_model,
        "--train_data_dir",
        str(train_root),
        "--output_dir",
        str(output_dir),
        "--output_name",
        output_name,
        "--resolution",
        f"{resolution},{resolution}",
        "--caption_extension",
        ".txt",
        "--train_batch_size",
        str(as_int(cfg.get("trainer_batch_size"), 1)),
        "--gradient_accumulation_steps",
        str(as_int(cfg.get("trainer_grad_accum"), 1)),
        "--network_dim",
        str(as_int(cfg.get("trainer_lora_rank"), 32)),
        "--network_alpha",
        str(as_int(cfg.get("trainer_lora_alpha"), 32)),
        "--learning_rate",
        str(lr),
        "--text_encoder_lr",
        str(te_lr),
        "--lr_scheduler",
        str(cfg.get("trainer_lr_scheduler") or "constant"),
        "--max_grad_norm",
        str(as_float(cfg.get("trainer_max_grad_norm"), 0)),
        "--min_snr_gamma",
        str(as_float(cfg.get("trainer_min_snr_gamma"), 0.0)),
        "--noise_offset",
        str(as_float(cfg.get("trainer_noise_offset"), 0.0)),
        "--network_module",
        "networks.lora",
    ]

    max_steps = as_int(cfg.get("trainer_max_train_steps"), 0)
    epochs = as_int(cfg.get("trainer_epochs"), 10)
    if max_steps > 0:
        args += ["--max_train_steps", str(max_steps)]
    else:
        args += ["--max_train_epochs", str(epochs)]

    if as_bool(cfg.get("trainer_use_8bit_adam"), True):
        args.append("--use_8bit_adam")
    if as_bool(cfg.get("trainer_gradient_checkpointing"), True):
        args.append("--gradient_checkpointing")
    if as_bool(cfg.get("trainer_shuffle_caption"), True):
        args.append("--shuffle_caption")
    caption_dropout = as_float(cfg.get("trainer_caption_dropout"), 0.0)
    if caption_dropout > 0:
        args += ["--caption_dropout_rate", str(caption_dropout)]

    clip_skip = as_int(cfg.get("trainer_clip_skip"), 0)
    if clip_skip > 0:
        args += ["--clip_skip", str(clip_skip)]

    if as_bool(cfg.get("trainer_enable_bucket"), True):
        args.append("--enable_bucket")
        min_reso = as_int(cfg.get("trainer_bucket_min_reso"), 0)
        max_reso = as_int(cfg.get("trainer_bucket_max_reso"), 0)
        step_reso = as_int(cfg.get("trainer_bucket_step"), 0)
        if step_reso > 0:
            args += ["--bucket_reso_steps", str(step_reso)]
        if min_reso > 0:
            args += ["--min_bucket_reso", str(min_reso)]
        if max_reso > 0:
            args += ["--max_bucket_reso", str(max_reso)]
        if as_bool(cfg.get("trainer_bucket_no_upscale"), True):
            args.append("--bucket_no_upscale")

    if as_bool(cfg.get("trainer_random_crop"), False):
        args.append("--random_crop")

    if weight_decay > 0:
        args += ["--optimizer_args", f"weight_decay={weight_decay}"]

    sample_prompts = cfg.get("trainer_sample_prompts")
    sample_trigger = str(cfg.get("trainer_trigger") or output_name or "trigger").strip()
    sample_trigger = re.sub(r"\.zip$", "", sample_trigger, flags=re.IGNORECASE) or "trigger"
    sample_steps = max(1, min(1000, as_int(cfg.get("trainer_sample_steps"), 60)))
    sample_sampler = str(cfg.get("trainer_sample_sampler") or "euler_a").strip() or "euler_a"
    sample_negative = str(cfg.get("trainer_sample_negative_prompt") or DEFAULT_SAMPLE_NEGATIVE_PROMPT).strip()
    if isinstance(sample_prompts, (list, tuple)):
        samples = [str(p).strip() for p in sample_prompts if str(p).strip()]
    else:
        samples = []
    if samples:
        normalized_samples: List[str] = []
        for prompt in samples:
            next_prompt = re.sub(r"(\{trigger\}|<trigger>)", sample_trigger, prompt, flags=re.IGNORECASE)
            if " --s " not in f" {next_prompt} ":
                next_prompt = f"{next_prompt} --s {sample_steps}"
            if " --ss " not in f" {next_prompt} ":
                next_prompt = f"{next_prompt} --ss {sample_sampler}"
            if sample_negative and " --n " not in f" {next_prompt} ":
                next_prompt = f"{next_prompt} --n {sample_negative}"
            normalized_samples.append(next_prompt)
        sample_path = output_dir / "sample_prompts.txt"
        sample_path.write_text("\n".join(normalized_samples) + "\n", encoding="utf-8")
        args += ["--sample_prompts", str(sample_path)]
        args += ["--sample_sampler", sample_sampler]
        every_epochs = as_int(cfg.get("trainer_sample_every_n_epochs"), 0)
        if every_epochs > 0:
            args += ["--sample_every_n_epochs", str(every_epochs)]

    return args


def find_latest_model(output_dir: Path) -> Path | None:
    candidates = sorted(output_dir.glob("*.safetensors"), key=lambda p: p.stat().st_mtime, reverse=True)
    if candidates:
        return candidates[0]
    return None


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    args = parser.parse_args()

    payload = json.loads(Path(args.input).read_text(encoding="utf-8"))
    dataset_path = Path(payload.get("dataset_path", ""))
    output_dir = Path(payload.get("output_dir", ""))
    base_model = payload.get("base_model_path")
    settings = payload.get("settings") or {}
    run_id = payload.get("run_id") or "run"

    if not dataset_path.exists():
        print("dataset_missing", file=sys.stderr)
        return 2
    if not base_model:
        print("base_model_missing", file=sys.stderr)
        return 3

    output_dir.mkdir(parents=True, exist_ok=True)
    raw_dir = output_dir / "dataset" / "raw"
    stage_dir = output_dir / "dataset" / f"1_{run_id}"
    if raw_dir.exists():
        shutil.rmtree(raw_dir)
    if stage_dir.exists():
        shutil.rmtree(stage_dir)
    raw_dir.mkdir(parents=True, exist_ok=True)

    if dataset_path.suffix.lower() == ".zip":
        extract_zip(dataset_path, raw_dir)
    elif dataset_path.is_dir():
        shutil.copytree(dataset_path, raw_dir, dirs_exist_ok=True)
    else:
        shutil.copy2(dataset_path, raw_dir / dataset_path.name)

    count = collect_images(raw_dir, stage_dir)
    if count == 0:
        print("no_training_images", file=sys.stderr)
        return 4

    trainer_root = find_trainer_root()
    accel_bin = find_accelerate_bin()
    is_xl = "xl" in str(base_model).lower()
    script_path = find_train_script(trainer_root, is_xl)
    resolution = as_int(settings.get("trainer_resolution"), 1024)

    dataset_root = output_dir / "dataset"
    min_side, max_side = dataset_image_bounds(stage_dir)
    if as_bool(settings.get("trainer_enable_bucket"), True) and min_side and max_side:
        step_reso = as_int(settings.get("trainer_bucket_step"), 64)
        min_setting = as_int(settings.get("trainer_bucket_min_reso"), resolution)
        max_setting = as_int(settings.get("trainer_bucket_max_reso"), resolution)
        max_bucket = max(step_reso, min(max_setting, max_side - (max_side % step_reso)))
        if max_bucket < step_reso:
            max_bucket = step_reso
        min_bucket = max(
            step_reso,
            min(min_setting, max_bucket, min_side - (min_side % step_reso) if min_side >= step_reso else step_reso)
        )
        settings = dict(settings)
        settings["trainer_bucket_min_reso"] = min_bucket
        settings["trainer_bucket_max_reso"] = max_bucket
        settings["trainer_bucket_no_upscale"] = False if min_side < min_setting else settings.get("trainer_bucket_no_upscale", True)
        settings["trainer_resolution"] = max_bucket
    train_args = build_args(settings, str(base_model), dataset_root, output_dir, str(run_id))
    cmd = [str(accel_bin), "launch", str(script_path)] + train_args

    env = os.environ.copy()
    env["PYTHONUNBUFFERED"] = "1"
    proc = subprocess.run(cmd, cwd=str(trainer_root), env=env)
    if proc.returncode != 0:
        print(f"training_failed_{proc.returncode}", file=sys.stderr)
        return 5

    model_path = find_latest_model(output_dir)
    if not model_path:
        print("training_output_missing", file=sys.stderr)
        return 6
    final_path = output_dir / "model.safetensors"
    if model_path != final_path:
        shutil.copy2(model_path, final_path)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
