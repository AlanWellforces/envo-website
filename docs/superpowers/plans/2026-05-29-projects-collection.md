# Projects Collection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded 4-card `/projects` page with a Payload-driven case-study feature mirroring the Blog (Posts) implementation — Collection + list page + detail page + industry/tag filter routes.

**Architecture:** Mirror the Blog 1:1. New `Projects` Payload Collection with a 5-tab schema (Content / Project Details / Taxonomy / Publishing / SEO). New typed query helpers in `src/lib/projects.ts` (mirror of `src/lib/posts.ts`). New components under `src/components/projects/` (copy-from-Blog for ProjectCard/ProjectHero, two new components for Gallery and ProductsUsed). Four routes: `/projects`, `/projects/[slug]`, `/projects/industry/[industry]`, `/projects/tag/[tag]`. Hooks: `autoSlug` + `revalidate` (no readingTime). All-conditional render so the zero-content launch state is clean.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Payload CMS 3, PostgreSQL via Drizzle, Tailwind v4. Reference files: `src/payload/collections/Posts.ts`, `src/lib/posts.ts`, `src/app/(frontend)/blog/**`, `src/components/blog/**`.

**Source spec:** [`docs/superpowers/specs/2026-05-29-projects-collection-design.md`](../specs/2026-05-29-projects-collection-design.md)

---

## File Structure

**Create:**
- `src/payload/collections/Projects.ts` — Payload Collection config (5 tabs, hooks)
- `src/lib/projects.ts` — typed query helpers (mirrors `src/lib/posts.ts`)
- `src/components/projects/ProjectCard.tsx` — list card (copy-from-PostCard)
- `src/components/projects/ProjectHero.tsx` — detail-page hero (copy-from-PostHero + meta strip)
- `src/components/projects/ProjectGallery.tsx` — `{image, caption}[]` → 2-col figure grid
- `src/components/projects/ProductsUsedList.tsx` — SKU array → product cards via `getProduct()`
- `src/app/(frontend)/projects/[slug]/page.tsx` — detail page
- `src/app/(frontend)/projects/industry/[industry]/page.tsx` — industry filter route
- `src/app/(frontend)/projects/tag/[tag]/page.tsx` — tag filter route

**Modify:**
- `src/payload.config.ts` — register `Projects` in the `collections` array
- `src/app/(frontend)/projects/page.tsx` — rewrite to Payload fetch
- `src/components/home/projects.tsx` — migrate from hardcoded data to Payload fetch

**Delete:**
- `src/data/projects.ts` — hardcoded placeholder data, no longer needed

---

## Task 1: Branch off origin/dev

**Files:** none

This work is unrelated to the current branch's WIP. Fresh feature branch keeps the diff reviewable.

- [ ] **Step 1: Fetch latest dev**

```bash
git fetch origin
git status --short
```

If the worktree is dirty, ask the user before stashing — there may be unrelated WIP they care about. Otherwise:

```bash
git stash push -u -m "pre-projects-feature WIP"
```

- [ ] **Step 2: Checkout dev + branch**

```bash
git checkout dev
git pull origin dev
git checkout -b feature/projects-collection-2026-05-29
```

- [ ] **Step 3: Verify clean working tree**

```bash
git status
```

Expected: `nothing to commit, working tree clean`.

---

## Task 2: Create the Projects Payload Collection

**Files:**
- Create: `src/payload/collections/Projects.ts`

- [ ] **Step 1: Write the Collection config**

Create `src/payload/collections/Projects.ts`:

```ts
// Projects — editorial case-study content. See spec:
//   docs/superpowers/specs/2026-05-29-projects-collection-design.md
//
// Mirrors Posts.ts: tabbed admin UI, autoSlug + revalidate hooks,
// drafts/versions enabled. The "Project Details" tab adds structured
// case-study metadata (client, location, year, gallery, productsUsed).

import type { CollectionConfig } from 'payload'
import { slugify } from '../../lib/slugify.ts'

export const Projects: CollectionConfig = {
  slug: 'projects',
  labels: {
    singular: 'Project',
    plural: 'Projects',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['coverPreview', 'title', '_status', 'industry', 'completedYear', 'publishedAt'],
    description: 'Real-world ENVO LED installations. Publish to make a case study visible on the website.',
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
            { name: 'title', type: 'text', required: true },
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
              admin: { description: 'Cover image. Used on list cards and the detail page hero.' },
            },
            { name: 'body', type: 'richText', required: true },
          ],
        },

        // ----- Tab 2: Project Details (Projects-specific structured meta) -----
        {
          label: 'Project Details',
          fields: [
            {
              name: 'client',
              type: 'text',
              admin: { description: 'Client / building owner. Leave blank if under NDA.' },
            },
            {
              name: 'location',
              type: 'text',
              admin: { description: 'e.g. "Los Angeles, USA".' },
            },
            {
              name: 'completedYear',
              type: 'number',
              admin: { description: 'Year the install was completed.' },
            },
            {
              name: 'gallery',
              type: 'array',
              admin: { description: 'Install photos. Caption is optional but boosts SEO + alt-text.' },
              fields: [
                { name: 'image', type: 'upload', relationTo: 'media', required: true },
                { name: 'caption', type: 'text' },
              ],
            },
            {
              name: 'productsUsed',
              type: 'array',
              admin: { description: 'ENVO SKU codes used in this install. Front-end resolves each via getProduct().' },
              fields: [{ name: 'sku', type: 'text', required: true }],
            },
            {
              name: 'testimonial',
              type: 'textarea',
              admin: { description: 'Optional client quote, shown as a pull-quote block.' },
            },
          ],
        },

        // ----- Tab 3: Taxonomy -----
        {
          label: 'Taxonomy',
          fields: [
            {
              name: 'industry',
              type: 'select',
              hasMany: true,
              required: true,
              options: [
                { label: 'Retail', value: 'retail' },
                { label: 'Hotel & Hospitality', value: 'hotel' },
                { label: 'Storefront', value: 'storefront' },
                { label: 'Architectural Facade', value: 'architectural' },
                { label: 'Canopy', value: 'canopy' },
                { label: 'Other', value: 'other' },
              ],
            },
            {
              name: 'tags',
              type: 'array',
              fields: [{ name: 'tag', type: 'text', required: true }],
              admin: { description: 'Free-form tags. Powers /projects/tag/[t] pages.' },
            },
          ],
        },

        // ----- Tab 4: Publishing -----
        {
          label: 'Publishing',
          fields: [
            {
              name: 'publishedAt',
              type: 'date',
              required: true,
              admin: {
                description: 'When this project becomes visible. Future dates work as scheduled publishing.',
                date: { displayFormat: 'dd/MM/yyyy HH:mm' },
              },
            },
            {
              name: 'featured',
              type: 'checkbox',
              defaultValue: false,
              admin: { description: 'Show in the featured strip on /projects.' },
            },
          ],
        },

        // ----- Tab 5: SEO -----
        {
          label: 'SEO',
          fields: [
            { name: 'seoTitle', type: 'text', admin: { description: 'Optional. Falls back to title.' } },
            { name: 'seoDescription', type: 'textarea', admin: { description: 'Optional. Falls back to excerpt.' } },
            { name: 'ogImage', type: 'upload', relationTo: 'media', admin: { description: 'Optional. Falls back to cover.' } },
          ],
        },
      ],
    },

    // List-only cover thumbnail (reuses Blog's PostCoverCell pattern).
    {
      name: 'coverPreview',
      type: 'ui',
      label: 'Cover',
      admin: {
        components: {
          Cell: '/payload/components/PostCoverCell#PostCoverCell',
        },
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation === 'create' && !data.slug && data.title) {
          data.slug = slugify(data.title)
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc }) => {
        const wasPublic = previousDoc?._status === 'published'
        const isPublic = doc._status === 'published'
        if (!wasPublic && !isPublic) return doc

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
        const secret = process.env.REVALIDATE_SECRET
        if (!siteUrl || !secret) return doc

        const paths = new Set<string>(['/projects'])
        if (doc.slug) paths.add(`/projects/${doc.slug}`)

        // Industry list pages — current + removed (industry is multi-select).
        const currentInd: string[] = Array.isArray(doc.industry) ? doc.industry : []
        const prevInd: string[] = Array.isArray(previousDoc?.industry) ? previousDoc.industry : []
        for (const i of new Set([...currentInd, ...prevInd])) {
          paths.add(`/projects/industry/${i}`)
        }

        // Tag pages — current + removed.
        const currentTags: string[] = (doc.tags ?? []).map((t: { tag: string }) => t.tag).filter(Boolean)
        const prevTags: string[] = (previousDoc?.tags ?? []).map((t: { tag: string }) => t.tag).filter(Boolean)
        for (const t of new Set([...currentTags, ...prevTags])) {
          paths.add(`/projects/tag/${t}`)
        }

        // Old slug — clear the stale static page.
        if (previousDoc?.slug && previousDoc.slug !== doc.slug) {
          paths.add(`/projects/${previousDoc.slug}`)
        }

        try {
          await fetch(
            `${siteUrl}/api/revalidate?paths=${Array.from(paths).join(',')}`,
            { method: 'POST', headers: { 'x-revalidate-secret': secret } },
          )
        } catch (err) {
          console.error('[Projects.afterChange] revalidate fetch failed:', err)
        }
        return doc
      },
    ],
  },
}
```

