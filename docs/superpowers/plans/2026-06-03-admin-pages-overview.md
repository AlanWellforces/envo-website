# Admin Pages Overview + Page SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only "Pages" overview to the Payload admin that lists every site route and links to where each is edited, plus a small `page-seo` collection that lets per-route SEO be edited without making page bodies editable.

**Architecture:** A `page-seo` Payload collection (route-keyed SEO overrides) + a `getPageSeo()` helper that code-built pages' `generateMetadata` reads with fallback to in-code defaults. A custom Payload admin view renders a section-grouped table from a hand-maintained Git config (`src/data/site-pages.ts`), reachable via a sidebar nav link. No page bodies become editable; no code is stored in or edited from the admin.

**Tech Stack:** Payload CMS 3.84.1, Next.js 16 App Router, TypeScript, Drizzle (Payload-managed table), Postgres.

**Spec:** `docs/superpowers/specs/2026-06-03-admin-pages-overview-design.md`

**Verification model:** No page-level unit tests in this repo. Verify via `npm run typecheck`, `npm run lint`, `curl` of public routes (for SEO output), and — because headless Chrome cannot render the authed Payload admin — by asking the user to confirm admin-UI items. Pre-existing repo typecheck/lint debt in unrelated files is expected; only new/changed files must be clean.

**Branch:** `feature/admin-pages-overview-2026-06-03` (already created off `dev`; spec already committed). NOTE: the working tree carries unrelated stray files (`next-env.d.ts` change, `public/assets/.../hero-signage.*`) from parallel work — do NOT `git add` them; use precise `git add <file>` on every commit.

**Branch safety (the user switches branches in parallel):** before EACH commit run `git branch --show-current`; it MUST be `feature/admin-pages-overview-2026-06-03`. Commit atomically: `b=$(git branch --show-current); [ "$b" = "feature/admin-pages-overview-2026-06-03" ] && git add <files> && git commit -m "<msg>"`. If the guard fails, do not commit — report BLOCKED.

---

## File Structure

- Create: `src/payload/collections/PageSeo.ts` — the `page-seo` collection config
- Modify: `src/payload.config.ts` — register the collection; register the custom view + nav link
- Create: `src/lib/page-seo.ts` — `getPageSeo(route)` reader helper
- Create: `src/data/site-pages.ts` — hand-maintained route inventory config
- Create: `src/payload/views/PagesOverview.tsx` — the read-only overview view (table)
- Create: `src/payload/components/PagesNavLink.tsx` — sidebar nav link to the view
- Modify: code-built pages' `page.tsx` `generateMetadata` (listed in Task 4)

---

## Task 1: `page-seo` collection

**Files:**
- Create: `src/payload/collections/PageSeo.ts`
- Modify: `src/payload.config.ts`

- [ ] **Step 1: Create the collection** (mirrors the `Faqs.ts` idiom)

`src/payload/collections/PageSeo.ts`:
```ts
// src/payload/collections/PageSeo.ts
// Per-route SEO overrides for code-built pages (about, contact, solutions, …).
// Page bodies stay in Git; only the <title>/<meta>/OG text lives here, read by
// getPageSeo() with fallback to each page's in-code defaults. CMS pages
// (Posts/Projects/Products/Faqs) manage their own SEO and are NOT listed here.
import type { CollectionConfig } from 'payload'

export const PageSeo: CollectionConfig = {
  slug: 'page-seo',
  labels: { singular: 'Page SEO', plural: 'Page SEO' },
  admin: {
    useAsTitle: 'route',
    defaultColumns: ['route', 'seoTitle', 'updatedAt'],
    group: 'Website',
    description: 'SEO title / description / share image for code-built pages, keyed by route. Empty fields fall back to the page’s in-code defaults.',
  },
  access: { read: () => true },
  fields: [
    {
      name: 'route',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'Exact route path, e.g. /about or /solutions/signage-lighting' },
    },
    { name: 'label', type: 'text', admin: { description: 'Optional friendly name shown in the admin list.' } },
    { name: 'seoTitle', type: 'text', admin: { description: 'Overrides the <title>. Leave blank to keep the page default.' } },
    {
      name: 'metaDescription',
      type: 'textarea',
      admin: { description: 'Overrides <meta name="description">. Aim ≤ 155 characters.' },
    },
    { name: 'ogImage', type: 'upload', relationTo: 'media', admin: { description: 'Optional social share image.' } },
  ],
}
```

- [ ] **Step 2: Register it in payload.config.ts**

