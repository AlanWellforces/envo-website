# Blog Collection — Design Spec

**Date:** 2026-05-22
**Status:** Approved, awaiting implementation plan
**Owner:** Mackenzie (frontend + collection), Wei (content authoring)
**Scope level:** Level B (recommended baseline — see Scope section)

## Purpose

Add a `Posts` collection to Payload CMS so Wei can publish editorial content
(SEO guides, technical deep dives, company news) without code changes.
First non-product editorial collection on the site — establishes the pattern
later collections (CaseStudies, Pages-with-blocks) will follow.

This is part of the strategy decided 2026-05-22: build design-agnostic Payload
collections now while homepage visual design is still open, then build the
visually-coupled `Pages` block system once the design is locked.

## Scope decisions (locked)

The following decisions were settled during the brainstorm and should not be
re-litigated without a new brainstorm:

- **Single language (English only).** Payload `localization` config not
  enabled. Adding Chinese later requires schema migration — accepted risk.
- **Category = fixed select enum.** Wei cannot add categories without a code
  PR. Trades editorial flexibility for routing predictability.
- **Tags = free text array.** Wei adds freely; routes aggregate dynamically.
- **No author module.** All posts byline as "ENVO Team". No `Authors`
  collection, no `authorName` field. Adding later is a small additive change.
- **Case Studies are out of scope.** Will be their own collection in a
  separate brainstorm — different fields, different consumer pages.
- **Level B feature set.** Drafts/versions ON; SEO override fields ON;
  featured flag ON; auto slug + auto reading time ON. No related-posts
  relationships, no cover image variants, no auto TOC.

## Explicit non-goals

Listed so they don't resurface during implementation:

- RSS feed
- Email newsletter signup
- Comments
- View / read analytics
- Multilingual content
- Per-post author byline
- Multiple cover image sizes beyond what `Media` provides
- Automatic table of contents
- Manually curated related posts

Any of these requires its own brainstorm.

## Architecture

```
Payload admin                Next.js frontend
─────────────────            ────────────────────────
Posts collection      ←→     src/lib/posts.ts  ←→  /blog
(src/payload/                (data accessors,         /blog/[slug]
 collections/                 status + date            /blog/category/[c]
 Posts.ts)                    filter centralised)      /blog/tag/[t]

         │
         └── afterChange hook ──→  POST /api/revalidate
                                   (Next.js revalidatePath)
```

Three layers, single responsibility each:

- **Collection** owns schema and edit-time logic (slug, reading time,
  revalidate trigger).
- **Data accessor (`src/lib/posts.ts`)** owns query composition; every read
  passes through here so the published+date filter is never bypassed.
- **Route handlers** own rendering. They never compose Payload `where`
  clauses directly.

## Posts collection schema

File: `src/payload/collections/Posts.ts`
Admin group: `Editorial` (new)
Collection slug: `posts`

```ts
admin: {
  useAsTitle: 'title',
  defaultColumns: ['title', 'category', 'publishedAt', 'featured', '_status'],
  group: 'Editorial',
}
access: { read: () => true }
versions: { drafts: true }
```

### Tab 1 — Content

| Field    | Type     | Required | Notes                                            |
|----------|----------|----------|--------------------------------------------------|
| title    | text     | yes      |                                                  |
| slug     | text     | yes      | Unique. Admin readOnly. Auto-filled from title.  |
| excerpt  | textarea | yes      | maxLength 200. Used in cards + meta fallback.    |
| cover    | upload   | yes      | → `media`. Required so list pages don't break.   |
| body     | richText | yes      | Lexical editor (same as Products).               |

### Tab 2 — Taxonomy

| Field    | Type   | Required | Notes                                                |
|----------|--------|----------|------------------------------------------------------|
| category | select | yes      | Fixed enum — see Category values below.              |
| tags     | array  | no       | Array of `{ tag: text }`. Free-form, stored as Wei types them. Case normalisation deferred — see Risks. |

### Tab 3 — Publishing

| Field        | Type     | Required | Notes                                          |
|--------------|----------|----------|------------------------------------------------|
| publishedAt  | date     | yes      | Manual. Supports backfill + future scheduling. |
| featured     | checkbox | no       | Default false. For homepage + blog index hero. |

Draft / published state is handled by Payload's built-in `_status` field
(from `versions.drafts: true`) — not a custom field.

### Tab 4 — SEO

