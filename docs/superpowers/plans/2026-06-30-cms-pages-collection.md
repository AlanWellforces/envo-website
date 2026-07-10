# CMS Pages Collection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make standalone rich-text pages (starting with the 4 policy pages) editable in the Payload admin, Shopify-style, with a data-driven footer and sitemap.

**Architecture:** A new `pages` Payload collection (Lexical rich text, drafts = Visible/Hidden, self-contained SEO). Policy pages keep their root URLs via thin route files that fetch by slug; every other page is served by a `/pages/[slug]` dynamic route. Footer and sitemap read the collection. Existing `RichTextRenderer` + `LegalPage` are reused for rendering.

**Tech Stack:** Next.js 16 App Router, Payload CMS 3 (`@payloadcms/richtext-lexical`), Drizzle/Postgres, vitest.

## Global Constraints

- Tailwind v4 only (CSS-first); no v3 config. (Not touched here, but applies.)
- Reuse existing patterns: Lexical editor config from `Posts.ts`, `RichTextRenderer.tsx`, `LegalPage` + `legal.module.css`, `slugify`, fail-soft sitemap `try`.
- Payload drafts already hide `_status: 'draft'` from default public reads — do NOT add explicit `_status` filters to public `find` calls (matches `src/lib/posts.ts`).
- Legal entity in copy = **Envo** (Stoughton MA); legal contact email = **contact@envolighting.com**. Brand wordmark "ENVO" only in page `<title>`/meta chrome.
- No block-based page builder — rich text + optional raw-HTML block only.
- Run the dev server detached (PID `/tmp/envo-dev.pid`, log `/tmp/envo-dev.log`); verify routes with `curl` status + rendered-HTML greps. The Payload admin cannot be verified headless — ask the user to confirm admin UI.
- Prefer `npm ci`; only `npm install` when adding a dependency (none needed here).
- Branch: `feature/prelaunch-polish-2026-06-30` (continues the policy-pages work).

---

### Task 1: `pages` collection + registration + types

**Files:**
- Create: `src/payload/collections/Pages.ts`
- Modify: `src/payload.config.ts` (import + add to `collections`)

**Interfaces:**
- Produces: a Payload collection `slug: 'pages'` with fields `title` (text), `slug` (text, unique), `content` (richText), `showInFooter` (checkbox), `seoTitle` (text), `metaDescription` (textarea), `ogImage` (upload→media); `versions.drafts: true`; `access.read: () => true`. Generated type `Page` in `src/payload-types.ts`.

- [ ] **Step 1: Create the collection**

```ts
// src/payload/collections/Pages.ts
// Standalone rich-text pages (policy pages, and any future plain-content page),
// Shopify-style. Bodies live here (not Git). drafts: published = Visible,
// draft = Hidden. Routing: policy slugs render at root; everything else at
// /pages/<slug> — see src/lib/cms-pages.ts.
import type { CollectionConfig } from 'payload'
import { lexicalEditor, FixedToolbarFeature, BlocksFeature } from '@payloadcms/richtext-lexical'
import { slugify } from '../../lib/slugify.ts'

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Page', plural: 'Pages' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', '_status', 'slug', 'updatedAt'],
    group: 'Website',
    description: 'Standalone rich-text pages. Publish to make a page Visible on the website.',
  },
  access: { read: () => true },
  versions: { drafts: true },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: { placeholder: 'Page title' },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      label: 'Content',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          FixedToolbarFeature(),
          BlocksFeature({
            blocks: [
              {
                slug: 'html',
                labels: { singular: 'HTML', plural: 'HTML blocks' },
                fields: [
                  {
                    name: 'html',
                    type: 'code',
                    label: 'Raw HTML',
                    admin: { language: 'html', description: 'Custom HTML, rendered as-is on the published page.' },
                  },
                ],
              },
            ],
          }),
        ],
      }),
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'URL slug. Policy pages render at /<slug>; other pages at /pages/<slug>.',
      },
    },
    {
      name: 'showInFooter',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Show this page in the footer legal links.' },
    },
    {
      name: 'seoTitle',
      type: 'text',
      label: 'SEO title',
      admin: { position: 'sidebar', description: 'Optional. Falls back to the page title.' },
    },
    {
      name: 'metaDescription',
      type: 'textarea',
      admin: { position: 'sidebar', description: 'Meta description (aim ≤ 155 chars).' },
    },
    {
      name: 'ogImage',
      type: 'upload',
      relationTo: 'media',
      admin: { position: 'sidebar', description: 'Optional social share image.' },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (data.slug) data.slug = slugify(data.slug)
        else if (operation === 'create' && data.title) data.slug = slugify(data.title)
        return data
      },
    ],
  },
}
```

