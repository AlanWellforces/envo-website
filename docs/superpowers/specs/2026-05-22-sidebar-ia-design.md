# Sidebar IA — Blog entry + cleanup

**Date:** 2026-05-22
**Status:** Approved, awaiting implementation plan
**Owner:** Mackenzie (frontend)
**Scope:** small (~4 file edits, single PR)

## Purpose

Add the `Blog` entry to the sidebar so the just-shipped Posts collection has
a navigation home, and apply a "primary in sidebar, secondary in footer" IA
principle to clean up adjacent duplication uncovered during the brainstorm.

This brainstorm started bigger — an "Insights" group containing Blog +
Case Studies + maybe FAQs — and collapsed once we noticed three real
semantic overlaps in the existing nav. The simpler change documented here
is what survived.

## Brainstorm provenance

- Mockup: `.superpowers/brainstorm/35183-1779324154/content/sidebar-ia-options.html`
  (the mockup explores a 3rd "Insights" group; **this spec supersedes that
  direction** — see "Decisions" below)
- Discussion thread: this conversation, 2026-05-22

## Decisions (locked)

These were settled during the brainstorm and should not re-open without a
new brainstorm:

- **Blog goes into the existing `NAVIGATE` group**, not into a new
  "Insights" group. Reason: once we recognised that `/projects` already is
  case studies (the data file's top comment literally says so), the
  proposed Insights group would have held only one real item — Blog —
  which doesn't justify a new section.

- **Front-end label for project showcases is `Projects`**, not
  "Case Studies". Reason: industry convention in B2B lighting (ERCO,
  Zumtobel, iGuzzini, FLOS Architectural all use Projects / References),
  shorter label fits the sidebar, sets lower content-depth expectations.
  The Payload collection that will eventually back this route is still
  named `CaseStudies` (developer-facing); the user-facing label and URL
  stay `Projects`.

- **`Contact engineering` is removed from the Tools group.** Reason:
  it's a shortcut to `/contact`, which is already reachable via Support
  (`/support/contact`) and the footer's Support column ("Contact Us").
  Removing the Tools entry eliminates a redundant entry point without
  losing the underlying functionality.

- **`News` does not appear as a nav item.** Reason: News is a category
  inside Blog (`/blog/category/company_news`), not a separate concept.
  The existing footer `News (disabled)` span is replaced with a `Blog`
  live link covering all four Blog categories (Guides, Tech Insights,
  Company News, Industry).

- **Resources stays at `/support/resources`** under the Support hub. Not
  promoted to a top-level nav item. Reason: not enough independent content
  depth yet to justify a sidebar seat. Footer's Support column already
  surfaces it.

- **No `Insights` group is added.** Reason above: collapsed scope.

## Final sidebar structure

```
Navigate                      ← 6 items (was 5, +Blog)
├── Home
├── Products
├── Solutions
├── Projects
├── Blog                      ← NEW
└── Support

Tools                         ← 2 items (was 3, −Contact engineering)
├── Find your match
└── Free layout design

Foot                          ← unchanged
├── Region row (NZ · Oceania ↔ US · International)
└── Status pill (CATALOGUE LIVE · v2.4)
```

Position rationale for the new `Blog` item: between `Projects` and
`Support`. Reading order works as primary-product (Home/Products) →
applied-product (Solutions/Projects) → editorial (Blog) → help (Support).

## Final footer structure

Only one change. Existing footer Company column today:

```
About ENVO
News (disabled)
Careers (disabled)
```

Becomes:

```
About ENVO
Blog                          ← was `News (disabled)`, now live link to /blog
Careers (disabled)
```

`Case Studies` is **not** added to the footer at this time — its eventual
home is the same `/projects` link that's already in the Products /
Solutions / Support columns. When the `CaseStudies` Payload collection
ships and `/projects` gets per-project detail pages, no footer change
is required.

## Out of scope (deferred to other brainstorms)

These came up during the discussion but are explicitly **not** part of
this PR. Picking them up requires their own brainstorm:

- `CaseStudies` Payload collection (its own brainstorm — Blog spec already
  flagged this)
- Resources elevation to top-level nav or its own Payload collection
- Mobile drawer redesign (current grouped pattern still works with +1
  Navigate item / −1 Tools item)
- Collapsed-sidebar icon-only mode tweaks (existing icon-only behaviour
  handles the new Blog item with no special treatment)
- Footer Support column subdivision (Spec Sheets / Installation Guides /
  White Papers as separate links)
- Shopify-style nested expandable groups
- Top sub-nav reactivity to region (already noted in `region-switcher.html`
  states 02 + 03 — separate follow-up)

## Files affected

```
src/components/layout/sidebar.tsx
src/components/layout/footer.tsx
```

Two files, three concrete edits:

1. `sidebar.tsx` — add a `Blog` entry to the `NAVIGATE` array between
   `Projects` and `Support`.
2. `sidebar.tsx` — remove the `Contact engineering` entry from the
   `TOOLS` array.
3. `footer.tsx:54` — replace `<span aria-disabled="true">News</span>` with
   a Next.js `<Link href="/blog">Blog</Link>`.

## Blog item visual details

- **Label:** `Blog`
- **Href:** `/blog`
- **Section:** `blog` (used for active-state highlighting; matches the
  pattern of existing items like `home` / `products`)
- **Icon:** document-with-lines (matches the mockup option file). Stroke
  and fill come from the `.sidebar-icon` CSS class (consistent with
  existing items like Home / Products):

  ```tsx
  <svg className="sidebar-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 19V5a2 2 0 0 1 2-2h11l3 3v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
    <path d="M8 8h8M8 12h8M8 16h5" />
  </svg>
  ```

  Reads as "a document with three short rules of text" — visually
  equivalent in weight to the existing 16×16 outline icons in the
  sidebar.

## Verification

Per spec, the change is visual + structural; no new data fetching, no
new routes (Blog routes shipped in the previous PR). Smoke test is:

- Sidebar shows `Blog` between `Projects` and `Support` on every page
- Clicking `Blog` navigates to `/blog`
- Blog item highlights as active when on `/blog` or any `/blog/*` route
  (because the existing active-state matcher uses `pathname.startsWith`
  on the item's `href`)
- Tools group no longer shows `Contact engineering`; clicking `Find your
  match` still works
- Footer Company column shows `Blog` (live) replacing the old `News`
  greyed-out span
- Mobile drawer renders the same structure (one extra Navigate item, one
  fewer Tools item — same layout)

## Risks / open questions

- **Existing TOP_SUBNAV configuration:** the top sub-nav has section keys
  matching each Navigate item. Adding a `blog` section may need a
  corresponding empty or single-item entry in the TopSubnav config so
  the sub-nav bar doesn't render orphan / leaked state when Blog is the
  active section. To be verified during implementation; if so, add a
  minimal entry (or set the Blog section to suppress the sub-nav bar).

- **Removed Contact engineering's behaviour:** if any analytics or
  marketing campaign currently links to the Tools entry by selector
  (`[data-section="contact"]`), it'll be a dead reference. Mackenzie
  greps for `data-section="contact"` and any "Contact engineering" string
  references before deleting to be safe.
