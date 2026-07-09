# Resources FAQ Collection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the `/resources` FAQ from a hardcoded Git data file into a Payload `Faqs` collection Wei can edit, surfaced on a new `/resources/faq` page and teased on the hub.

**Architecture:** Follows the proven Posts/Projects wiring: a Payload collection (admin form) → a server-only `src/lib/faqs.ts` query helper (groups + sorts, published-only) → a `/resources/faq` Server Component with ISR. A one-off script migrates `src/data/resource-faqs.ts` verbatim, after which the data file is deleted.

**Tech Stack:** Payload CMS 3, Next.js 16 App Router, TypeScript, Vitest, Lexical richText.

**Prerequisites:** Execute on a branch off `dev` that already contains the `feature/resources-trim-and-icon-2026-06-02` changes (the trimmed hub with the `02 · FAQ` section). If that PR is not yet merged, branch off it. Spec: `docs/superpowers/specs/2026-06-02-resources-subpages-architecture-design.md`.

---

### Task 1: `Faqs` Payload collection

**Files:**
- Create: `src/payload/collections/Faqs.ts`
- Modify: `src/payload.config.ts` (register the collection)

- [ ] **Step 1: Write the collection config**

```ts
// src/payload/collections/Faqs.ts
// FAQ entries for /resources/faq. Editorial content (Wei's domain) — migrated
// from the old src/data/resource-faqs.ts stopgap. `group` stores the short key;
// the human label lives in src/lib/faqs.ts (FAQ_GROUP_LABELS).
import type { CollectionConfig } from 'payload'
import { lexicalEditor, FixedToolbarFeature } from '@payloadcms/richtext-lexical'

export const Faqs: CollectionConfig = {
  slug: 'faqs',
  labels: { singular: 'FAQ', plural: 'FAQs' },
  admin: {
    useAsTitle: 'question',
    defaultColumns: ['question', 'group', 'order', '_status'],
    group: 'Editorial',
    description: 'Questions answered on /resources/faq. Publish to make one visible.',
  },
  access: { read: () => true },
  versions: { drafts: true },
  fields: [
    { name: 'question', type: 'text', required: true, admin: { placeholder: 'The question, as a customer would ask it.' } },
    {
      name: 'answer',
      type: 'richText',
      required: true,
      editor: lexicalEditor({ features: ({ defaultFeatures }) => [...defaultFeatures, FixedToolbarFeature()] }),
    },
    {
      name: 'group',
      type: 'select',
      required: true,
      admin: { position: 'sidebar', description: 'Which FAQ section this appears under.' },
      options: [
        { label: 'Ordering & availability', value: 'ordering' },
        { label: 'Products & compatibility', value: 'products' },
        { label: 'Installation & technical', value: 'installation' },
        { label: 'Warranty & after-sales', value: 'warranty' },
      ],
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Sort order within the group (low → high).' },
    },
  ],
}
```

- [ ] **Step 2: Register the collection**

In `src/payload.config.ts`, import `Faqs` next to the other collection imports and add `Faqs` to the `collections` array (next to `Posts`):

```ts
import { Faqs } from './payload/collections/Faqs'
// ...
collections: [/* ...existing..., */ Posts, Faqs /* , ... */],
```

- [ ] **Step 3: Verify the schema pushes and the collection loads**

Restart the dev server cleanly (Drizzle pushes the new `faqs` table — see memory `project_drizzle-stale-constraint-on-collection-edit` if it errors):

Run: `cat /tmp/envo-dev.pid && kill $(cat /tmp/envo-dev.pid); yes | nohup npm run dev > /tmp/envo-dev.log 2>&1 & echo $! > /tmp/envo-dev.pid`
Then: `sleep 25 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/faqs`
Expected: `200` (empty list is fine).

- [ ] **Step 4: Commit**

```bash
git add src/payload/collections/Faqs.ts src/payload.config.ts
git commit -m "feat(faqs): add Faqs Payload collection"
```

---

### Task 2: `getFaqs()` query helper (TDD)

**Files:**
- Create: `src/lib/faqs.ts`
- Test: `src/lib/faqs.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/faqs.test.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFind = vi.fn()
vi.mock('payload', () => ({ getPayload: vi.fn(async () => ({ find: mockFind })) }))
vi.mock('@/payload.config', () => ({ default: {} }))

import { getFaqs, FAQ_GROUP_LABELS } from './faqs'

beforeEach(() => {
  mockFind.mockReset()
  mockFind.mockResolvedValue({ docs: [] })
})

describe('getFaqs', () => {
  it('queries published faqs sorted by order', async () => {
    await getFaqs()
    const arg = mockFind.mock.calls[0][0]
    expect(arg.collection).toBe('faqs')
    expect(arg.where).toEqual({ _status: { equals: 'published' } })
    expect(arg.sort).toBe('order')
  })

  it('groups items by group key in canonical order, preserving item order', async () => {
    mockFind.mockResolvedValue({ docs: [
      { id: 3, question: 'w', answer: {}, group: 'warranty', order: 0 },
      { id: 1, question: 'o1', answer: {}, group: 'ordering', order: 0 },
      { id: 2, question: 'o2', answer: {}, group: 'ordering', order: 1 },
    ] })
    const groups = await getFaqs()
    expect(groups.map((g) => g.key)).toEqual(['ordering', 'warranty'])
    expect(groups[0].items.map((i) => i.id)).toEqual([1, 2])
    expect(groups[0].label).toBe(FAQ_GROUP_LABELS.ordering)
  })

  it('omits empty groups', async () => {
    mockFind.mockResolvedValue({ docs: [
      { id: 1, question: 'o', answer: {}, group: 'ordering', order: 0 },
    ] })
    const groups = await getFaqs()
    expect(groups).toHaveLength(1)
    expect(groups[0].key).toBe('ordering')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/faqs.test.ts`