- [ ] **Step 2: Register in payload config**

In `src/payload.config.ts`: add `import { Pages } from './payload/collections/Pages.ts'` next to the other collection imports, and add `Pages` to the `collections` array (before `Users`):

```ts
collections: [Products, Media, Posts, Projects, Faqs, PageSeo, Pages, Users],
```

- [ ] **Step 3: Regenerate Payload types**

Run: `yes | npm run payload generate:types`
Expected: `src/payload-types.ts` updated; a `Page` interface now exists.
Verify: `grep -c "export interface Page " src/payload-types.ts` → `1`

- [ ] **Step 4: Boot the dev server and confirm it compiles**

Run: `nohup npm run dev > /tmp/envo-dev.log 2>&1 & echo $! > /tmp/envo-dev.pid`
Then poll the log for `Ready`, then `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/` → `200`.
Expected: no Drizzle/schema errors in `/tmp/envo-dev.log`. (Schema push may prompt — `yes |` it if needed per the admin-wedge note.)

- [ ] **Step 5: Commit**

```bash
git add src/payload/collections/Pages.ts src/payload.config.ts src/payload-types.ts
git commit -m "feat(pages): add Shopify-style CMS Pages collection"
```

---

### Task 2: Lexical content builders + unit test

**Files:**
- Create: `src/lib/lexical-build.ts`
- Test: `src/lib/lexical-build.test.ts`

**Interfaces:**
- Produces:
  - `text(s: string, format?: number): LexicalLeaf` — plain/marked text run (`format` bitmask: bold=1).
  - `b(s: string): LexicalLeaf` — bold run (`text(s, 1)`).
  - `link(label: string, url: string): LexicalNode` — inline link node.
  - `p(...children: LexicalNode[]): LexicalNode` — paragraph.
  - `h2(s: string): LexicalNode` — heading level 2.
  - `ul(items: LexicalNode[][]): LexicalNode` — bullet list; each item is an array of inline children.
  - `doc(...blocks: LexicalNode[]): { root: LexicalNode }` — wraps blocks in a Lexical root.
- These produce JSON shaped for `@payloadcms/richtext-lexical` and consumed by `RichTextRenderer.tsx` (paragraph/heading/list/link/text + format bitmask — already supported).

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/lexical-build.test.ts
import { describe, it, expect } from 'vitest'
import { doc, h2, p, ul, text, b, link } from './lexical-build'

