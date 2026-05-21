# Blog (Posts) Collection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a `posts` collection in Payload CMS plus four frontend routes
so Wei can publish editorial content from the admin — drafts, scheduled
publishing, and SEO fields included. Pages use placeholder layouts until
visual design lands.

**Architecture:** Three-layer split. The `Posts` collection owns schema and
three inline hooks (autoSlug, calcReadingTime, revalidate). `src/lib/posts.ts`
is the only path that talks to Payload for posts — it enforces the
`publishedAt <= now` filter centrally. Route handlers (`/blog`, `/blog/[slug]`,
`/blog/category/[c]`, `/blog/tag/[t]`) call accessors and render. The
`afterChange` revalidate hook POSTs to `/api/revalidate` which calls Next.js
`revalidatePath`.

**Tech Stack:** Payload 3.84, Next.js 16.2 App Router, PostgreSQL via Payload,
Lexical richtext, Vitest 1.x (newly added).

**Scope deviation marker:** This plan adds Vitest (Task 0) because the spec
requires unit tests but the codebase has none. If you'd rather YAGNI-skip
testing infra to match `src/lib/products.ts` (which is also untested), delete
Task 0 and the test steps in Tasks 4–6 before executing — the rest of the
plan stands alone.

---

## Source-of-truth references

Reading these once before starting saves hours of guessing:

- Spec: `docs/superpowers/specs/2026-05-22-blog-collection-design.md`
- Accessor pattern to mirror: `src/lib/products.ts`
- Collection pattern to mirror: `src/payload/collections/Products.ts`
- Payload config: `src/payload.config.ts`
- Frontend route group: `src/app/(frontend)/`

Hard rule from the spec: route handlers and components **never** call
`payload.find({ collection: 'posts' })` directly. Always go through
`src/lib/posts.ts`. This keeps the publish/date filter in one place.

---

## Task 0: Add Vitest

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` — add `test` script + devDependencies

- [ ] **Step 1: Install Vitest**

```bash
npm install --save-dev vitest @vitest/coverage-v8
```

Expected: package-lock.json updated, no peer-dep errors.

- [ ] **Step 2: Add the config file**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globals: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 3: Add the test script**

In `package.json`, add to `scripts`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Sanity-check that Vitest runs**

```bash
npm test
```

Expected: "No test files found" — confirms Vitest is installed and finds the
include glob, but has nothing to run yet.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "test: add Vitest test framework"
```

---

## Task 1: Create the Posts collection (fields only)

This task gets the schema in the DB. Hooks come in Tasks 2, 3, 6.

**Files:**
- Create: `src/payload/collections/Posts.ts`
- Modify: `src/payload.config.ts`

- [ ] **Step 1: Write the collection file**

Create `src/payload/collections/Posts.ts`:

```ts
// Posts — editorial content (blog). See spec:
//   docs/superpowers/specs/2026-05-22-blog-collection-design.md
//
// Hooks (autoSlug, calcReadingTime, revalidate) are added in later tasks.

import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'publishedAt', 'featured', '_status'],
    description: 'ENVO editorial content. Publish to make a post visible on the website.',
    group: 'Editorial',
  },
  access: {
    read: () => true,
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [

        // ----- Tab 1: Content -----
        {
          label: 'Content',
          fields: [
            { name: 'title',   type: 'text',     required: true },
            {
              name: 'slug',
              type: 'text',
              required: true,
              unique: true,
              admin: {
                readOnly: true,
                description: 'Auto-generated from title. Edit in the database if you must change it.',
              },
            },
            {
              name: 'excerpt',
              type: 'textarea',
              required: true,
              maxLength: 200,
              admin: { description: 'Shown on cards and as the meta-description fallback. 200 chars max.' },
            },
            {
              name: 'cover',
              type: 'upload',
              relationTo: 'media',
              required: true,
              admin: { description: 'Cover image. Used on list cards and the detail page header.' },
            },
            { name: 'body', type: 'richText', required: true },
          ],
        },

        // ----- Tab 2: Taxonomy -----
        {
          label: 'Taxonomy',
          fields: [
            {
              name: 'category',
              type: 'select',
              required: true,
              options: [
                { label: 'Guides',        value: 'guides' },
                { label: 'Tech Insights', value: 'tech_insights' },
                { label: 'Company News',  value: 'company_news' },
                { label: 'Industry',      value: 'industry' },
              ],
            },
            {
              name: 'tags',
              type: 'array',
              fields: [{ name: 'tag', type: 'text', required: true }],
              admin: { description: 'Free-form tags. Used for /blog/tag/[t] pages.' },
            },
          ],
        },

        // ----- Tab 3: Publishing -----
        {
          label: 'Publishing',
          fields: [
            {
              name: 'publishedAt',
              type: 'date',
              required: true,
              admin: {
                description: 'When this post becomes visible. Future dates work as scheduled publishing.',
                date: { displayFormat: 'dd/MM/yyyy HH:mm' },
              },
            },
            {
              name: 'featured',
              type: 'checkbox',
              defaultValue: false,
              admin: { description: 'Show in featured spots on /blog and home.' },
            },
          ],
        },

        // ----- Tab 4: SEO -----
        {
          label: 'SEO',
          fields: [
            {
              name: 'seoTitle',
              type: 'text',
              admin: { description: 'Optional. Falls back to title if empty.' },
            },
            {
              name: 'seoDescription',
              type: 'textarea',
              admin: { description: 'Optional. Falls back to excerpt if empty.' },
            },
            {
              name: 'ogImage',
              type: 'upload',
              relationTo: 'media',
              admin: { description: 'Optional. Falls back to cover if empty.' },
            },
          ],
        },
      ],
    },

    // Hook-managed, admin-readonly. Lives outside the tabs so it's compact.
    {
      name: 'readingTime',
      type: 'number',
      admin: {
        readOnly: true,
        description: 'Estimated minutes to read. Calculated on save.',
        position: 'sidebar',
      },
    },
  ],
}
```

