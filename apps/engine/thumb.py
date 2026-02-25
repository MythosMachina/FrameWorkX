#!/usr/bin/env python3
import argparse
from pathlib import Path

from PIL import Image, ImageOps


def main() -> int:
    parser = argparse.ArgumentParser(description="Create a webp thumbnail.")
    parser.add_argument("--input", required=True, help="Source image path")
    parser.add_argument("--output", required=True, help="Target thumbnail path (.webp)")
    parser.add_argument("--size", type=int, default=384, help="Max edge size")
    parser.add_argument("--quality", type=int, default=82, help="WebP quality")
    args = parser.parse_args()

    src = Path(args.input)
    dst = Path(args.output)
    dst.parent.mkdir(parents=True, exist_ok=True)

    with Image.open(src) as image:
        image = ImageOps.exif_transpose(image)
        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGB")
        image.thumbnail((args.size, args.size), Image.Resampling.LANCZOS)
        image.save(dst, format="WEBP", quality=max(1, min(100, args.quality)), method=6)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
