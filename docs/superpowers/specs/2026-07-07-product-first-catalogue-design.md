# Product-First Catalogue Restructure — Design Spec

**Date:** 2026-07-07
**Status:** Approved, pending implementation plan
**Target branch:** `feature/product-first-catalogue-2026-07-07` (clean, off `dev`)

## Problem

The product browsing experience is range/series-first. That suits marketing
storytelling for signage, but it fails users of **LED Drivers** and **Control
Gear**, who arrive knowing they need a specific SKU by spec (voltage, wattage,
dimming protocol, control type, channels, IP, datasheet). Some series are also
mixed — Control Gear can hold controllers, remotes, gateways, converters and
sensors — so forcing everything behind a "range" first is confusing.

## Final Information Architecture

| Layer | Route | Purpose | Card / content granularity |
|---|---|---|---|
| **Category page** | `/products/[category]` | **Find a product** | Drivers / Control Gear / Accessories = **SKU-level cards**; Signage = **series-level cards** (same product-grid visual style) |
| **Series page** | `/products/[category]/[series]` | **Understand the range** (unchanged) | Series story, applications, install notes, full comparison, related |
| **SKU detail page** | `/products/[category]/[sku]` | **Decide / compare / download / enquire** (new) | One SKU (Drivers / Control Gear / Accessories only) |

- Category page = discovery. Series page = range education. SKU page = decision.
- Series pages are **no longer the required first step**, but they remain useful.

## Detail-Page Strategy by Family

Detail-page granularity differs by family — we do **not** force every family into
true single-SKU pages.

| Family | Category cards | Detail page | Reason |
|---|---|---|---|
| **LED Drivers** | SKU-level | True SKU detail page | Selected by wattage, voltage, dimming, IP, form factor |
| **Control Gear** | SKU-level | True SKU detail page | SKUs differ by protocol, function, control type, channels, unit type |
| **Accessories** | SKU-level | True SKU detail page | Individual purchasable items |
| **Signage Modules** | **Series-level** (product-grid style) | **Existing merged series page** with variant selector / compare | Variant-driven: one series = CCT + size + LED-config + brightness variants. One page per SKU → many near-duplicate pages, and fights the locked decision that signage detail = merged series page |

**Locked decisions preserved:** signage detail pages stay as merged series pages;
CCT/variant selection stays inside the series page; MiniLux hand-curated page
intact; other signage series stay data-driven; **no true single-SKU pages for
signage** at this stage.

## 1. Category Page (`/products/[category]`)

**Layout:** header (category name + short description) → filter area (search +
filters) → product grid.

**Filters** — series becomes *a filter*, not the primary browsing layer.
Category-specific filter sets are **already implemented** in `buildGroups()`:

- **LED Drivers:** output voltage, power range, dimming, form factor,
  environment/IP, operation mode (CV/CC).
- **Control Gear:** protocol, function, control type, channels.
- **Signage Modules:** size, LED configuration, brightness, CCT (series optional).
- **Accessories:** simple type/category filters where data supports it; no forced
  filters when data is sparse.

Facet groups stay **adaptive**: a group only renders when the visible cards hold
≥2 of its values (existing behaviour in `buildGroups` / `group()`).

**Grid** — reuse the existing `layout="productGrid"` / `resultKind="products"`
pattern already in the WIP. Responsive via `auto-fit` + `minmax` for a stable
layout:

- large desktop: 4 / row (when content stays clean)
- normal desktop: 3 / row
- tablet: 2 / row
- mobile: 1 / row

**Card content:**

- Individual product image for Drivers / Control Gear / Accessories; series/best
  representative image for Signage series cards (existing `resolveProductImage`
  fallback chain: clean product image → series line-art).
- SKU shown on SKU cards.
- Product name (SKU cards) or series name (Signage cards).
- Only 2–3 key chips/specs — do **not** overcrowd; detailed specs live on the
  detail page.
- CTA wording:
  - Drivers / Control Gear / Accessories → **"View product"** (→ SKU detail page)
  - Signage → **"View series"** (→ series page)