- [ ] **Step 2: Register Posts in payload.config**

In `src/payload.config.ts`, change:

```ts
import { Products } from './payload/collections/Products.ts'
import { Media } from './payload/collections/Media.ts'
```

…to:

```ts
import { Products } from './payload/collections/Products.ts'
import { Media } from './payload/collections/Media.ts'
import { Posts } from './payload/collections/Posts.ts'
```

And change:

```ts
  collections: [Products, Media],
```

…to:

```ts
  collections: [Products, Media, Posts],
```

- [ ] **Step 3: Regenerate Payload types**

```bash
npm run generate:types
```

Expected: `src/payload-types.ts` updated to include the new `Post` type.

- [ ] **Step 4: Verify schema pushes cleanly**

If dev server is already running, watch the log for the schema push.
Otherwise:

```bash
npm run dev
```

Expected log shows Drizzle pushing `posts` and `_posts_v` (versions) tables.
If it prompts for a destructive change confirmation, see memory:
`/admin` hang → cause #2 (`yes | nohup npm run dev`).

- [ ] **Step 5: Verify Posts appears in admin**

Visit `http://localhost:3000/admin` → sidebar should show an "Editorial" group
with "Posts" inside. Click "Create New" — all four tabs should render. Don't
save yet (slug is required and we haven't built the autoSlug hook).

- [ ] **Step 6: Commit**

```bash
git add src/payload/collections/Posts.ts src/payload.config.ts src/payload-types.ts
git commit -m "feat(payload): add Posts collection (fields only)"
```

---

## Task 2: autoSlug hook

Extract the slug generator as a pure function so it can be unit-tested.

**Files:**
- Create: `src/lib/slugify.ts`
- Create: `src/lib/slugify.test.ts`
- Modify: `src/payload/collections/Posts.ts`

- [ ] **Step 1: Write failing tests for slugify**

Create `src/lib/slugify.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { slugify } from './slugify'

describe('slugify', () => {
  it('lowercases and joins words with dashes', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('strips punctuation', () => {
    expect(slugify("Don't worry, be happy!")).toBe('dont-worry-be-happy')
  })

  it('collapses repeated spaces and dashes', () => {
    expect(slugify('a   b -- c')).toBe('a-b-c')
  })

  it('trims leading and trailing dashes', () => {
    expect(slugify('  --hello--  ')).toBe('hello')
  })

  it('returns empty string for empty input', () => {
    expect(slugify('')).toBe('')
  })

  it('handles unicode by stripping it', () => {
    // We intentionally do not transliterate. Editor can override slug manually.
    expect(slugify('LED 灯')).toBe('led')
  })
})
```

- [ ] **Step 2: Run the test, watch it fail**

```bash
npm test -- src/lib/slugify.test.ts
```

Expected: fails with "Cannot find module './slugify'".

- [ ] **Step 3: Implement slugify**

Create `src/lib/slugify.ts`:

```ts
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')   // drop non-word, non-space, non-dash
    .replace(/[\s_-]+/g, '-')   // collapse runs of space/underscore/dash
    .replace(/^-+|-+$/g, '')    // trim leading/trailing dashes
}
```

- [ ] **Step 4: Run the tests, watch them pass**

```bash
npm test -- src/lib/slugify.test.ts
```

Expected: all 6 tests pass.

- [ ] **Step 5: Wire the hook into Posts**

Add the import at the top of `src/payload/collections/Posts.ts` (after the
`CollectionConfig` import):

```ts
import { slugify } from '../../lib/slugify'
```

Then add a `hooks` block just before the closing `}` of the exported `Posts`
object (after the `fields` array):

```ts
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        // Auto-fill slug from title on create, only if slug is blank.
        if (operation === 'create' && !data.slug && data.title) {
          data.slug = slugify(data.title)
        }
        return data
      },
    ],
  },
```

- [ ] **Step 6: Manual verification in admin**

Restart dev server. In admin → Posts → Create New → fill title and other
required fields → leave slug blank → Save Draft. Slug should auto-populate.

- [ ] **Step 7: Commit**

```bash
git add src/lib/slugify.ts src/lib/slugify.test.ts src/payload/collections/Posts.ts
git commit -m "feat(payload): autoSlug hook on Posts collection"
```

---

## Task 3: calcReadingTime hook

**Files:**
- Create: `src/lib/lexical-text.ts`
- Create: `src/lib/lexical-text.test.ts`
- Modify: `src/payload/collections/Posts.ts`

- [ ] **Step 1: Write failing tests for the text extractor and reading-time calc**

Create `src/lib/lexical-text.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { lexicalToText, readingTimeMinutes } from './lexical-text'

describe('lexicalToText', () => {
  it('returns empty string for null / undefined', () => {
    expect(lexicalToText(null)).toBe('')
    expect(lexicalToText(undefined)).toBe('')
  })

  it('extracts text from a flat text node', () => {
    expect(lexicalToText({ text: 'hello' })).toBe('hello')
  })

  it('walks children recursively', () => {
    const doc = {
      root: {
        children: [
          { children: [{ text: 'one' }, { text: 'two' }] },
          { children: [{ text: 'three' }] },
        ],
      },
    }
    expect(lexicalToText(doc)).toContain('one')
    expect(lexicalToText(doc)).toContain('two')
    expect(lexicalToText(doc)).toContain('three')
  })
})

describe('readingTimeMinutes', () => {
  it('rounds up to nearest minute, minimum 1', () => {
    expect(readingTimeMinutes('')).toBe(1)
    expect(readingTimeMinutes('one')).toBe(1)
  })

  it('uses 200 words per minute', () => {
    const text = Array(400).fill('word').join(' ') // 400 words
    expect(readingTimeMinutes(text)).toBe(2)
  })

  it('rounds 250 words up to 2 minutes', () => {
    const text = Array(250).fill('word').join(' ')
    expect(readingTimeMinutes(text)).toBe(2)
  })
})
```

- [ ] **Step 2: Run the tests, watch them fail**

```bash
npm test -- src/lib/lexical-text.test.ts
```

Expected: fails — module not found.

- [ ] **Step 3: Implement the module**

Create `src/lib/lexical-text.ts`:

```ts
// Minimal Lexical-JSON text extractor. Handles the shapes Payload's
// lexicalEditor() produces today: { root: { children: [...] } }, plus
// arbitrary nesting through `children` arrays and leaf `text` strings.

type LexicalNode =
  | { text?: string; children?: LexicalNode[]; root?: LexicalNode }
  | null
  | undefined

export function lexicalToText(node: LexicalNode): string {
  if (!node) return ''
  if (typeof (node as { text?: unknown }).text === 'string') {
    return (node as { text: string }).text
  }
  const root = (node as { root?: LexicalNode }).root
  if (root) return lexicalToText(root)
  const children = (node as { children?: LexicalNode[] }).children
  if (Array.isArray(children)) return children.map(lexicalToText).join(' ')
  return ''
}

const WPM = 200

export function readingTimeMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / WPM))
}
```

- [ ] **Step 4: Run the tests, watch them pass**

```bash
npm test -- src/lib/lexical-text.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Wire the hook into Posts**

In `src/payload/collections/Posts.ts`, add the import:

```ts
import { lexicalToText, readingTimeMinutes } from '../../lib/lexical-text'
```

In the `hooks.beforeChange` array, add a second hook (after autoSlug):

```ts
      ({ data }) => {
        // Calculate readingTime from body. Re-runs on every save.
        if (data.body) {
          const text = lexicalToText(data.body)
          data.readingTime = readingTimeMinutes(text)
        }
        return data
      },
```

Final shape of the hooks block:

```ts
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation === 'create' && !data.slug && data.title) {
          data.slug = slugify(data.title)
        }
        return data
      },
      ({ data }) => {
        if (data.body) {
          const text = lexicalToText(data.body)
          data.readingTime = readingTimeMinutes(text)
        }
        return data
      },
    ],
  },
