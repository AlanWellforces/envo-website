// Detect and repair BLANK clean product images (u2net erases white-on-white
// product shots — EV-BLEG02LBY / EV-BLEG03LBY were both hit, 2026-07-09).
//
// Sweep: every distinct clean image referenced by a visible product is
// downloaded and measured; an image whose visible pixels (< 240 in any RGB
// channel, alpha > 10) cover less than THRESHOLD % of the frame is blank.
// Repair: centre-crop the product region out of the raw Akeneo studio photo
// (mask non-white pixels in the 21.5%–86% vertical band — skips the cert
// logos on top and the SKU caption at the bottom — bbox + 24% pad), upload
// it once per model, and point every product sharing that source at it.
//
// Idempotent: an already-repaired model (media `clean-recrop-<model>.png`
// exists and all its products point at it) is skipped, and repaired images
// pass the blank check anyway.
//
// Run:      npx tsx --tsconfig tsconfig.json scripts/fix-blank-clean-images.mts
// Dry run:  DRY_RUN=1 …            (measure + crop to ./tmp, no uploads/updates)
// Options:  MEDIA_BASE=http://localhost:3000   base URL that serves /api/media
//           THRESHOLD=0.5                       blank cut-off, % visible pixels
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { initPayload, root } from './lib/bootstrap.mts'

const MEDIA_BASE = process.env.MEDIA_BASE ?? 'http://localhost:3000'
const THRESHOLD = Number(process.env.THRESHOLD ?? '0.5')
const DRY_RUN = !!process.env.DRY_RUN

const payload = await initPayload()

type Prod = {
  id: number
  sku: string
  image_url_fallback?: string | null
  clean_image?: { id: number; filename?: string; url?: string } | number | null
}

/** % of pixels that are actually visible (non-transparent and non-white). */
async function visiblePct(buf: Buffer): Promise<number> {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  let visible = 0
  const n = info.width * info.height
  for (let i = 0; i < n; i++) {
    const o = i * 4
    if (data[o + 3] > 10 && Math.min(data[o], data[o + 1], data[o + 2]) < 240) visible++
  }
  return (visible / n) * 100
}

/** Centre-crop the product out of a white-bg studio photo (validated on the
    EV-BLEG02/03 repairs). Returns a 1200×1200 PNG buffer. */
async function cropProduct(raw: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(raw).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = info
  const yMin = Math.floor(h * 0.215)
  const yMax = Math.floor(h * 0.86)
  let x0 = w, x1 = -1, y0 = h, y1 = -1
  for (let y = yMin; y < yMax; y++) {
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 3
      if (data[o] < 240 || data[o + 1] < 240 || data[o + 2] < 240) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
    }
  }
  if (x1 < 0) throw new Error('no product pixels found in the crop band')
  const cx = Math.floor((x0 + x1) / 2)
  const cy = Math.floor((y0 + y1) / 2)
  const half = Math.floor(Math.max(x1 - x0, y1 - y0) * 0.62)
  // vertical clamp stays INSIDE the band so the padding never re-includes
  // the brand row / SKU caption; contain-fit pads back to square undistorted
  const left = Math.max(cx - half, 0)
  const top = Math.max(cy - half, yMin)
  const right = Math.min(cx + half, w)
  const bottom = Math.min(cy + half, yMax)
  return sharp(raw)
    .extract({ left, top, width: right - left, height: bottom - top })
    .resize(1200, 1200, { fit: 'contain', background: { r: 255, g: 255, b: 255 } })
    .png()
    .toBuffer()
}

async function fetchBuf(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

// ── sweep ────────────────────────────────────────────────────────────────────
const result = await payload.find({
  collection: 'products',
  where: {
    and: [
      { enabled: { equals: true } },
      { hidden: { not_equals: true } },
      { clean_image: { exists: true } },
    ],
  },
  limit: 500,
  depth: 1,
})
const products = result.docs as unknown as Prod[]

// group products by their clean media file
const byMedia = new Map<string, { mediaUrl: string; prods: Prod[] }>()
for (const p of products) {
  const m = p.clean_image
  if (!m || typeof m === 'number' || !m.url) continue
  const key = m.filename ?? m.url
  if (!byMedia.has(key)) byMedia.set(key, { mediaUrl: m.url, prods: [] })
  byMedia.get(key)!.prods.push(p)
}
console.log(`${products.length} products, ${byMedia.size} distinct clean images (threshold ${THRESHOLD}%)`)

const tmpDir = path.join(root, 'tmp', 'blank-clean-fix')
fs.mkdirSync(tmpDir, { recursive: true })

let blanks = 0
let repaired = 0
for (const [filename, { mediaUrl, prods }] of byMedia) {
  let pct: number
  try {
    pct = await visiblePct(await fetchBuf(mediaUrl.startsWith('http') ? mediaUrl : `${MEDIA_BASE}${mediaUrl}`))
  } catch (e) {
    console.warn(`  SKIP ${filename}: ${e}`)
    continue
  }
  if (pct >= THRESHOLD) continue

  blanks++
  const rawUrl = prods.find((p) => p.image_url_fallback)?.image_url_fallback
  const model = prods[0].sku.replace(/-(WW|NW|CW)$/i, '').toLowerCase()
  console.log(`BLANK ${filename} (${pct.toFixed(3)}% visible) ← ${prods.map((p) => p.sku).join(', ')}`)
  if (!rawUrl) {
    console.warn('  no raw image_url_fallback to recrop from — needs a manual fix')
    continue
  }

  const png = await cropProduct(await fetchBuf(rawUrl))
  const outName = `clean-recrop-${model}.png`
  const outPath = path.join(tmpDir, outName)
  fs.writeFileSync(outPath, png)
  const croppedPct = await visiblePct(png)
  console.log(`  recropped → ${outPath} (${croppedPct.toFixed(1)}% visible)`)
  if (croppedPct < THRESHOLD) {
    console.warn('  recrop still blank — needs a manual fix')
    continue
  }
  if (DRY_RUN) continue

  const existing = await payload.find({ collection: 'media', where: { filename: { equals: outName } }, limit: 1 })
  let media = existing.docs[0] as { id: number; url?: string } | undefined
  if (!media) {
    media = (await payload.create({
      collection: 'media',
      data: { alt: `${prods[0].sku.replace(/-(WW|NW|CW)$/i, '')} product image (clean)` } as never,
      filePath: outPath,
    })) as { id: number; url?: string }
  }
  for (const p of prods) {
    await payload.update({
      collection: 'products',
      id: p.id,
      data: { clean_image: media.id, clean_image_url_fallback: media.url } as never,
    })
    console.log(`  repointed ${p.sku} → media ${media.id}`)
    repaired++
  }
}

console.log(`\ndone: ${blanks} blank image(s), ${repaired} product(s) repointed${DRY_RUN ? ' (DRY RUN — nothing written)' : ''}`)
process.exit(0)
