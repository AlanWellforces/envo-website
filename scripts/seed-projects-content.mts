#!/usr/bin/env npx tsx
// One-off: enrich the 3 seeded projects with a working cover + gallery + real
// productsUsed SKUs. Fixes the broken hero (covers pointed at driver-product
// media that 500s on this machine) and thickens the case studies. No
// testimonials — these are fictional demo projects; real quotes come later.
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
for (const line of fs.readFileSync(path.join(root, '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const payloadLoadEnvDir = path.join(root, 'node_modules/payload/dist/bin')
const _requireFromPayload = createRequire(path.join(payloadLoadEnvDir, 'dummy.js'))
const nextEnvExports = _requireFromPayload('@next/env')
if (!nextEnvExports.default) nextEnvExports.default = nextEnvExports

const configMod = await import('../src/payload.config.ts')
const config = await (configMod.default ?? configMod)
const { getPayload } = await import('payload')
const payload = await getPayload({ config })

const assetsDir = path.join(root, 'public/assets/images')
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envo-proj-'))

async function uploadImage(srcName: string, alt: string): Promise<number> {
  const dest = path.join(tmpDir, `project-${srcName}`)
  fs.copyFileSync(path.join(assetsDir, srcName), dest)
  const media = await payload.create({ collection: 'media', data: { alt } as never, filePath: dest })
  return (media as { id: number }).id
}

type Plan = {
  slug: string
  cover: [string, string]
  gallery: [string, string][]
  products: string[]
}

const PLANS: Plan[] = [
  {
    slug: 'metro-cafe-storefront-sign',
    cover: ['app-mini-channel-letters.jpg', 'Metro Cafe illuminated channel-letter storefront sign at night'],
    gallery: [['app-mini-halo-letters.jpg', 'Halo-lit detail of the Metro Cafe letterset']],
    products: ['EV-BLML01LBY-NW', 'SC-80-12'],
  },
  {
    slug: 'aurora-hotel-facade-wash',
    cover: ['app-mini-hospitality-facade.jpg', 'Aurora Hotel facade with an even LED wash'],
    gallery: [['ind-architectural.jpg', 'Architectural facade illumination across the full elevation']],
    products: ['EV-SLEF01LBY-WW', 'SC-80-24', 'SR-CS9101EA-5C'],
  },
  {
    slug: 'harbourview-mall-channel-letters',
    cover: ['ind-commercial.jpg', 'Harbourview Mall channel-letter signage'],
    gallery: [['app-mini-channel-letters.jpg', 'Channel letters built with ENVO modules']],
    products: ['EV-SLEL01LBY-WW', 'SC-80-12'],
  },
]

let updated = 0
for (const plan of PLANS) {
  const res = await payload.find({ collection: 'projects', where: { slug: { equals: plan.slug } }, limit: 1 })
  const proj = res.docs[0]
  if (!proj) { console.warn('! project not found:', plan.slug); continue }
  const coverId = await uploadImage(plan.cover[0], plan.cover[1])
  const gallery: { image: number; caption: string }[] = []
  for (const [file, caption] of plan.gallery) {
    gallery.push({ image: await uploadImage(file, caption), caption })
  }
  await payload.update({
    collection: 'projects',
    id: proj.id as number,
    data: {
      cover: coverId,
      gallery,
      productsUsed: plan.products.map((sku) => ({ sku })),
    } as never,
  })
  console.log(`✓ ${plan.slug} — cover + ${gallery.length} gallery + ${plan.products.length} products`)
  updated++
}
console.log(`\nDone. Updated ${updated}/${PLANS.length} projects.`)
process.exit(0)