```

- [ ] **Step 6: Manual verification**

In admin, create a post with a 100-word body → Save Draft → reopen → sidebar
`readingTime` should read `1`.

- [ ] **Step 7: Commit**

```bash
git add src/lib/lexical-text.ts src/lib/lexical-text.test.ts src/payload/collections/Posts.ts
git commit -m "feat(payload): calcReadingTime hook on Posts collection"
```

---

## Task 4: Data accessor `src/lib/posts.ts`

The central query layer. Every public read of posts goes through here.

**Files:**
- Create: `src/lib/posts.ts`
- Create: `src/lib/posts.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/posts.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Payload before importing the module under test.
const mockFind = vi.fn()
vi.mock('payload', () => ({
  getPayload: vi.fn(async () => ({ find: mockFind })),
}))
vi.mock('@/payload.config', () => ({ default: {} }))

// Import after the mocks.
import { getPosts, getPostBySlug, getPostsByCategory, getPostsByTag, getRelatedPosts, getAllSlugs } from './posts'

beforeEach(() => {
  mockFind.mockReset()
  mockFind.mockResolvedValue({ docs: [], totalDocs: 0, totalPages: 0 })
})

function findCall() {
  return mockFind.mock.calls[0][0]
}

describe('posts accessor — publish/date filter', () => {
  it('getPosts filters by publishedAt <= now', async () => {
    await getPosts({})
    const call = findCall()
    expect(call.collection).toBe('posts')
    const conditions: object[] = call.where.and
    const dateCond = conditions.find((c: any) => 'publishedAt' in c) as any
    expect(dateCond.publishedAt.less_than_equal).toBeDefined()
  })

  it('getPostBySlug filters by slug AND publishedAt', async () => {
    mockFind.mockResolvedValue({ docs: [{ id: 1, slug: 'hello' }], totalDocs: 1, totalPages: 1 })
    await getPostBySlug('hello')
    const call = findCall()
    const conditions: object[] = call.where.and
    expect(conditions.some((c: any) => c.slug?.equals === 'hello')).toBe(true)
    expect(conditions.some((c: any) => c.publishedAt?.less_than_equal)).toBe(true)
  })

  it('getPostBySlug returns null when not found', async () => {
    mockFind.mockResolvedValue({ docs: [], totalDocs: 0, totalPages: 0 })
    const result = await getPostBySlug('nope')
    expect(result).toBeNull()
  })
})

