// Localize remote Akeneo product images onto the site's OWN media store, so the
// site stops fetching product images from Akeneo S3 at request time.
//
// For every product that resolveProductImage() (src/lib/products.ts) would serve
// from a REMOTE Akeneo URL — tier 2 (clean_image_url_fallback, no clean upload)
// or tier 4 (image_url_fallback, no upload at all) — download that image and
// import it as a Payload media upload, then link it as the product's
// clean_image / image. Payload uploads are editorial overrides (priority 1/3)
// and survive akeneo-sync, which only rewrites the *_url_fallback columns, so
// this is durable. The ~240 products already on local uploads or bundled
// series-level fallbacks are left untouched.
//
// ── Run ────────────────────────────────────────────────────────────────────
//   DRY_RUN=1 npx tsx --tsconfig tsconfig.json scripts/localize-akeneo-images.mts
//   npx tsx --tsconfig tsconfig.json scripts/localize-akeneo-images.mts
//
// Writes to whatever DATABASE_URL points at. The Local API writes the media
// FILES to THIS machine's Payload staticDir and inserts rows into DATABASE_URL.
//
// ⚠️ GO-LIVE (self-hosted box): run on a machine with the repo (the Mac) with
// DATABASE_URL pointed at the FINAL box Postgres, then copy the freshly-created
// media files (printed at the end) onto the box's media volume — same
// tar-over-ssh step used for the Supabase Storage migration. Idempotent: re-runs
// skip products that already have the upload. See the deployment spec §5.
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { initPayload } from './lib/bootstrap.mts'

const DRY = process.env.DRY_RUN === '1'

type P = {
  id: number
  sku?: string | null
  name?: string | null
  clean_image?: number | { id: number } | null
  image?: number | { id: number } | null
  clean_image_url_fallback?: string | null
  image_url_fallback?: string | null
}

const idOf = (rel: unknown): number | null =>
  rel == null ? null : typeof rel === 'object' ? (rel as { id: number }).id : (rel as number)

function extFromUrl(url: string): string {
  const ext = path.extname(url.split('?')[0]).toLowerCase()
  return /^\.(jpe?g|png|webp|gif)$/.test(ext) ? ext : '.jpg'
}

const payload = await initPayload()

// depth:0 → upload relations come back as ids (or null); fallbacks as strings.
const all = await payload.find({ collection: 'products', depth: 0, pagination: false })
const products = all.docs as unknown as P[]

type Job = {
  p: P
  field: 'clean_image' | 'image'
  fallbackField: 'clean_image_url_fallback' | 'image_url_fallback'
  url: string
}

// Mirror resolveProductImage's tier order exactly.
const jobs: Job[] = []
for (const p of products) {
  if (idOf(p.clean_image) != null) continue // tier 1: local clean upload
  if (p.clean_image_url_fallback) {
    jobs.push({ p, field: 'clean_image', fallbackField: 'clean_image_url_fallback', url: p.clean_image_url_fallback })
    continue // tier 2: remote clean
  }
  if (idOf(p.image) != null) continue // tier 3: local regular upload
  if (p.image_url_fallback) {
    jobs.push({ p, field: 'image', fallbackField: 'image_url_fallback', url: p.image_url_fallback })
    continue // tier 4: remote regular
  }
  // tier 5: series-level git fallback / no image — nothing remote to localize
}

console.log(`${products.length} products — ${jobs.length} still resolve to a REMOTE Akeneo image`)
if (DRY) {
  for (const j of jobs) console.log(`  would localize ${j.p.sku ?? j.p.id} [${j.field}] <- ${j.url}`)
  console.log('DRY_RUN — no writes.')
  process.exit(0)
}

const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'akeneo-loc-'))
let done = 0
let failed = 0
for (const j of jobs) {
  const sku = j.p.sku ?? String(j.p.id)
  const filename = `akeneo-${j.field === 'clean_image' ? 'clean' : 'main'}-${sku}${extFromUrl(j.url)}`
  try {
    // idempotent: reuse an existing media row of the same deterministic filename
    const existing = await payload.find({ collection: 'media', where: { filename: { equals: filename } }, limit: 1 })
    let media = existing.docs[0] as { id: number; url?: string } | undefined
    if (!media) {
      const res = await fetch(j.url)
      if (!res.ok) throw new Error(`download HTTP ${res.status}`)
      const staged = path.join(staging, filename)
      fs.writeFileSync(staged, Buffer.from(await res.arrayBuffer()))
      media = (await payload.create({
        collection: 'media',
        data: { alt: `${j.p.name ?? sku} product image` } as never,
        filePath: staged,
      })) as { id: number; url?: string }
    }
    // Link the upload AND repoint the fallback column at the local URL, so no
    // Akeneo URL is served even before the upload-priority kicks in.
    await payload.update({
      collection: 'products',
      id: j.p.id,
      data: { [j.field]: media.id, [j.fallbackField]: media.url ?? null } as never,
    })
    done++
    console.log(`  ✓ ${sku} [${j.field}] → media ${media.id}`)
  } catch (e) {
    failed++
    console.warn(`  ✗ ${sku} <- ${j.url}: ${(e as Error).message}`)
  }
}
console.log(`\ndone: ${done} localized, ${failed} failed`)
console.log(`new media files written under this machine's Payload staticDir (staging copies: ${staging})`)
console.log('GO-LIVE: copy the new media files onto the box media volume (tar-over-ssh), then verify.')
process.exit(failed ? 1 : 0)
