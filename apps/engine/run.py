#!/usr/bin/env python3
import argparse
import gc
import json
import os
import sys
from typing import Any, Dict, List

try:
    import torch
    from diffusers import StableDiffusionPipeline, StableDiffusionXLPipeline
    from diffusers import (
        DDIMScheduler,
        DPMSolverMultistepScheduler,
        EulerAncestralDiscreteScheduler,
        EulerDiscreteScheduler,
        HeunDiscreteScheduler,
        KDPM2AncestralDiscreteScheduler,
        KDPM2DiscreteScheduler,
        LMSDiscreteScheduler,
        PNDMScheduler,
        UniPCMultistepScheduler,
    )
except Exception as exc:
    print(f"engine_import_error: {exc}", file=sys.stderr)
    sys.exit(2)

SAMPLER_MAP = {
    "Euler": EulerDiscreteScheduler,
    "Euler a": EulerAncestralDiscreteScheduler,
    "DDIM": DDIMScheduler,
    "DPM++ 2M": DPMSolverMultistepScheduler,
    "DPM++ SDE": DPMSolverMultistepScheduler,
    "DPM++ 2M Karras": DPMSolverMultistepScheduler,
    "DPM++ SDE Karras": DPMSolverMultistepScheduler,
    "DPM2": KDPM2DiscreteScheduler,
    "DPM2 a": KDPM2AncestralDiscreteScheduler,
    "Heun": HeunDiscreteScheduler,
    "LMS": LMSDiscreteScheduler,
    "PLMS": PNDMScheduler,
    "UniPC": UniPCMultistepScheduler,
}

SCHEDULE_MAP = {
    "Karras": {"use_karras_sigmas": True},
    "Exponential": {"sigma_schedule": "exponential"},
    "SGM Uniform": {"sigma_schedule": "sgm_uniform"},
    "Simple": {"sigma_schedule": "simple"},
    "Beta": {"sigma_schedule": "beta"},
    "PolyExponential": {"sigma_schedule": "polyexponential"},
}

DPM_ALGO = {
    "DPM++ 2M": "dpmsolver++",
    "DPM++ SDE": "sde-dpmsolver++",
    "DPM++ 2M Karras": "dpmsolver++",
    "DPM++ SDE Karras": "sde-dpmsolver++",
}

DPM_SOLVER_ORDER = {
    "DPM++ 2M": 2,
    "DPM++ SDE": 2,
    "DPM++ 2M Karras": 2,
    "DPM++ SDE Karras": 2,
}


def filter_kwargs(cls, overrides: Dict[str, Any]) -> Dict[str, Any]:
    try:
        import inspect

        params = inspect.signature(cls.__init__).parameters
        return {key: value for key, value in overrides.items() if key in params}
    except Exception:
        return overrides


def build_scheduler(pipe, sampler_name: str, schedule_name: str):
    cls = SAMPLER_MAP.get(sampler_name, pipe.scheduler.__class__)
    overrides: Dict[str, Any] = {}

    if sampler_name in DPM_ALGO:
        overrides["algorithm_type"] = DPM_ALGO[sampler_name]
    if sampler_name in DPM_SOLVER_ORDER:
        overrides["solver_order"] = DPM_SOLVER_ORDER[sampler_name]

    schedule_overrides = SCHEDULE_MAP.get(schedule_name, {})
    overrides.update(schedule_overrides)

    if sampler_name.endswith("Karras"):
        overrides["use_karras_sigmas"] = True

    safe_overrides = filter_kwargs(cls, overrides)
    try:
        return cls.from_config(pipe.scheduler.config, **safe_overrides)
    except Exception:
        try:
            return cls.from_config(pipe.scheduler.config)
        except Exception as exc:
            print(f"scheduler_build_failed: {exc}", file=sys.stderr)
            return pipe.scheduler


def load_loras(pipe, lora_paths: List[str]):
    if not lora_paths:
        return
    adapter_names = []
    for idx, path in enumerate(lora_paths):
        adapter_name = f"lora_{idx}"
        pipe.load_lora_weights(path, adapter_name=adapter_name)
        adapter_names.append(adapter_name)
    try:
        pipe.set_adapters(adapter_names)
    except Exception:
        pass
    try:
        pipe.fuse_lora()
    except Exception:
        pass


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    args = parser.parse_args()

    with open(args.input, "r", encoding="utf-8") as handle:
        payload = json.load(handle)

    prompt = payload.get("prompt", "")
    if not prompt:
        print("prompt_required", file=sys.stderr)
        return 3

    model_path = payload.get("model_path")
    if not model_path or not os.path.exists(model_path):
        print("model_path_missing", file=sys.stderr)
        return 4

    output_dir = payload.get("output_dir")
    if not output_dir:
        print("output_dir_missing", file=sys.stderr)
        return 5

    os.makedirs(output_dir, exist_ok=True)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    dtype = torch.float16 if device == "cuda" else torch.float32
    memory_mode = str(payload.get("memory_mode") or "default").strip().lower()
    low_vram_mode = memory_mode in {"low_vram", "safe", "balanced"}

    pipe = None
    try:
        pipe = StableDiffusionXLPipeline.from_single_file(model_path, torch_dtype=dtype)
    except Exception as exc:
        try:
            pipe = StableDiffusionPipeline.from_single_file(model_path, torch_dtype=dtype)
        except Exception as exc_inner:
            print(f"model_load_failed: {exc} | {exc_inner}", file=sys.stderr)
            return 6
    try:
        pipe.safety_checker = None
    except Exception:
        pass

    pipe.scheduler = build_scheduler(pipe, payload.get("sampler", ""), payload.get("scheduler", ""))

    if device == "cuda" and low_vram_mode:
        try:
            pipe.enable_vae_slicing()
        except Exception:
            pass
        try:
            pipe.enable_vae_tiling()
        except Exception:
            pass
        try:
            pipe.enable_attention_slicing("max")
        except Exception:
            pass
        try:
            pipe.enable_model_cpu_offload()
        except Exception:
            try:
                pipe.to(device)
            except Exception:
                pipe = pipe.to(device)
    else:
        try:
            pipe.to(device)
        except Exception:
            pipe = pipe.to(device)
        try:
            pipe.enable_xformers_memory_efficient_attention()
        except Exception:
            pass

    load_loras(pipe, payload.get("lora_paths", []))

    prompt_variants = payload.get("prompt_variants") or []
    if not isinstance(prompt_variants, list):
        prompt_variants = []
    prompt_variants = [str(item).strip() for item in prompt_variants if str(item).strip()]
    batch_count = max(1, int(payload.get("batch_count", 1)))
    prompts = prompt_variants if prompt_variants else [prompt] * batch_count
    seed = payload.get("seed")
    images = []
    for idx, prompt_item in enumerate(prompts):
        generator = None
        if seed is not None:
            generator = torch.Generator(device=device).manual_seed(int(seed) + idx)
        result = pipe(
            prompt=prompt_item,
            negative_prompt=payload.get("negative_prompt") or None,
            width=int(payload.get("width", 1024)),
            height=int(payload.get("height", 1024)),
            num_inference_steps=int(payload.get("steps", 30)),
            guidance_scale=float(payload.get("cfg_scale", 7.5)),
            generator=generator,
            num_images_per_prompt=1,
        )
        batch_images = getattr(result, "images", []) or []
        images.extend(batch_images[:1])

    for idx, image in enumerate(images):
        out_path = os.path.join(output_dir, f"output_{idx + 1:03d}.png")
        image.save(out_path)

    try:
        del pipe
        gc.collect()
        if device == "cuda":
            torch.cuda.empty_cache()
    except Exception:
        pass

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
