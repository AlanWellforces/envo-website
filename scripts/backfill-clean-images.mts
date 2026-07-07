// Backfill clean (background-removed) product images.
//
// Some Akeneo products ship only a raw white-background studio photo and no
// "clean" (transparent cut-out) variant, so the frontend + admin fall back to
// the raw image (resolveProductImage / ProductImageCell both prefer clean).
// This backfills a clean variant for those products:
//   - sets `clean_image` (Payload upload relation) → frontend priority 1,
//     survives akeneo-sync (sync only writes the *_url_fallback columns).
//   - sets `clean_image_url_fallback` (the uploaded media URL) → so the admin
//     list cell (reads clean_image_url_fallback) shows clean too.
//
// Two stages (the raw photos are pure white-bg, trivial to cut out):
//   1. scripts/rembg-clean-images.py — download each raw image, rembg → PNG,
//      writing <cache>/clean/<hash>.png + <cache>/clean-manifest.json and a
//      <cache>/only-raw.json list of { id, sku, image_url_fallback }.
//   2. this script — upload each unique PNG once, then set both fields on
//      every product that shares that source image.
//
// Run:  BACKFILL_DIR=/abs/cache npx tsx --tsconfig tsconfig.json scripts/backfill-clean-images.mts
// Idempotent: re-uploads are skipped when a media file of the same name exists.

import fs from 'node:fs'
import path from 'node:path'
import { initPayload } from './lib/bootstrap.mts'

const CACHE = process.env.BACKFILL_DIR
if (!CACHE) throw new Error('set BACKFILL_DIR to the rembg cache dir (holds only-raw.json, clean-manifest.json, clean/)')

type Row = { id: number; sku: string; image_url_fallback: string }
const rows: Row[] = JSON.parse(fs.readFileSync(path.join(CACHE, 'only-raw.json'), 'utf8'))
const manifest: Record<string, string> = JSON.parse(fs.readFileSync(path.join(CACHE, 'clean-manifest.json'), 'utf8'))

const payload = await initPayload()

// Upload each unique source image once; cache url -> { id, url }.
const mediaByUrl = new Map<string, { id: number; url: string }>()
for (const [srcUrl, pngName] of Object.entries(manifest)) {
  const filePath = path.join(CACHE, 'clean', pngName)
  if (!fs.existsSync(filePath)) { console.warn('  MISSING png, skipping:', pngName); continue }
  const filename = `clean-${pngName}`
  const existing = await payload.find({ collection: 'media', where: { filename: { equals: filename } }, limit: 1 })
  let media = existing.docs[0] as { id: number; url?: string } | undefined
  if (!media) {
    // copy to a stably-named temp so the uploaded filename is deterministic
    const staged = path.join(CACHE, 'clean', filename)
    if (!fs.existsSync(staged)) fs.copyFileSync(filePath, staged)
    media = (await payload.create({
      collection: 'media',
      data: { alt: 'Product image (clean)' } as never,
      filePath: staged,
    })) as { id: number; url?: string }
  }
  mediaByUrl.set(srcUrl, { id: media.id, url: media.url ?? '' })
  console.log('  media', media.id, '←', pngName)
}

// Set both fields on every product sharing that source image.
let updated = 0
for (const r of rows) {
  const media = mediaByUrl.get(r.image_url_fallback)
  if (!media) { console.warn('  no media for', r.sku); continue }
  await payload.update({
    collection: 'products',
    id: r.id,
    data: { clean_image: media.id, clean_image_url_fallback: media.url } as never,
  })
  updated++
}
console.log(`\ndone: ${mediaByUrl.size} media, ${updated}/${rows.length} products updated`)
process.exit(0)