Expected: FAIL — `Cannot find module './faqs'`.

- [ ] **Step 3: Write the helper**

```ts
// src/lib/faqs.ts
// Server-only. Reads the Faqs collection via the Payload local API and shapes
// it into ordered, labelled groups for the FAQ page. Do NOT import from a
// client component.
import { getPayload } from 'payload'
import config from '@/payload.config'

export type FaqGroupKey = 'ordering' | 'products' | 'installation' | 'warranty'

export const FAQ_GROUP_LABELS: Record<FaqGroupKey, string> = {
  ordering: 'Ordering & availability',
  products: 'Products & compatibility',
  installation: 'Installation & technical',
  warranty: 'Warranty & after-sales',
}

const GROUP_ORDER: FaqGroupKey[] = ['ordering', 'products', 'installation', 'warranty']

export type Faq = {
  id: number
  question: string
  answer: unknown // Lexical richText document
  group: FaqGroupKey
  order: number
}

export type FaqGroup = { key: FaqGroupKey; label: string; items: Faq[] }

export async function getFaqs(): Promise<FaqGroup[]> {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'faqs',
    where: { _status: { equals: 'published' } },
    sort: 'order',
    limit: 200,
    depth: 0,
  })

  const byGroup = new Map<FaqGroupKey, Faq[]>()
  for (const d of docs as unknown as Faq[]) {
    const arr = byGroup.get(d.group) ?? []
    arr.push(d)
    byGroup.set(d.group, arr)
  }

  return GROUP_ORDER.filter((k) => byGroup.has(k)).map((k) => ({
    key: k,
    label: FAQ_GROUP_LABELS[k],
    items: byGroup.get(k)!,
  }))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/faqs.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/faqs.ts src/lib/faqs.test.ts
git commit -m "feat(faqs): add getFaqs query helper"
```

---

### Task 3: Migrate `resource-faqs.ts` into Payload (seed script)

**Files:**
- Create: `scripts/seed-faqs.mts`

- [ ] **Step 1: Write the seed script**

```ts
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
```

- [ ] **Step 2: Run the seed and verify count**

Run: `npx tsx --tsconfig tsconfig.json scripts/seed-faqs.mts`
Expected: prints `done — created 11 FAQs.` (3 + 3 + 3 + 2 from the current data file).
Then: `curl -s "http://localhost:3000/api/faqs?limit=0" | python3 -c "import sys,json;print(json.load(sys.stdin)['totalDocs'])"`
Expected: `11`.

- [ ] **Step 3: Commit**

```bash
git add scripts/seed-faqs.mts
git commit -m "chore(faqs): seed script migrating resource-faqs.ts into Payload"
```

---

### Task 4: `/resources/faq` page

**Files:**
- Create: `src/app/(frontend)/resources/faq/page.tsx`
- Create: `src/app/(frontend)/resources/faq/page.module.css`

- [ ] **Step 1: Write the page**