- **Datasheet lives on the SKU detail page**, never as the category-card
  destination. Avoid "View range" wording on SKU product cards.

**Scope note:** the all-families `/products` index page stays unchanged for now.

## 2. Series Page (`/products/[category]/[series]`)

Unchanged. Keep the existing merged series page system:

- MiniLux hand-curated page intact.
- Other series render the data-driven merged template
  (`buildMergedSeriesProps` → `MergedSeriesPage`).
- Still serves: series story, applications, installation notes, shared benefits,
  full variant/spec comparison, related products.

Do **not** remove or restructure series pages.

## 3. SKU Detail Page (`/products/[category]/[seg]`)

**Route:** a single dynamic segment `[seg]` serves **both** existing series pages
and new SKU detail pages. This extends the current
`src/app/(frontend)/products/[slug]/[series]/page.tsx` route (which is
`dynamicParams=false` + `generateStaticParams`).

**Resolution order (series first, then SKU):**

1. Resolve `[seg]` as an existing **series slug** → render the series page (today's behaviour).
2. Else resolve `[seg]` as a **SKU** (`getProduct(seg)`, confirm it belongs to `[category]`) → render the SKU detail page.
3. Else `notFound()` (404).

**Constraints:**

- Existing `/products/[category]/[series]` URLs must not break — series wins on
  any ambiguity.
- Collisions are unlikely (SKUs are codes like `EV-…`, `SR-…`; series slugs are
  human-readable lowercase), but preserving existing series URLs is the priority.
- `generateStaticParams` gains one `{ slug, series: sku }` entry per SKU for the
  three spec-driven families (Drivers, Control Gear, Accessories). SKU strings are
  URL-encoded.
- SKU detail pages apply to **LED Drivers, Control Gear, Accessories** only — **not
  Signage Modules**.

**Page structure:**

- Breadcrumb
- Hero: individual product image, SKU, product name, core specs
- Datasheet CTA
- Enquiry / distributor CTA (reuse region-aware `FindDistributorCta`)
- Same-series comparison table (when useful — see §4)
- Related products (when available)
- Shared series/editorial content (when available)

**Data assembly** — via a new `buildSkuDetailProps(family, product, sameSeriesProducts)`:

- current product data (`getProduct(sku)`)
- same-series product list (`getProductsByMarketingFamily(slug)` filtered by
  `seriesSlug(p.series)`)
- shared series/editorial content **where available**

**Sparse-editorial fallback:** Driver / Control-Gear series editorial is thin in
the data. Any shared-content section with no data is **omitted entirely** (no
empty shells).

## 4. Product-Aware Comparison Table (`SpecCompareTable`)

New reusable component for SKU detail pages.

**Data:** current SKU + same-series products.

**Rules by same-series product count:**

- **= 1 (singleton series):** do **not** render the table — a one-row comparison
  has no value.
- **2–6:** horizontal table — specs as rows, products/SKUs as columns; highlight
  the current SKU column with a subtle background; other columns carry a
  "View product" link/button (near header or footer).
- **> 6:** row-based table — one row per SKU, key specs as columns; highlight the
  current SKU row; current row action = **"Current"**; other rows action =
  **"View product"** (→ that SKU's detail page).

**Mobile:** never force a wide horizontal table on mobile. Even when desktop uses
the 2–6 horizontal layout, mobile renders a stacked or row-based version for
readability.

**Suggested key columns:**

- **LED Drivers:** model/SKU, power, output voltage, dimming, operation mode,
  IP/environment, action.
- **Control Gear:** model/SKU, protocol, function, control type, channels,
  input/output voltage (if available), action.
- **Accessories:** model/SKU, type, dimensions/material/IP (if available), action.

## 5. Existing WIP to Build On

The current (uncommitted) WIP already proves the pattern:

- `buildControlGearProductCards()` in `catalogue-data.ts` — per-SKU cards.
- `CatalogueFilter` supports `layout="productGrid"` + `resultKind="products"`.
- Control Gear category page already uses SKU product cards.
- Family-specific filters already implemented for drivers, control gear, signage.

Phase 1 generalizes this: rename/extend the card builder beyond Control Gear so
Drivers and Accessories produce SKU cards, and Signage produces series cards in
the same grid style.

## 6. Phasing

**Phase 1 — Product-first category grids (all families):**

- Clean up the existing Control Gear product-grid WIP.
- Generalize the product-card builder beyond Control Gear
  (`buildControlGearProductCards` → shared `buildProductCards`).
- Convert LED Drivers to SKU product grid.
- Convert Accessories to SKU product grid.
- Convert Signage Modules to series-level cards in product-grid visual style.
- Keep `/products` all-families index unchanged.
- Category-card CTAs: "View product" (SKU families) / "View series" (Signage);
  cards link to detail/series pages, not datasheets.

**Phase 2 — SKU detail routing + template:**

- Smart `[seg]` route resolution (series first, then SKU, else 404).
- `generateStaticParams` emits SKU params for the three spec-driven families.
- New `SkuDetailPage` component + `buildSkuDetailProps`.
- New `SpecCompareTable` component with the count-based rules.

**Phase 3 — Polish:**

- Enquiry / distributor CTA wiring.
- Related products.
- Sparse-editorial fallback.
- Design refinements.

Each phase is a separable PR against `dev`.

## 7. Branch Hygiene & PR Strategy

The current branch `feature/sidebar-structure-optimize-2026-07-07` has **three
unrelated uncommitted streams** tangled together:

1. region → regionLabel refactor
2. Supply-Channel rename
3. catalogue / product-first WIP ← the only part relevant here

**Do not mix** region / supply-channel work into this catalogue PR.

**Setup (first execution step):**

- Create a clean branch off `dev`: `feature/product-first-catalogue-2026-07-07`.
- Bring over **only** the catalogue / product-first changes:
  - `src/app/(frontend)/products/[slug]/page.tsx`
  - `src/components/products/CatalogueFilter.tsx`
  - `src/components/products/catalogue-data.ts`
  - `src/components/products/products-catalogue.css`
- Leave the current branch's WIP fully intact (do not blanket-discard; target
  exact paths). Prefer a git worktree so the current dirty tree is never touched
  (do **not** symlink `node_modules` into the worktree — worktree removal would
  wipe the real one).
- `FindDistributorCta.tsx` is region-aware — audit whether its WIP change is
  catalogue-relevant or region-stream before carrying it over.

## Constraints — do not break

- Do **not** remove the merged series pages.
- Do **not** convert all signage SKUs into standalone detail pages.
- Do **not** make the category page range-first again.
- Existing `/products/[category]/[series]` URLs must keep working (series resolves
  before SKU).
- No prices anywhere (lead-gen site). No online-chat wording. No response-time
  promises. Supply via authorised channels (not on-site checkout). ENVO-only
  branding. (Site-wide copy rules.)

## Key Files

```
src/app/(frontend)/products/[slug]/page.tsx            category page
src/app/(frontend)/products/[slug]/[series]/page.tsx   series + (new) SKU resolver
src/components/products/catalogue-data.ts              card + facet builders
src/components/products/CatalogueFilter.tsx            grid/rows + filter UI
src/components/products/products-catalogue.css         catalogue styles
src/components/products/merged/MergedSeriesPage.tsx    series-page template (reuse blocks)
src/components/products/merged/FindDistributorCta.tsx  region-aware CTA (reuse)
src/lib/products.ts                                    getProduct, getProductsByMarketingFamily, groupProductsBySeries
src/data/family-map.ts                                 seriesSlug / seriesLabel / section titles
docs/superpowers/specs/2026-07-07-product-first-catalogue-design.md   this spec
```

New files (Phase 2):

```
src/components/products/sku/SkuDetailPage.tsx          SKU detail template
src/components/products/sku/SpecCompareTable.tsx       product-aware comparison table
src/lib/sku-detail.ts (or similar)                     buildSkuDetailProps
```
