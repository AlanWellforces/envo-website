// One-off: seed published Blog Posts (with real, locally-stored cover images)
// via the Payload local API, so /blog looks populated in local dev.
//
// Run with: tsx --tsconfig tsconfig.json scripts/seed-blog-posts.mts
//
// Covers upload from public/assets/images/blog/ (committed editorial art,
// exact article ↔ image mapping) so fresh databases seed correct covers.

import path from 'node:path'
import { initPayload, root } from './lib/bootstrap.mts'

const payload = await initPayload()

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

// ---- cover images: purpose-made editorial art committed in the repo
// (public/assets/images/blog/, spec 2026-07-09 — each article has an exact
// image + alt; never random SKU product shots). Uploaded as Media so the
// detail hero / cards / OG images resolve them. ----
const coverDir = path.join(root, 'public/assets/images/blog')

async function uploadCover(srcName: string, alt: string): Promise<number> {
  const media = await payload.create({
    collection: 'media',
    data: { alt } as never,
    filePath: path.join(coverDir, srcName),
  })
  return (media as { id: number }).id
}

// title, category, featured, tags, cover image, excerpt, body blocks. Dates are
// staggered backwards from today so the list ordering looks natural.
const POSTS = [
  {
    title: 'Constant-Current vs Constant-Voltage Drivers, Explained',
    category: 'tech_insights', featured: true, img: 'blog-constant-current-vs-voltage-drivers.jpg',
    alt: 'LED driver, signage modules, wiring, and multimeter arranged on an engineering workbench',
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
    category: 'guides', featured: false, img: 'blog-channel-letter-module-guide.jpg',
    alt: 'LED modules installed inside an open channel letter sign housing',
    tags: ['signage', 'channel-letters', 'minilux'],
    excerpt: 'Module pitch, beam angle, and letter depth — the three numbers that decide whether channel letters glow evenly or blotch.',
    blocks: [
      para('Channel letters live or die on uniformity. Too few modules and you get dark gaps; too many and you waste power and create hotspots.'),
      h2('Match pitch to letter depth'),
      para('Shallow letters need a wider beam angle to spread light before it hits the face. The ENVO MiniLux 180° × 140° spread is built for exactly this — even fill in letters as shallow as 40mm.'),
      para('Start from the stroke width, space modules to the recommended pitch, and always mock up the tightest curve before committing the full run.'),
    ],
  },
  {
    title: "Inside ENVO's IP66 Rating: What It Really Means Outdoors",
    category: 'tech_insights', featured: false, img: 'blog-ip66-outdoor-rating.jpg',
    alt: 'Outdoor sign cabinet with sealed LED modules and waterproof connectors after rain',
    tags: ['waterproof', 'outdoor', 'ultraflare'],
    excerpt: 'IP66 is not "waterproof forever." Here is what the two digits actually certify — and where outdoor installs still go wrong.',
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
    category: 'guides', featured: false, img: 'blog-zigbee-lighting-control.jpg',
    alt: 'Wireless lighting controller connected to LED signage modules on a commissioning bench',
    tags: ['zigbee', 'smart-control'],
    excerpt: 'Mesh networking, scenes, and scheduling — how to add wireless control to signage without re-running cable.',
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
    category: 'tech_insights', featured: false, img: 'blog-rgbw-vs-rgb-color.jpg',
    alt: 'RGBW LED signage modules illuminating color samples and neutral white acrylic panels',
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
    category: 'industry', featured: true, img: 'blog-retail-signage-trends-2026.jpg',
    alt: 'Modern retail storefront at dusk with illuminated signage and architectural light accents',
    tags: ['retail', 'trends', 'ecoglo'],
    excerpt: 'Dynamic storefronts, tighter energy rules, and the shift from neon nostalgia to clean edge-lit faces.',
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
    category: 'industry', featured: false, img: 'blog-hotel-facade-lighting.jpg',
    alt: 'Upscale hotel exterior at night with facade grazing and illuminated canopy lighting',
    tags: ['hospitality', 'facade', 'optilume'],
    excerpt: 'A lit facade is a hotel\'s biggest billboard. Here is how premium properties use light without wasting energy.',
    blocks: [
      para('For a hotel, the facade works every night for years. Done well, it is the cheapest brand impression per guest the property will ever buy.'),
      h2('Principles that hold up'),
      para('Light the architecture, not just the sign. Even washes on key surfaces read as "premium" far more than a bright logo on a dark building.'),
      para('ENVO OptiLume wash modules give controllable, even coverage so facades stay uniform from the street — no scalloping, no hot bands.'),
    ],
  },
  {
    title: 'ENVO Expands Distribution Across 60+ Countries',
    category: 'company_news', featured: false, img: 'blog-global-distribution-news.jpg',
    alt: 'Organized LED lighting product distribution workspace with packages and global network display',
    tags: ['company', 'distribution'],
    excerpt: 'Field-proven ENVO modules, drivers, and control gear are now supported through regional partners worldwide.',
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
  const coverId = await uploadCover(p.img, p.alt)
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

console.log(`\ndone — created ${created} posts.`)
process.exit(0)
