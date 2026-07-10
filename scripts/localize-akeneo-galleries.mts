// Localize remote Akeneo *gallery* images (the product `image` field) onto the
// site's OWN media store. Companion to localize-akeneo-images.mts, which only
// handles the HERO (clean_image/image tier order and stops at clean). Products
// that have a clean_image still keep a separate `image` (the second/"scene"
// photo) whose image_url_fallback points at Akeneo S3 — the series gallery
// renders it, so it must be localized too for full Akeneo independence.
//
// For every product with a REMOTE image_url_fallback and no local `image`
// upload: download it → import as a Payload media upload → link it as `image`
// and repoint image_url_fallback at the local URL. Idempotent (reuses an
// existing media row of the same deterministic filename). Uploads override the
// fallback column and survive akeneo-sync.
//
//   DRY_RUN=1 npx tsx --tsconfig tsconfig.json scripts/localize-akeneo-galleries.mts
//   npx tsx --tsconfig tsconfig.json scripts/localize-akeneo-galleries.mts
//
// ⚠️ Run with S3 storage DISABLED (S3_BUCKET unset) so files write to the local
// staticDir, then copy the new media files onto the box media volume. Writes to
// whatever DATABASE_URL points at.
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { initPayload } from './lib/bootstrap.mts'

const DRY = process.env.DRY_RUN === '1'

type P = {
  id: number
  sku?: string | null
  name?: string | null
  image?: number | { id: number } | null
  image_url_fallback?: string | null
}

const idOf = (rel: unknown): number | null =>
  rel == null ? null : typeof rel === 'object' ? (rel as { id: number }).id : (rel as number)

function extFromUrl(url: string): string {
  const ext = path.extname(url.split('?')[0]).toLowerCase()
  return /^\.(jpe?g|png|webp|gif)$/.test(ext) ? ext : '.jpg'
}

const payload = await initPayload()
const all = await payload.find({ collection: 'products', depth: 0, pagination: false })
const products = all.docs as unknown as P[]

const jobs = products.filter(
  (p) => idOf(p.image) == null && !!p.image_url_fallback && /akeneo-pim/.test(p.image_url_fallback),
)

console.log(`${products.length} products — ${jobs.length} have a REMOTE gallery image (\`image\`) to localize`)
if (DRY) {
  for (const p of jobs) console.log(`  would localize ${p.sku ?? p.id} [image] <- ${p.image_url_fallback}`)
  console.log('DRY_RUN — no writes.')
  process.exit(0)
}

const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'akeneo-gal-'))
let done = 0
let failed = 0
for (const p of jobs) {
  const sku = p.sku ?? String(p.id)
  const filename = `akeneo-main-${sku}${extFromUrl(p.image_url_fallback!)}`
  try {
    const existing = await payload.find({ collection: 'media', where: { filename: { equals: filename } }, limit: 1 })
    let media = existing.docs[0] as { id: number; url?: string } | undefined
    if (!media) {
      const res = await fetch(p.image_url_fallback!)
      if (!res.ok) throw new Error(`download HTTP ${res.status}`)
      const staged = path.join(staging, filename)
      fs.writeFileSync(staged, Buffer.from(await res.arrayBuffer()))
      media = (await payload.create({
        collection: 'media',
        data: { alt: `${p.name ?? sku} product image` } as never,
        filePath: staged,
      })) as { id: number; url?: string }
    }
    await payload.update({
      collection: 'products',
      id: p.id,
      data: { image: media.id, image_url_fallback: media.url ?? null } as never,
    })
    done++
    console.log(`  ✓ ${sku} [image] → media ${media.id}`)
  } catch (e) {
    failed++
    console.warn(`  ✗ ${sku} <- ${p.image_url_fallback}: ${(e as Error).message}`)
  }
}
console.log(`\ndone: ${done} localized, ${failed} failed`)
console.log(`new media files under this machine's Payload staticDir (staging copies: ${staging})`)
process.exit(failed ? 1 : 0)
