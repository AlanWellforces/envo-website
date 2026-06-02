# Resources Sub-Pages — Content Architecture Design

**Date:** 2026-06-02
**Status:** Approved (architecture direction). Downloads source = Option A (hybrid).
**Scope:** Architecture only — how the `/resources` sub-pages store content and link to the
backend. This spec does **not** design pixel-level layouts; each sub-page reuses an existing
frontend pattern (blog list/detail). Implementation of each page is a follow-on plan.

## Goal

`/resources` (the hub) is built and trimmed. Its deeper pages are still `PageStub`
placeholders, and the hub's content currently lives in hardcoded Git data files
(`src/data/resources.tsx`, `src/data/resource-faqs.ts`) that were always intended as
stopgaps. This spec defines where each kind of resources content lives, and the single
wiring pattern that connects every CMS-driven sub-page to Payload.

Three sub-pages are in scope:
1. **Downloads** — `/resources/downloads`
2. **Tools & Guides** — `/resources/tools`
3. **FAQ** — `/resources/faq` (new; currently inline on the hub)

## Governing rule — three-source ownership

Per `CLAUDE.md`, every piece of content has exactly one owner:

| Content | Owner | Location |
|---|---|---|
| Per-product / per-series spec sheet (datasheet PDF) | **Akeneo** | `Products.spec_sheet_url` (exists today) |
| FAQ question & answer copy | **Payload** | new `Faqs` collection (migrate `resource-faqs.ts` verbatim) |
| How-to / installation guide articles | **Payload** | **reuse `Posts`** — its `category` select already includes `guides` |
| Selection calculators / wiring logic | **Git** | React components under `src/` (same principle as `find-your-match` prompt logic) |
| Brand-level files (master catalogue PDF, IES bundles, layout templates) | **Payload** | new `Downloads` collection (Option A) |
| Where-to-buy regions | **Git** constant | `src/data/purchase-channels.ts` (unchanged — brand-wide constant) |
| Section intro/eyebrow copy | **Payload** | `SiteSettings` global (optional; may stay inline initially) |

Principle: **datasheets/IES are product data → Akeneo; FAQ/guides are editorial → Payload;
calculators are logic → Git.** The current hardcoded data files are temporary and migrate out.

## Wiring pattern — how every CMS sub-page links to the backend

No new mechanism. We reuse the exact pattern already proven by `Posts` and `Projects`:

```
Payload Collection (src/payload/collections/<X>.ts)   ← editors work in /admin
        │  Postgres (Payload tables; product_* via Drizzle)
        ▼
src/lib/<x>.ts   get<X>()   ← getPayload() local API; typed return; published/date filter
        ▼
src/app/(frontend)/resources/<x>/page.tsx   ← Server Component; `export const revalidate`
        ▲
        └─ Collection afterChange hook → POST /api/revalidate (ISR refresh; Posts implements this)
```

Each CMS-driven sub-page is the same three pieces: **Collection (admin form) → `src/lib/*`
query helper → Server Component page.** Identical to the blog. The "link to the backend" is
this chain; there is nothing bespoke to build per page beyond the collection schema and the
query helper.

## Sub-page designs

### 1. FAQ — `/resources/faq`

- **New collection `Faqs`** (`src/payload/collections/Faqs.ts`), group: Editorial.
  Fields: `question` (text, required), `answer` (richText, required),
  `group` (select: Ordering & availability / Products & compatibility /
  Installation & technical / Warranty & after-sales — seeded from current data),
  `order` (number, sidebar), `_status` (drafts enabled).
- **Query helper** `src/lib/faqs.ts` → `getFaqs()` returns groups with ordered items
  (published only).
- **Page** `/resources/faq/page.tsx` — Server Component, renders grouped `<details>`
  accordions (lift the existing markup out of the hub). `export const revalidate`.
- **Hub** keeps a short FAQ teaser linking to `/resources/faq`, or the inline section is
  replaced by a query against `getFaqs()` (decided at implementation time).
- **Migration:** `resource-faqs.ts` content seeded into `Faqs` via a one-off script
  (same bootstrap as `scripts/seed-blog-posts.mts`); then delete the data file and its
  import.

### 2. Tools & Guides — `/resources/tools`

- **Calculators** (e.g. driver-sizing): **Git** React components. Pure logic + UI; no CMS.
  Supporting copy (intro, disclaimer) may read from `SiteSettings`.
- **How-to / guide articles:** **reuse `Posts`** with `category = guides`. A query helper
  (`getPosts({ category: 'guides' })` already exists via `getPostsByCategory`) feeds a
  guides list on `/resources/tools`. Zero new collection. These articles also appear at
  `/blog/category/guides` — intentional cross-surfacing, single source.
- **Layout templates** (downloadable files): Payload Media, surfaced through the same
  `Downloads` collection (category = template) as the Downloads page.

### 3. Downloads — `/resources/downloads` (Option A · hybrid)

Two merged sources:

- **Per-product / per-series spec sheets → Akeneo.** Query `Products` and list
  `spec_sheet_url` grouped by series. No duplication; product docs stay product-owned.
- **Brand-level files → new `Downloads` collection** (`src/payload/collections/Downloads.ts`),
  group: Editorial. Fields: `title` (text, required), `category`
  (select: Catalogue / IES bundle / Installation guide / Layout template),
  `file` (upload → media, required), `series` (optional relationship/text for grouping),
  `order` (number), `_status`. Lets Wei upload the master catalogue, IES packs, and
  templates today without waiting on Akeneo schema changes.
- **Query helper** `src/lib/downloads.ts` → `getDownloads()` (brand files) plus a
  `getProductSpecSheets()` reader over `Products`. The page composes both into labelled
  groups.
- **Page** `/resources/downloads/page.tsx` replaces the stub; Server Component + ISR.

## What we are NOT building (YAGNI)

- **No `Guides` collection** — `Posts` (category=guides) covers it.
- **No mega "Resources" collection** with a `type` discriminator — it muddies the admin UX
  and the editor-style layout; two focused collections are clearer.
- **No Akeneo schema work** for this milestone — Option A deliberately avoids adding
  `ies_url`/`install_guide_url` PIM fields. (Option B, fully Akeneo-driven product docs,
  remains a future refinement once Alan extends the PIM; the `Downloads` collection can then
  shrink to genuinely brand-level files.)
- **No ticketing / RMA / after-sales** — `/resources` is a pre-sales hub; after-sales routes
  to distributors.

## New collections summary

| Collection | Purpose | Net new |
|---|---|---|
| `Faqs` | FAQ Q&A (editorial) | ✅ new |
| `Downloads` | brand-level downloadable files | ✅ new (Option A) |
| `Posts` (category=guides) | how-to / guide articles | reuse |
| `Products` (`spec_sheet_url`) | per-product datasheets | reuse (Akeneo) |

Net: **2 new Payload collections.** Each follows the canonical editor-style collection layout
(`Posts.ts` is the template) and the Collection → `src/lib` → Server Component wiring above.

## Dependencies & sequencing

- `Faqs` and the FAQ page are fully self-contained → buildable first, no external blockers.
- `Downloads` (brand files) is self-contained; the Akeneo spec-sheet listing depends only on
  the existing `Products.spec_sheet_url` field.
- Tools/Guides reuse depends on `Posts` (done) — only a guides query + list view is new.

## Out of scope for this spec

Per-page visual/layout design, calculator algorithm details, and the data-migration scripts
are deferred to the implementation plan(s). Each sub-page can be its own plan; FAQ is the
natural first slice.