In `src/payload.config.ts`, add the import and insert into the `collections` array just before `Users` (keeps Users/Settings last per the existing comment):
```ts
import { PageSeo } from '@/payload/collections/PageSeo'
// ...
collections: [Products, Media, Posts, Projects, Faqs, PageSeo, Users],
```

- [ ] **Step 3: Apply the schema (new table) and verify**

The dev server runs on :3000. Payload uses Drizzle `db.push`; a new collection adds a table. If the detached dev server stalls on a schema-push prompt, restart it cleanly (see memory: admin-wedge-payload-schema-push) — confirm intent then `yes | nohup npm run dev`. After it's up:

Run: `npm run typecheck 2>&1 | grep -iE "page-?seo|PageSeo" || echo "no PageSeo typecheck errors"`
Run: `curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/api/page-seo?limit=1"`
Expected: typecheck clean for the new file; the REST endpoint returns `200` (collection exists).

- [ ] **Step 4: Commit**
```bash
b=$(git branch --show-current); [ "$b" = "feature/admin-pages-overview-2026-06-03" ] && \
git add src/payload/collections/PageSeo.ts src/payload.config.ts && \
git commit -m "feat(admin): page-seo collection for per-route SEO overrides"
```

---

## Task 2: `getPageSeo()` helper + wire code pages' SEO

**Files:**
- Create: `src/lib/page-seo.ts`
- Modify: `src/app/(frontend)/about/page.tsx`, `src/app/(frontend)/contact/page.tsx`, `src/app/(frontend)/free-layout-design/page.tsx`, `src/app/(frontend)/solutions/page.tsx`, `src/app/(frontend)/solutions/architectural-lighting/page.tsx`, `src/app/(frontend)/solutions/signage-lighting/page.tsx`, `src/app/(frontend)/resources/page.tsx`, `src/app/(frontend)/resources/downloads/page.tsx`, `src/app/(frontend)/resources/tools/page.tsx`, `src/app/(frontend)/find-your-match/page.tsx`

- [ ] **Step 1: Create the helper**

`src/lib/page-seo.ts`:
```ts
import { getPayload } from 'payload'
import config from '@payload-config'

export type PageSeo = {
  seoTitle?: string
  metaDescription?: string
  ogImage?: { url: string }
}

/**
 * Per-route SEO override from the `page-seo` collection. Returns null when no
 * row exists for the route. Callers MUST fall back to their in-code defaults —
 * an absent or empty field must never blank out a page's SEO.
 */
export async function getPageSeo(route: string): Promise<PageSeo | null> {
  const payload = await getPayload({ config })
  const res = await payload.find({
    collection: 'page-seo',
    where: { route: { equals: route } },
    depth: 1,
    limit: 1,
  })
  const doc = res.docs[0] as
    | { seoTitle?: string; metaDescription?: string; ogImage?: { url?: string } | null }
    | undefined
  if (!doc) return null
  return {
    seoTitle: doc.seoTitle || undefined,
    metaDescription: doc.metaDescription || undefined,
    ogImage: doc.ogImage?.url ? { url: doc.ogImage.url } : undefined,
  }
}
```

- [ ] **Step 2: Add a metadata helper to keep wiring DRY**

Append to `src/lib/page-seo.ts`:
```ts
import type { Metadata } from 'next'

/** Merge a page's in-code defaults with any page-seo override (override wins). */
export async function metadataForRoute(
  route: string,
  defaults: { title: string; description: string },
): Promise<Metadata> {
  const seo = await getPageSeo(route)
  return {
    title: seo?.seoTitle ?? defaults.title,
    description: seo?.metaDescription ?? defaults.description,
    ...(seo?.ogImage ? { openGraph: { images: [{ url: seo.ogImage.url }] } } : {}),
  }
}
```

- [ ] **Step 3: Convert each code page to `generateMetadata` using the helper**