| Field           | Type     | Required | Notes                                |
|-----------------|----------|----------|--------------------------------------|
| seoTitle        | text     | no       | Falls back to `title` if empty.      |
| seoDescription  | textarea | no       | Falls back to `excerpt` if empty.    |
| ogImage         | upload   | no       | → `media`. Falls back to `cover`.    |

### Hook-managed (admin readOnly)

| Field        | Type      | Hook                                       |
|--------------|-----------|--------------------------------------------|
| readingTime  | number    | `beforeChange` — `wordCount(body) / 200`.  |
| _status      | enum      | Payload-managed (versions plugin).         |
| createdAt    | timestamp | Payload-managed.                           |
| updatedAt    | timestamp | Payload-managed.                           |

## Category values

```ts
category: {
  type: 'select',
  required: true,
  options: [
    { label: 'Guides',        value: 'guides' },
    { label: 'Tech Insights', value: 'tech_insights' },
    { label: 'Company News',  value: 'company_news' },
    { label: 'Industry',      value: 'industry' },
  ],
}
```

Editorial scope of each category:

- **Guides** — How-to, selection guidance, beginner explainers. Primary SEO
  driver. Example: "How to choose an LED driver for outdoor signage".
- **Tech Insights** — Engineer-facing. Standards interpretation, comparative
  reviews, design principles. Example: "DALI-2 vs Casambi: when to use which".
- **Company News** — In-house news. Product launches, exhibitions,
  milestones. Example: "ENVO at Light + Building 2026".
- **Industry** — Trends, regulation, market commentary. Example: "What the
  EU's new energy label means for LED imports".

Changing this list requires a code PR. Adding a new value also requires
updating any existing posts (Payload will error on invalid enum on read).

## Publishing workflow

### Wei's admin experience

With `versions: { drafts: true }`, the save UI becomes:

- **Save Draft** — persists as draft; not publicly visible.
- **Publish** — flips `_status` to `published`; public read paths can see it.
- **Unpublish** — flips back to `draft`; immediately removed from public read.
- **Versions tab** — full history, any version can be restored.

All built-in; no custom code.

### Scheduled publishing

No cron, no external scheduler. Mechanism:

1. Wei sets `publishedAt` to the future date/time.
2. Wei clicks **Publish** (not Save Draft).
3. The data layer always filters with:

```ts
where: {
  _status: { equals: 'published' },
  publishedAt: { less_than_equal: new Date() },
}
```

The post sits in the DB as `published` but invisible to public queries until
its `publishedAt` passes. On the first request after that timestamp, ISR
re-generates and the post appears.

Trade-off accepted: a future-dated post does not auto-appear at the exact
second its `publishedAt` passes — it appears on the next page request or the
next ISR tick. For a B2B blog this is fine.

### Revalidation

ISR strategy:

- Blog list and detail pages: `export const revalidate = 3600` (hourly
  fallback — guarantees scheduled posts surface even with low traffic).
- On-demand revalidation: collection `afterChange` hook POSTs to
  `/api/revalidate` with the paths that need to be invalidated.

```ts
hooks: {
  afterChange: [
    async ({ doc, previousDoc, req }) => {
      // Revalidate on publish OR unpublish OR slug change.
      const wasPublic = previousDoc?._status === 'published'
      const isPublic = doc._status === 'published'
      if (!wasPublic && !isPublic) return  // draft → draft, nothing public changed

      const paths = ['/blog', `/blog/${doc.slug}`]
      if (doc.category) paths.push(`/blog/category/${doc.category}`)
      // Tag pages are dynamic; tag revalidation handled by the 1-hour fallback.

      await fetch(`${process.env.SITE_URL}/api/revalidate?paths=${paths.join(',')}`, {
        headers: { 'x-revalidate-secret': process.env.REVALIDATE_SECRET! },
      })
    }
  ],
}
```

`/api/revalidate` route handler validates the shared secret, then calls
`revalidatePath()` for each path.

## Data accessor — `src/lib/posts.ts`

Mirrors the pattern in `src/lib/products.ts`. All functions enforce the
published+date filter centrally:

```ts
getPosts({ limit?, offset?, category?, tag?, featured? }): Post[]
getPostBySlug(slug: string): Post | null
getPostsByCategory(category: CategoryValue, opts?: { limit?: number }): Post[]
getPostsByTag(tag: string, opts?: { limit?: number }): Post[]
getRelatedPosts(post: Post, opts?: { limit?: number }): Post[]
  // Auto-select by same category, excluding current post, ordered by publishedAt desc.
getAllSlugs(): string[]
  // For generateStaticParams in /blog/[slug].
```

