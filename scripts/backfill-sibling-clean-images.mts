// Backfill clean images for products that have NO image of their own by
// borrowing the clean image of a sibling SKU that is the same physical
// product in another variant (plug/-P, US plug/-US, DALI/-DA, 3in1 dimming,
// Bluetooth/BT — the enclosure in the photo is identical).
//
// Sources per donor:
//   - donor already has a clean_image upload → the target products simply
//     share that media doc (relation reuse, no new upload).
//   - donor only has an Akeneo-hosted clean JPEG (white studio bg) → download
//     it, cut out via rembg (same u2net default as scripts/rembg-clean-images.py),
//     upload once, then set it on the donor AND its targets so the whole
//     sibling group is uniform + sync-safe (uploads survive akeneo-sync;
//     *_url_fallback columns do not).
//
// Not fixable (no photo in Akeneo, envo-led.com, or the marketing library —
// needs new photography): ENC-20-350 / ENC-20-500 / ENC-20-700 / ENC-20-1050 /
// ENC-REMOTE.
//
// Prereqs: python3 with rembg + pillow (pip install rembg pillow).
// Run:  npx tsx --tsconfig tsconfig.json scripts/backfill-sibling-clean-images.mts
// Idempotent: skips uploads whose media filename exists and products whose
// clean_image is already set.
// ⚠️ Writes the shared DEV database — re-run against PROD at launch.

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { initPayload } from './lib/bootstrap.mts'

// donor SKU → target SKUs (targets are variants of the donor's physical unit)
const GROUPS: Record<string, string[]> = {
  'ENC-18-500': ['ENC-18-350BT', 'ENC-18-350BT+P', 'ENC-18-700BT', 'ENC-18-700BT+P'],
  'SC-100S-24': ['SC-100S-24DA'],
  'SC-60-24-US': ['SC-60-24-US-P'],
  'EV-ZB9032A-4IN1': ['V-ZB9032A-4IN1'], // same sensor; V- SKU is missing its E
  'SC-60-24': ['SC-60-24-P'],
  'SC-150-24': ['SC-150-24-US', 'SC-150-243in1'],
  'SC-300-24': ['SC-300-243in1'],
  'SC-10-12': ['SC-10-12DA'],
}

const payload = await initPayload()
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sibling-clean-'))

type Prod = { id: number; sku?: string | null; clean_image?: number | { id: number } | null; clean_image_url_fallback?: string | null }
const bySku = async (sku: string): Promise<Prod | undefined> =>
  (await payload.find({ collection: 'products', where: { sku: { equals: sku } }, limit: 1, depth: 0 })).docs[0] as Prod | undefined

let updated = 0
for (const [donorSku, targets] of Object.entries(GROUPS)) {
  const donor = await bySku(donorSku)
  if (!donor) { console.warn(`donor ${donorSku} not found — skipping group`); continue }

  // Resolve the media doc the group should share.
  let mediaId = typeof donor.clean_image === 'object' && donor.clean_image ? donor.clean_image.id : (donor.clean_image as number | null)
  let mediaUrl: string | null = null
  if (mediaId) {
    const m = (await payload.findByID({ collection: 'media', id: mediaId })) as { url?: string }
    mediaUrl = m.url ?? null
    console.log(`${donorSku}: reusing existing clean media ${mediaId}`)
  } else {
    const src = donor.clean_image_url_fallback
    if (!src?.startsWith('http')) { console.warn(`donor ${donorSku} has no usable clean source — skipping group`); continue }
    const filename = `clean-${donorSku}.png`
    const existing = await payload.find({ collection: 'media', where: { filename: { equals: filename } }, limit: 1 })
    let media = existing.docs[0] as { id: number; url?: string } | undefined
    if (!media) {
      const raw = path.join(tmp, `raw-${donorSku}`)
      const out = path.join(tmp, filename)
      const res = await fetch(src)
      if (!res.ok) { console.warn(`download failed for ${donorSku}: ${res.status}`); continue }
      fs.writeFileSync(raw, Buffer.from(await res.arrayBuffer()))
      execFileSync('python3', ['-c', `
from rembg import remove
from PIL import Image
Image.open(${JSON.stringify(raw)}).convert('RGB').save(${JSON.stringify(raw)} + '.jpg')
remove(Image.open(${JSON.stringify(raw)} + '.jpg')).save(${JSON.stringify(out)})
`], { stdio: 'inherit' })
      media = (await payload.create({
        collection: 'media',
        data: { alt: `${donorSku} (clean)` } as never,
        filePath: out,
      })) as { id: number; url?: string }
      console.log(`${donorSku}: uploaded new clean media ${media.id}`)
    } else {
      console.log(`${donorSku}: found previously uploaded media ${media.id}`)
    }
    mediaId = media.id
    mediaUrl = media.url ?? null
    // make the donor itself sync-safe + uniform with its group
    await payload.update({ collection: 'products', id: donor.id, data: { clean_image: mediaId, clean_image_url_fallback: mediaUrl } as never })
    updated++
  }

  for (const sku of targets) {
    const t = await bySku(sku)
    if (!t) { console.warn(`  target ${sku} not found`); continue }
    const has = typeof t.clean_image === 'object' && t.clean_image ? t.clean_image.id : t.clean_image
    if (has) { console.log(`  ${sku}: already has clean media ${has} — skip`); continue }
    await payload.update({ collection: 'products', id: t.id, data: { clean_image: mediaId, clean_image_url_fallback: mediaUrl } as never })
    console.log(`  ${sku}: ← media ${mediaId}`)
    updated++
  }
}
console.log(`\ndone: ${updated} products updated`)
process.exit(0)