For EACH file listed above, replace its static `export const metadata = {...}` with a `generateMetadata` that calls `metadataForRoute(<route>, <in-code defaults>)`. Use the page's CURRENT metadata values as the defaults (read each file first; do not invent copy). Example for `src/app/(frontend)/about/page.tsx`:
```ts
import type { Metadata } from 'next'
import { metadataForRoute } from '@/lib/page-seo'

export async function generateMetadata(): Promise<Metadata> {
  return metadataForRoute('/about', {
    title: 'About ENVO',
    description:
      'ENVO designs and manufactures professional-grade LED lighting systems for signage and architectural illumination worldwide.',
  })
}
```
Repeat per file with that file's existing title/description as the defaults and its own route string. **Do not touch CMS-backed pages** (blog/projects/products/faq) — they already manage SEO. If a listed page currently has only a `title` and no `description`, pass a sensible one-line description drawn from the page's hero copy (read the file; don't leave it blank).

- [ ] **Step 4: Verify fallback + override both work**

With the dev server on :3000 and NO `page-seo` row for `/about` yet:
Run: `curl -s http://localhost:3000/about | grep -o '<title>[^<]*</title>'`
Expected: the in-code default (`About ENVO …`) — fallback path works.

Then create one row via REST (or the admin) and re-check:
```bash
curl -s -X POST http://localhost:3000/api/page-seo -H 'Content-Type: application/json' \
  -d '{"route":"/about","seoTitle":"About ENVO — Engineered Illumination Since 2014"}'
curl -s http://localhost:3000/about | grep -o '<title>[^<]*</title>'
```
Expected: the second curl shows the overridden title — override path works. (If POST needs auth, create the row in the admin UI instead and ask the user to confirm.)
Run: `npm run typecheck 2>&1 | grep -iE "page-seo|generateMetadata" || echo "clean"` and `npx eslint src/lib/page-seo.ts "src/app/(frontend)/about/page.tsx"` → clean.

- [ ] **Step 5: Commit**
```bash
b=$(git branch --show-current); [ "$b" = "feature/admin-pages-overview-2026-06-03" ] && \
git add src/lib/page-seo.ts "src/app/(frontend)/about/page.tsx" "src/app/(frontend)/contact/page.tsx" "src/app/(frontend)/free-layout-design/page.tsx" "src/app/(frontend)/solutions" "src/app/(frontend)/resources/page.tsx" "src/app/(frontend)/resources/downloads/page.tsx" "src/app/(frontend)/resources/tools/page.tsx" "src/app/(frontend)/find-your-match/page.tsx" && \
git commit -m "feat(seo): code pages read per-route page-seo overrides with in-code fallback"
```

---

## Task 3: Custom admin view scaffold + nav link (de-risk the Payload API first)

**Files:**
- Create: `src/payload/views/PagesOverview.tsx`
- Create: `src/payload/components/PagesNavLink.tsx`
- Modify: `src/payload.config.ts`

- [ ] **Step 1: Minimal view component (prove it renders before building the table)**

`src/payload/views/PagesOverview.tsx`:
```tsx
import React from 'react'

// Custom Payload admin view at /admin/pages-overview. Server Component.
export function PagesOverview() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Pages</h1>
      <p>Page overview — table coming in the next step.</p>
    </div>
  )
}

export default PagesOverview
```

- [ ] **Step 2: Nav link component**

`src/payload/components/PagesNavLink.tsx`:
```tsx
import React from 'react'
import { Link } from '@payloadcms/ui'

// Sidebar entry that opens the custom Pages overview view.
export function PagesNavLink() {
  return (
    <Link href="/admin/pages-overview" className="nav__link">
      Pages
    </Link>
  )
}

export default PagesNavLink
```

- [ ] **Step 3: Register the view + nav link in payload.config.ts**

In the `admin.components` block (which currently has `providers` and `importMap`), add `views` and `afterNavLinks`:
```ts
admin: {
  components: {
    providers: ['/payload/components/AdminStyles#AdminStyles'],
    afterNavLinks: ['/payload/components/PagesNavLink#PagesNavLink'],
    views: {
      pagesOverview: {
        Component: '/payload/views/PagesOverview#PagesOverview',
        path: '/pages-overview',
      },
    },
  },
  importMap: { baseDir: path.resolve(dirname) },
},
```

- [ ] **Step 4: Regenerate the import map and verify the route resolves**

Payload resolves these component paths via the import map. Regenerate it:
Run: `npm run payload -- generate:importmap` (if that script is absent, run `npx payload generate:importmap`)
Expected: completes without error; `src/app/(payload)/admin/importMap.js` now references PagesOverview + PagesNavLink.
Run: `npm run typecheck 2>&1 | grep -iE "PagesOverview|PagesNavLink" || echo "clean"`
Expected: clean.

Then **ask the user** to open `/admin`, confirm a "Pages" link appears in the sidebar, and that clicking it shows the "Pages — table coming…" placeholder at `/admin/pages-overview`. (Headless Chrome can't render the authed admin — see memory.) If the API key/shape differs in 3.84.1, consult Payload docs for `admin.components.views` / `afterNavLinks` and adjust; this step exists to catch that before the table is built.

- [ ] **Step 5: Commit**
```bash
b=$(git branch --show-current); [ "$b" = "feature/admin-pages-overview-2026-06-03" ] && \
git add src/payload/views/PagesOverview.tsx src/payload/components/PagesNavLink.tsx src/payload.config.ts src/app/\(payload\)/admin/importMap.js && \
git commit -m "feat(admin): scaffold Pages overview custom view + nav link"
```

---

## Task 4: Route inventory config + the overview table

**Files:**
- Create: `src/data/site-pages.ts`
- Modify: `src/payload/views/PagesOverview.tsx`

- [ ] **Step 1: Create the route inventory config**

`src/data/site-pages.ts`:
```ts
// Hand-maintained inventory of site pages for the admin Pages overview.
// Add a row when a new page ships. `source` drives the type badge; `editHref`
// is where the ✎ link points: a Payload collection/global for CMS pages, or the
// page-seo collection (filtered by route) for code pages.
export type SitePage = {
  label: string
  route: string
  section: string
  source: 'cms' | 'code'
  editHref?: string
}

export const SITE_PAGES: SitePage[] = [
  { label: 'Home', route: '/', section: 'Home', source: 'cms', editHref: '/admin/globals/home-page' },

  { label: 'About', route: '/about', section: 'Marketing', source: 'code', editHref: '/admin/collections/page-seo?where[route][equals]=/about' },
  { label: 'Contact', route: '/contact', section: 'Marketing', source: 'code', editHref: '/admin/collections/page-seo?where[route][equals]=/contact' },
  { label: 'Free Layout Design', route: '/free-layout-design', section: 'Marketing', source: 'code', editHref: '/admin/collections/page-seo?where[route][equals]=/free-layout-design' },
  { label: 'Find Your Match', route: '/find-your-match', section: 'Marketing', source: 'code', editHref: '/admin/collections/page-seo?where[route][equals]=/find-your-match' },

  { label: 'Solutions', route: '/solutions', section: 'Solutions', source: 'code', editHref: '/admin/collections/page-seo?where[route][equals]=/solutions' },
  { label: 'Architectural Lighting', route: '/solutions/architectural-lighting', section: 'Solutions', source: 'code', editHref: '/admin/collections/page-seo?where[route][equals]=/solutions/architectural-lighting' },
  { label: 'Signage Lighting', route: '/solutions/signage-lighting', section: 'Solutions', source: 'code', editHref: '/admin/collections/page-seo?where[route][equals]=/solutions/signage-lighting' },

  { label: 'Blog', route: '/blog', section: 'Content collections', source: 'cms', editHref: '/admin/collections/posts' },
  { label: 'Projects', route: '/projects', section: 'Content collections', source: 'cms', editHref: '/admin/collections/projects' },
  { label: 'Products', route: '/products', section: 'Content collections', source: 'cms', editHref: '/admin/collections/products' },

  { label: 'Resources', route: '/resources', section: 'Resources', source: 'code', editHref: '/admin/collections/page-seo?where[route][equals]=/resources' },
  { label: 'Downloads', route: '/resources/downloads', section: 'Resources', source: 'code', editHref: '/admin/collections/page-seo?where[route][equals]=/resources/downloads' },
  { label: 'Tools', route: '/resources/tools', section: 'Resources', source: 'code', editHref: '/admin/collections/page-seo?where[route][equals]=/resources/tools' },
  { label: 'Signage Selector', route: '/resources/tools/signage-selector', section: 'Resources', source: 'code', editHref: '/admin/collections/page-seo?where[route][equals]=/resources/tools/signage-selector' },
  { label: 'FAQ', route: '/resources/faq', section: 'Resources', source: 'cms', editHref: '/admin/collections/faqs' },
]

/** Section order for the overview, and a stable grouping helper. */
export const SITE_PAGE_SECTIONS = ['Home', 'Marketing', 'Solutions', 'Content collections', 'Resources'] as const

export function groupedSitePages(): { section: string; pages: SitePage[] }[] {
  return SITE_PAGE_SECTIONS.map((section) => ({
    section,
    pages: SITE_PAGES.filter((p) => p.section === section),
  })).filter((g) => g.pages.length > 0)
}
```

- [ ] **Step 2: Render the grouped table in the view**

Replace `src/payload/views/PagesOverview.tsx` body:
```tsx
import React from 'react'
import { groupedSitePages } from '@/data/site-pages'

export function PagesOverview() {
  const groups = groupedSitePages()
  return (
    <div style={{ padding: '2rem', maxWidth: 1000 }}>
      <h1 style={{ marginBottom: 4 }}>Pages</h1>
      <p style={{ opacity: 0.7, marginBottom: 24 }}>
        Every site page and where it&apos;s edited. Page bodies live in code; SEO is editable per row.
      </p>
      {groups.map((g) => (
        <section key={g.section} style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.6, marginBottom: 8 }}>
            {g.section}
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--theme-elevation-150)' }}>
                <th style={{ padding: '6px 8px' }}>Page</th>
                <th style={{ padding: '6px 8px' }}>Route</th>
                <th style={{ padding: '6px 8px' }}>Type</th>
                <th style={{ padding: '6px 8px' }}>Edit</th>
              </tr>
            </thead>
            <tbody>
              {g.pages.map((p) => (
                <tr key={p.route} style={{ borderBottom: '1px solid var(--theme-elevation-100)' }}>
                  <td style={{ padding: '6px 8px' }}>{p.label}</td>
                  <td style={{ padding: '6px 8px' }}>
                    <a href={p.route} target="_blank" rel="noopener noreferrer">{p.route} ↗</a>
                  </td>
                  <td style={{ padding: '6px 8px' }}>{p.source === 'cms' ? '🟢 CMS' : '⚪ Code'}</td>
                  <td style={{ padding: '6px 8px' }}>
                    {p.editHref ? <a href={p.editHref}>{p.source === 'cms' ? 'Edit content' : 'Edit SEO'} ✎</a> : 'Git'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  )
}

export default PagesOverview
```

- [ ] **Step 3: Verify**

Run: `npm run typecheck 2>&1 | grep -iE "site-pages|PagesOverview" || echo "clean"` and `npx eslint src/data/site-pages.ts src/payload/views/PagesOverview.tsx` → clean.
Then **ask the user** to reload `/admin/pages-overview` and confirm: the grouped table renders; each Route link opens the live page in a new tab; each "Edit SEO ✎" opens the page-seo collection filtered to that route; each "Edit content ✎" opens the right collection/global.

- [ ] **Step 4: Commit**
```bash
b=$(git branch --show-current); [ "$b" = "feature/admin-pages-overview-2026-06-03" ] && \
git add src/data/site-pages.ts src/payload/views/PagesOverview.tsx && \
git commit -m "feat(admin): Pages overview table from site-pages config"
```

---

## Task 5: Final verification + push/PR (push only on user go-ahead)

- [ ] **Step 1: Full typecheck + lint**

Run: `npm run typecheck 2>&1 | tail -20` and `npx eslint src/payload/collections/PageSeo.ts src/lib/page-seo.ts src/data/site-pages.ts src/payload/views/PagesOverview.tsx src/payload/components/PagesNavLink.tsx`
Expected: no NEW errors in the feature files (pre-existing repo debt elsewhere is fine).

- [ ] **Step 2: End-to-end SEO check**

Run: `curl -s http://localhost:3000/about | grep -oE '<title>[^<]*</title>|<meta name="description"[^>]*>'`
Expected: reflects the page-seo row if one exists, else the in-code default. Repeat for one more route (e.g. `/contact`).

- [ ] **Step 3: Ask the user to do a final admin pass** (sidebar "Pages" link → table → a Route ↗ and an Edit ✎ each work; create/edit a page-seo row and confirm the live `<title>` updates).

- [ ] **Step 4: Rebase + push (ONLY after the user says go)**
```bash
git fetch origin && git rebase origin/dev
git push -u origin feature/admin-pages-overview-2026-06-03
```
Then open a PR against `dev` (not `main`). Do not merge without explicit user consent.

---

## Self-Review Notes

- **Spec coverage:** Page Overview view + nav link (Tasks 3–4); grouped table from Git config (Task 4); `page-seo` collection with route/seoTitle/metaDescription/ogImage + first-column = route (Task 1); `getPageSeo` helper + mandatory fallback (Task 2); code pages wired (Task 2); editHref → collection for CMS, page-seo for code (Task 4); out-of-scope items excluded. SiteSettings untouched (correct). ✔
- **Known-unknown:** Payload 3.84.1 `admin.components.views` / `afterNavLinks` exact shape is de-risked by the Task 3 spike (verify-then-build) rather than assumed silently.
- **Stray files:** plan repeatedly warns to use precise `git add` (never `git add -A`) so the unrelated `hero-signage.*` / `next-env.d.ts` strays are never committed.
- **Type consistency:** `getPageSeo` returns `PageSeo | null`; `metadataForRoute` consumes it; `SitePage.source` is `'cms' | 'code'` used consistently in config + view.
- **No placeholders:** every code step has full code; verification steps have exact commands + expected output.
