#!/usr/bin/env python3
"""
Generate demo project/installation scene images for the /projects redesign using
OpenAI's gpt-image-1. Loads OPENAI_API_KEY from the wellforces_automation env file
(envo-website-v2's own .env.local doesn't carry the key).

Usage:
    python3 scripts/generate-project-scenes.py            # generates missing files
    python3 scripts/generate-project-scenes.py --force    # regenerates everything

Output: /public/assets/images/projects/<name>.jpg  (1536x1024 landscape)
"""
import argparse
import base64
import os
import sys
import time
from pathlib import Path

import requests

ENV_PATH = Path("/Users/marketing/Desktop/wellforces_automation/wf_image_pipeline/.env")
OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "assets" / "images" / "projects"

_NEUTRAL = (
    "Brand-neutral, no readable real brand names or logos. Cinematic, photoreal, "
    "professional commercial architectural photography for an LED lighting brand."
)

PROMPTS = {
    "project-marina-bay-facade": (
        "Nighttime architectural photograph of a tall modern waterfront tower whose entire "
        "facade is covered with a programmable RGBW LED media display showing abstract, "
        "colourful synchronised content. Calm harbour water in the foreground with long "
        "mirror-like reflections, distant city skyline. Wide cinematic shot. " + _NEUTRAL
    ),
    "project-northgate-mall": (
        "Dusk exterior photograph of a contemporary shopping mall entrance with large "
        "illuminated channel-letter signage glowing clean, even white light through acrylic "
        "faces. Modern glass-and-metal facade, abstract neutral wordmark. " + _NEUTRAL
    ),
    "project-aurora-hotel-lobby": (
        "Interior photograph of a luxurious modern hotel lobby at evening, with warm linear "
        "LED cove lighting washing the ceiling coffers and feature walls. Elegant minimalist "
        "design, reception desk, soft reflections on polished stone floor. " + _NEUTRAL
    ),
    "project-westpark-arena": (
        "Nighttime photograph of a large modern sports arena exterior, its curved architecture "
        "traced with dynamic LED accent lighting in saturated colour. Empty entry plaza, "
        "dramatic wide-angle composition. " + _NEUTRAL
    ),
    "project-terminal4-wayfinding": (
        "Interior photograph of a sleek modern airport terminal with backlit illuminated "
        "wayfinding signage panels glowing clean white. Contemporary architecture, soft "
        "motion-blurred travellers, bright calm atmosphere. " + _NEUTRAL
    ),
    "project-harbour-bridge": (
        "Nighttime long-exposure photograph of a large steel bridge illuminated with "
        "programmable LED accent lighting in cool blue and white along its structure. "
        "Glassy water reflection below, city lights distant. " + _NEUTRAL
    ),
    "project-fifth-ave-flagship": (
        "Nighttime street-level photograph of an upscale retail flagship storefront with "
        "halo-lit (backlit) signage glowing softly against a premium dark glass facade. "
        "Wet pavement reflections, abstract neutral wordmark. " + _NEUTRAL
    ),
}


def load_env_key() -> str:
    if not ENV_PATH.exists():
        sys.exit(f"env file not found: {ENV_PATH}")
    for line in ENV_PATH.read_text().splitlines():
        if line.startswith("OPENAI_API_KEY="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    sys.exit(f"OPENAI_API_KEY not in {ENV_PATH}")


def generate(name: str, prompt: str, api_key: str) -> None:
    out = OUT_DIR / f"{name}.jpg"
    print(f"\n[gen] {out.name}")
    payload = {
        "model": "gpt-image-1",
        "prompt": prompt,
        "n": 1,
        "size": "1536x1024",
        "quality": "medium",
        "output_format": "jpeg",
    }
    r = requests.post(
        "https://api.openai.com/v1/images/generations",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json=payload,
        timeout=300,
    )
    if r.status_code != 200:
        print(f"  FAILED HTTP {r.status_code}: {r.text[:300]}")
        return
    item = r.json()["data"][0]
    if "b64_json" in item:
        out.write_bytes(base64.b64decode(item["b64_json"]))
    elif "url" in item:
        out.write_bytes(requests.get(item["url"], timeout=60).content)
    else:
        print(f"  unexpected keys: {list(item.keys())}")
        return
    print(f"  WROTE {out.name} ({out.stat().st_size // 1024} KB)")


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--force", action="store_true")
    args = p.parse_args()
    api_key = load_env_key()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"output dir: {OUT_DIR}")
    for name, prompt in PROMPTS.items():
        out = OUT_DIR / f"{name}.jpg"
        if out.exists() and not args.force:
            print(f"[skip] {out.name} exists")
            continue
        generate(name, prompt, api_key)
        time.sleep(1)


if __name__ == "__main__":
    main()