describe('posts accessor — filter options', () => {
  it('getPosts adds category filter when provided', async () => {
    await getPosts({ category: 'guides' })
    const conditions: object[] = findCall().where.and
    expect(conditions.some((c: any) => c.category?.equals === 'guides')).toBe(true)
  })

  it('getPosts adds featured filter when true', async () => {
    await getPosts({ featured: true })
    const conditions: object[] = findCall().where.and
    expect(conditions.some((c: any) => c.featured?.equals === true)).toBe(true)
  })

  it('getPosts adds tag filter using array element match', async () => {
    await getPosts({ tag: 'dali' })
    const conditions: object[] = findCall().where.and
    // Tag is matched on the nested `tags.tag` path
    expect(conditions.some((c: any) => c['tags.tag']?.equals === 'dali')).toBe(true)
  })

  it('getPostsByCategory uses the category arg', async () => {
    await getPostsByCategory('industry', { limit: 5 })
    const conditions: object[] = findCall().where.and
    expect(conditions.some((c: any) => c.category?.equals === 'industry')).toBe(true)
    expect(findCall().limit).toBe(5)
  })

  it('getPostsByTag uses the tag arg', async () => {
    await getPostsByTag('led-strip')
    const conditions: object[] = findCall().where.and
    expect(conditions.some((c: any) => c['tags.tag']?.equals === 'led-strip')).toBe(true)
  })
})

describe('getRelatedPosts', () => {
  it('queries same category, excludes current id, defaults limit 3', async () => {
    await getRelatedPosts({ id: 7, category: 'guides' } as any)
    const call = findCall()
    const conditions: object[] = call.where.and
    expect(conditions.some((c: any) => c.category?.equals === 'guides')).toBe(true)
    expect(conditions.some((c: any) => c.id?.not_equals === 7)).toBe(true)
    expect(call.limit).toBe(3)
  })
})

describe('getAllSlugs', () => {
  it('returns just slug strings', async () => {
    mockFind.mockResolvedValue({
      docs: [{ slug: 'a' }, { slug: 'b' }],
      totalDocs: 2,
      totalPages: 1,
    })
    const result = await getAllSlugs()
    expect(result).toEqual(['a', 'b'])
  })

  it('paginates internally to 500 limit (smoke check)', async () => {
    await getAllSlugs()
    expect(findCall().limit).toBe(500)
  })
})
```

- [ ] **Step 2: Run tests, watch them fail**

```bash
npm test -- src/lib/posts.test.ts
```

Expected: fails with "Cannot find module './posts'".

- [ ] **Step 3: Implement the accessor**

Create `src/lib/posts.ts`:

```ts
// Server-only — never import this from a client component.
// All functions use the Payload local API (no HTTP, no auth required).
// Every read goes through this module so the publishedAt <= now filter is
// applied centrally. Route handlers and components must NOT call
// payload.find({ collection: 'posts' }) directly.

import { getPayload } from 'payload'
import config from '@/payload.config'

export type PostCategory =
  | 'guides'
  | 'tech_insights'
  | 'company_news'
  | 'industry'

export type Post = {
  id: number
  title: string
  slug: string
  excerpt: string
  cover: { url?: string; alt?: string } | number
  body: unknown // Lexical JSON
  category: PostCategory
  tags: { tag: string }[]
  publishedAt: string // ISO
  featured: boolean
  seoTitle: string | null
  seoDescription: string | null
  ogImage: { url?: string; alt?: string } | number | null
  readingTime: number | null
  _status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
}

async function payload() {
  return getPayload({ config })
}

/**
 * Date filter applied to every public read. Future-dated posts (publishedAt in
 * the future) do not appear on the public site even when their _status is
 * 'published'. Payload's drafts behavior already hides _status='draft' from
 * default reads, so we don't add an explicit _status filter here.
 */
function dateFilter(): object {
  return { publishedAt: { less_than_equal: new Date().toISOString() } }
}

export type GetPostsOpts = {
  limit?: number
  page?: number
  category?: PostCategory
  tag?: string
  featured?: boolean
}

/** Paginated list of posts. Featured-first ordering only when featured filter is set. */
export async function getPosts(opts: GetPostsOpts = {}): Promise<{
  docs: Post[]
  totalDocs: number
  totalPages: number
}> {
  const p = await payload()
  const conditions: object[] = [dateFilter()]
  if (opts.category) conditions.push({ category: { equals: opts.category } })
  if (opts.tag) conditions.push({ 'tags.tag': { equals: opts.tag } })
  if (opts.featured) conditions.push({ featured: { equals: true } })

  const result = await p.find({
    collection: 'posts',
    where: { and: conditions },
    sort: '-publishedAt',
    limit: opts.limit ?? 12,
    page: opts.page ?? 1,
    depth: 1,
  })

  return {
    docs: result.docs as unknown as Post[],
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
  }
}

/** Single post by slug. Returns null if not found or scheduled for the future. */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const p = await payload()
  const result = await p.find({
    collection: 'posts',
    where: { and: [{ slug: { equals: slug } }, dateFilter()] },
    limit: 1,
    depth: 1,
  })
  return (result.docs[0] as unknown as Post) ?? null
}

export async function getPostsByCategory(
  category: PostCategory,
  opts: { limit?: number } = {},
): Promise<Post[]> {
  const p = await payload()
  const result = await p.find({
    collection: 'posts',
    where: { and: [{ category: { equals: category } }, dateFilter()] },
    sort: '-publishedAt',
    limit: opts.limit ?? 24,
    depth: 1,
  })
  return result.docs as unknown as Post[]
}

