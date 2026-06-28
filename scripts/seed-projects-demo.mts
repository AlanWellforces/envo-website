#!/usr/bin/env npx tsx
/**
 * Seed demo Projects for the /projects redesign (2026-06-26).
 * Uploads the generated scene images (public/assets/images/projects/*) into
 * Payload media, then creates demo case studies with headline `specs`.
 * Idempotent: skips media/projects that already exist by filename/slug.
 *
 *   npx tsx scripts/seed-projects-demo.mts
 *
 * Demo content (clearly fictional, same nature as the existing 3 demo projects).
 * Spec values use real ENVO params (RGBW / DMX512 / real IP + CCT); project-scale
 * figures (module counts, run length) are illustrative.
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// Load .env.local BEFORE importing the payload config (buildConfig reads
// PAYLOAD_SECRET / DATABASE_URL at import time), then shim @next/env so
// payload's loadEnv doesn't choke under tsx. Mirrors seed-blog-posts.mts.
for (const line of fs.readFileSync(path.join(root, '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const _requireFromPayload = createRequire(path.join(root, 'node_modules/payload/dist/bin/dummy.js'))
const nextEnvExports = _requireFromPayload('@next/env')
if (!nextEnvExports.default) nextEnvExports.default = nextEnvExports

const configMod = await import('../src/payload.config.ts')
const config = await (configMod.default ?? configMod)
const { getPayload } = await import('payload')

const IMG_DIR = path.resolve(root, 'public/assets/images/projects')

const body = (paras: string[]) => ({
  root: {
    type: 'root', format: '', indent: 0, version: 1, direction: 'ltr',
    children: paras.map((t) => ({
      type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr',
      children: [{ type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text: t, version: 1 }],
    })),
  },
})

type Demo = {
  slug: string; title: string; file: string; client: string; location: string
  completedYear: number; industry: string[]; tags: string[]; featured?: boolean
  excerpt: string; specs: { value: string; label: string }[]; story: string[]
  testimonial?: string; gallery?: string[]
}

const DEMOS: Demo[] = [
  {
    slug: 'marina-bay-facade', title: 'Marina Bay Facade', file: 'project-marina-bay-facade.jpg',
    client: 'Waterfront Developments', location: 'Singapore', completedYear: 2026,
    industry: ['architectural'], tags: ['Media facade'], featured: true,
    excerpt: 'A full-media façade wrapping twelve storeys of a Marina Bay tower, driven entirely by ENVO ChromaFlux RGBW modules.',
    specs: [
      { value: '1,920', label: 'Modules' }, { value: 'DMX512', label: 'Control' },
      { value: '96 m', label: 'Run length' }, { value: 'IP67', label: 'Rating' },
    ],
    story: [
      'The brief called for a continuous, weather-sealed media surface that could render synchronised content visible across the waterfront — durable enough for years of coastal humidity and salt exposure.',
      'ENVO ChromaFlux modules were specified for their pixel pitch and IP67 sealing, driven over DMX512 from a central controller. A single addressable run lets the building behave as one canvas rather than independent panels.',
      'Commissioning was handled with the local integrator; ENVO supplied modules, drivers and the control mapping reference.',
    ],
    testimonial: 'The façade reads as a single seamless surface from across the bay — exactly the effect we were after, and it has shrugged off two monsoon seasons without a dropped pixel.',
    gallery: ['project-westpark-arena.jpg', 'project-harbour-bridge.jpg', 'project-fifth-ave-flagship.jpg', 'project-aurora-hotel-lobby.jpg'],
  },
  {
    slug: 'westpark-arena', title: 'Westpark Arena', file: 'project-westpark-arena.jpg',
    client: 'Westpark Stadium Trust', location: 'Melbourne, AU', completedYear: 2025,
    industry: ['architectural'], tags: ['Facade accent'],
    excerpt: 'Curved facade accent lighting tracing the arena’s roofline, colour-matched to event branding.',
    specs: [
      { value: '64 m', label: 'Run length' }, { value: 'DMX512', label: 'Control' },
      { value: 'IP66', label: 'Rating' }, { value: 'RGBW', label: 'Output' },
    ],
    story: [
      'The arena wanted its exterior to change with each event — a calm wash on match days, saturated colour for concerts.',
      'A continuous RGBW run follows the roofline, sealed to IP66 for the exposed elevation and addressed over DMX512 so the operations team can recall scenes from the existing show controller.',
    ],
  },
  {
    slug: 'harbour-bridge-approach', title: 'Harbour Bridge Approach', file: 'project-harbour-bridge.jpg',
    client: 'City Infrastructure', location: 'Wellington, NZ', completedYear: 2025,
    industry: ['architectural'], tags: ['Architectural'],
    excerpt: 'Cool-white architectural accent along the bridge approach, rated for full outdoor exposure.',
    specs: [
      { value: '142 m', label: 'Run length' }, { value: 'DMX512', label: 'Control' },
      { value: 'IP68', label: 'Rating' }, { value: '6500 K', label: 'CCT' },
    ],
    story: [
      'A long, fully-sealed run was needed to trace the bridge structure with even output across its full length.',
      'IP68 modules handle the splash and weather exposure of the harbour setting; the run is addressed for slow scene transitions through the evening.',
    ],
  },
  {
    slug: 'fifth-ave-flagship', title: 'Fifth Ave Flagship', file: 'project-fifth-ave-flagship.jpg',
    client: 'Flagship Retail Group', location: 'Auckland, NZ', completedYear: 2026,
    industry: ['retail'], tags: ['Halo-lit signage'],
    excerpt: 'Warm halo-lit signage and storefront trim for a premium retail flagship.',
    specs: [
      { value: '38 m', label: 'Run length' }, { value: '24 V DC', label: 'Input' },
      { value: 'IP66', label: 'Rating' }, { value: '3000 K', label: 'CCT' },
    ],
    story: [
      'The flagship wanted a soft, premium glow rather than hard edge-lighting — halo-lit lettering and a continuous storefront trim.',
      'Warm 3000 K modules on 24 V DC drivers give an even, low-glare backlight; the outdoor sections are sealed to IP66.',
    ],
  },
  {
    slug: 'terminal-4-wayfinding', title: 'Terminal 4 Wayfinding', file: 'project-terminal4-wayfinding.jpg',
    client: 'Regional Airports', location: 'Brisbane, AU', completedYear: 2025,
    industry: ['other'], tags: ['Backlit panels'],
    excerpt: 'Backlit wayfinding panels across a terminal concourse — bright, even, and maintenance-light.',
    specs: [
      { value: '247', label: 'Panels' }, { value: '24 V DC', label: 'Input' },
      { value: 'IP20', label: 'Rating' }, { value: '4000 K', label: 'CCT' },
    ],
    story: [
      'Wayfinding panels needed uniform, glare-free backlighting that reads clearly from a distance under bright terminal lighting.',
      'Neutral 4000 K modules give consistent panel brightness; indoor IP20 modules keep cost and depth down across the 247-panel rollout.',
    ],
  },
]

async function main() {
  const payload = await getPayload({ config })

  // 1) upload images (idempotent by filename)
  const mediaId: Record<string, number | string> = {}
  const files = new Set(DEMOS.flatMap((d) => [d.file, ...(d.gallery ?? [])]))
  for (const file of files) {
    const existing = await payload.find({ collection: 'media', where: { filename: { equals: file } }, limit: 1 })
    if (existing.docs[0]) { mediaId[file] = existing.docs[0].id; console.log(`[media] reuse ${file}`); continue }
    const doc = await payload.create({
      collection: 'media',
      data: { alt: file.replace(/^project-|\.jpg$/g, '').replace(/-/g, ' ') },
      filePath: path.join(IMG_DIR, file),
    })
    mediaId[file] = doc.id
    console.log(`[media] uploaded ${file} -> ${doc.id}`)
  }

  // 2) create projects (skip existing slugs)
  for (const d of DEMOS) {
    const exists = await payload.find({ collection: 'projects', where: { slug: { equals: d.slug } }, limit: 1 })
    if (exists.docs[0]) { console.log(`[project] skip ${d.slug} (exists)`); continue }
    await payload.create({
      collection: 'projects',
      data: {
        title: d.title, slug: d.slug, excerpt: d.excerpt,
        cover: mediaId[d.file], client: d.client, location: d.location,
        completedYear: d.completedYear, industry: d.industry as never,
        tags: d.tags.map((tag) => ({ tag })), featured: !!d.featured,
        specs: d.specs, testimonial: d.testimonial,
        gallery: (d.gallery ?? []).map((f) => ({ image: mediaId[f] })),
        body: body(d.story) as never,
        publishedAt: new Date('2026-06-20').toISOString(),
        _status: 'published',
      } as never,
    })
    console.log(`[project] created ${d.slug}${d.featured ? ' (featured)' : ''}`)
  }

  // 3) single featured: demote any other featured project so Marina Bay is the hero
  const feat = await payload.find({ collection: 'projects', where: { featured: { equals: true } }, limit: 50 })
  for (const p of feat.docs) {
    if ((p as { slug: string }).slug !== 'marina-bay-facade') {
      await payload.update({ collection: 'projects', id: p.id, data: { featured: false } })
      console.log(`[project] demoted featured: ${(p as { slug: string }).slug}`)
    }
  }

  console.log('done.')
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
