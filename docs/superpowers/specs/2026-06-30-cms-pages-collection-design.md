# CMS Pages Collection — Design

**Date:** 2026-06-30
**Status:** Approved (design)
**Branch:** feature/prelaunch-polish-2026-06-30

## Problem

The standalone policy pages (Terms of Service, Privacy, Cookie, Acceptable Use) are
currently hardcoded as JSX in Git (`src/app/(frontend)/<slug>/page.tsx` via the
`LegalPage` component). This violates the project's three-source rule — editorial copy
should live in Payload, not Git — and means a non-developer cannot edit policy wording
or add a new standalone page.

The user wants a Shopify-style **Pages** experience: a list of single pages in the
admin, each with a Title, a rich-text Content editor, a Visible/Hidden toggle, and a
"Search engine listing" (SEO) section. New pages created in the admin should go live
without a developer.

## Goals

- A general `pages` Payload collection for **plain rich-text** standalone pages.
- Migrate the 4 existing policy pages into it (content authored as Lexical JSON).
- Admin can **Add page** and have it live at a stable URL with no code change.
- Visible/Hidden controlled like Shopify (Payload drafts: published = visible).
- Footer legal links and sitemap become data-driven from the collection.

## Non-goals

- No block-based page builder (explicitly rejected previously). Rich text + an optional
  raw-HTML block only.
- Bespoke pages with forms or interactive components (About, Contact, Solutions,
  Products, Resources, Find Your Match, Free Layout Design) stay in code. They are not
  plain rich text and are out of scope.
- The existing `page-seo` collection stays for the remaining code-built pages.

## Architecture

### 1. `pages` collection (`src/payload/collections/Pages.ts`)

- `slug: 'pages'`, labels Page/Pages, `admin.group: 'Website'`, `useAsTitle: 'title'`.
- `versions: { drafts: true }` → **published = Visible, draft = Hidden** (maps to
  Shopify's Visibility toggle). Public reads default to published-only.
- `access.read: () => true`.
- Editor-style admin layout mirroring `Posts.ts`: writing surface (title, content) in
  the main column; visibility/slug/SEO in the sidebar / a collapsed section.
- `defaultColumns: ['title', '_status', 'slug', 'updatedAt']` — the Shopify-like list.

**Fields**

| name | type | notes |
|---|---|---|
| `title` | text, required | Shopify "Title". |
| `slug` | text, required, unique | Auto-generated from title via an `autoSlug` hook (reuse `slugify`), editable. |
| `content` | richText, required | Lexical editor: `defaultFeatures` + `FixedToolbarFeature()` + a raw-HTML `BlocksFeature` block (same config as `Posts.body`). Label "Content". |
| `showInFooter` | checkbox, default false | "Show this page in the footer legal links." Seeded `true` for the 4 policy pages. |
| `seoTitle` | text | Collapsible "Search engine listing" group. Overrides `<title>`; falls back to `title`. |
| `metaDescription` | textarea | Meta description. |
| `ogImage` | upload → media | Optional social share image. |

### 2. Routing

- **Policy pages keep their root URLs** (`/terms-of-service`, `/privacy-policy`,
  `/cookie-policy`, `/acceptable-use-policy`). Each existing route file is rewritten to a
  thin server component that fetches its page from the collection by a fixed slug and
  renders via the shared wrapper. 404 if the page is missing or hidden.
- **`/pages/[slug]/page.tsx`** — dynamic route for every other page in the collection.
  - `generateStaticParams` returns all published slugs **except** `LEGAL_ROOT_SLUGS`.
  - At runtime, if `slug ∈ LEGAL_ROOT_SLUGS`, `redirect()` to the root URL (avoids
    duplicate content). If not found or hidden, `notFound()`.
- The only hardcoded coupling is `LEGAL_ROOT_SLUGS` (4 strings) + a `slug → rootPath`
  map, in a small shared module (e.g. `src/lib/cms-pages.ts`).

### 3. Shared rendering

- A small server helper `getPageBySlug(slug)` in `src/lib/cms-pages.ts` wraps
  `payload.find({ collection: 'pages', where: { slug } , limit: 1 })` (published-only).
- A shared presentational wrapper renders the page: reuse the existing `LegalPage`
  look (breadcrumb, hero with title + "Last updated", `.prose` body) and render
  `content` through the existing `src/components/blog/RichTextRenderer.tsx`. No new
  Lexical node types are required (headings, paragraphs, lists, links, marks are all
  covered).
- `generateMetadata` per route uses `seoTitle`/`metaDescription`/`ogImage` with fallback
  to `title`.

### 4. Footer + sitemap (data-driven)

- `getFooterLegalPages()` in `src/lib/cms-pages.ts`: returns published pages with
  `showInFooter === true` as `{ label, href }`, where `href` = root path for a
  `LEGAL_ROOT_SLUGS` slug, else `/pages/<slug>`. Footer renders this list (replaces the
  4 hardcoded `<Link>`s).
- `sitemap.ts`: replace the hardcoded policy slugs with published `pages` slugs (root
  path for legal, `/pages/<slug>` otherwise), wrapped in the existing fail-soft `try`.

### 5. Content migration

- Seed script `scripts/seed-cms-pages.mts` (mirrors `seed-blog-posts.mts`): creates the
  4 policy pages as published docs with `showInFooter: true`, fixed slugs, the current
  adapted copy converted to **Lexical JSON** (headings, paragraphs, bullet lists, links),
  `seoTitle`/`metaDescription` from the current per-page metadata, and the "Last updated"
  date. Idempotent (skip/update if a page with the slug already exists).

### 6. Touch-ups

- `PagesOverview.tsx` (read-only admin map): mark the 4 policy pages as 🟢 CMS and link
  their "Edit content" to the `pages` collection edit view.
- Register `Pages` in `payload.config.ts` collections.

## Data flow

```
Admin edits/creates a Page (Payload)
        │  published?            draft?
        ▼                         ▼
  public read (default)      hidden everywhere
        │
        ├─ /pages/[slug]  OR  root policy route  → getPageBySlug → LegalPage + RichTextRenderer
        ├─ Footer ← getFooterLegalPages() (showInFooter)
        └─ sitemap ← published pages slugs
```

## Edge cases / error handling

- Page hidden (draft) → root route and `/pages/[slug]` both `notFound()`; excluded from
  footer + sitemap (published-only reads).
- `/pages/<legal-slug>` → 308 redirect to the canonical root URL.
- Missing/duplicate slug → unique constraint in Payload; autoSlug de-dupes on create.
- DB hiccup in footer/sitemap → fail-soft (footer renders nothing extra; sitemap keeps
  its static list), matching existing patterns.

## Testing / verification

- Seed runs idempotently; the 4 policy pages render at their root URLs identical in
  structure to today (manual diff of headings/links + curl 200).
- Create a test page in admin → live at `/pages/<slug>`; toggle Hidden → 404 + drops
  from footer/sitemap; toggle `showInFooter` → footer reflects it.
- `/pages/privacy-policy` redirects to `/privacy-policy`.
- Typecheck/lint clean for new files (don't touch pre-existing debt).

## Reused, not rebuilt

- Lexical editor config + raw-HTML block: from `Posts.ts`.
- `RichTextRenderer.tsx`: from blog (no new node types).
- `LegalPage` component + `legal.module.css`: visual wrapper.
- `slugify`, drafts pattern, fail-soft sitemap pattern: existing.