export async function getPostsByTag(
  tag: string,
  opts: { limit?: number } = {},
): Promise<Post[]> {
  const p = await payload()
  const result = await p.find({
    collection: 'posts',
    where: { and: [{ 'tags.tag': { equals: tag } }, dateFilter()] },
    sort: '-publishedAt',
    limit: opts.limit ?? 24,
    depth: 1,
  })
  return result.docs as unknown as Post[]
}

/** Same-category posts, excluding the supplied post. Default 3. */
export async function getRelatedPosts(
  post: Pick<Post, 'id' | 'category'>,
  opts: { limit?: number } = {},
): Promise<Post[]> {
  const p = await payload()
  const result = await p.find({
    collection: 'posts',
    where: {
      and: [
        { category: { equals: post.category } },
        { id: { not_equals: post.id } },
        dateFilter(),
      ],
    },
    sort: '-publishedAt',
    limit: opts.limit ?? 3,
    depth: 1,
  })
  return result.docs as unknown as Post[]
}

/** All published slugs — feeds generateStaticParams on /blog/[slug]. */
export async function getAllSlugs(): Promise<string[]> {
  const p = await payload()
  const result = await p.find({
    collection: 'posts',
    where: { and: [dateFilter()] },
    limit: 500,
    depth: 0,
  })
  return (result.docs as unknown as { slug: string }[]).map((d) => d.slug)
}
```

- [ ] **Step 4: Run tests, watch them pass**

```bash
npm test -- src/lib/posts.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/posts.ts src/lib/posts.test.ts
git commit -m "feat: src/lib/posts.ts data accessor with publish/date filter"
```

---

## Task 5: `/api/revalidate` route handler

**Files:**
- Create: `src/app/api/revalidate/route.ts`
- Modify: `.env.example`

- [ ] **Step 1: Add env vars to .env.example**

Append to `.env.example`:

```
# Blog revalidation
SITE_URL=http://localhost:3000
REVALIDATE_SECRET=change-me-to-a-random-string
```

- [ ] **Step 2: Set the env vars in your local `.env`**

Edit `.env` (not committed) — add the same two vars with real values.

- [ ] **Step 3: Write the route handler**

Create `src/app/api/revalidate/route.ts`:

```ts
import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/revalidate?paths=/blog,/blog/foo
// Header: x-revalidate-secret: <REVALIDATE_SECRET>
//
// Called by the Posts collection's afterChange hook to invalidate Next.js's
// ISR cache when an editor publishes / unpublishes / edits a post.

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-revalidate-secret')
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const pathsParam = searchParams.get('paths')
  if (!pathsParam) {
    return NextResponse.json({ ok: false, error: 'missing paths param' }, { status: 400 })
  }

  const paths = pathsParam.split(',').filter(Boolean)
  for (const p of paths) {
    revalidatePath(p)
  }

  return NextResponse.json({ ok: true, revalidated: paths })
}
```

- [ ] **Step 4: Smoke-test the endpoint**

With dev server running:

```bash
curl -X POST 'http://localhost:3000/api/revalidate?paths=/blog,/blog/foo' \
  -H "x-revalidate-secret: $(grep REVALIDATE_SECRET .env | cut -d= -f2)"
```

Expected: `{"ok":true,"revalidated":["/blog","/blog/foo"]}`

And:

```bash
curl -X POST 'http://localhost:3000/api/revalidate?paths=/blog' \
  -H "x-revalidate-secret: wrong"
```

Expected: 401 `{"ok":false,"error":"unauthorized"}`.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/revalidate/route.ts .env.example
git commit -m "feat: /api/revalidate route handler for ISR invalidation"
```

---

## Task 6: afterChange revalidate hook on Posts

**Files:**
- Modify: `src/payload/collections/Posts.ts`

- [ ] **Step 1: Add the afterChange hook**

In `src/payload/collections/Posts.ts`, replace the entire existing `hooks`
block (which currently has only `beforeChange`) with this version that adds
`afterChange`:

```ts
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation === 'create' && !data.slug && data.title) {
          data.slug = slugify(data.title)
        }
        return data
      },
      ({ data }) => {
        if (data.body) {
          const text = lexicalToText(data.body)
          data.readingTime = readingTimeMinutes(text)
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc }) => {
        const wasPublic = previousDoc?._status === 'published'
        const isPublic = doc._status === 'published'
        if (!wasPublic && !isPublic) return doc // draft → draft, nothing public changed

        const siteUrl = process.env.SITE_URL
        const secret = process.env.REVALIDATE_SECRET
        if (!siteUrl || !secret) {
          // Skip silently in environments without these set (e.g. CI).
          return doc
        }

        const paths = new Set<string>(['/blog'])
        if (doc.slug) paths.add(`/blog/${doc.slug}`)
        if (doc.category) paths.add(`/blog/category/${doc.category}`)
        // Old slug: revalidate too, so a rename clears the old static page.
        if (previousDoc?.slug && previousDoc.slug !== doc.slug) {
          paths.add(`/blog/${previousDoc.slug}`)
        }

        try {
          await fetch(
            `${siteUrl}/api/revalidate?paths=${Array.from(paths).join(',')}`,
            { method: 'POST', headers: { 'x-revalidate-secret': secret } },
          )
        } catch (err) {
          // Don't fail the save because of a revalidate hiccup; log it.
          console.error('[Posts.afterChange] revalidate fetch failed:', err)
        }

        return doc
      },
    ],
  },
```

- [ ] **Step 2: Manual verification end-to-end**