```tsx
// src/app/(frontend)/resources/faq/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { getFaqs } from '@/lib/faqs'
import { RichTextRenderer } from '@/components/blog/RichTextRenderer'
import styles from './page.module.css'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'FAQ — ENVO',
  description: 'Answers on ordering, product compatibility, installation and warranty for ENVO LED signage.',
}

export default async function FaqPage() {
  const groups = await getFaqs()

  return (
    <div className="theme-light projects-page">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">›</span>
          <Link href="/resources">Resources</Link>
          <span className="sep">›</span>
          <span>FAQ</span>
        </div>
        <section className={styles.head}>
          <span className={styles.eyebrow}>Resources · FAQ</span>
          <h1 className={styles.title}>Frequently asked questions</h1>
        </section>

        {groups.length === 0 ? (
          <p className={styles.empty}>No questions published yet — check back soon.</p>
        ) : (
          groups.map((group) => (
            <div key={group.key} className={styles.group}>
              <h2 className={styles.groupTitle}>{group.label}</h2>
              <div className={styles.list}>
                {group.items.map((item) => (
                  <details key={item.id} className={styles.item}>
                    <summary className={styles.q}>{item.question}</summary>
                    <div className={styles.a}>
                      <RichTextRenderer doc={item.answer} />
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write the page CSS**

```css
/* src/app/(frontend)/resources/faq/page.module.css */
.head { padding: 24px 0 8px; }
.eyebrow {
  display: inline-block; font-size: 11px; letter-spacing: .18em; text-transform: uppercase;
  color: var(--color-brand-lime-deep); font-weight: 600; margin-bottom: 10px;
}
.title { font-size: 30px; font-weight: 700; letter-spacing: -.02em; margin: 0 0 8px; }
.group { padding: 20px 0; }
.groupTitle { font-size: 13px; font-weight: 650; letter-spacing: .04em; text-transform: uppercase; color: var(--color-text-muted); margin: 0 0 12px; }
.list { display: flex; flex-direction: column; gap: 10px; }
.item { border: 1px solid var(--color-line-strong); border-radius: 12px; background: var(--color-surface-card); padding: 4px 16px; }
.q { cursor: pointer; font-size: 15px; font-weight: 600; padding: 12px 0; list-style: none; }
.q::-webkit-details-marker { display: none; }
.a { font-size: 14px; line-height: 1.6; color: var(--color-text-muted); padding: 0 0 14px; }
.empty { padding: 48px 0; color: var(--color-text-muted); }
```

- [ ] **Step 3: Verify the page renders with content**

Run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/resources/faq`
Expected: `200`.
Then capture a screenshot and confirm four groups of accordions render (headless Chrome to `/tmp/faq.png`, window 1440×1400) — the renderer shows each answer as a paragraph.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(frontend)/resources/faq/page.tsx" "src/app/(frontend)/resources/faq/page.module.css"
git commit -m "feat(faqs): /resources/faq page reading from Payload"
```

---

### Task 5: Point the hub at the FAQ page and retire the data file

**Files:**
- Modify: `src/app/(frontend)/resources/page.tsx` (the trimmed hub — `02 · FAQ` section)
- Delete: `src/data/resource-faqs.ts`

- [ ] **Step 1: Confirm no other importers of the data file**

Run: `grep -rln "resource-faqs\|RESOURCE_FAQS" src`
Expected: only `src/app/(frontend)/resources/page.tsx`.

- [ ] **Step 2: Replace the hub's inline FAQ with a teaser link**

In `src/app/(frontend)/resources/page.tsx`, remove the `import { RESOURCE_FAQS } from '@/data/resource-faqs'` line, and replace the entire `{/* ===== 02 · FAQ (gray band) ===== */}` `<section>` (which currently maps over `RESOURCE_FAQS`) with this teaser:

```tsx
{/* ===== 02 · FAQ (gray band) ===== */}
<section className={`${styles.bandGray} ${styles.section}`} id="faqs">
  <div className="container">
    <div className={styles.sectionHead}>
      <span className={styles.sectionNum}>02</span>
      <h2 className={styles.sectionTitle}>Frequently asked questions</h2>
    </div>
    <p className={styles.sectionSub}>
      Ordering, product compatibility, installation and warranty — answered in one place.
    </p>
    <Link className={styles.jumpLink} href="/resources/faq">Read all FAQs →</Link>
  </div>
</section>
```

(`styles.jumpLink` was removed in the trim — if it is absent, use `styles.dlCta` or add a small link style; verify the class exists before committing.)

- [ ] **Step 3: Delete the data file**

```bash
git rm src/data/resource-faqs.ts
```

- [ ] **Step 4: Verify hub still builds and links out**

Run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/resources`
Expected: `200`. Confirm the `02 · FAQ` section now shows the teaser + "Read all FAQs →" linking to `/resources/faq`.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(frontend)/resources/page.tsx"
git commit -m "refactor(faqs): hub links to /resources/faq; drop resource-faqs.ts"
```

---

## Self-Review

- **Spec coverage:** Spec §"1. FAQ" requires a `Faqs` collection (Task 1), `getFaqs()` helper (Task 2), the page (Task 4), and migration + data-file deletion (Tasks 3, 5). All covered.
- **Placeholders:** none — every code/command step is concrete. Two verification notes ("confirm class exists", screenshot check) are deliberate human-eyes checks, not code gaps.
- **Type consistency:** `FaqGroupKey`, `FaqGroup`, `getFaqs`, `FAQ_GROUP_LABELS` are defined in Task 2 and used identically in Tasks 2 (test) and 4 (page). `group` values (`ordering`/`products`/`installation`/`warranty`) match across collection options (Task 1), seed mapping (Task 3), and helper (Task 2). `answer` is Lexical richText in the collection, seeded as a Lexical doc, and rendered with `RichTextRenderer` (Task 4).

## Out of scope (separate plans)

- **Signage selection table** (`/resources/tools/signage-selector`) — needs a `Products` schema read first; its own plan.
- **Downloads** page and **Tools/Guides** list — separate plans per the spec.
