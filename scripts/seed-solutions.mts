// Seed the Solutions collection from the canonical hardcoded data
// (src/data/solutions.ts). Run with:
//   npx tsx --tsconfig tsconfig.json scripts/seed-solutions.mts
//
// Idempotent: updates the doc if the slug exists, creates otherwise.
// Images are seeded as repo-asset path fallbacks (imagePath) — editors can
// override any of them with a Media upload later.

import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
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
    gallery: s.gallery.map((g) => ({ imagePath: g.src, alt: g.alt })),
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
