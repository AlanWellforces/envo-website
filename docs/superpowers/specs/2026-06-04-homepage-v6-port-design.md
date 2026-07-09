# Homepage v6 Port — Design Spec

**Date:** 2026-06-04
**Branch:** `feature/homepage-v6-port-2026-06-04` (off `dev`)
**Author:** marketing + Claude

## Goal

Replace the current catalogue-first homepage (`src/app/(frontend)/page.tsx`, 12 legacy
section components) with the locked **home-v6** redesign mockup: an application-first,
8-section layout. Faithful pixel port, rebuilt as clean React + a scoped CSS Module —
following the `free-layout-design` precedent (JSX + module, not Shadow DOM).

Source mockup: `.superpowers/brainstorm/33087-1780436613/content/home-v6.html`
(viewable at `http://localhost:65101/files/home-v6.html`).

## Scope

**In:**
- 8 v6 sections ported as components under `src/components/home/`.
- One shared CSS Module for all v6 styling.
- `page.tsx` recomposed to render the 8 sections (no data fetching).
- Delete legacy home components no longer referenced.
- Commit the two hero assets the v6 hero depends on.

**Out (deferred follow-ups):**
- Payload data wiring (hero copy, CTA copy, trust numbers) — v1 is hardcoded, matching
  the `free-layout-design` demo precedent. Trust proof numbers were already placeholder
  in the mockup.
- Homepage-only sidebar lightening (see Styling note below).
- A dedicated "Where to buy" section (v6 folds buy links into the final CTA `.v4-buyline`).

## App shell — already provided, do NOT port

`src/app/(frontend)/layout.tsx` already renders `Sidebar`, `TopSubnav`, `Footer`,
`CursorGlow`, `RevealOnScroll`, `BackToTop`. Only the v6 `<main>` `<section>`s are ported.
The mockup's `<aside class="sidebar">` markup is ignored.

## The 8 sections (in order)

| # | Component file | v6 class | Bg | Content summary |
|---|----------------|----------|----|-----------------|
| 1 | `hero.tsx` | `.v4-hero` | dark + video | Eyebrow, "Light that performs.", lead, 3 trust chips, 2 CTAs (Find your match / Free layout), + quiet 4-item catalogue quick-grid |
| 2 | `apps.tsx` | `.v4-apps` | white | "Solutions for how the light is used." + 4 application cards (Signage / Architectural Facades / Retail & Hospitality / Control Systems), all → `/solutions` |
| 3 | `free-layout.tsx` | `.v4-layout` | mist | "Free layout design." 2-col: image + 3 numbered steps + CTA → `/free-layout-design` |
| 4 | `featured-project.tsx` | `.v4-action` | dark | "Specified. Installed. Still performing." Featured case (image + info + badges + products-used chips) + 2 mini-case tiles |
| 5 | `product-range.tsx` | `.v4-fam` | white | "One system, four families." 4 family cards (Signage Modules / LED Drivers / Control Gear / Accessories) → `/products` |
| 6 | `trust-slim.tsx` | `.v4-trust2` | mist | One promise line + 4 cert logos (CE / UL / RoHS / TÜV) |
| 7 | `guides.tsx` | `.v4-guides` | white | "Guides & industry notes." 3 blog teaser cards → `/blog` |
| 8 | `final-cta.tsx` | `.v4-final` | gradient | "Let's light your next project." 3 tiered CTAs + slim distributor buy-line (Wellforces / PowerSupplyMall) |

All copy, image `src`s, and `href`s are transcribed verbatim from the mockup. All 23
referenced assets already exist under `public/assets/` (verified).

## Architecture

```
src/app/(frontend)/page.tsx        → imports home-v6.css; renders <Hero/> <Apps/>
                                      <FreeLayout/> <FeaturedProject/> <ProductRange/>
                                      <TrustSlim/> <Guides/> <FinalCta/>
src/components/home/
  hero.tsx  apps.tsx  free-layout.tsx  featured-project.tsx
  product-range.tsx  trust-slim.tsx  guides.tsx  final-cta.tsx
  home-v6.css                       → scoped global stylesheet, shared by all 8
```