1. `npm run dev`
2. Admin → Create New Post → fill all required fields → set publishedAt = now → **Publish**
3. Watch the dev server log — you should see a POST to `/api/revalidate` and a 200 response
4. Visit `/blog` — post should be there (page renders even if just placeholder — Task 7 wires the page)

If the page isn't built yet (you're executing tasks in order), you'll see a
404 on /blog, which is fine — confirm the revalidate fetch line in the log
and move on.

- [ ] **Step 3: Commit**

```bash
git add src/payload/collections/Posts.ts
git commit -m "feat(payload): afterChange revalidate hook on Posts"
```

---

## Task 7: RichTextRenderer component

A minimal React renderer for Lexical JSON. Handles the common nodes; can be
extended later.

**Files:**
- Create: `src/components/blog/RichTextRenderer.tsx`

- [ ] **Step 1: Write the component**

Create `src/components/blog/RichTextRenderer.tsx`:

```tsx
// Minimal Lexical-JSON → React renderer. Covers paragraphs, headings, lists,
// links, blockquotes, and inline marks (bold/italic/underline/code). Add more
// node types as they appear in real content.

import React from 'react'

type LexicalNode = {
  type?: string
  tag?: string
  text?: string
  format?: number
  url?: string
  newTab?: boolean
  fields?: { url?: string; newTab?: boolean }
  listType?: 'bullet' | 'number'
  children?: LexicalNode[]
}

type LexicalDoc = { root: LexicalNode }

const FMT = {
  BOLD: 1,
  ITALIC: 1 << 1,
  STRIKETHROUGH: 1 << 2,
  UNDERLINE: 1 << 3,
  CODE: 1 << 4,
}

function applyFormat(text: React.ReactNode, format = 0): React.ReactNode {
  let node = text
  if (format & FMT.CODE) node = <code>{node}</code>
  if (format & FMT.BOLD) node = <strong>{node}</strong>
  if (format & FMT.ITALIC) node = <em>{node}</em>
  if (format & FMT.UNDERLINE) node = <u>{node}</u>
  if (format & FMT.STRIKETHROUGH) node = <s>{node}</s>
  return node
}

function renderChildren(children: LexicalNode[] | undefined): React.ReactNode {
  if (!children) return null
  return children.map((child, i) => <Node key={i} node={child} />)
}

function Node({ node }: { node: LexicalNode }): React.ReactNode {
  if (!node) return null

  // Leaf text
  if (typeof node.text === 'string') {
    return applyFormat(node.text, node.format)
  }

  switch (node.type) {
    case 'paragraph':
      return <p>{renderChildren(node.children)}</p>
    case 'heading': {
      const Tag = (node.tag || 'h2') as keyof React.JSX.IntrinsicElements
      return <Tag>{renderChildren(node.children)}</Tag>
    }
    case 'quote':
      return <blockquote>{renderChildren(node.children)}</blockquote>
    case 'list': {
      const ListTag = node.listType === 'number' ? 'ol' : 'ul'
      return <ListTag>{renderChildren(node.children)}</ListTag>
    }
    case 'listitem':
      return <li>{renderChildren(node.children)}</li>
    case 'link': {
      const href = node.fields?.url ?? node.url ?? '#'
      const newTab = node.fields?.newTab ?? node.newTab
      return (
        <a href={href} target={newTab ? '_blank' : undefined} rel={newTab ? 'noopener noreferrer' : undefined}>
          {renderChildren(node.children)}
        </a>
      )
    }
    case 'linebreak':
      return <br />
    default:
      // Unknown node — render children if any, else nothing.
      return <>{renderChildren(node.children)}</>
  }
}

export function RichTextRenderer({ doc }: { doc: LexicalDoc | unknown }) {
  const root = (doc as LexicalDoc | undefined)?.root
  if (!root) return null
  return <>{renderChildren(root.children)}</>
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/blog/RichTextRenderer.tsx
git commit -m "feat(blog): RichTextRenderer for Lexical JSON"
```

---

## Task 8: PostCard component

**Files:**
- Create: `src/components/blog/PostCard.tsx`

- [ ] **Step 1: Write the component**

Create `src/components/blog/PostCard.tsx`:

```tsx
// Placeholder layout — Mackenzie replaces with final design later.

import Link from 'next/link'
import type { Post } from '@/lib/posts'

const CATEGORY_LABEL: Record<string, string> = {
  guides: 'Guides',
  tech_insights: 'Tech Insights',
  company_news: 'Company News',
  industry: 'Industry',
}

function coverUrl(cover: Post['cover']): string | null {
  if (typeof cover === 'number') return null
  return cover?.url ?? null
}

export function PostCard({ post }: { post: Post }) {
  const img = coverUrl(post.cover)
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="block border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition"
    >
      {img && (
        <div className="aspect-[16/9] bg-slate-100 overflow-hidden">
          <img src={img} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4">
        <div className="text-xs uppercase tracking-wide text-slate-500">
          {CATEGORY_LABEL[post.category] ?? post.category}
        </div>
        <h3 className="mt-2 font-semibold text-lg leading-tight">{post.title}</h3>
        <p className="mt-2 text-sm text-slate-600 line-clamp-2">{post.excerpt}</p>
        <div className="mt-3 text-xs text-slate-500">
          {new Date(post.publishedAt).toLocaleDateString()} · {post.readingTime ?? 1} min read
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/blog/PostCard.tsx
git commit -m "feat(blog): PostCard component (placeholder layout)"
```

---

## Task 9: PostHeader component

**Files:**
- Create: `src/components/blog/PostHeader.tsx`

