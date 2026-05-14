# ENVO Website — Design Audit

**Source mockups:** `~/Desktop/ENVO/website/_mockups/mockup-version-c*.html` (10 files, 16,902 lines total — the third design iteration in the marketing-cyber repo, selected as the design source for the v2 Next.js site).
**Date:** 2026-05-15
**Purpose:** Identify a single set of design tokens + shared components, so every page draws from one design system instead of each page reinventing its own.

---

## TL;DR — what the audit found

**Good news:** the source mockup files aren't 10 chaotic designs. They form **two themes** with deliberate roles, sharing a common brand layer:

| Theme | Files | Role |
|---|---|---|
| **Dark immersive** | homepage mockup, eco-series mockup | Showcase / hero pages |
| **Light catalog** | 8 other files (products / signage / drivers / control / accessories / solutions / projects / support) | Browsable content / nav pages |

**Brand layer is identical everywhere:**
- `--envo-blue: #0071bc` + `--envo-blue-glow: #4dc3ff`
- `--envo-lime: #aec90b`
- Sidebar: `--sidebar-w: 200px`, `--sidebar-w-collapsed: 64px`
- Inter Tight font, 400/500/600/700/800 weights
- Same `.btn` / `.btn-primary` / `.btn-ghost` system across all 10 files

**Component overlap is high.** The 8 light-theme files all use **`.sig-card`** as their only catalog card variant. The 2 dark files use 6 card variants (`.pf-card`, `.product-card`, `.case-card`, `.proj-card`, `.res-card`, `.sol-card`).

This is **a tractable unification**, not a rewrite.

---

## 1. Token inventory

### 1.1 Brand tokens (identical across all 10 files — no decision needed)

```css
--envo-blue:      #0071bc;
--envo-blue-glow: #4dc3ff;
--envo-lime:      #aec90b;

--sidebar-w:           200px;
--sidebar-w-collapsed:  64px;

font-family: 'Inter Tight', -apple-system, BlinkMacSystemFont, sans-serif;
```

### 1.2 Theme-specific tokens

| Token | Dark (home/eco) | Light (8 catalog) |
|---|---|---|
| `--bg` / `--bg-page` | `#050b1a` (deep navy) | `#f4f5f7` (cool gray) |
| `--bg-elevated` | `#0a1a2e` | `#0a1a2e` *(same — sidebar stays dark)* |
| `--bg-surface` / `--bg-page-alt` | `#102542` | `#eaecf0` |
| `--bg-card` | `#142d4f` (dark glass) | `#ffffff` (white) |
| `--bg-sidebar` | (uses `--bg-elevated`) | `#0a1a2e` (explicit) |
| `--fg` | `#f5f7fa` (near-white) | `#1a2332` (near-black) |
| `--fg-mute` | `#8b9cb0` | `#4a5568` |
| `--fg-soft` | `#5a6c80` | `#6a7a8a` |
| `--fg-dark-mute` | *(not used)* | `#8b9cb0` (for dark sidebar text on light pages) |
| `--line` | `rgba(77,195,255,.1)` (faint blue glow) | `#e2e5ea` (gray hairline) |
| `--line-strong` | `rgba(77,195,255,.18)` | `#d5d9e0` |
| `--envo-lime-glow` | `#c8e62a` (bright glow for dark bg) | *(not present)* |
| `--envo-lime-deep` | *(not present)* | `#5b6a08` (deep hover/text on light bg) |

**Key insight:** the **sidebar is dark on every page** (`--bg-elevated: #0a1a2e`), regardless of which theme the page body uses. That's the design constant that ties the site together visually.

---

## 2. Decision points

These are the choices you need to make before we refactor. My technical recommendation is in **bold** — purely from a maintenance perspective, not brand opinion.

### D1 — Two-theme system, yes or collapse to one?

