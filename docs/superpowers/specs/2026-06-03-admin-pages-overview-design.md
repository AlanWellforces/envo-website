# Admin Pages Overview + Page SEO — design spec

**Date:** 2026-06-03
**Branch:** `feature/admin-pages-overview-2026-06-03`

## Goal

Give the team one place in the Payload admin to **see every site page** and **jump to where each is edited**, plus make **per-page SEO editable** for the code-built pages — without turning page bodies into CMS content.

## Background & decisions (brainstormed with user 2026-06-03)

The user asked for a Shopify-style admin where each page has an edit box "including showing its code." We worked through it and **deliberately rejected** the full page-builder:

- **Page bodies stay in code.** The code-built marketing pages (about, contact, solutions, etc.) are low-churn; the team has frontend devs; churny content (blog, projects, products, FAQ) already has CMS collections. A block-based page builder for the few static pages is over-engineering (YAGNI). **No `Pages` collection, no blocks, no body editing, no in-admin code editor.** Page edits continue via the normal branch → PR → deploy flow.
- Shopify's "show code" toggle is the **HTML view of editable rich-text body content**, not app source. Since we're not making bodies editable, that concept is dropped.
- The two pieces with real, cheap value are: **(1) a read-only page overview**, and **(2) editable per-page SEO** (the one bit of page metadata marketing tunes often enough to not want a PR each time).

Three-source rule compliance: page structure/components stay in Git; only SEO **text** (a content concern) moves to Payload, with code-side fallback. No code is stored in or edited from the admin.

## Scope

**In scope:**
1. **Page Overview** — a read-only custom admin view listing all site routes.
2. **Page SEO** — a small collection holding per-route SEO overrides; code pages read it via a helper with fallback to in-code defaults.

**Out of scope:** Pages collection, content blocks, body editing, in-admin code view/editor, thumbnails, analytics/KPIs, nav badges, global ⌘K search. Site-wide SEO defaults remain in the existing `SiteSettings` global; CMS pages keep their existing per-doc SEO.

## Component 1 — Page Overview (read-only custom admin view)

- A custom Payload admin view, reachable from a sidebar nav entry (label "Pages" / "页面总览").
- Renders a **table grouped by section** from a hand-maintained Git config — **no DB schema, no auto-discovery**.
- **Config:** `src/data/site-pages.ts` — an array of:
  ```
  { label: string; route: string; section: string;
    source: 'cms' | 'code';
    editHref?: string }   // where ✎ links: a Payload collection/global, or a page-seo entry
  ```
  Sections (initial): Home · Marketing · Solutions · Content collections · Resources.
- **Columns:** Page (label) · Route (opens the live route in a new tab) · Type badge (🟢 CMS / ⚪ Code) · Edit (✎ link → Payload collection/global for CMS pages; → the page's Page-SEO entry for code pages).
- Read-only. Adding a route later = add one config row (acceptable manual maintenance; logged, not auto-discovered).

## Component 2 — Page SEO (small collection + helper + wiring)

- **Collection `page-seo`** (admin group "Website"/"网站" alongside the overview):
  - `route` — text, **required + unique** (e.g. `/about`); the match key. First list column (click-to-edit).
  - `label` — text, optional (admin readability).
  - `seoTitle` — text, optional.
  - `metaDescription` — textarea, optional.
  - `ogImage` — upload → Media, optional.
  - `defaultColumns`: route, seoTitle (first column is a real field per the admin list rule).
- **Helper `src/lib/page-seo.ts`:** `getPageSeo(route: string): Promise<{ seoTitle?: string; metaDescription?: string; ogImage?: {url:string} } | null>` — queries `page-seo` by exact `route`, returns null if none.
- **Wiring:** the code-built pages' `generateMetadata` reads `getPageSeo(route)` and merges over in-code defaults:
  ```
  const seo = await getPageSeo('/about')
  return {
    title: seo?.seoTitle ?? 'About ENVO',
    description: seo?.metaDescription ?? '<in-code default>',
    openGraph: seo?.ogImage ? { images: [seo.ogImage.url] } : undefined,
  }
  ```
  **Fallback is mandatory** — an empty/missing `page-seo` row must never blank out a page's SEO; the in-code default always applies.
- **Pages wired initially (code pages with `metadata`/`generateMetadata`):** `/about`, `/contact`, `/free-layout-design`, `/solutions` (+ `/solutions/architectural-lighting`, `/solutions/signage-lighting`), `/resources` (+ `/resources/downloads`, `/resources/tools`), `/find-your-match`. (CMS pages already manage SEO per-doc and are NOT changed.) The pattern is trivially repeatable for any future code page.

## Architecture notes

- Payload custom view + custom nav link: register via `admin.components` per Payload 3.84 API (confirm exact key during planning — `admin.components.views` / `admin.components.beforeNavLinks` or a custom view route). The view is a React Server/Client component rendering the table from `site-pages.ts`.
- `editHref` for CMS pages points to the Payload collection list URL (e.g. `/admin/collections/posts`); for code pages, to the page's `page-seo` document (or a pre-filtered create/edit link keyed by route).
- No migrations beyond the `page-seo` collection table Payload generates.

## Out-of-scope / future (logged, not built)

- Auto-discovery of routes; SEO-completeness status column; OG-image preview; per-page analytics. Add only if a real need appears.

## Verification

- `npm run typecheck` + `npm run lint` clean for new files (ignore pre-existing repo debt).
- `/admin` → the "Pages" overview renders the grouped table; route links open live pages; ✎ links resolve.
- Create a `page-seo` row for `/about` with a custom title → `/about` `<title>` reflects it; delete the row → falls back to the in-code default (verify via curl of the route HTML `<title>`/`<meta name=description>`).
- Headless admin UI cannot be screenshotted (auth) — verify the admin view by asking the user; verify SEO output via curl of the public routes.
