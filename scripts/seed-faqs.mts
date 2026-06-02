// One-off: migrate src/data/resource-faqs.ts into the Faqs collection.
// Run: npx tsx --tsconfig tsconfig.json scripts/seed-faqs.mts
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
for (const line of fs.readFileSync(path.join(root, '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const _req = createRequire(path.join(root, 'node_modules/payload/dist/bin/dummy.js'))
const nextEnv = _req('@next/env')
if (!nextEnv.default) nextEnv.default = nextEnv
const configMod = await import('../src/payload.config.ts')
const config = await (configMod.default ?? configMod)
const { getPayload } = await import('payload')
const { RESOURCE_FAQS } = await import('../src/data/resource-faqs.ts')
const payload = await getPayload({ config })

// Map the old long group labels → the new collection keys.
const GROUP_KEY: Record<string, string> = {
  'Ordering & availability': 'ordering',
  'Products & compatibility': 'products',
  'Installation & technical': 'installation',
  'Warranty & after-sales': 'warranty',
}

// Wrap a plain answer string into a minimal Lexical richText doc.
const answerDoc = (text: string) => ({
  root: {
    type: 'root', direction: 'ltr', format: '', indent: 0, version: 1,
    children: [{
      type: 'paragraph', direction: 'ltr', format: '', indent: 0, version: 1, textFormat: 0,
      children: [{ type: 'text', text, detail: 0, format: 0, mode: 'normal', style: '', version: 1 }],
    }],
  },
})

let created = 0
for (const group of RESOURCE_FAQS) {
  const key = GROUP_KEY[group.group]
  if (!key) throw new Error(`Unmapped FAQ group: ${group.group}`)
  for (let i = 0; i < group.items.length; i++) {
    const item = group.items[i]
    const doc = await payload.create({
      collection: 'faqs',
      data: { question: item.q, answer: answerDoc(item.a), group: key, order: i, _status: 'published' } as never,
    })
    created++
    console.log(`✓ #${(doc as { id: number }).id} [${key}] ${item.q}`)
  }
}
console.log(`\ndone — created ${created} FAQs.`)
process.exit(0)
