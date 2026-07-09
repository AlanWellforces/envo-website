#!/usr/bin/env python3
"""
Generate 3 application scene images for the Mini Series mockup using OpenAI's
gpt-image-1 model. Loads OPENAI_API_KEY from the wellforces_automation env file
since envo-website-v2's own .env.local doesn't carry the key.

Usage:
    python3 scripts/generate-mini-scenes.py            # generates missing files
    python3 scripts/generate-mini-scenes.py --force    # regenerates everything

Output: /public/assets/images/app-mini-*.jpg
"""
import argparse
import base64
import json
import os
import sys
import time
from pathlib import Path

import requests

ENV_PATH = Path("/Users/marketing/Desktop/wellforces_automation/wf_image_pipeline/.env")
OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "assets" / "images"

PROMPTS = {
    # === Existing 3 (kept; will skip if files exist) ===========================
    "app-mini-channel-letters": (
        "Close-up nighttime photograph of a modern storefront's illuminated channel-letter signage. "
        "The letters have narrow strokes (about 25 mm wide), face-lit with even, calm white LED illumination "
        "(around 4000 K) glowing through a clean white acrylic face. The signboard reads an abstract simple "
        "wordmark like 'CAFÉ' or 'STUDIO' — keep typography clean and brand-neutral. Shallow depth of field, "
        "shot on a 50 mm lens at f/2, slight bokeh in the background. Ground-level perspective with a hint of "
        "wet-pavement reflection. Cinematic warm-evening atmosphere, professional commercial photography for "
        "an LED signage brand."
    ),
    "app-mini-outline-trim": (
        "A modern boutique facade at dusk, traced with very thin LED outline accents along the doorway, "
        "window frames, and signage border. The LED outline is precise and continuous, glowing soft warm "
        "white. The architecture is clean, minimal, and contemporary — flat concrete or dark-metal cladding. "
        "Slight reflection on the sidewalk. Professional commercial photography, brand campaign mood, "
        "no specific brand name visible, no people in frame."
    ),
    "app-mini-thin-lightbox": (
        "A shallow rectangular lightbox sign (cabinet depth visibly less than 50 mm) mounted flush against a "
        "neutral interior wall of a modern boutique hotel lobby. The lightbox displays a simple, abstract "
        "typographic mark — evenly backlit by slim LED modules so the entire face glows uniformly without "
        "hot spots. Soft architectural interior lighting, warm wood and plaster textures around. "
        "Professional commercial interior photography, brand campaign style."
    ),

    # === New 6 — different visual styles for variety ==========================

    # STYLE: cinematic dusk · golden-hour editorial architecture
    "app-mini-hospitality-facade": (
        "Cinematic dusk photograph of a five-star boutique hotel facade. A large illuminated wordmark — "
        "made of face-lit channel letters about 200 mm tall with warm 3000 K glow — sits centred on a "
        "dark stone and bronze-metal facade above the entrance canopy. The sky is deep cobalt blue with "
        "the last orange light just fading behind the building. Shot on a 35 mm lens at f/2.8, slight "
        "anamorphic lens flare from the warm letters. Architectural editorial style, brand-neutral "
        "typography reading something abstract like 'AURELIA' or 'NORDEN'. No people in frame. "
        "Professional commercial photography for an LED signage portfolio."
    ),

    # STYLE: bright daytime · crisp blue-sky corporate product photography
    "app-mini-pylon-monument": (
        "Bright clear-daylight photograph of a freestanding pylon monument sign at the entrance of a "
        "modern corporate office park. The pylon is a tall slim vertical structure about 3 metres high, "
        "clad in brushed aluminium, with a backlit translucent face panel running most of its height. "
        "The face glows softly even in full sunlight — clean 4000 K natural-white illumination, no "
        "hotspots. The wordmark reads an abstract neutral name like 'MERIDIAN' or 'AXIS' in clean sans-serif. "
        "Manicured landscaping with low boxwood hedges around the base, blue sky overhead. Shot on a "
        "35 mm lens at f/8 for sharp focus throughout, slight three-quarter angle. Architectural product "
        "photography, brand-portfolio style, no people."
    ),

    # STYLE: minimal architectural interior · cool soft daylight · museum/airport
    "app-mini-wayfinding": (
        "Minimalist interior architecture photograph of a modern airport terminal or contemporary museum "
        "concourse. In the centre of the frame, a slim wall-mounted directional sign — a thin lightbox "
        "panel about 600 mm wide — displays clean wayfinding text and an arrow ('GATES →' or 'GALLERIES →') "
        "in evenly-backlit 4000 K white. The cabinet depth is visibly less than 40 mm. Surrounding the sign: "
        "polished concrete floor, white plaster walls, soft cool daylight pouring in from a clerestory above. "
        "Wide-angle 28 mm lens, perfect verticals, calm and quiet mood. Architectural editorial style. "
        "No people, no specific brand logos visible."
    ),

    # STYLE: moody noir studio · close-up halo letters on dark wall
    "app-mini-halo-letters": (
        "Moody dramatic close-up nighttime photograph of three-dimensional halo-lit (reverse-lit) letters "
        "mounted on a textured dark concrete wall. The letters are about 300 mm tall, made of solid brushed "
        "stainless steel with no face illumination — instead, the entire halo behind each letter glows with "
        "an even soft warm white light (about 3000 K), painting a clean continuous halo on the wall behind. "
        "The wordmark reads an abstract neutral 4–6 letter name like 'STILL' or 'NORTH'. High-contrast "
        "studio lighting, almost noir, deep shadows around the edges. Shot on a 50 mm lens at f/4, slight "
        "vignette. Editorial brand photography, no specific brand identity visible."
    ),

    # STYLE: industrial / engineering · clean white-background product detail
    "app-mini-cabinet-detail": (
        "Top-down product photograph of an opened aluminium channel-letter cabinet — the letter 'O' or 'D' — "
        "viewed from above without its translucent acrylic face on, revealing the interior. Inside, a single "
        "row of small white LED modules is mounted to the back panel and daisy-chained with thin black wire. "
        "Each LED module is tiny (about 9 × 9 × 40 mm). The letter is photographed on a pure white seamless "
        "background under soft even diffused studio light, no harsh shadows. Industrial product-catalogue "
        "photography style — sharp, clean, technical. No text or branding on the cabinet itself."
    ),

    # STYLE: cinematic telephoto twilight · multiple lit storefronts · atmospheric
    "app-mini-hero-twilight": (
        "Wide cinematic twilight street-scene photograph: a quiet pedestrian shopping street at the blue "
        "hour, lined with three or four small boutique storefronts whose illuminated channel-letter signs "
        "glow softly in a mix of warm 3000 K and natural 4000 K white. Slight telephoto lens compression "
        "(85 mm equivalent at f/2.8), shallow depth of field with the foreground sign sharp and the further "
        "signs softly out of focus. Wet pavement reflects the glow. Sky is gradient indigo-to-magenta. "
        "Brand-neutral abstract storefront names — keep typography clean and generic. Editorial commercial "
        "photography, calm and high-end atmosphere, no people."
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
    print(f"  prompt: {prompt[:90]}...")

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
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=300,
    )
    if r.status_code != 200:
        print(f"  FAILED HTTP {r.status_code}")
        print(f"  body: {r.text[:400]}")
        return
    data = r.json()
    item = data["data"][0]
    if "b64_json" in item:
        out.write_bytes(base64.b64decode(item["b64_json"]))
    elif "url" in item:
        img = requests.get(item["url"], timeout=60).content
        out.write_bytes(img)
    else:
        print(f"  unexpected response keys: {list(item.keys())}")
        return
    size_kb = out.stat().st_size // 1024
    print(f"  WROTE {out.name} ({size_kb} KB)")


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--force", action="store_true", help="Regenerate even if file exists")
    args = p.parse_args()

    api_key = load_env_key()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"output dir: {OUT_DIR}")

    for name, prompt in PROMPTS.items():
        out = OUT_DIR / f"{name}.jpg"
        if out.exists() and not args.force:
            print(f"[skip] {out.name} already exists (use --force to regen)")
            continue
        generate(name, prompt, api_key)
        time.sleep(1)


if __name__ == "__main__":
    main()
