// One-off content fix: replace the blog covers that were seeded from random
// SKU product shots with the purpose-made editorial images in
// public/assets/images/blog/ (exact article ↔ image mapping below — spec
// 2026-07-09), refresh the excerpts to the approved copy, and store an honest
// reading time (words / 200 wpm from the body richtext, min 1).
//
// Covers upload as Payload media (alt = approved alt text) so the detail-page
// hero, cards and OG images all pick them up; the old SKU-shot media rows are
// left in place (other content may reference them).
//
// Run:  npx tsx --tsconfig tsconfig.json scripts/fix-blog-covers.mts
// Idempotent: media dedup by filename; post updates simply re-apply.
// ⚠️ Writes the shared DEV database — re-run against PROD at launch (after
// seed-blog-posts.mts, which now seeds these same covers for fresh DBs).

import path from 'node:path'
import { initPayload } from './lib/bootstrap.mts'
import { root } from './lib/bootstrap.mts'

type Fix = { slug: string; img: string; alt: string; excerpt: string }

const FIXES: Fix[] = [
  {
    slug: 'constant-current-vs-constant-voltage-drivers-explained',
    img: 'blog-constant-current-vs-voltage-drivers.jpg',
    alt: 'LED driver, signage modules, wiring, and multimeter arranged on an engineering workbench',
    excerpt: 'The single most common spec mistake in LED signage — and a simple rule for picking the right driver every time.',
  },
  {
    slug: 'choosing-the-right-led-module-for-channel-letters',
    img: 'blog-channel-letter-module-guide.jpg',
    alt: 'LED modules installed inside an open channel letter sign housing',
    excerpt: 'Module pitch, beam angle, and letter depth — the three numbers that decide whether channel letters glow evenly or blotch.',
  },
  {
    slug: 'inside-envos-ip66-rating-what-it-really-means-outdoors',
    img: 'blog-ip66-outdoor-rating.jpg',
    alt: 'Outdoor sign cabinet with sealed LED modules and waterproof connectors after rain',
    excerpt: 'IP66 is not “waterproof forever.” Here is what the two digits actually certify — and where outdoor installs still go wrong.',
  },
  {
    slug: 'a-practical-guide-to-zigbee-lighting-control',
    img: 'blog-zigbee-lighting-control.jpg',
    alt: 'Wireless lighting controller connected to LED signage modules on a commissioning bench',
    excerpt: 'Mesh networking, scenes, and scheduling — how to add wireless control to signage without re-running cable.',
  },
  {
    slug: 'rgbw-vs-rgb-getting-true-color-in-led-signage',
    img: 'blog-rgbw-vs-rgb-color.jpg',
    alt: 'RGBW LED signage modules illuminating color samples and neutral white acrylic panels',
    excerpt: 'Why a dedicated white channel beats mixing R+G+B — especially when the brief calls for a clean, branded white.',
  },
  {
    slug: 'retail-signage-trends-lighting-up-2026',
    img: 'blog-retail-signage-trends-2026.jpg',
    alt: 'Modern retail storefront at dusk with illuminated signage and architectural light accents',
    excerpt: 'Dynamic storefronts, tighter energy rules, and the shift from neon nostalgia to clean edge-lit faces.',
  },
  {
    slug: 'how-hotels-use-facade-lighting-to-build-brand-presence',
    img: 'blog-hotel-facade-lighting.jpg',
    alt: 'Upscale hotel exterior at night with facade grazing and illuminated canopy lighting',
    excerpt: 'A lit facade is a hotel’s biggest billboard. Here is how premium properties use light without wasting energy.',
  },
  {
    slug: 'envo-expands-distribution-across-60-countries',
    img: 'blog-global-distribution-news.jpg',
    alt: 'Organized LED lighting product distribution workspace with packages and global network display',
    excerpt: 'Field-proven ENVO modules, drivers, and control gear are now supported through regional partners worldwide.',
  },
]

/** words / 200 wpm, min 1 — walked out of the Lexical richtext tree. */
function readingTimeOf(body: unknown): number {
  let words = 0
  const walk = (n: unknown): void => {
    if (!n || typeof n !== 'object') return
    const node = n as { text?: string; children?: unknown[]; root?: unknown }
    if (typeof node.text === 'string') words += node.text.split(/\s+/).filter(Boolean).length
    if (node.root) walk(node.root)
    if (Array.isArray(node.children)) node.children.forEach(walk)
  }
  walk(body)
  return Math.max(1, Math.round(words / 200))
}

const payload = await initPayload()
let updated = 0

for (const fix of FIXES) {
  const res = await payload.find({ collection: 'posts', where: { slug: { equals: fix.slug } }, limit: 1, draft: true })
  const post = res.docs[0] as { id: number; body?: unknown; _status?: string } | undefined
  if (!post) { console.warn(`post not found: ${fix.slug}`); continue }

  const existing = await payload.find({ collection: 'media', where: { filename: { equals: fix.img } }, limit: 1 })
  let media = existing.docs[0] as { id: number } | undefined
  if (!media) {
    media = (await payload.create({
      collection: 'media',
      data: { alt: fix.alt } as never,
      filePath: path.join(root, 'public/assets/images/blog', fix.img),
    })) as { id: number }
    console.log(`uploaded ${fix.img} → media ${media.id}`)
  } else {
    await payload.update({ collection: 'media', id: media.id, data: { alt: fix.alt } as never })
  }

  await payload.update({
    collection: 'posts',
    id: post.id,
    draft: post._status === 'draft', // keep drafts drafts — don't publish as a side effect
    data: {
      cover: media.id,
      excerpt: fix.excerpt,
      readingTime: readingTimeOf(post.body),
    } as never,
  })
  console.log(`${fix.slug}: cover→${media.id} (${post._status})`)
  updated++
}

console.log(`\ndone: ${updated}/${FIXES.length} posts updated`)
process.exit(0)