Route handlers and components **must** call these accessors — never
`payload.find({ collection: 'posts', ... })` directly. This keeps the
publish/date filter in one place.

## Frontend routes

```
/blog                              ← index. Lists posts, paginated, featured up top.
/blog/[slug]                       ← post detail.
/blog/category/[category]          ← single-category list.
/blog/tag/[tag]                    ← single-tag list (aggregated dynamically).
```

URL structure choice: `/blog/category/[category]` rather than `/blog/[category]`,
because the latter conflicts with `/blog/[slug]` (Next.js can't disambiguate
"is this a slug or a category?" without a manifest lookup).

All pages use ISR with 1-hour fallback revalidation.

## File inventory

### New files

```
src/payload/collections/Posts.ts
src/lib/posts.ts
src/app/(frontend)/blog/page.tsx
src/app/(frontend)/blog/[slug]/page.tsx
src/app/(frontend)/blog/category/[category]/page.tsx
src/app/(frontend)/blog/tag/[tag]/page.tsx
src/app/api/revalidate/route.ts
src/components/blog/PostCard.tsx
src/components/blog/PostHeader.tsx
src/components/blog/RichTextRenderer.tsx
```

### Modified files

```
src/payload.config.ts        — add Posts to collections array.
.env.example                 — add SITE_URL, REVALIDATE_SECRET.
```

### Not modified

- `src/payload/collections/Products.ts`
- `src/payload/collections/Media.ts` — reused as-is. (Optional later: move its
  `admin.group` from `Products` to something more general; not part of this PR.)

## Hooks design

All three hooks live inline in `Posts.ts` — small enough that extraction would
hurt readability.

```
beforeChange:
  - autoSlug         // if slug empty, slugify(title)
  - calcReadingTime  // wordCount(body) / 200, store in readingTime

afterChange:
  - revalidate       // see Publishing workflow > Revalidation
```

`autoSlug` only fills when the slug field is empty — Wei can still override
manually if needed.

## Environment variables

New in `.env.example`:

```
SITE_URL=http://localhost:3000     # public origin for revalidate fetch
REVALIDATE_SECRET=<random-string>  # shared secret for /api/revalidate
```

Production values go in Vercel env when launch happens.

## Implementation order

Steps 1-7 can be done immediately (design-independent). Step 8 waits for the
homepage/blog visual design. Step 9 waits for the navigation decision.

1. Create `Posts.ts` collection with all fields + three hooks.
2. Register in `payload.config.ts`; run `npm run generate:types`.
3. Start dev server — schema auto-pushes (push mode already enabled).
4. Build `src/lib/posts.ts` with all accessors + tests.
5. Build `/api/revalidate` route handler.
6. Build the four frontend pages with placeholder layout (no design).
7. Wei seeds 1–2 test posts in admin to verify end-to-end (draft → publish →
   appear → unpublish → disappear → reschedule → reappear).
8. Mackenzie applies design treatment once design is locked.
9. Add `/blog` link to sidebar / navigation (after navigation decision lands).

## Testing strategy

- Unit tests for `src/lib/posts.ts` — verify the published+date filter is
  applied on every path (catches the "someone added a new accessor and forgot
  the filter" regression).
- Manual end-to-end at step 7 with at least one of each state:
  - Draft (not visible)
  - Published, publishedAt in past (visible)
  - Published, publishedAt in future (not visible until date passes)
  - Unpublished (not visible)
- Hook behaviour: editing a published post fires revalidate for `/blog`,
  `/blog/[slug]`, and `/blog/category/[category]`. Renaming the slug leaves
  the old path 404ing — acceptable for v1; add redirects later if it
  becomes a problem.

## Risks / open questions

- **Tag lowercase normalisation:** spec leaves tag casing as Wei types it.
  If "DALI" and "dali" diverge in posts, tag pages will split. Defer until
  observed; trivial to add a `beforeChange` normaliser later.
- **Slug collision on title edit:** if Wei renames a post after publish, the
  old `/blog/[old-slug]` 404s. Redirects collection is a separate piece of
  infra (mentioned in the broader CMS plan from the previous discussion).
  Acceptable for v1.
- **Featured count not enforced:** nothing stops Wei from featuring 20 posts.
  Frontend will simply show top N. Add a validation later if it becomes a
  pain.