- [ ] **Step 2: Verify file compiles in isolation**

```bash
npx tsc --noEmit src/payload/collections/Projects.ts
```

Expected: no output (success). If errors about Payload types, the dev server registration in Task 3 will resolve them — the bare file lacks the registered type augmentation.

- [ ] **Step 3: Commit**

```bash
git add src/payload/collections/Projects.ts
git commit -m "feat(projects): add Projects Payload Collection (schema + hooks)"
```

---

## Task 3: Register Projects in payload.config + verify schema push

**Files:**
- Modify: `src/payload.config.ts`

- [ ] **Step 1: Locate the collections array**

```bash
grep -nE "collections:" src/payload.config.ts
```

- [ ] **Step 2: Add Projects to the import + array**

In `src/payload.config.ts`, find the line that imports `Posts` and add Projects beside it. Then in the `collections: [...]` array, add `Projects` (alphabetical order with the existing entries — typically after `Posts`):

```ts
import { Posts } from './payload/collections/Posts.ts'
import { Projects } from './payload/collections/Projects.ts'   // ← ADD
// ... other imports
export default buildConfig({
  // ...
  collections: [Media, Posts, Products, Projects],  // ← ADD Projects
  // ...
})
```

(Exact existing structure may vary — read the file first.)

- [ ] **Step 3: Restart dev server**

The detached dev server needs to reload the config. If it's still running and just hot-reloaded, that's fine. Otherwise:

```bash
kill $(cat /tmp/envo-dev.pid) 2>/dev/null
rm -f /tmp/envo-dev.log
nohup npm run dev > /tmp/envo-dev.log 2>&1 &
echo $! > /tmp/envo-dev.pid
disown

for i in $(seq 1 60); do
  if grep -qE "Ready in|Error:|EADDRINUSE" /tmp/envo-dev.log 2>/dev/null; then break; fi
  sleep 1
done
tail -30 /tmp/envo-dev.log
```

- [ ] **Step 4: Verify schema push completed without an interactive prompt**

```bash
grep -E "Pulling schema|schema-push|y/N|destructive" /tmp/envo-dev.log | tail
curl -sS -m 30 -o /dev/null -w "admin HTTP %{http_code}\n" http://localhost:3000/admin
```

Expected: HTTP 200 on `/admin`. If the log shows a `y/N` prompt and admin hangs, follow `memory/project_admin-wedge-payload-schema-push.md`: confirm the destructive intent is acceptable, then `kill ... && yes | nohup npm run dev > ...`.

- [ ] **Step 5: Open /admin/collections/projects in browser**

Visit `http://localhost:3000/admin/collections/projects`. The Projects list page should render (empty). The "Create New" form should show all 5 tabs.

- [ ] **Step 6: Commit**

```bash
git add src/payload.config.ts
git commit -m "feat(projects): register Projects collection in payload config"
```

---

## Task 4: Create src/lib/projects.ts query helpers

**Files:**
- Create: `src/lib/projects.ts`
- Test: `src/lib/projects.test.ts`

- [ ] **Step 1: Read the Posts helper for the canonical shape**

```bash
cat src/lib/posts.ts
```

Note the exported symbols: `PostCategory`, `Post`, `GetPostsOpts`, `getPosts`, `getPostBySlug`, `getPostsByCategory`, `getPostsByTag`, `getRelatedPosts`, `getPostCounts`, `getAllSlugs`. Projects needs the same surface (with `industry` instead of `category` and no `readingTime`).

- [ ] **Step 2: Write the helper**

Create `src/lib/projects.ts`:

```ts
// Projects — typed query helpers over the Payload Local API.
// Mirrors src/lib/posts.ts. Industry is multi-select, so filtering uses
// `contains`/`in` semantics rather than equality.

import { getPayload } from 'payload'
import configPromise from '@payload-config'

export type ProjectIndustry =
  | 'retail'
  | 'hotel'
  | 'storefront'
  | 'architectural'
  | 'canopy'
  | 'other'

export const INDUSTRY_LABELS: Record<ProjectIndustry, string> = {
  retail: 'Retail',
  hotel: 'Hotel & Hospitality',
  storefront: 'Storefront',
  architectural: 'Architectural Facade',
  canopy: 'Canopy',
  other: 'Other',
}

export type ProjectGalleryItem = {
  image: { url: string; alt?: string } | string
  caption?: string
}

export type Project = {
  id: string | number
  slug: string
  title: string
  excerpt: string
  cover: { url: string; alt?: string } | string
  body: unknown
  client?: string
  location?: string
  completedYear?: number
  gallery?: ProjectGalleryItem[]
  productsUsed?: string[]      // flattened from [{sku}] to string[]
  testimonial?: string
  industry: ProjectIndustry[]
  tags: string[]
  publishedAt: string
  featured: boolean
  seoTitle?: string
  seoDescription?: string
  ogImage?: { url: string; alt?: string } | string
}

export type GetProjectsOpts = {
  featured?: boolean
  limit?: number
  industry?: ProjectIndustry
  tag?: string
  excludeSlug?: string
}

type RawProject = {
  id: string | number
  slug: string
  title: string
  excerpt: string
  cover: unknown
  body: unknown
  client?: string | null
  location?: string | null
  completedYear?: number | null
  gallery?: Array<{ image: unknown; caption?: string | null }> | null
  productsUsed?: Array<{ sku: string }> | null
  testimonial?: string | null
  industry: ProjectIndustry[]
  tags?: Array<{ tag: string }> | null
  publishedAt: string
  featured?: boolean | null
  seoTitle?: string | null
  seoDescription?: string | null
  ogImage?: unknown
}

function shape(p: RawProject): Project {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    cover: p.cover as Project['cover'],
    body: p.body,
    client: p.client ?? undefined,
    location: p.location ?? undefined,
    completedYear: p.completedYear ?? undefined,
    gallery: p.gallery?.map((g) => ({
      image: g.image as ProjectGalleryItem['image'],
      caption: g.caption ?? undefined,
    })),
    productsUsed: p.productsUsed?.map((r) => r.sku).filter(Boolean),
    testimonial: p.testimonial ?? undefined,
    industry: p.industry,
    tags: p.tags?.map((t) => t.tag).filter(Boolean) ?? [],
    publishedAt: p.publishedAt,
    featured: p.featured ?? false,
    seoTitle: p.seoTitle ?? undefined,
    seoDescription: p.seoDescription ?? undefined,
    ogImage: p.ogImage as Project['ogImage'] | undefined,
  }
}

export async function getProjects(opts: GetProjectsOpts = {}): Promise<{
  docs: Project[]
  totalDocs: number
}> {
  const payload = await getPayload({ config: configPromise })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = { _status: { equals: 'published' } }
  if (opts.featured) where.featured = { equals: true }
  if (opts.industry) where.industry = { contains: opts.industry }
  if (opts.tag) where['tags.tag'] = { equals: opts.tag }
  if (opts.excludeSlug) where.slug = { not_equals: opts.excludeSlug }

  const res = await payload.find({
    collection: 'projects',
    where,
    sort: '-publishedAt',
    limit: opts.limit ?? 50,
    depth: 2,
  })
  return {
    docs: (res.docs as unknown as RawProject[]).map(shape),
    totalDocs: res.totalDocs,
  }
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const payload = await getPayload({ config: configPromise })
  const res = await payload.find({
    collection: 'projects',
    where: { slug: { equals: slug }, _status: { equals: 'published' } },
    limit: 1,
    depth: 2,
  })
  const doc = res.docs[0] as unknown as RawProject | undefined
  return doc ? shape(doc) : null
}

export async function getRelatedProjects(
  industry: ProjectIndustry,
  excludeSlug: string,
  limit = 3,
): Promise<Project[]> {
  const { docs } = await getProjects({ industry, excludeSlug, limit })
  return docs
}

export async function getAllProjectSlugs(): Promise<string[]> {
  const payload = await getPayload({ config: configPromise })
  const res = await payload.find({
    collection: 'projects',
    where: { _status: { equals: 'published' } },
    limit: 500,
    pagination: false,
    depth: 0,
  })
  return res.docs.map((d) => (d as { slug: string }).slug).filter(Boolean)
}
```

- [ ] **Step 3: Write the smoke test**

Create `src/lib/projects.test.ts` (this mirrors the shape of `src/lib/posts.test.ts` — a unit-level guard, not a full integration test):

```ts
import { describe, it, expect } from 'vitest'
import { INDUSTRY_LABELS } from './projects.ts'

describe('projects helpers', () => {
  it('exposes a label for every industry value', () => {
    expect(INDUSTRY_LABELS.retail).toBe('Retail')
    expect(INDUSTRY_LABELS.hotel).toBe('Hotel & Hospitality')
    expect(INDUSTRY_LABELS.storefront).toBe('Storefront')
    expect(INDUSTRY_LABELS.architectural).toBe('Architectural Facade')
    expect(INDUSTRY_LABELS.canopy).toBe('Canopy')
    expect(INDUSTRY_LABELS.other).toBe('Other')
  })
})
```

- [ ] **Step 4: Run the test**

```bash
npx vitest run src/lib/projects.test.ts
```

Expected: 1 pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/projects.ts src/lib/projects.test.ts
git commit -m "feat(projects): typed query helpers over Payload Local API"
```

---

## Task 5: Create ProjectCard component (copy-from-PostCard)

**Files:**
- Create: `src/components/projects/ProjectCard.tsx`

- [ ] **Step 1: Read PostCard for the canonical structure**

```bash
cat src/components/blog/PostCard.tsx
```

Note: PostCard renders cover image, title, excerpt, category chip + publishedAt date.

- [ ] **Step 2: Create ProjectCard with the case-study delta**

The differences vs PostCard:
- Replace `category` chip with `industry[]` chips (multi-select → multiple chips)
- Replace `publishedAt` formatted date with `location · completedYear` meta line
- Card link target: `/projects/<slug>` not `/blog/<slug>`

Create `src/components/projects/ProjectCard.tsx`:

```tsx
import Image from 'next/image'
import Link from 'next/link'
import type { Project } from '@/lib/projects'
import { INDUSTRY_LABELS } from '@/lib/projects'

type Props = { project: Project }

