#!/usr/bin/env python3
"""
Convert the real signage-module product photos into neutral technical line-art
(datasheet / patent-drawing style, charcoal hairlines, no fill) via gpt-image-1
image edits — so the line art stays faithful to the actual module geometry.
Outputs /public/assets/images/mod-<slug>-line.png (transparent). The original
photos (mod-<slug>.png) are left untouched.

Usage:
    python3 scripts/generate-signage-lineart.py            # missing only
    python3 scripts/generate-signage-lineart.py --only eco
    python3 scripts/generate-signage-lineart.py --force
"""
import argparse
import base64
import sys
import time
from pathlib import Path

import requests

ENV_PATH = Path("/Users/marketing/Desktop/wellforces_automation/wf_image_pipeline/.env")
OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "assets" / "images"
SLUGS = ["mini", "eco", "pro", "rgb", "24v", "sidelit"]

PROMPT = (
    "Convert this LED signage module into a precise technical engineering line drawing, like a "
    "patent illustration or datasheet diagram. Thin, uniform, single-colour dark charcoal (#1a2332) "
    "outlines only — NO colour fills, NO shading, NO red or blue tints, pure line work on a transparent "
    "background. Stay faithful to the real geometry of this exact module (housing shape, the number and "
    "layout of the LED lenses, lead wires), adding concentric detail lines on each lens. Clean CAD "
    "blueprint aesthetic, crisp hairline strokes, technical and industrial, not cartoonish, no flat-colour areas."
)


def load_env_key() -> str:
    if not ENV_PATH.exists():
        sys.exit(f"env file not found: {ENV_PATH}")
    for line in ENV_PATH.read_text().splitlines():
        if line.startswith("OPENAI_API_KEY="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    sys.exit(f"OPENAI_API_KEY not in {ENV_PATH}")


def generate(slug: str, api_key: str) -> None:
    src = OUT_DIR / f"mod-{slug}.png"
    out = OUT_DIR / f"mod-{slug}-line.png"
    if not src.exists():
        print(f"  [skip] source photo missing: {src.name}")
        return
    print(f"\n[gen] {out.name}  (from {src.name})")
    for attempt in range(4):
        r = requests.post(
            "https://api.openai.com/v1/images/edits",
            headers={"Authorization": f"Bearer {api_key}"},
            data={
                "model": "gpt-image-1",
                "prompt": PROMPT,
                "size": "1024x1024",
                "background": "transparent",
                "quality": "medium",
                "n": "1",
            },
            files={"image": (src.name, src.read_bytes(), "image/png")},
            timeout=300,
        )
        if r.status_code == 200:
            out.write_bytes(base64.b64decode(r.json()["data"][0]["b64_json"]))
            print(f"  WROTE {out.name} ({out.stat().st_size // 1024} KB)")
            return
        print(f"  attempt {attempt + 1} HTTP {r.status_code}")
        time.sleep(4)
    print(f"  FAILED after retries: {out.name}")


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--only")
    p.add_argument("--force", action="store_true")
    args = p.parse_args()
    api_key = load_env_key()
    slugs = [args.only] if args.only else SLUGS
    for slug in slugs:
        if slug not in SLUGS:
            sys.exit(f"unknown slug: {slug}")
        out = OUT_DIR / f"mod-{slug}-line.png"
        if out.exists() and not args.force:
            print(f"[skip] {out.name} exists (use --force)")
            continue
        generate(slug, api_key)
        time.sleep(1)


if __name__ == "__main__":
    main()