| Option | Implication |
|---|---|
| **A. Keep both themes** (Recommended) | Match the source design intent. Home + showcase pages stay dark/immersive; catalog/nav pages stay light/readable. Implement as `body[data-theme="dark"]` vs `body[data-theme="light"]` switching CSS variable values. |
| B. Collapse to dark everywhere | Visual unity but light bg in the source was deliberate for product reading. Risk: catalog pages look too heavy. |
| C. Collapse to light everywhere | Loses brand drama; home video bg doesn't pop. Not recommended. |

### D2 — Token naming

The source's token names diverge across themes (`--bg` vs `--bg-page`, `--fg-soft` value differs, etc). Pick one canonical naming scheme:

| Option | Example |
|---|---|
| **A. Semantic per role** (Recommended) | `--surface-base` / `--surface-elevated` / `--surface-overlay` / `--text-primary` / `--text-muted` — same names in both themes, different values |
| B. Keep source names | `--bg` and `--bg-page` co-exist — confusing, but no rename work |
| C. Tailwind v4 namespace | `--color-bg-base` / `--color-bg-elevated` — verbose but Tailwind-utility-friendly |

### D3 — Card components

| Option | Implication |
|---|---|
| **A. One `<Card>` component with variants** (Recommended) | Single React component, props: `variant` ('catalog' / 'project' / 'feature' / 'resource' / 'solution' / 'product'). CSS handles the 6 dark-theme variants + the light-theme `.sig-card` |
| B. Six separate components | More duplication, easier per-variant edits |

### D4 — Container width

The source containers hop between `1320px` (catalog pages, no sidebar offset) and `1440px` (homepage, with sidebar offset). Choices:

| Option | Implication |
|---|---|
| **A. Single max-width: 1440px** (Recommended) | One value everywhere, sidebar always offsets via `body { padding-left: var(--sidebar-w) }` |
| B. Two: `--container-narrow: 1320` for catalog, `--container-wide: 1440` for home | Matches source pixel-perfect |

### D5 — Sub-page CSS strategy

Each source page has its own CSS inline (~3000 lines per file). Where do those live in Next.js?