export function ProjectCard({ project }: Props) {
  const cover = typeof project.cover === 'string' ? project.cover : project.cover?.url
  const coverAlt =
    typeof project.cover === 'object' && project.cover?.alt ? project.cover.alt : project.title

  const metaParts: string[] = []
  if (project.location) metaParts.push(project.location)
  if (project.completedYear) metaParts.push(String(project.completedYear))

  return (
    <Link href={`/projects/${project.slug}`} className="project-card">
      <div className="project-card-cover">
        {cover && (
          <Image
            src={cover}
            alt={coverAlt}
            width={640}
            height={400}
            sizes="(min-width: 1100px) 33vw, (min-width: 641px) 50vw, 100vw"
          />
        )}
      </div>
      <div className="project-card-body">
        <div className="project-card-chips">
          {project.industry.map((i) => (
            <span key={i} className="project-card-chip">{INDUSTRY_LABELS[i]}</span>
          ))}
        </div>
        <h3 className="project-card-title">{project.title}</h3>
        <p className="project-card-excerpt">{project.excerpt}</p>
        {metaParts.length > 0 && (
          <div className="project-card-meta">{metaParts.join(' · ')}</div>
        )}
      </div>
    </Link>
  )
}
```

- [ ] **Step 3: Add minimal styles to `src/app/envo.css`**

Append at the end of the file:

```css
/* ===== Project cards (case study list) ===== */
.project-card {
  display: block;
  background: var(--bg-card, #fff);
  border: 1px solid var(--line, #e2e5ea);
  border-radius: 12px;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transition: transform .2s ease, border-color .2s ease;
}
.project-card:hover { transform: translateY(-3px); border-color: var(--blue, #0071bc); }
.project-card-cover { aspect-ratio: 16 / 10; overflow: hidden; background: #f4f5f7; }
.project-card-cover img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s ease; }
.project-card:hover .project-card-cover img { transform: scale(1.04); }
.project-card-body { padding: 18px 20px 22px; }
.project-card-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.project-card-chip {
  padding: 2px 8px;
  font-size: 11px; font-weight: 500;
  color: var(--blue, #0071bc);
  background: var(--blue-soft, #e8f1fb);
  border-radius: 4px;
  letter-spacing: 0.02em;
}
.project-card-title { font-size: 17px; margin: 0 0 6px; letter-spacing: -0.01em; font-weight: 700; }
.project-card-excerpt { font-size: 13.5px; color: var(--text-muted, #4a5568); margin: 0 0 12px; line-height: 1.5; }
.project-card-meta { font-size: 12.5px; color: var(--text-subtle, #6a7a8a); }
```

- [ ] **Step 4: Verify compilation**

```bash
curl -sS -m 30 -o /dev/null -w "/projects HTTP %{http_code}\n" http://localhost:3000/projects
tail -10 /tmp/envo-dev.log | grep -iE "error|fail" | grep -v "email adapter"
```

Expected: HTTP 200 (component not yet imported anywhere, so no visible change), no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/projects/ProjectCard.tsx src/app/envo.css
git commit -m "feat(projects): ProjectCard component + styles"
```

---

## Task 6: Create ProjectHero component

**Files:**
- Create: `src/components/projects/ProjectHero.tsx`

- [ ] **Step 1: Read PostHero for the structure**

```bash
cat src/components/blog/PostHero.tsx
```

- [ ] **Step 2: Create ProjectHero with industry chips + meta row**

Create `src/components/projects/ProjectHero.tsx`:

```tsx
import Image from 'next/image'
import type { Project } from '@/lib/projects'
import { INDUSTRY_LABELS } from '@/lib/projects'

type Props = { project: Project }

export function ProjectHero({ project }: Props) {
  const cover = typeof project.cover === 'string' ? project.cover : project.cover?.url
  const coverAlt =
    typeof project.cover === 'object' && project.cover?.alt ? project.cover.alt : project.title

  const metaParts: string[] = []
  if (project.client) metaParts.push(project.client)
  if (project.location) metaParts.push(project.location)
  if (project.completedYear) metaParts.push(String(project.completedYear))

  return (
    <header className="project-hero">
      {cover && (
        <div className="project-hero-cover">
          <Image
            src={cover}
            alt={coverAlt}
            width={1600}
            height={900}
            priority
            sizes="(min-width: 1100px) 1100px, 100vw"
          />
        </div>
      )}
      <div className="project-hero-inner">
        <div className="project-hero-chips">
          {project.industry.map((i) => (
            <span key={i} className="project-hero-chip">{INDUSTRY_LABELS[i]}</span>
          ))}
        </div>
        <h1 className="project-hero-title">{project.title}</h1>
        {metaParts.length > 0 && (
          <div className="project-hero-meta">{metaParts.join(' · ')}</div>
        )}
        <p className="project-hero-excerpt">{project.excerpt}</p>
      </div>
    </header>
  )
}
```

- [ ] **Step 3: Add styles to `src/app/envo.css`**

Append:

```css
/* ===== Project hero (case study detail) ===== */
.project-hero { background: var(--bg-card, #fff); padding: 0 0 32px; }
.project-hero-cover {
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: #f4f5f7;
}
.project-hero-cover img { width: 100%; height: 100%; object-fit: cover; }
.project-hero-inner {
  max-width: 880px;
  margin: 0 auto;
  padding: 32px 24px 0;
}
.project-hero-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
.project-hero-chip {
  padding: 4px 10px;
  font-size: 12px; font-weight: 500;
  color: var(--blue, #0071bc);
  background: var(--blue-soft, #e8f1fb);
  border-radius: 4px;
  letter-spacing: 0.02em;
}
.project-hero-title {
  font-size: clamp(32px, 4.5vw, 56px);
  line-height: 1.05;
  letter-spacing: -0.025em;
  margin: 0 0 14px;
  font-weight: 700;
}
.project-hero-meta {
  font-size: 14px;
  color: var(--text-subtle, #6a7a8a);
  letter-spacing: 0.02em;
  margin-bottom: 16px;
}
.project-hero-excerpt {
  font-size: 18px;
  line-height: 1.5;
  color: var(--text-muted, #4a5568);
  margin: 0;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/projects/ProjectHero.tsx src/app/envo.css
git commit -m "feat(projects): ProjectHero component + styles"
```

---

## Task 7: Create ProjectGallery component

**Files:**
- Create: `src/components/projects/ProjectGallery.tsx`

- [ ] **Step 1: Write the component**

Create `src/components/projects/ProjectGallery.tsx`:

```tsx
import Image from 'next/image'
import type { ProjectGalleryItem } from '@/lib/projects'

type Props = { items: ProjectGalleryItem[] }

export function ProjectGallery({ items }: Props) {
  if (items.length === 0) return null

  return (
    <section className="project-gallery">
      <div className="project-gallery-grid">
        {items.map((it, idx) => {
          const url = typeof it.image === 'string' ? it.image : it.image?.url
          const altFromImage =
            typeof it.image === 'object' && it.image?.alt ? it.image.alt : undefined
          const alt = it.caption ?? altFromImage ?? `Project photo ${idx + 1}`
          if (!url) return null
          return (
            <figure key={idx} className="project-gallery-figure">
              <Image
                src={url}
                alt={alt}
                width={1200}
                height={800}
                sizes="(min-width: 900px) 50vw, 100vw"
              />
              {it.caption && (
                <figcaption className="project-gallery-caption">{it.caption}</figcaption>
              )}
            </figure>
          )
        })}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Add styles to `src/app/envo.css`**

Append:

```css
/* ===== Project gallery (figure grid) ===== */
.project-gallery { max-width: 1100px; margin: 0 auto; padding: 48px 24px; }
.project-gallery-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}
@media (max-width: 740px) {
  .project-gallery-grid { grid-template-columns: 1fr; }
}
.project-gallery-figure { margin: 0; }
.project-gallery-figure img {
  width: 100%;
  height: auto;
  border-radius: 10px;
  display: block;
}
.project-gallery-caption {
  margin-top: 8px;
  font-size: 13px;
  color: var(--text-subtle, #6a7a8a);
  line-height: 1.5;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/projects/ProjectGallery.tsx src/app/envo.css
git commit -m "feat(projects): ProjectGallery component + styles"
```

---

## Task 8: Create ProductsUsedList component

**Files:**
- Create: `src/components/projects/ProductsUsedList.tsx`

- [ ] **Step 1: Read getProduct signature**

```bash
grep -nE "export (async )?function getProduct" src/lib/products.ts
```

Confirm `getProduct(sku: string): Promise<Product | null>` exists. If the signature differs, adapt accordingly.

- [ ] **Step 2: Write the server component**

Create `src/components/projects/ProductsUsedList.tsx`:

```tsx
// Server component: resolves each SKU via Akeneo-backed getProduct().
// SKUs that don't resolve render as a muted pill — protects against rot.

import Image from 'next/image'
import { getProduct, resolveProductImage } from '@/lib/products'

type Props = { skus: string[] }

export async function ProductsUsedList({ skus }: Props) {
  if (skus.length === 0) return null

  const items = await Promise.all(
    skus.map(async (sku) => ({ sku, product: await getProduct(sku) })),
  )

  return (
    <section className="products-used">
      <h2 className="products-used-heading">Products used</h2>
      <ul className="products-used-grid">
        {items.map(({ sku, product }) => {
          if (!product) {
            return (
              <li key={sku} className="products-used-item products-used-item-muted">
                <span className="products-used-sku">ENVO {sku}</span>
                <span className="products-used-status">SKU not in catalog</span>
              </li>
            )
          }
          const img = resolveProductImage(product, '')
          return (
            <li key={sku} className="products-used-item">
              <div className="products-used-thumb">
                {img.isLocal ? (
                  <Image src={img.src} alt={img.alt} width={200} height={200} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img.src} alt={img.alt} loading="lazy" />
                )}
              </div>
              <div className="products-used-body">
                <div className="products-used-name">{product.name ?? product.sku}</div>
                <div className="products-used-sku">{product.sku}</div>
                {product.spec_sheet_url && (
                  <a
                    href={product.spec_sheet_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="products-used-link"
                  >
                    Datasheet PDF ↗
                  </a>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
```

- [ ] **Step 3: Add styles to `src/app/envo.css`**

Append:

```css
/* ===== Products used (case study detail) ===== */
.products-used { max-width: 1100px; margin: 0 auto; padding: 48px 24px; }
.products-used-heading {
  font-size: 24px;
  letter-spacing: -0.015em;
  margin: 0 0 22px;
  font-weight: 700;
}
.products-used-grid {
  list-style: none; padding: 0; margin: 0;
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px;
}
@media (max-width: 900px) { .products-used-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 560px) { .products-used-grid { grid-template-columns: 1fr; } }
.products-used-item {
  display: flex; gap: 14px;
  padding: 14px;
  background: var(--bg-card, #fff);
  border: 1px solid var(--line, #e2e5ea);
  border-radius: 10px;
}
.products-used-item-muted { opacity: 0.65; }
.products-used-thumb {
  width: 64px; height: 64px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: var(--blue-soft, #e8f1fb);
  border-radius: 8px; overflow: hidden;
}
.products-used-thumb img { max-width: 80%; max-height: 80%; object-fit: contain; }
.products-used-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.products-used-name {
  font-size: 14px; font-weight: 600;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.products-used-sku { font-size: 12px; color: var(--text-subtle, #6a7a8a); }
.products-used-status {
  font-size: 11.5px; color: var(--text-subtle, #6a7a8a);
}
.products-used-link {
  margin-top: 4px;
  font-size: 12.5px; font-weight: 500;
  color: var(--blue, #0071bc);
  text-decoration: none;
}
.products-used-link:hover { text-decoration: underline; }
```

- [ ] **Step 4: Commit**

```bash
git add src/components/projects/ProductsUsedList.tsx src/app/envo.css
git commit -m "feat(projects): ProductsUsedList component + styles"
```

---

## Task 9: Rewrite /projects list page

**Files:**
- Modify: `src/app/(frontend)/projects/page.tsx` (rewrite)

- [ ] **Step 1: Read current state of the file**

```bash
cat src/app/\(frontend\)/projects/page.tsx
```

(Confirms the hardcoded structure being replaced.)

- [ ] **Step 2: Rewrite the file**

Replace the entire contents of `src/app/(frontend)/projects/page.tsx`:

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { getProjects } from '@/lib/projects'

export const metadata: Metadata = {
  title: 'Projects — ENVO',
  description:
    'Real-world ENVO LED installations: retail signage, hotel facades, premium storefronts, and canopy lighting. Field-proven across 60+ countries.',
}

const STATS = [
  { label: 'Installations', value: '500+' },
  { label: 'Countries', value: '60+' },
  { label: 'Years deployed', value: '10+' },
  { label: 'Repeat clients', value: '80%' },
]

export default async function ProjectsPage() {
  const [{ docs: featured }, { docs: projects, totalDocs }] = await Promise.all([
    getProjects({ featured: true, limit: 3 }),
    getProjects({ limit: 60 }),
  ])

  return (
    <div className="theme-light">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">›</span>
          <span>Projects</span>
        </div>
      </div>

      <section className="sig-hero">
        <div className="container">
          <div className="sig-hero-inner">
            <span className="sig-eyebrow">Projects · Case studies</span>
            <h1>
              Proven in <em>real-world installations.</em>
            </h1>
            <p className="sig-hero-desc">
              Retail signage, hotel facades, storefronts, and outdoor canopy lighting — ENVO
              modules and drivers are running today on installations across 60+ countries.
            </p>
          </div>
        </div>
      </section>

      <div className="sig-stats">
        {STATS.map((s) => (
          <div key={s.label} className="sig-stat">
            <div className="sig-stat-label">{s.label}</div>
            <div className="sig-stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      {/* FEATURED — conditional render */}
      {featured.length > 0 && (
        <section className="container projects-featured">
          <h2 className="projects-featured-heading">Featured installations</h2>
          <div className="projects-grid">
            {featured.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        </section>
      )}

      {/* GRID */}
      <section className="container projects-list">
        {totalDocs === 0 ? (
          <p className="projects-empty">
            Case studies coming soon — check back as our latest installs land.
          </p>
        ) : (
          <div className="projects-grid">
            {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}
      </section>
    </div>
  )
}
```

- [ ] **Step 3: Add list-page styles to `src/app/envo.css`**

Append:

```css
/* ===== /projects list page ===== */
.projects-featured { padding: 24px 0 8px; }
.projects-featured-heading {
  font-size: 22px;
  letter-spacing: -0.01em;
  font-weight: 700;
  margin: 0 0 18px;
}
.projects-list { padding: 24px 0 64px; }
.projects-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}
@media (max-width: 960px) { .projects-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .projects-grid { grid-template-columns: 1fr; } }
.projects-empty {
  text-align: center;
  padding: 64px 24px;
  font-size: 15px;
  color: var(--text-subtle, #6a7a8a);
}
```

- [ ] **Step 4: Verify route renders**

```bash
curl -sS -m 30 -o /dev/null -w "/projects HTTP %{http_code}\n" http://localhost:3000/projects
tail -15 /tmp/envo-dev.log | grep -iE "error|fail" | grep -v "email adapter"
```

Expected: HTTP 200, no errors. Page renders the hero + stats + empty-state message (zero projects in DB).

- [ ] **Step 5: Commit**

```bash
git add src/app/\(frontend\)/projects/page.tsx src/app/envo.css
git commit -m "feat(projects): rewrite /projects list page to Payload fetch"
```

---

## Task 10: Create /projects/[slug] detail page

**Files:**
- Create: `src/app/(frontend)/projects/[slug]/page.tsx`

- [ ] **Step 1: Read the blog detail page for the canonical pattern**

```bash
cat src/app/\(frontend\)/blog/\[slug\]/page.tsx
```

(Note generateStaticParams + generateMetadata + RichTextRenderer usage.)

- [ ] **Step 2: Create the detail page**

Create `src/app/(frontend)/projects/[slug]/page.tsx`:

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ProjectHero } from '@/components/projects/ProjectHero'
import { ProjectGallery } from '@/components/projects/ProjectGallery'
import { ProductsUsedList } from '@/components/projects/ProductsUsedList'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { RichTextRenderer } from '@/components/blog/RichTextRenderer'
import {
  getProjectBySlug,
  getAllProjectSlugs,
  getRelatedProjects,
} from '@/lib/projects'

type Params = Promise<{ slug: string }>

export async function generateStaticParams() {
  const slugs = await getAllProjectSlugs()
  return slugs.map((slug) => ({ slug }))
}

export const dynamicParams = true

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) return {}
  const cover = typeof project.cover === 'string' ? project.cover : project.cover?.url
  const og = typeof project.ogImage === 'string' ? project.ogImage : project.ogImage?.url
  return {
    title: project.seoTitle ?? `${project.title} — ENVO Projects`,
    description: project.seoDescription ?? project.excerpt,
    openGraph: { images: og ?? cover ? [(og ?? cover) as string] : undefined },
  }
}

export default async function ProjectDetailPage({ params }: { params: Params }) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) notFound()

  const primaryIndustry = project.industry[0]
  const related = primaryIndustry
    ? await getRelatedProjects(primaryIndustry, project.slug, 3)
    : []

  return (
    <article className="theme-light">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">›</span>
          <Link href="/projects">Projects</Link>
          <span className="sep">›</span>
          <span>{project.title}</span>
        </div>
      </div>

      <ProjectHero project={project} />

      <div className="project-body container">
        <RichTextRenderer content={project.body} />
      </div>

      {project.gallery && project.gallery.length > 0 && (
        <ProjectGallery items={project.gallery} />
      )}

      {project.productsUsed && project.productsUsed.length > 0 && (
        <ProductsUsedList skus={project.productsUsed} />
      )}

      {project.testimonial && (
        <section className="project-testimonial container">
          <blockquote className="project-testimonial-quote">
            “{project.testimonial}”
          </blockquote>
        </section>
      )}

      {related.length >= 2 && (
        <section className="container project-related">
          <h2 className="project-related-heading">Related projects</h2>
          <div className="projects-grid">
            {related.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        </section>
      )}
    </article>
  )
}
```

- [ ] **Step 3: Add detail-page styles to `src/app/envo.css`**

Append:

```css
/* ===== Project detail page ===== */
.project-body {
  max-width: 720px;
  padding: 36px 24px 16px;
  font-size: 16px;
  line-height: 1.7;
  color: var(--text, #1a2332);
}
.project-testimonial { padding: 32px 24px; max-width: 760px; }
.project-testimonial-quote {
  margin: 0;
  font-size: 22px;
  line-height: 1.4;
  letter-spacing: -0.01em;
  color: var(--text, #1a2332);
  border-left: 3px solid var(--lime, #aec90b);
  padding-left: 22px;
}
.project-related { padding: 56px 0 64px; }
.project-related-heading {
  font-size: 22px;
  letter-spacing: -0.01em;
  font-weight: 700;
  margin: 0 0 18px;
}
```

- [ ] **Step 4: Verify (no project exists yet, route should 404 gracefully)**

```bash
curl -sS -m 30 -o /dev/null -w "non-existent slug HTTP %{http_code}\n" http://localhost:3000/projects/does-not-exist
tail -10 /tmp/envo-dev.log | grep -iE "error|fail" | grep -v "email adapter"
```

Expected: HTTP 404 (notFound() triggered). No 500 errors in the log.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(frontend\)/projects/\[slug\]/page.tsx src/app/envo.css
git commit -m "feat(projects): /projects/[slug] detail page"
```

---

## Task 11: Create /projects/industry/[industry] filter route

**Files:**
- Create: `src/app/(frontend)/projects/industry/[industry]/page.tsx`

- [ ] **Step 1: Read the blog category route for the pattern**

```bash
cat src/app/\(frontend\)/blog/category/\[category\]/page.tsx
```

- [ ] **Step 2: Create the industry filter route**

Create `src/app/(frontend)/projects/industry/[industry]/page.tsx`:

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ProjectCard } from '@/components/projects/ProjectCard'
import {
  getProjects,
  INDUSTRY_LABELS,
  type ProjectIndustry,
} from '@/lib/projects'

type Params = Promise<{ industry: string }>

const VALID: ProjectIndustry[] = [
  'retail',
  'hotel',
  'storefront',
  'architectural',
  'canopy',
  'other',
]

function isValid(v: string): v is ProjectIndustry {
  return (VALID as string[]).includes(v)
}

export async function generateStaticParams() {
  return VALID.map((industry) => ({ industry }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { industry } = await params
  if (!isValid(industry)) return {}
  return {
    title: `${INDUSTRY_LABELS[industry]} projects — ENVO`,
    description: `ENVO LED installations in the ${INDUSTRY_LABELS[industry].toLowerCase()} sector.`,
  }
}

export default async function IndustryPage({ params }: { params: Params }) {
  const { industry } = await params
  if (!isValid(industry)) notFound()

  const { docs, totalDocs } = await getProjects({ industry, limit: 60 })
  const label = INDUSTRY_LABELS[industry]

  return (
    <div className="theme-light">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">›</span>
          <Link href="/projects">Projects</Link>
          <span className="sep">›</span>
          <span>{label}</span>
        </div>
      </div>

      <section className="sig-hero">
        <div className="container">
          <div className="sig-hero-inner">
            <span className="sig-eyebrow">Industry · {label}</span>
            <h1>{label} <em>installations.</em></h1>
            <p className="sig-hero-desc">
              ENVO LED case studies in the {label.toLowerCase()} sector.
            </p>
          </div>
        </div>
      </section>

      <section className="container projects-list">
        {totalDocs === 0 ? (
          <p className="projects-empty">
            No {label.toLowerCase()} case studies published yet — check back soon.
          </p>
        ) : (
          <div className="projects-grid">
            {docs.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}
      </section>
    </div>
  )
}
```

- [ ] **Step 3: Verify all 6 industry routes**

```bash
for i in retail hotel storefront architectural canopy other; do
  curl -sS -m 30 -o /dev/null -w "HTTP %{http_code}  /projects/industry/$i\n" http://localhost:3000/projects/industry/$i
done
curl -sS -m 30 -o /dev/null -w "invalid HTTP %{http_code}\n" http://localhost:3000/projects/industry/bogus
```

Expected: 6 × HTTP 200, invalid route → HTTP 404.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(frontend\)/projects/industry/\[industry\]/page.tsx
git commit -m "feat(projects): /projects/industry/[i] filter route"
```

---

## Task 12: Create /projects/tag/[tag] filter route

**Files:**
- Create: `src/app/(frontend)/projects/tag/[tag]/page.tsx`

- [ ] **Step 1: Create the tag filter route**

Tags are free-form, so unlike industry there's no static-params list. Make this fully dynamic.

Create `src/app/(frontend)/projects/tag/[tag]/page.tsx`:

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { getProjects } from '@/lib/projects'

type Params = Promise<{ tag: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { tag } = await params
  const decoded = decodeURIComponent(tag)
  return {
    title: `Projects tagged "${decoded}" — ENVO`,
    description: `ENVO LED case studies tagged "${decoded}".`,
  }
}

export default async function TagPage({ params }: { params: Params }) {
  const { tag } = await params
  const decoded = decodeURIComponent(tag)
  const { docs, totalDocs } = await getProjects({ tag: decoded, limit: 60 })

  return (
    <div className="theme-light">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">›</span>
          <Link href="/projects">Projects</Link>
          <span className="sep">›</span>
          <span>#{decoded}</span>
        </div>
      </div>

      <section className="sig-hero">
        <div className="container">
          <div className="sig-hero-inner">
            <span className="sig-eyebrow">Tag · {decoded}</span>
            <h1>Tagged <em>#{decoded}</em></h1>
          </div>
        </div>
      </section>

      <section className="container projects-list">
        {totalDocs === 0 ? (
          <p className="projects-empty">
            No projects tagged "{decoded}" yet.
          </p>
        ) : (
          <div className="projects-grid">
            {docs.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Verify with an arbitrary tag**

```bash
curl -sS -m 30 -o /dev/null -w "HTTP %{http_code}  /projects/tag/outdoor\n" http://localhost:3000/projects/tag/outdoor
```

Expected: HTTP 200 with the empty-state message in body.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(frontend\)/projects/tag/\[tag\]/page.tsx
git commit -m "feat(projects): /projects/tag/[t] filter route"
```

---

## Task 13: Migrate homepage `<Projects>` component to Payload

**Files:**
- Modify: `src/components/home/projects.tsx`

- [ ] **Step 1: Read the current homepage Projects component**

```bash
cat src/components/home/projects.tsx
```

Note which fields it accesses (`name`, `desc`, `img`, etc.) — these need to map to the new Payload shape (`title`, `excerpt`, `cover`).

- [ ] **Step 2: Rewrite as an async server component using Payload**

Replace the entire contents of `src/components/home/projects.tsx`:

```tsx
import Image from 'next/image'
import Link from 'next/link'
import { getProjects } from '@/lib/projects'

export async function HomeProjects() {
  const { docs } = await getProjects({ limit: 4 })

  // Zero-content state — homepage stays clean.
  if (docs.length === 0) return null

  return (
    <section className="home-projects">
      <div className="container">
        <h2 className="home-projects-heading">Featured installations</h2>
        <div className="home-projects-grid">
          {docs.map((p) => {
            const cover = typeof p.cover === 'string' ? p.cover : p.cover?.url
            return (
              <Link key={p.id} href={`/projects/${p.slug}`} className="home-projects-card">
                <div className="home-projects-cover">
                  {cover && (
                    <Image
                      src={cover}
                      alt={p.title}
                      width={400}
                      height={260}
                      sizes="(min-width: 1100px) 25vw, 50vw"
                    />
                  )}
                </div>
                <div className="home-projects-body">
                  <h3 className="home-projects-title">{p.title}</h3>
                  <p className="home-projects-desc">{p.excerpt}</p>
                </div>
              </Link>
            )
          })}
        </div>
        <Link href="/projects" className="home-projects-more">View all projects →</Link>
      </div>
    </section>
  )
}

// Default export kept for back-compat if any caller imports it as default.
export default HomeProjects
```

- [ ] **Step 3: Verify imports still resolve**

Check whether anything else in the codebase imports the old named exports:

```bash
grep -rn "from '@/components/home/projects'" src/ | head
grep -rn "from '@/data/projects'" src/ | head
```

If a caller imports a named export that no longer exists, fix the import to use `HomeProjects` (or the default export).

- [ ] **Step 4: Verify homepage renders**

```bash
curl -sS -m 30 -o /dev/null -w "/ HTTP %{http_code}\n" http://localhost:3000/
tail -15 /tmp/envo-dev.log | grep -iE "error|fail" | grep -v "email adapter"
```

Expected: HTTP 200, no errors. The home-projects section renders nothing (zero content) — that's intentional.

- [ ] **Step 5: Commit**

```bash
git add src/components/home/projects.tsx
git commit -m "feat(projects): migrate homepage <Projects> to Payload fetch"
```

---

## Task 14: Delete src/data/projects.ts

**Files:**
- Delete: `src/data/projects.ts`

- [ ] **Step 1: Verify zero remaining imports**

```bash
grep -rnE "from ['\"]@/data/projects['\"]|from ['\"]\\.\\./data/projects['\"]|from ['\"]\\.\\./\\.\\./data/projects['\"]" src/
```

Expected: no output. If any imports remain, fix them before proceeding.

- [ ] **Step 2: Delete the file**

```bash
rm src/data/projects.ts
```

- [ ] **Step 3: Run build to confirm no broken references**

```bash
npm run build 2>&1 | tail -40
```

Expected: build completes with the usual pre-existing 5 TS / 42 ESLint warnings noted in `memory/project_known-tech-debt-typecheck-lint.md`. No NEW errors related to the deletion.

- [ ] **Step 4: Commit**

```bash
git add -u src/data/projects.ts
git commit -m "chore(projects): remove hardcoded placeholder data — now Payload-driven"
```

---

## Task 15: Manual smoke test — full feature loop

**Files:** none (verification only)

- [ ] **Step 1: Visit empty-state routes**

In a browser, verify each route renders gracefully with the empty-state copy:

- `http://localhost:3000/projects` → "Case studies coming soon..." message
- `http://localhost:3000/projects/industry/retail` → "No retail case studies published yet..."
- `http://localhost:3000/projects/tag/outdoor` → "No projects tagged..." message
- `http://localhost:3000/projects/does-not-exist` → 404 page

- [ ] **Step 2: Create a test project in admin**

In `http://localhost:3000/admin/collections/projects`, click **Create New**:

- Content tab: title "Test Project", excerpt "Smoke test record", upload any cover, type some richText body
- Project Details tab: client "Test Client", location "Auckland, NZ", completedYear 2025, add one gallery row with image + caption "Test caption", add one productsUsed row with sku "EV-BLML01LBY-NW", testimonial "Great install"
- Taxonomy tab: industry → check Retail + Hotel, add a tag "test-tag"
- Publishing tab: publishedAt = today, leave featured unchecked
- Click **Save Draft** → then **Publish**

Verify the slug auto-populated to `test-project`.

- [ ] **Step 3: Verify revalidation fired**

```bash
tail -40 /tmp/envo-dev.log | grep -E "revalidate|Projects.afterChange" | tail
```

Expected: a POST to `/api/revalidate?paths=...` listing `/projects`, `/projects/test-project`, `/projects/industry/retail`, `/projects/industry/hotel`, `/projects/tag/test-tag`.

If the revalidate call fails because `NEXT_PUBLIC_SITE_URL` or `REVALIDATE_SECRET` env vars aren't set in dev, that's expected per the Posts.ts pattern — the hook swallows the error silently. Confirm by `grep "revalidate fetch failed" /tmp/envo-dev.log`. Production runs with both vars set.

- [ ] **Step 4: Verify the test record renders everywhere**

Visit each route and confirm the test record shows up:

- `http://localhost:3000/projects` → grid shows "Test Project" card with Retail + Hotel chips and "Auckland, NZ · 2025" meta
- `http://localhost:3000/projects/test-project` → full detail page with hero, body, gallery (1 image + caption), products-used (EV-BLML01LBY-NW card), testimonial pull-quote, no related projects (only 1 in DB)
- `http://localhost:3000/projects/industry/retail` → grid shows the test project
- `http://localhost:3000/projects/industry/hotel` → grid shows the test project (multi-select works)
- `http://localhost:3000/projects/industry/storefront` → empty-state (test project not in that industry)
- `http://localhost:3000/projects/tag/test-tag` → grid shows the test project
- `http://localhost:3000/` → home-projects section shows the test project card (now that DB has ≥1 record)

- [ ] **Step 5: Verify products-used handles SKU rot**

In admin, edit the test project. In Project Details → productsUsed, add a second row with sku "EV-NOPE-NONE". Save & Publish.

Visit `/projects/test-project` → confirm:
- First row: EV-BLML01LBY-NW renders as a full card (image + name + datasheet link)
- Second row: EV-NOPE-NONE renders as a muted pill with "SKU not in catalog" text

- [ ] **Step 6: Delete the test project**

In admin, delete the test record. Visit `/projects` → empty state should return.

- [ ] **Step 7: Final commit**

There's nothing to commit from this task (verification only), but if any small fixes surfaced during smoke testing, commit them now with a focused message:

```bash
git status
# only commit if there were fixes from smoke test:
# git add -u && git commit -m "fix(projects): <specific fix>"
```

- [ ] **Step 8: Push and open PR**

```bash
git fetch origin
git rebase origin/dev
git push -u origin feature/projects-collection-2026-05-29
gh pr create --base dev --title "feat(projects): Payload-driven Projects Collection + 4 routes" --body "$(cat <<'EOF'
## Summary
- New Projects Payload Collection (5 tabs, mirrors Blog Posts)
- /projects rewritten to Payload fetch (replaces hardcoded data)
- New routes: /projects/[slug], /projects/industry/[i], /projects/tag/[t]
- Homepage <Projects> migrated to Payload
- src/data/projects.ts deleted

## Test plan
- [ ] Empty-state copy renders on all 4 routes when DB has zero projects
- [ ] Create draft → publish in admin, all 4 routes update
- [ ] Multi-industry project appears in BOTH industry filter routes
- [ ] productsUsed: valid SKU shows full card; bogus SKU shows muted pill
- [ ] Revalidate logs include /projects, /[slug], each industry, each tag

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-Review Notes

- **Spec coverage:** Every section/field/route/hook from the spec maps to a task above. ✓
- **Placeholder scan:** No "TBD" / "TODO" / "fill in later" — every step has explicit code or an explicit command. ✓
- **Type consistency:** `Project`, `ProjectIndustry`, `ProjectGalleryItem`, `getProjects`, `getProjectBySlug`, `getRelatedProjects`, `getAllProjectSlugs`, `INDUSTRY_LABELS` are all defined in Task 4 and used consistently in Tasks 5–13. ✓
- **Risk coverage:**
  - Drizzle wedge: Task 3 Step 4 has the curl-check + fallback recipe
  - Homepage data-migration ordering: Task 13 (migrate) comes before Task 14 (delete) — Step 1 of Task 14 verifies zero remaining imports
  - Zero-content empty state: Tasks 9, 10, 11, 12, 13 all branch on the empty case
  - SKU rot: Task 8 muted-pill branch + Task 15 Step 5 verifies it
  - Multi-industry revalidation: Task 2 hook walks both `doc.industry` and `previousDoc.industry`; Task 15 Step 3 inspects the log to confirm

