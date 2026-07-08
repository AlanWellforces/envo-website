// Import the retouched "website ready" product images from the marketing
// library as each product's clean_image (Payload upload = editorial override,
// priority 1 in resolveProductImage; survives akeneo-sync, which only writes
// the *_url_fallback columns). Sources (user 2026-07-08):
//   - LED drivers:  <library>/LED Driver Images/Single Product Images/Main PNG/<SKU>_main.png
//   - Control gear: <library>/Website Ready Images/<cat>/Clear/<SKU>_MAIN_01_clear*.jpg
//
// Run:  npx tsx --tsconfig tsconfig.json scripts/import-website-ready-images.mts
// Idempotent: skips upload when a media file of the same name exists; skips
// products whose clean_image already points at a website-ready upload.
// ⚠️ Writes the shared DEV database — re-run against PROD at launch.

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { initPayload } from './lib/bootstrap.mts'

const LIB = '/Users/marketing/Documents/New project/outputs/ENVO Product Library/Product Images'

type Entry = { sku: string; file: string }
const entries: Entry[] = []

// drivers — transparent main PNGs
const driverDir = path.join(LIB, 'LED Driver Images/Single Product Images/Main PNG')
for (const f of fs.readdirSync(driverDir)) {
  const m = f.match(/^(EV-[A-Z0-9-]+)_main\.png$/i)
  if (m) entries.push({ sku: m[1], file: path.join(driverDir, f) })
}

// control gear / sensors — clear (no-logo) website-ready mains
const wrDir = path.join(LIB, 'Website Ready Images')
for (const cat of fs.readdirSync(wrDir)) {
  const clearDir = path.join(wrDir, cat, 'Clear')
  if (!fs.existsSync(clearDir) || !fs.statSync(clearDir).isDirectory()) continue
  for (const f of fs.readdirSync(clearDir)) {
    const m = f.match(/^(EV-[A-Z0-9-]+)_MAIN_01_clear/i)
    if (m) entries.push({ sku: m[1], file: path.join(clearDir, f) })
  }
}
console.log(`found ${entries.length} SKU main images`)

const payload = await initPayload()
const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'website-imgs-'))

let updated = 0
let missing = 0
for (const { sku, file } of entries) {
  const found = await payload.find({ collection: 'products', where: { sku: { equals: sku } }, limit: 1 })
  const product = found.docs[0] as { id: number } | undefined
  if (!product) { console.warn('  no product for', sku); missing++; continue }

  const filename = `website-main-${sku}${path.extname(file).toLowerCase()}`
  const existing = await payload.find({ collection: 'media', where: { filename: { equals: filename } }, limit: 1 })
  let media = existing.docs[0] as { id: number; url?: string } | undefined
  if (!media) {
    const staged = path.join(staging, filename) // deterministic upload name
    fs.copyFileSync(file, staged)
    media = (await payload.create({
      collection: 'media',
      data: { alt: `${sku} product image` } as never,
      filePath: staged,
    })) as { id: number; url?: string }
  }
  await payload.update({
    collection: 'products',
    id: product.id,
    data: { clean_image: media.id, clean_image_url_fallback: media.url ?? null } as never,
  })
  updated++
  console.log('  set', sku, '→ media', media.id)
}
console.log(`\ndone: ${updated} products updated, ${missing} SKUs without a product`)
process.exit(0)