| Option | Implication |
|---|---|
| **A. One `envo.css` shared layer + per-page tweaks via CSS modules** (Recommended) | Common ~80% of source CSS goes to envo.css; truly page-specific bits (eco-series's unique product viewer) get `*.module.css` |
| B. All pages share one envo.css, no scoping | Risk: class name collisions, harder to know what's where |
| C. Per-page CSS files imported in each page.tsx | Cleanest scoping, but lots of files |

### D6 — eco-series treatment

`mockup-version-c-eco-series.html` is **3,980 lines** (the largest mockup). It's a deep product detail page with interactive specs / variants. Two options:

| Option | Implication |
|---|---|
| **A. Build it as a template, not a single page** (Recommended) | One template at `/products/[slug]` that reads product data from Payload. eco-series becomes the design reference for how the template renders any product. |
| B. Static port as `/products/signage-eco-series` only | Faster but doesn't scale to ~50 products |

---

## 3. Shared component candidates

Sorted by reuse count across the 10 mockups.

### High reuse — build first

| Component | Reuse | Notes |
|---|---|---|
| `<Button>` (variants: primary, ghost, arrow) | 10/10 | Same `.btn` base across all pages. Already partially exists as shadcn `<Button>` — extend with the additional variants from source. |
| `<Container>` | 10/10 | Already done. |
| `<Sidebar>` | 10/10 | Already done. |
| `<Footer>` | 10/10 | Already done (5-col layout). |
| `<LightBinBar>` | 10/10 | Already done. |
| `<CatalogCard>` (= `.sig-card`) | 8/10 | Used everywhere on light theme pages. Hero pattern: image left/right + body. |
| `<SectionHead>` (eyebrow + h2) | 10/10 | Repeated in every section. Trivial component. |

### Medium reuse — build after first pages

| Component | Reuse | Notes |
|---|---|---|
| `<ProductFamilyCard>` (= `.pf-card`) | Done for homepage | Image + name + desc + series links |
| `<CaseCard>` (= `.case-card` / `.proj-card`) | 3/10 | Project showcase format |
| `<ResourceCard>` (= `.res-card`) | 3/10 | Download links with icon |
| `<SolutionCard>` (= `.sol-card`) | 3/10 | Solution category card |
| `<StatCard>` | 2/10 | Icon + label + desc, used in Impact + impact-stats |
| `<TrustBadge>` | 1/10 | Compliance badges, only on homepage Trust strip |

### Page-level layouts — Round B/C

| Layout | For pages |
|---|---|
| `<ImmersivePage>` (dark theme + diamond bg + cursor glow) | `/`, `/products/[slug]`, `/products/signage-eco-series` |
| `<CatalogPage>` (light theme + standard container + breadcrumbs) | `/products`, `/solutions`, `/projects`, `/support`, all light theme catalog pages |

---

## 4. Recommended implementation order

Assuming you accept the recommendations above (or with your own decisions):

### Round B — Tokens + primitives (1 session)

1. Rewrite `globals.css @theme` with the canonical semantic tokens (D2-A)
2. Add `body[data-theme="dark"]` / `body[data-theme="light"]` switch in CSS
3. Default body to dark theme (matches home)
4. Move the source's `.btn` / `.btn-primary` / `.btn-ghost` into `envo.css` (already there, just confirm clean)
5. Build `<Button>` React component wrapping those classes
6. Build `<SectionHead>` React component
7. Refactor homepage sections to use `<Button>` + `<SectionHead>` (visual unchanged, code cleaner)
8. Commit + verify homepage looks identical

### Round C — Catalog pages (2-3 sessions)

1. Build `<CatalogPage>` layout wrapper that flips body to light theme
2. Build `<CatalogCard>` component
3. Port `/products` (light theme catalog, 4-card grid of product families)
4. Port `/solutions` + `/projects` + `/support` (same pattern, different data)
5. Stub `/products/[slug]` template using the eco-series mockup as visual reference

### Round D — Product detail template (1-2 sessions)

1. Port eco-series mockup → `<ProductDetailTemplate>` accepting product data props
2. Wire to Payload products collection (read-only first, hardcoded fallback)
3. Generate stub data for the 4 product families so all routes render
4. Round trip with Wei on product copy

### Round E — Leaf pages (1 session)

1. `/free-layout-design`, `/contact`, `/about`, `/find-your-match` — these don't have source mockups (or are very simple). Build from scratch using the established design system.

---

## 5. What this audit does NOT cover

- **Animations / transitions / scroll behaviour**: The source has cursor-glow, panel-dots, reveal-on-scroll, smooth-scroll. All already in our Phase 2b foundation. Per-page animations (counter animation on hero stats, hero video play handling) handled in the homepage port.
- **Mobile responsive behaviour**: The source's responsive rules are in each file's inline `<style>`. These need their own audit when we get to a mobile review pass.
- **Accessibility**: The source has some `aria-*` attributes but no systematic a11y review. Worth doing after Round D.
- **Copy / content**: this is Wei's domain. Audit just normalises visual presentation.
- **Find Your Match wizard**: it's a separate SPA-style flow. Not covered here; needs its own design pass.

---

## 6. Decisions tracker — fill in to commit

When you've decided, write your call here so future PRs/sessions can pick up consistently:

| ID | Decision | Recommended | Your call |
|---|---|---|---|
| D1 | Two-theme system | A. Keep both | __ |
| D2 | Token naming | A. Semantic per role | __ |
| D3 | Card component | A. One Card with variants | __ |
| D4 | Container width | A. Single 1440 | __ |
| D5 | Sub-page CSS | A. envo.css + CSS modules | __ |
| D6 | eco-series scope | A. Template for /products/[slug] | __ |
