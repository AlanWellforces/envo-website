// One-off: seed published Blog Posts (with real, locally-stored cover images)
// via the Payload local API, so /blog looks populated in local dev.
//
// Run with: tsx --tsconfig tsconfig.json scripts/seed-blog-posts.mts
//
// Covers: Payload Media is local-disk storage (staticDir: 'media', gitignored)
// and the team's media files aren't synced to every machine — so existing
// Media rows 500. This script UPLOADS fresh images from wf_image_pipeline/ready,
// which writes the file to ./media on THIS machine, so the covers actually load.

import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// Load .env.local BEFORE importing the payload config (buildConfig reads
// PAYLOAD_SECRET / DATABASE_URL at import time).
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

// ---- lexical body builder (only nodes RichTextRenderer supports) ----
const txt = (text: string) => ({ type: 'text', text, detail: 0, format: 0, mode: 'normal', style: '', version: 1 })
const para = (text: string) => ({ type: 'paragraph', direction: 'ltr', format: '', indent: 0, version: 1, textFormat: 0, children: [txt(text)] })
const h2 = (text: string) => ({ type: 'heading', tag: 'h2', direction: 'ltr', format: '', indent: 0, version: 1, children: [txt(text)] })
const ul = (items: string[]) => ({
  type: 'list', listType: 'bullet', tag: 'ul', start: 1, direction: 'ltr', format: '', indent: 0, version: 1,
  children: items.map((t, i) => ({ type: 'listitem', value: i + 1, direction: 'ltr', format: '', indent: 0, version: 1, children: [txt(t)] })),
})
type Block = ReturnType<typeof para> | ReturnType<typeof h2> | ReturnType<typeof ul>
const body = (blocks: Block[]) => ({ root: { type: 'root', direction: 'ltr', format: '', indent: 0, version: 1, children: blocks } })

// ---- cover images: copy real files out of the image pipeline into a temp
// dir under blog-* names (avoids colliding with the 1052 product Media rows),
// then upload each so Payload writes it into ./media on this machine. ----
const readyDir = path.join(os.homedir(), 'Desktop/wellforces_automation/wf_image_pipeline/ready')
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envo-blog-cover-'))

async function uploadCover(srcName: string, alt: string): Promise<number> {
  const src = path.join(readyDir, srcName)
  const dest = path.join(tmpDir, `blog-${srcName}`)
  fs.copyFileSync(src, dest)
  const media = await payload.create({ collection: 'media', data: { alt } as never, filePath: dest })
  return (media as { id: number }).id
}