Each section component is a server component, no props, returns its `<section>`. They are
single-use (homepage only) and intentionally not abstracted — content is static. This
matches the existing per-section layout of `src/components/home/` and keeps each future
Payload-wiring change isolated to one file.

## Styling strategy

- The mockup's `#v6-redesign` `<style>` block (~200 lines) is ported into one shared,
  scoped **global** stylesheet `src/components/home/home-v6.css`, imported once by
  `page.tsx`. The big `inlined-app-css` block is the site's own cloned `globals.css` and
  is NOT ported (production already has it).
- **Why global, not a CSS Module:** the mockup CSS is already fully namespaced — every
  helper class (`.body`, `.pic`, `.go`, `.row`, `.grid`, `.info`, `.tag`, `.n`, `.steps`,
  `.badges`, `.used`, `.chips`, `.quick`, `.fb`, `.gb`, `.ph`, …) is authored as a
  descendant of a `.v4*` ancestor (e.g. `.v4-app .body`, `.v4-case .info`). The only
  bare top-level selector is `.v4` itself, which exists only on the homepage `<main>`.
  So a plain global import has effectively zero leakage, and the JSX uses the mockup's
  **verbatim kebab class names** (`className="v4-hero"`) — a direct transcription with
  near-zero transformation, which minimises visual-drift risk versus hand-converting
  every nested selector to module-local camelCase. App Router permits global CSS imports
  in any component/page.
- **Brand colour single-sourcing:** `--v4-blue` / `--v4-lime` map to the existing global
  tokens `--envo-blue` / `--envo-lime` (identical values: `#0071bc` / `#aec90b`). v6's
  neutral palette (`--v4-ink`, `--v4-ink-soft`, `--v4-paper`, `--v4-mist`, `--v4-mist-line`,
  `--v4-text`, `--v4-muted`, `--v4-blue-deep`) is kept as module-local custom properties
  to preserve the exact look.
- The font stack uses the existing `--font-sans` / Inter Tight already loaded by the layout.
- Responsive breakpoints (1080 / 880 / 560px) ported verbatim.

**Dropped on purpose:** the mockup's homepage-only sidebar tweak
(`.sidebar:before{opacity:.45}`, `.sidebar-link.active` overrides). Those target the
globally-rendered sidebar; in a bundled stylesheet they would leak to every page. The
hero is dark and dominant without it. Deferred — revisit only if a per-page body class
is introduced.

## Cleanup

Legacy home components are imported only by `(frontend)/page.tsx` (verified). After the
port, delete the ones with no replacement:

`impact.tsx · trust.tsx · product-families.tsx · solutions.tsx · projects.tsx ·
quote.tsx · featured-detail.tsx · process.tsx · resources.tsx · newsletter.tsx`

`hero.tsx` and `final-cta.tsx` are overwritten with the v6 versions. `getHomePage` /
`src/lib/home-page.ts` becomes unused by the homepage — leave the lib in place (may be
reused by the deferred Payload-wiring follow-up); only its import is removed from page.tsx.

## Assets

The v6 hero references `/assets/videos/hero-signage.mp4` + poster
`/assets/images/hero-signage-poster.jpg`. Both already exist in the working tree as
untracked files and are committed as part of this work. All other referenced images
(`cat-*.png`, `app-mini-*.jpg`, `ind-*.jpg`, `featured-project.jpg`, `certs/*.png`)
already exist and are committed.

## Verification

1. `npx tsc --noEmit` — no NEW type errors beyond the known baseline (5 pre-existing).
2. `npm run lint` — no NEW lint errors beyond the known baseline (42 pre-existing).
3. Dev server + headless Chrome screenshot of `http://localhost:3000/` at **1440×900**
   (canonical review res), compared side-by-side against the mockup at
   `http://localhost:65101/files/home-v6.html`. Check: hero video + scrim, 4-up app grid,
   free-layout 2-col, dark featured case, family cards, trust logos, guides, final CTA.
4. Spot-check responsive collapse at ≤1080 and ≤560 (grids → 2-col → 1-col).
5. User visually confirms before merge.

## Non-goals / explicitly excluded

- No Shadow DOM (top-level flagship page; module is more maintainable + wireable).
- No new abstractions / shared section primitives (single caller — YAGNI).
- No changes to sidebar, footer, or other routes.
