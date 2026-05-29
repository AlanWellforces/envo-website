// One-off: seed a few published test Projects via Payload local API.
// Run with: tsx --tsconfig tsconfig.json scripts/seed-test-projects.mts
// (Same @next/env CJS interop patch as generate-importmap.mts — must run
// before any payload import.)

import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// Load .env.local into process.env BEFORE importing the payload config
// (buildConfig reads PAYLOAD_SECRET / DATABASE_URL at import time).
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

// Minimal valid lexical richText value for the required `body` field.
const lexicalBody = (text: string) => ({
  root: {
    type: 'root',
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
    children: [
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        children: [
          { type: 'text', text, detail: 0, format: 0, mode: 'normal', style: '', version: 1 },
        ],
      },
    ],
  },
})

const TEST_PROJECTS = [
  {
    title: 'Harbourview Mall Channel Letters',
    client: 'Harbourview Properties',
    location: 'Auckland, New Zealand',
    completedYear: 2024,
    excerpt: 'Backlit channel-letter signage for a flagship retail mall — even illumination, no hotspots, across 40+ tenant storefronts.',
    cover: 1,
    industry: ['retail', 'storefront'],
    featured: true,
    body: lexicalBody('Harbourview Mall needed crisp, even backlit signage across dozens of tenant storefronts. ENVO MiniLux modules delivered uniform brightness with zero hotspots.'),
  },
  {
    title: 'Aurora Hotel Facade Wash',
    client: 'Aurora Group',
    location: 'Sydney, Australia',
    completedYear: 2025,
    excerpt: 'Architectural facade lighting for a five-star hotel — warm, glare-free wash visible across the harbour at night.',
    cover: 2,
    industry: ['hotel', 'architectural'],
    featured: false,
    body: lexicalBody('A five-star hotel facade lit with ENVO architectural modules — a warm, even wash that reads cleanly from across the harbour.'),
  },
  {
    title: 'Metro Cafe Storefront Sign',
    client: 'Metro Cafe',
    location: 'Wellington, New Zealand',
    completedYear: 2023,
    excerpt: 'A compact illuminated storefront sign for a neighbourhood cafe — bright, low-power, and reliable through coastal weather.',
    cover: 3,
    industry: ['storefront'],
    featured: false,
    body: lexicalBody('A small but punchy storefront sign for Metro Cafe, built with IP66 ENVO modules to survive Wellington coastal weather.'),
  },
]

for (const data of TEST_PROJECTS) {
  const doc = await payload.create({
    collection: 'projects',
    data: { ...data, _status: 'published', publishedAt: new Date().toISOString() } as never,
  })
  console.log(`✓ created project #${(doc as { id: number }).id}: ${data.title} (slug auto → ${(doc as { slug?: string }).slug})`)
}

console.log('done.')
process.exit(0)