- [ ] **Step 1: Write the component**

Create `src/components/blog/PostHeader.tsx`:

```tsx
// Placeholder layout — Mackenzie replaces with final design later.

import type { Post } from '@/lib/posts'

const CATEGORY_LABEL: Record<string, string> = {
  guides: 'Guides',
  tech_insights: 'Tech Insights',
  company_news: 'Company News',
  industry: 'Industry',
}

function coverUrl(cover: Post['cover']): string | null {
  if (typeof cover === 'number') return null
  return cover?.url ?? null
}

export function PostHeader({ post }: { post: Post }) {
  const img = coverUrl(post.cover)
  return (
    <header className="mb-8">
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {CATEGORY_LABEL[post.category] ?? post.category}
      </div>
      <h1 className="mt-2 text-3xl md:text-4xl font-bold leading-tight">{post.title}</h1>
      <p className="mt-3 text-lg text-slate-600">{post.excerpt}</p>
      <div className="mt-4 text-sm text-slate-500">
        ENVO Team · {new Date(post.publishedAt).toLocaleDateString()} · {post.readingTime ?? 1} min read
      </div>
      {img && (
        <div className="mt-6 aspect-[2/1] bg-slate-100 overflow-hidden rounded-lg">
          <img src={img} alt="" className="w-full h-full object-cover" />
        </div>
      )}
    </header>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/blog/PostHeader.tsx
git commit -m "feat(blog): PostHeader component (placeholder layout)"
```

---

## Task 10: `/blog` index page

**Files:**
- Create: `src/app/(frontend)/blog/page.tsx`

- [ ] **Step 1: Write the page**

Create `src/app/(frontend)/blog/page.tsx`:

```tsx
import { getPosts } from '@/lib/posts'
import { PostCard } from '@/components/blog/PostCard'
import type { Metadata } from 'next'

export const revalidate = 3600 // ISR fallback — every hour

export const metadata: Metadata = {
  title: 'Blog — ENVO',
  description: 'Guides, tech insights, and company news from ENVO.',
}

export default async function BlogIndexPage() {
  const [featured, recent] = await Promise.all([
    getPosts({ featured: true, limit: 1 }),
    getPosts({ limit: 12 }),
  ])

  const hero = featured.docs[0]
  const restIds = new Set(hero ? [hero.id] : [])
  const rest = recent.docs.filter((p) => !restIds.has(p.id))

  return (
    <main className="container mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Blog</h1>

      {hero && (
        <div className="mb-12">
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Featured</div>
          <PostCard post={hero} />
        </div>
      )}

      {rest.length === 0 ? (
        <p className="text-slate-600">No posts yet — check back soon.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 2: Smoke test**

```bash
npm run dev
```

Visit `http://localhost:3000/blog`. If you have at least one published post
with `publishedAt` in the past, it should render. Otherwise: "No posts yet".

- [ ] **Step 3: Commit**

```bash
git add 'src/app/(frontend)/blog/page.tsx'
git commit -m "feat(blog): /blog index page (placeholder layout)"
```

---

## Task 11: `/blog/[slug]` detail page

**Files:**
- Create: `src/app/(frontend)/blog/[slug]/page.tsx`

- [ ] **Step 1: Write the page**

Create `src/app/(frontend)/blog/[slug]/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPostBySlug, getAllSlugs, getRelatedPosts } from '@/lib/posts'
import { PostHeader } from '@/components/blog/PostHeader'
import { PostCard } from '@/components/blog/PostCard'
import { RichTextRenderer } from '@/components/blog/RichTextRenderer'

export const revalidate = 3600

export async function generateStaticParams() {
  const slugs = await getAllSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return {}
  const ogImg = typeof post.ogImage === 'object' && post.ogImage?.url
    ? post.ogImage.url
    : (typeof post.cover === 'object' ? post.cover?.url : undefined)
  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    openGraph: ogImg ? { images: [{ url: ogImg }] } : undefined,
  }
}

export default async function PostDetailPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const related = await getRelatedPosts(post)

  return (
    <main className="container mx-auto max-w-3xl px-4 py-12">
      <PostHeader post={post} />

      <article className="prose prose-slate max-w-none">
        <RichTextRenderer doc={post.body} />
      </article>

      {related.length > 0 && (
        <section className="mt-16 pt-8 border-t border-slate-200">
          <h2 className="text-2xl font-bold mb-6">Related posts</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {related.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
```

- [ ] **Step 2: Smoke test**

In admin, create a post with body content + Publish. Visit
`/blog/[its-slug]`. Body should render with paragraphs, headings, etc.

- [ ] **Step 3: Commit**

```bash
git add 'src/app/(frontend)/blog/[slug]/page.tsx'
git commit -m "feat(blog): /blog/[slug] detail page (placeholder layout)"
```

---

## Task 12: `/blog/category/[category]` page

**Files:**
- Create: `src/app/(frontend)/blog/category/[category]/page.tsx`

- [ ] **Step 1: Write the page**