// title, category, featured, tags, cover image, excerpt, body blocks. Dates are
// staggered backwards from today so the list ordering looks natural.
const POSTS = [
  {
    title: 'Constant-Current vs Constant-Voltage Drivers, Explained',
    category: 'tech_insights', featured: true, img: 'SE-12-100-400-W1A.jpg',
    tags: ['drivers', 'power'],
    excerpt: 'The single most common spec mistake in LED signage — and a simple rule for picking the right driver every time.',
    blocks: [
      para('Pick the wrong driver and even the best LED module will flicker, run hot, or die early. The choice comes down to how your modules are wired and rated.'),
      h2('The short version'),
      ul([
        'Constant-voltage (e.g. 12V / 24V): modules have onboard resistors — wire in parallel, size the driver to total wattage.',
        'Constant-current (e.g. 350mA / 700mA): the driver regulates current — wire in series, match the current rating exactly.',
      ]),
      para('ENVO drivers are labelled clearly on the spec sheet. When in doubt, match the module datasheet first and the driver second — never the other way around.'),
    ],
  },
  {
    title: 'Choosing the Right LED Module for Channel Letters',
    category: 'guides', featured: false, img: 'EV-BLML03LBY-CW.jpg',
    tags: ['signage', 'channel-letters', 'minilux'],
    excerpt: 'Module pitch, beam angle, and depth — the three numbers that decide whether your channel letters glow evenly or blotch.',
    blocks: [
      para('Channel letters live or die on uniformity. Too few modules and you get dark gaps; too many and you waste power and create hotspots.'),
      h2('Match pitch to letter depth'),
      para('Shallow letters need a wider beam angle to spread light before it hits the face. The ENVO MiniLux 180° × 140° spread is built for exactly this — even fill in letters as shallow as 40mm.'),
      para('Start from the stroke width, space modules to the recommended pitch, and always mock up the tightest curve before committing the full run.'),
    ],
  },
  {
    title: "Inside ENVO's IP66 Rating: What It Really Means Outdoors",
    category: 'tech_insights', featured: false, img: 'EV-BLUF04LBY-CW.jpg',
    tags: ['waterproof', 'outdoor', 'ultraflare'],
    excerpt: 'IP66 is not "waterproof forever." Here is what the two digits actually certify — and where installs still go wrong.',
    blocks: [
      para('The first digit (6) means fully dust-tight. The second (6) means protected against powerful water jets from any direction. It does not mean continuous submersion.'),
      h2('Where outdoor installs fail anyway'),
      ul([
        'Unsealed wire entries — the module is rated, the splice is not.',
        'Trapped condensation inside the letter cavity.',
        'Cheap connectors downstream of an IP66 module.',
      ]),
      para('Rate the whole system, not just the LED. ENVO UltraFlare modules pair with sealed connectors so the rating survives the full chain.'),
    ],
  },
  {
    title: 'A Practical Guide to Zigbee Lighting Control',
    category: 'guides', featured: false, img: 'LOP-500-12.jpg',
    tags: ['zigbee', 'smart-control'],
    excerpt: 'Mesh networking, scenes, and scheduling — how to add wireless control to a signage install without re-running cable.',
    blocks: [
      para('Zigbee builds a self-healing mesh: every powered node relays for its neighbours, so coverage grows as you add fixtures rather than fighting a single weak radio.'),
      h2('What you get'),
      ul([
        'Scene recall — switch a whole storefront between day and night looks instantly.',
        'Scheduling — dim or cut signage to local trading hours automatically.',
        'No new cable — control rides over the existing power layout.',
      ]),
      para('Start small: commission one zone, confirm the mesh, then expand. ENVO Zigbee gear co-exists with standard drivers on the same install.'),
    ],
  },
  {
    title: 'RGBW vs RGB: Getting True Color in LED Signage',
    category: 'tech_insights', featured: false, img: 'EV-BLCF03LBY-RGBW.jpg',
    tags: ['color', 'rgbw', 'chromaflux'],
    excerpt: 'Why a dedicated white channel beats mixing R+G+B — especially when the brief calls for a clean, branded white.',
    blocks: [
      para('Pure RGB can make almost any colour except a convincing white. Mixed white drifts pink or green and burns three channels to do one job.'),
      h2('The case for the W channel'),
      para('ChromaFlux RGBW adds a calibrated white LED, so brand whites stay neutral and saturated colours still pop. For logos with a fixed corporate white, RGBW is the safer choice.'),
      para('Reserve plain RGB for pure-colour accent and architainment work where white is never the hero.'),
    ],
  },
  {
    title: 'Retail Signage Trends Lighting Up 2026',
    category: 'industry', featured: true, img: 'EV-BLEG04LBY-CW.jpg',
    tags: ['retail', 'trends', 'ecoglo'],
    excerpt: 'Dynamic storefronts, tighter energy rules, and the quiet shift from neon nostalgia to clean edge-lit faces.',
    blocks: [
      para('Two forces are reshaping retail signage in 2026: energy regulation and the demand for storefronts that change with the campaign, not the renovation budget.'),
      h2('What we are seeing'),
      ul([
        'Edge-lit acrylic faces replacing exposed neon for a cleaner, lower-glare look.',
        'Tunable-white and RGBW letting one sign carry seasonal campaigns.',
        'Efficiency-first module choices as power budgets tighten.',
      ]),
      para('ENVO EcoGlo sits squarely in this shift — efficient, even, and built for faces that need to stay sharp in daylight.'),
    ],
  },
  {
    title: 'How Hotels Use Facade Lighting to Build Brand Presence',
    category: 'industry', featured: false, img: 'EV-BLOL04LBY-CW.jpg',
    tags: ['hospitality', 'facade', 'optilume'],
    excerpt: 'A lit facade is a hotel\'s biggest billboard. Here is how the best properties use it without blowing the energy budget.',
    blocks: [
      para('For a hotel, the facade works every night for years. Done well, it is the cheapest brand impression per guest the property will ever buy.'),
      h2('Principles that hold up'),
      para('Light the architecture, not just the sign. Even washes on key surfaces read as "premium" far more than a bright logo on a dark building.'),
      para('ENVO OptiLume wash modules give controllable, even coverage so facades stay uniform from the street — no scalloping, no hot bands.'),
    ],
  },
  {
    title: 'ENVO Expands Distribution Across 60+ Countries',
    category: 'company_news', featured: false, img: 'EV-BLPG04LBY-CW.jpg',
    tags: ['company', 'distribution'],
    excerpt: 'Field-proven ENVO modules and drivers are now stocked and supported through regional partners on six continents.',
    blocks: [
      para('ENVO LED modules, drivers, and control gear are now available through regional distribution partners spanning more than 60 countries.'),
      h2('Buy and get support locally'),
      para('Customers in NZ and Asia-Pacific are served through wellforces.co.nz; US and global orders route through powersupplymall.com — both carrying the full ENVO range with local lead times.'),
      para('Same field-proven hardware, now with shorter shipping and regional technical support.'),
    ],
  },
]

const today = new Date('2026-06-02T09:00:00Z')
let created = 0
for (let i = 0; i < POSTS.length; i++) {
  const p = POSTS[i]
  const coverId = await uploadCover(p.img, `${p.title} — cover`)
  const publishedAt = new Date(today.getTime() - i * 4 * 24 * 60 * 60 * 1000).toISOString() // 4 days apart, descending
  const doc = await payload.create({
    collection: 'posts',
    data: {
      title: p.title,
      excerpt: p.excerpt,
      cover: coverId,
      category: p.category,
      featured: p.featured,
      tags: p.tags.map((tag) => ({ tag })),
      body: body(p.blocks),
      _status: 'published',
      publishedAt,
    } as never,
  })
  created++
  console.log(`✓ #${(doc as { id: number }).id} [${p.category}${p.featured ? ', featured' : ''}] ${p.title} (cover media #${coverId})`)
}

fs.rmSync(tmpDir, { recursive: true, force: true })
console.log(`\ndone — created ${created} posts.`)
process.exit(0)