describe('lexical-build', () => {
  it('builds a heading node', () => {
    const n = h2('Hello')
    expect(n.type).toBe('heading')
    expect(n.tag).toBe('h2')
    expect(n.children?.[0]).toMatchObject({ type: 'text', text: 'Hello' })
  })

  it('builds a paragraph with an inline link and bold run', () => {
    const n = p(text('See '), link('here', '/x'), text(' and '), b('this'))
    expect(n.type).toBe('paragraph')
    expect(n.children?.[1]).toMatchObject({ type: 'link', fields: { url: '/x' } })
    expect(n.children?.[3]).toMatchObject({ type: 'text', text: 'this', format: 1 })
  })

  it('builds a bullet list with two items', () => {
    const n = ul([[text('one')], [text('two')]])
    expect(n.type).toBe('list')
    expect(n.listType).toBe('bullet')
    expect(n.children).toHaveLength(2)
    expect(n.children?.[0].type).toBe('listitem')
  })

  it('wraps blocks in a root', () => {
    const d = doc(h2('A'), p(text('b')))
    expect(d.root.type).toBe('root')
    expect(d.root.children).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/lexical-build.test.ts`
Expected: FAIL — cannot resolve `./lexical-build`.

- [ ] **Step 3: Implement the builders**

```ts
// src/lib/lexical-build.ts
// Tiny helpers to author Lexical rich-text JSON for seed scripts. Shapes match
// @payloadcms/richtext-lexical and what src/components/blog/RichTextRenderer.tsx
// renders (paragraph/heading/list/link/text + format bitmask, bold = 1).

export type LexicalNode = {
  type: string
  tag?: string
  text?: string
  format?: number | string
  listType?: 'bullet' | 'number'
  fields?: { url?: string; newTab?: boolean }
  children?: LexicalNode[]
  version?: number
  [k: string]: unknown
}
export type LexicalLeaf = LexicalNode

const leaf = (extra: Partial<LexicalNode>): LexicalNode => ({ version: 1, ...extra })

export const text = (s: string, format = 0): LexicalLeaf =>
  leaf({ type: 'text', text: s, format, detail: 0, mode: 'normal', style: '' })

export const b = (s: string): LexicalLeaf => text(s, 1)

export const link = (label: string, url: string): LexicalNode =>
  leaf({
    type: 'link',
    fields: { url, newTab: false, linkType: 'custom' },
    children: [text(label)],
    direction: 'ltr',
    format: '',
    indent: 0,
  })

export const p = (...children: LexicalNode[]): LexicalNode =>
  leaf({ type: 'paragraph', children, direction: 'ltr', format: '', indent: 0, textFormat: 0 })

export const h2 = (s: string): LexicalNode =>
  leaf({ type: 'heading', tag: 'h2', children: [text(s)], direction: 'ltr', format: '', indent: 0 })

export const ul = (items: LexicalNode[][]): LexicalNode =>
  leaf({
    type: 'list',
    listType: 'bullet',
    tag: 'ul',
    start: 1,
    children: items.map((children, i) =>
      leaf({ type: 'listitem', value: i + 1, children, direction: 'ltr', format: '', indent: 0 }),
    ),
    direction: 'ltr',
    format: '',
    indent: 0,
  })

export const doc = (...blocks: LexicalNode[]): { root: LexicalNode } => ({
  root: leaf({ type: 'root', children: blocks, direction: 'ltr', format: '', indent: 0 }),
})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/lexical-build.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/lexical-build.ts src/lib/lexical-build.test.ts
git commit -m "feat(pages): add Lexical content builders for seeding"
```

---

### Task 3: Seed the 4 policy pages

**Files:**
- Create: `scripts/seed-cms-pages.mts`

**Interfaces:**
- Consumes: `doc/h2/p/ul/text/b/link` from Task 2; the `pages` collection from Task 1.
- Produces: 4 published `pages` docs with slugs `terms-of-service`, `privacy-policy`, `cookie-policy`, `acceptable-use-policy`, each `showInFooter: true`, with `seoTitle`/`metaDescription`.

**Source of truth:** the current JSX in `src/app/(frontend)/{terms-of-service,privacy-policy,cookie-policy,acceptable-use-policy}/page.tsx` (still present until Task 6). Port each heading/paragraph/list/link 1:1 into builder calls. Use the existing `metadata.title`/`description` for `seoTitle`/`metaDescription`.

- [ ] **Step 1: Write the seed script**

Mirror `scripts/seed-blog-posts.mts` for env/payload bootstrapping. Worked example for one page (port the other three the same way from their route files):

```ts
// scripts/seed-cms-pages.mts
// Run with: tsx --tsconfig tsconfig.json scripts/seed-cms-pages.mts
import { getPayload } from 'payload'
import config from '../src/payload.config.ts'
import { doc, h2, p, ul, text, b, link } from '../src/lib/lexical-build.ts'

const PAGES = [
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    showInFooter: true,
    seoTitle: 'Privacy Policy — ENVO',
    metaDescription: 'How Envo collects, uses and protects the information you share through this website.',
    content: doc(
      p(text('This Privacy Policy explains how Envo (“we”, “us”) handles information you provide through this website. This is a brand and product-information site — it does not sell products or process payments. Purchases are completed through our regional distributors, who operate their own websites and privacy practices.')),
      h2('Information we collect'),
      p(text('We collect only what you choose to share and basic technical data:')),
      ul([
        [b('Enquiry details'), text(' — the name, company, email, phone number and message you submit through our contact, free-layout-design or “find your match” forms.')],
        [b('Usage data'), text(' — standard technical information your browser sends (IP address, device/browser type, pages viewed), and analytics gathered via cookies.')],
      ]),
      // …port the remaining sections from privacy-policy/page.tsx 1:1…
      h2('Contact'),
      p(text('Questions about this policy? Email '), link('contact@envolighting.com', 'mailto:contact@envolighting.com'), text(', call 888.228.9138, or write to 409 Canton Street, Unit 5, Stoughton, MA 02072, USA.')),
    ),
  },
  // terms-of-service, cookie-policy, acceptable-use-policy — same shape, ported
  // from their existing route files.
]

const run = async () => {
  const payload = await getPayload({ config })
  for (const pg of PAGES) {
    const existing = await payload.find({ collection: 'pages', where: { slug: { equals: pg.slug } }, limit: 1 })
    const data = { ...pg, _status: 'published' as const }
    if (existing.docs[0]) {
      await payload.update({ collection: 'pages', id: existing.docs[0].id, data })
      console.log('updated', pg.slug)
    } else {
      await payload.create({ collection: 'pages', data })
      console.log('created', pg.slug)
    }
  }
  process.exit(0)
}
run()
```

- [ ] **Step 2: Run the seed**

Run: `npx tsx --tsconfig tsconfig.json scripts/seed-cms-pages.mts`
Expected: prints `created`/`updated` for all 4 slugs, exits 0.

- [ ] **Step 3: Verify the docs exist and are published**

Run: `curl -s http://localhost:3000/sitemap.xml >/dev/null` (warm) then query via a one-off node/tsx or check the admin list (ask user). Minimum check: rerun the seed → it prints `updated` for all 4 (proves idempotency + existence).

- [ ] **Step 4: Commit**

```bash
git add scripts/seed-cms-pages.mts
git commit -m "feat(pages): seed the 4 policy pages into the CMS"
```

---

### Task 4: `cms-pages.ts` helpers + unit test

**Files:**
- Create: `src/lib/cms-pages.ts`
- Test: `src/lib/cms-pages.test.ts`

**Interfaces:**
- Produces:
  - `LEGAL_ROOT_SLUGS: Record<string, string>` — maps a policy slug to its root path, e.g. `{ 'terms-of-service': '/terms-of-service', 'privacy-policy': '/privacy-policy', 'cookie-policy': '/cookie-policy', 'acceptable-use-policy': '/acceptable-use-policy' }`.
  - `pageHref(slug: string): string` — returns `LEGAL_ROOT_SLUGS[slug]` if present, else `/pages/${slug}`. Pure (unit-tested).
  - `type CmsPage = { title: string; slug: string; content: unknown; seoTitle?: string; metaDescription?: string; updatedAt?: string }`.
  - `getPageBySlug(slug: string): Promise<CmsPage | null>` — `payload.find({ collection: 'pages', where: { slug }, limit: 1 })`, mapped; relies on default drafts behavior to hide hidden pages.
  - `getFooterLegalPages(): Promise<{ label: string; href: string }[]>` — published pages with `showInFooter`, mapped to `{ label: title, href: pageHref(slug) }`.
  - `getAllCmsPageSlugs(): Promise<string[]>` — all published slugs (for sitemap + `/pages` static params).

- [ ] **Step 1: Write the failing test (pure mapping only)**

```ts
// src/lib/cms-pages.test.ts
import { describe, it, expect } from 'vitest'
import { pageHref, LEGAL_ROOT_SLUGS } from './cms-pages'

describe('pageHref', () => {
  it('maps a policy slug to its root path', () => {
    expect(pageHref('privacy-policy')).toBe('/privacy-policy')
    expect(LEGAL_ROOT_SLUGS['terms-of-service']).toBe('/terms-of-service')
  })
  it('maps any other slug under /pages', () => {
    expect(pageHref('warranty')).toBe('/pages/warranty')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/cms-pages.test.ts`
Expected: FAIL — cannot resolve `./cms-pages`.

- [ ] **Step 3: Implement the helpers**

```ts
// src/lib/cms-pages.ts
import { getPayload } from 'payload'
import config from '@/payload.config'

export const LEGAL_ROOT_SLUGS: Record<string, string> = {
  'terms-of-service': '/terms-of-service',
  'privacy-policy': '/privacy-policy',
  'cookie-policy': '/cookie-policy',
  'acceptable-use-policy': '/acceptable-use-policy',
}

export function pageHref(slug: string): string {
  return LEGAL_ROOT_SLUGS[slug] ?? `/pages/${slug}`
}

export type CmsPage = {
  title: string
  slug: string
  content: unknown
  seoTitle?: string
  metaDescription?: string
  updatedAt?: string
}

export async function getPageBySlug(slug: string): Promise<CmsPage | null> {
  const payload = await getPayload({ config })
  const res = await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, limit: 1 })
  const d = res.docs[0]
  if (!d) return null
  return {
    title: d.title,
    slug: d.slug ?? slug,
    content: d.content,
    seoTitle: d.seoTitle || undefined,
    metaDescription: d.metaDescription || undefined,
    updatedAt: d.updatedAt ?? undefined,
  }
}

export async function getFooterLegalPages(): Promise<{ label: string; href: string }[]> {
  try {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: 'pages',
      where: { showInFooter: { equals: true } },
      limit: 50,
      sort: 'title',
    })
    return res.docs.map((d) => ({ label: d.title, href: pageHref(d.slug ?? '') }))
  } catch {
    return []
  }
}

export async function getAllCmsPageSlugs(): Promise<string[]> {
  const payload = await getPayload({ config })
  const res = await payload.find({ collection: 'pages', limit: 200, depth: 0 })
  return res.docs.map((d) => d.slug).filter((s): s is string => !!s)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/cms-pages.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/cms-pages.ts src/lib/cms-pages.test.ts
git commit -m "feat(pages): cms-pages helpers (fetch, footer list, href map)"
```

---

### Task 5: Shared `CmsPage` render component

**Files:**
- Create: `src/components/pages/CmsPage.tsx`

**Interfaces:**
- Consumes: `CmsPage` type (Task 4); `LegalPage` (`src/components/legal/LegalPage.tsx`); `RichTextRenderer` (`src/components/blog/RichTextRenderer.tsx`).
- Produces: `CmsPageView({ page }: { page: CmsPage })` — renders `LegalPage` with the title + a "Last updated" date derived from `page.updatedAt`, and the body via `RichTextRenderer`.

- [ ] **Step 1: Implement the component**

```tsx
// src/components/pages/CmsPage.tsx
import { LegalPage } from '@/components/legal/LegalPage'
import { RichTextRenderer } from '@/components/blog/RichTextRenderer'
import type { CmsPage } from '@/lib/cms-pages'

function formatUpdated(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function CmsPageView({ page }: { page: CmsPage }) {
  return (
    <LegalPage title={page.title} updated={formatUpdated(page.updatedAt)}>
      <RichTextRenderer doc={page.content} />
    </LegalPage>
  )
}
```

Note: `RichTextRenderer`'s prop is `doc` (signature `{ doc }: { doc: LexicalDoc | unknown }`), used the same way in `blog/[slug]`, `projects/[slug]`, and `resources/faq`. No cast needed.

- [ ] **Step 2: Verify it typechecks (used in Tasks 6–7)**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -c "components/pages/CmsPage"` → `0` (no new errors from this file). (Pre-existing errors elsewhere are expected — see tech-debt note.)

- [ ] **Step 3: Commit**

```bash
git add src/components/pages/CmsPage.tsx
git commit -m "feat(pages): shared CmsPageView render component"
```

---

### Task 6: Rewrite the 4 policy routes to read from the CMS

**Files:**
- Modify: `src/app/(frontend)/terms-of-service/page.tsx`
- Modify: `src/app/(frontend)/privacy-policy/page.tsx`
- Modify: `src/app/(frontend)/cookie-policy/page.tsx`
- Modify: `src/app/(frontend)/acceptable-use-policy/page.tsx`

**Interfaces:**
- Consumes: `getPageBySlug` (Task 4), `CmsPageView` (Task 5).

- [ ] **Step 1: Replace each route file with a CMS-backed version**

Pattern (privacy-policy shown; repeat per file with its own slug + brand title):

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPageBySlug } from '@/lib/cms-pages'
import { CmsPageView } from '@/components/pages/CmsPage'

const SLUG = 'privacy-policy'

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug(SLUG)
  return {
    title: page?.seoTitle ?? 'Privacy Policy — ENVO',
    description: page?.metaDescription ?? 'How Envo handles the information you share through this website.',
  }
}

export default async function PrivacyPolicyPage() {
  const page = await getPageBySlug(SLUG)
  if (!page) notFound()
  return <CmsPageView page={page} />
}
```

Per-file slug + fallback title/description:
- `terms-of-service` → 'Terms of Service — ENVO'
- `cookie-policy` → 'Cookie Policy — ENVO'
- `acceptable-use-policy` → 'Acceptable Use Policy — ENVO'

- [ ] **Step 2: Verify each renders from the CMS (200 + content)**

Run:
```bash
for p in terms-of-service privacy-policy cookie-policy acceptable-use-policy; do
  printf "%-22s %s\n" "$p" "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/$p)"
done
curl -s http://localhost:3000/privacy-policy | grep -c "Information we collect"
```
Expected: all `200`; the grep returns ≥1 (content came from the seeded CMS doc, not JSX).

- [ ] **Step 3: Verify Hidden behavior**

In the admin (ask user) set Privacy Policy to draft/Hidden → `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/privacy-policy` → `404`. Re-publish afterwards.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(frontend)/terms-of-service/page.tsx" "src/app/(frontend)/privacy-policy/page.tsx" "src/app/(frontend)/cookie-policy/page.tsx" "src/app/(frontend)/acceptable-use-policy/page.tsx"
git commit -m "feat(pages): serve policy pages from the CMS at their root URLs"
```

---

### Task 7: `/pages/[slug]` dynamic route

**Files:**
- Create: `src/app/(frontend)/pages/[slug]/page.tsx`

**Interfaces:**
- Consumes: `getPageBySlug`, `getAllCmsPageSlugs`, `LEGAL_ROOT_SLUGS` (Task 4), `CmsPageView` (Task 5).

- [ ] **Step 1: Implement the dynamic route**

```tsx
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getPageBySlug, getAllCmsPageSlugs, LEGAL_ROOT_SLUGS } from '@/lib/cms-pages'
import { CmsPageView } from '@/components/pages/CmsPage'

export async function generateStaticParams() {
  const slugs = await getAllCmsPageSlugs()
  return slugs.filter((slug) => !LEGAL_ROOT_SLUGS[slug]).map((slug) => ({ slug }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  const page = await getPageBySlug(slug)
  if (!page) return {}
  return { title: page.seoTitle ?? `${page.title} — ENVO`, description: page.metaDescription }
}

export default async function CmsDynamicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (LEGAL_ROOT_SLUGS[slug]) redirect(LEGAL_ROOT_SLUGS[slug])
  const page = await getPageBySlug(slug)
  if (!page) notFound()
  return <CmsPageView page={page} />
}
```

- [ ] **Step 2: Verify with a throwaway CMS page**

In the admin (ask user) create + publish a page titled "Test Page" (slug auto = `test-page`).
Run:
```bash
curl -s -o /dev/null -w 'test-page %{http_code}\n' http://localhost:3000/pages/test-page
curl -s -o /dev/null -w 'legal-under-pages %{http_code}\n' -L http://localhost:3000/pages/privacy-policy
curl -s -o /dev/null -w 'missing %{http_code}\n' http://localhost:3000/pages/nope-not-real
```
Expected: `test-page 200`; `/pages/privacy-policy` redirects to `/privacy-policy` (final 200 with `-L`); `missing 404`. Delete the test page after.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(frontend)/pages/[slug]/page.tsx"
git commit -m "feat(pages): /pages/[slug] dynamic route for CMS pages"
```

---

### Task 8: Data-driven footer + sitemap

**Files:**
- Modify: `src/components/layout/footer.tsx`
- Modify: `src/app/sitemap.ts`

**Interfaces:**
- Consumes: `getFooterLegalPages`, `getAllCmsPageSlugs`, `pageHref` (Task 4).

- [ ] **Step 1: Make the footer render the CMS legal links**

`footer.tsx` is currently a sync component. Make it `async` and replace the hardcoded `.footer-legal` `<Link>`s with the CMS list:

```tsx
// at top:
import { getFooterLegalPages } from '@/lib/cms-pages'
// component becomes async:
export async function Footer() {
  const legal = await getFooterLegalPages()
  // …existing JSX…
  // replace the two hardcoded policy <Link>s with:
  // <div className="footer-legal">
  //   {legal.map((l) => (<Link key={l.href} href={l.href}>{l.label}</Link>))}
  // </div>
}
```
If `Footer` is imported into a layout that expects a sync component, confirm the layout already awaits/renders server components (App Router does). Keep the rest of the footer unchanged.

- [ ] **Step 2: Make the sitemap pull CMS page URLs**

In `src/app/sitemap.ts`, replace the hardcoded `'/terms-of-service', '/privacy-policy', '/cookie-policy', '/acceptable-use-policy'` static entries with a fail-soft block:

```ts
import { getAllCmsPageSlugs, pageHref } from '@/lib/cms-pages'
// …inside sitemap(), alongside the other try blocks:
try {
  for (const slug of await getAllCmsPageSlugs()) urls.add(pageHref(slug))
} catch { /* skip cms pages */ }
```
Remove the 4 policy slugs from `STATIC_PATHS` (they now come from the collection).

- [ ] **Step 3: Verify**

Run:
```bash
curl -s http://localhost:3000/ | grep -oE '/(terms-of-service|privacy-policy|cookie-policy|acceptable-use-policy)' | sort -u
curl -s http://localhost:3000/sitemap.xml | grep -oE '/(terms-of-service|privacy-policy|cookie-policy|acceptable-use-policy)' | sort -u
```
Expected: all 4 appear in both (rendered from the CMS, not hardcoded).

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/footer.tsx src/app/sitemap.ts
git commit -m "feat(pages): data-drive footer legal links + sitemap from CMS"
```

---

### Task 9: PagesOverview touch-up

**Files:**
- Modify: `src/payload/views/PagesOverview.tsx` and/or `src/data/site-pages.ts`

**Interfaces:**
- Consumes: nothing new. Cosmetic admin-map update.

- [ ] **Step 1: Mark the 4 policy pages as CMS-editable**

In `src/data/site-pages.ts`, set the 4 policy entries' `source` to `'cms'` and `editHref` to the `pages` collection edit list (`/admin/collections/pages`). This makes the read-only overview show 🟢 CMS + "Edit content" for them.

- [ ] **Step 2: Verify (ask user)**

Ask the user to open `/admin/pages-overview` and confirm the 4 policy rows show 🟢 CMS linking to the Pages collection. (Headless cannot render the admin.)

- [ ] **Step 3: Commit**

```bash
git add src/payload/views/PagesOverview.tsx src/data/site-pages.ts
git commit -m "chore(pages): mark policy pages as CMS-editable in the admin overview"
```

---

## Final verification

- [ ] `npx vitest run src/lib/lexical-build.test.ts src/lib/cms-pages.test.ts` → all pass.
- [ ] All 4 policy routes 200 and render seeded content; footer + sitemap list them.
- [ ] `/pages/<new-slug>` works for an admin-created page; `/pages/<legal-slug>` redirects; unknown slug 404s.
- [ ] Hidden (draft) page → 404 + absent from footer/sitemap.
- [ ] `git log --oneline` shows one commit per task.

## Self-review notes

- **Spec coverage:** collection (T1), drafts=Visible/Hidden (T1, verified T6 step 3), rich text + HTML block (T1), root URLs preserved (T6), `/pages/[slug]` + redirect + exclude (T7), `LEGAL_ROOT_SLUGS` coupling (T4), data-driven footer (T8), data-driven sitemap (T8), migration/seed (T2–T3), reuse RichTextRenderer/LegalPage (T5), PagesOverview touch-up (T9), SEO in collection (T1, consumed T6/T7). All covered.
- **RichTextRenderer prop name** is the one open detail — Task 5 Step 1 instructs to read the file and match the real prop. Resolve it there before wiring.
