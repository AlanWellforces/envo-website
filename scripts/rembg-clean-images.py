#!/usr/bin/env python3
"""Stage 1 of the clean-image backfill: cut the white background off the raw
Akeneo product photos so scripts/backfill-clean-images.mts can upload them.

Some products ship only a raw white-background studio photo and no transparent
"clean" variant; this produces the clean cut-outs (the raw photos are pure
white-bg, so rembg/u2net strips them cleanly).

Prereqs:  pip install rembg pillow   (first run downloads the u2net model)

1. Produce the work-list from the DB (products visible but lacking a clean
   image), into $BACKFILL_DIR/only-raw.json:

     node --input-type=commonjs -e '
       require("dotenv").config({ path: ".env.local" });
       const { Client } = require("pg"), fs = require("fs");
       const c = new Client({ connectionString: process.env.DATABASE_URL });
       c.connect().then(async () => {
         const q = await c.query("SELECT id, sku, image_url_fallback FROM products \
           WHERE enabled AND hidden IS NOT TRUE AND clean_image_url_fallback IS NULL \
           AND image_url_fallback IS NOT NULL ORDER BY sku");
         fs.writeFileSync(process.env.BACKFILL_DIR + "/only-raw.json", JSON.stringify(q.rows, null, 2));
         console.log(q.rows.length); await c.end();
       });'

2. Run this:   BACKFILL_DIR=/abs/cache python3 scripts/rembg-clean-images.py
   → writes <cache>/clean/<hash>.png + <cache>/clean-manifest.json (url→png).

3. Upload + wire up:  BACKFILL_DIR=/abs/cache npx tsx --tsconfig tsconfig.json \
      scripts/backfill-clean-images.mts

Idempotent: already-cut images are skipped. Dedupes by source URL (many SKUs
in a series share one photo).
"""
import json, hashlib, urllib.request, os, io, sys
from rembg import remove
from PIL import Image

CACHE = os.environ.get("BACKFILL_DIR")
if not CACHE:
    sys.exit("set BACKFILL_DIR to the cache dir holding only-raw.json")

os.makedirs(f"{CACHE}/clean", exist_ok=True)
rows = json.load(open(f"{CACHE}/only-raw.json"))
urls = sorted({r["image_url_fallback"] for r in rows})
manifest = {}
print(f"processing {len(urls)} unique images for {len(rows)} products...", flush=True)
for i, url in enumerate(urls, 1):
    h = hashlib.sha1(url.encode()).hexdigest()[:16]
    out = f"{CACHE}/clean/{h}.png"
    manifest[url] = f"{h}.png"
    if os.path.exists(out):
        print(f"  [{i}/{len(urls)}] cached {h}", flush=True); continue
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        raw = urllib.request.urlopen(req, timeout=40).read()
        Image.open(io.BytesIO(remove(raw))).save(out)
        print(f"  [{i}/{len(urls)}] done {h}", flush=True)
    except Exception as e:
        print(f"  [{i}/{len(urls)}] FAIL {url[:60]} :: {e}", flush=True)
json.dump(manifest, open(f"{CACHE}/clean-manifest.json", "w"), indent=2)
print(f"manifest: {len(manifest)} urls mapped", flush=True)