Create `src/app/(frontend)/blog/category/[category]/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPostsByCategory, type PostCategory } from '@/lib/posts'
import { PostCard } from '@/components/blog/PostCard'

export const revalidate = 3600

const VALID_CATEGORIES: PostCategory[] = ['guides', 'tech_insights', 'company_news', 'industry']

const CATEGORY_LABEL: Record<PostCategory, string> = {
  guides: 'Guides',
  tech_insights: 'Tech Insights',
  company_news: 'Company News',
  industry: 'Industry',
}

export function generateStaticParams() {
  return VALID_CATEGORIES.map((category) => ({ category }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ category: string }> },
): Promise<Metadata> {
  const { category } = await params
  if (!VALID_CATEGORIES.includes(category as PostCategory)) return {}
  return {
    title: `${CATEGORY_LABEL[category as PostCategory]} — ENVO Blog`,
  }
}

export default async function CategoryPage(
  { params }: { params: Promise<{ category: string }> },
) {
  const { category } = await params
  if (!VALID_CATEGORIES.includes(category as PostCategory)) notFound()
  const cat = category as PostCategory

  const posts = await getPostsByCategory(cat, { limit: 50 })

  return (
    <main className="container mx-auto max-w-6xl px-4 py-12">
      <div className="text-sm text-slate-500 mb-2">Category</div>
      <h1 className="text-4xl font-bold mb-8">{CATEGORY_LABEL[cat]}</h1>

      {posts.length === 0 ? (
        <p className="text-slate-600">No posts in this category yet.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 2: Smoke test**

Visit `/blog/category/guides`. Should render with however many published
posts have category=guides. Visit `/blog/category/bogus` → 404.

- [ ] **Step 3: Commit**

```bash
git add 'src/app/(frontend)/blog/category/[category]/page.tsx'
git commit -m "feat(blog): /blog/category/[category] page"
```

---

## Task 13: `/blog/tag/[tag]` page

**Files:**
- Create: `src/app/(frontend)/blog/tag/[tag]/page.tsx`

- [ ] **Step 1: Write the page**

Create `src/app/(frontend)/blog/tag/[tag]/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { getPostsByTag } from '@/lib/posts'
import { PostCard } from '@/components/blog/PostCard'

export const revalidate = 3600
// Tag values aren't pre-known — render on-demand, fall back to ISR.
export const dynamicParams = true

export async function generateMetadata(
  { params }: { params: Promise<{ tag: string }> },
): Promise<Metadata> {
  const { tag } = await params
  return { title: `#${tag} — ENVO Blog` }
}

export default async function TagPage(
  { params }: { params: Promise<{ tag: string }> },
) {
  const { tag } = await params
  const posts = await getPostsByTag(tag, { limit: 50 })

  return (
    <main className="container mx-auto max-w-6xl px-4 py-12">
      <div className="text-sm text-slate-500 mb-2">Tag</div>
      <h1 className="text-4xl font-bold mb-8">#{tag}</h1>

      {posts.length === 0 ? (
        <p className="text-slate-600">No posts tagged "{tag}".</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 2: Smoke test**

Add a tag like `dali` to a published post. Visit `/blog/tag/dali`. Should
render. Visit `/blog/tag/nonexistent` → empty state, not 404 (tags are open).

- [ ] **Step 3: Commit**

```bash
git add 'src/app/(frontend)/blog/tag/[tag]/page.tsx'
git commit -m "feat(blog): /blog/tag/[tag] page"
```

---

## Task 14: End-to-end manual smoke test

This is the spec's primary validation: confirm the four publish states behave.

**Files:** none modified.

- [ ] **Step 1: Confirm typecheck and tests pass**

```bash
npm run typecheck && npm test && npm run lint
```

Expected: typecheck and tests clean. Lint may emit the 42 pre-existing
warnings noted in memory (`project_known-tech-debt-typecheck-lint.md`) —
ignore those, only fail on new ones.

- [ ] **Step 2: Walk the four states**

With `npm run dev` running:

1. **Draft (not visible).** Admin → create new post → fill required fields →
   Save Draft (do not Publish). Visit `/blog/[slug]` → expect 404.

2. **Published in past (visible).** Same post → set publishedAt to yesterday
   → Publish. Visit `/blog` → expect to see the post. Visit `/blog/[slug]`
   → expect detail page.

3. **Published in future (not visible).** New post → publishedAt = 1 hour
   from now → Publish. Visit `/blog/[slug]` → expect 404. Visit `/blog` →
   should NOT appear.

4. **Unpublished (not visible).** Take the past-published post → Unpublish.
   Visit `/blog/[slug]` → expect 404.

- [ ] **Step 3: Verify revalidate fires**

Watch the dev server log during each Publish / Unpublish. You should see a
POST to `/api/revalidate` returning 200 each time.

- [ ] **Step 4: Update memory if anything surprised you**

If a Payload behaviour, a Next.js routing detail, or a Lexical schema quirk
caught you out — write a `notes/` entry. (Memory feedback rule: save what's
non-obvious for future-Claude.)

---

## Out-of-scope deferrals

These belong in the spec's non-goals list and are NOT to be added to this
plan. If the user asks for any of them, brainstorm separately:

- RSS feed
- Email newsletter signup
- Comments
- View / read analytics
- Multilingual content
- Per-post author byline
- Cover image variants (beyond Media's existing imageSizes)
- Auto table of contents
- Manually curated related posts
- Tag lowercase normalisation (deferred per spec Risks section)
- Slug-change 301 redirects (deferred per spec Risks section)

---

## After all tasks complete

1. Push branch `feature/blog-collection-spec-2026-05-22` to origin (rebase
   on origin/dev first per team workflow memory).
2. Open PR against `dev`.
3. Tell Wei: "Posts collection is live in admin under Editorial group. The
   four pages render but use placeholder styling — design will come later.
   You can start drafting content."
4. Tasks 8 (apply final design) and 9 (add /blog to nav) from the spec's
   "Implementation order" stay parked until their respective dependencies
   land (design spec; navigation decision).
