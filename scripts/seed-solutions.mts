// Seed the Solutions collection from the canonical hardcoded data
// (src/data/solutions.ts). Run with:
//   npx tsx --tsconfig tsconfig.json scripts/seed-solutions.mts
//
// Idempotent: updates the doc if the slug exists, creates otherwise.
// Images are seeded as repo-asset path fallbacks (imagePath) — editors can
// override any of them with a Media upload later.

import { initPayload } from './lib/bootstrap.mts'

const payload = await initPayload()

const { SOLUTIONS } = await import('../src/data/solutions.ts')

for (const [i, s] of SOLUTIONS.entries()) {
  const data = {
    name: s.name,
    slug: s.slug,
    order: i,
    eyebrow: s.eyebrow,
    heroTitle: s.heroTitle,
    heroDesc: s.heroDesc,
    shortDesc: s.shortDesc,
    longDesc: s.longDesc,
    imagePath: s.img,
    checklist: s.checklist.map((text) => ({ text })),
    useCases: s.useCases.map((label) => ({ label })),
    gallery: s.gallery.map((g) => ({ imagePath: g.src, alt: g.alt })),
    bestFor: s.bestFor.map((b) => ({ scenario: b.scenario, note: b.note })),
    considerations: s.considerations.map((c) => ({ title: c.title, text: c.text })),
    series: s.series.map((r) => ({ name: r.name, blurb: r.blurb, href: r.href, imagePath: r.img })),
    alternatives: s.alternatives.map((a) => ({
      when: a.when,
      choose: a.choose,
      ...(a.href ? { href: a.href } : {}),
    })),
    kitHeading: s.kitHeading,
    kitLede: s.kitLede,
    kit: s.kit.map((k) => ({
      envo: k.envo,
      role: k.role,
      name: k.name,
      desc: k.desc,
      imagePath: k.img,
      specs: k.spec.map(([label, value]) => ({ label, value })),
      ...(k.href ? { href: k.href } : {}),
    })),
    _status: 'published' as const,
  }

  const existing = await payload.find({ collection: 'solutions', where: { slug: { equals: s.slug } }, limit: 1 })
  if (existing.docs[0]) {
    await payload.update({ collection: 'solutions', id: existing.docs[0].id, data })
    console.log('updated', s.slug)
  } else {
    await payload.create({ collection: 'solutions', data })
    console.log('created', s.slug)
  }
}

process.exit(0)
