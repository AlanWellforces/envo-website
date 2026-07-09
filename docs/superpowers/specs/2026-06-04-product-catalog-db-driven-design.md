# DB-Driven Product Catalog — Design Spec

**Date:** 2026-06-04
**Branch:** `feature/product-catalog-db-driven-2026-06-04` (off `dev`)
**Author:** marketing + Claude

## Goal

Make **all 224 ENVO products** reachable and viewable on the site with real spec detail
pages, so `/products` reads like a complete, mature catalogue instead of one hand-curated
series. Today the product front-end is driven entirely by the hardcoded
`src/data/product-families.ts` config; only `mini-series` actually renders DB products, so
200+ products in the Payload `products` collection have **no page at all**.

This is a **front-end + IA build over existing data** — it does NOT touch the Akeneo sync,
and does NOT fill missing data (certs, clean images, editorial fields). It surfaces the
data that already exists. See the companion audit `docs/product-data-gap-report-2026-06-04.md`.

## Background / current state

- Data: Payload `products` collection, 224 envo products, served via `src/lib/products.ts`
  (`getProduct`, `getProductsByFamily`, `listProducts` with family/series/spec filters +
  pagination, `resolveProductImage`). The data layer already supports everything below.
- 7 DB families: `psu_led_cv` (105), `led_module` (73), `psu_led_controller` (27),
  `psu_led_cc` (9), `sensor` (8), `switch_switch_module` (1), `accessory_general` (1).
- Routes today: `/products` (4 hardcoded family cards), `/products/[slug]` (hardcoded
  series cards), `/products/[slug]/[series]` (static unless `mini-series`, which pulls DB).
  No SKU-level route. 36 curated series, 12 "live", rest "Coming soon".
- Reusable UI: `MiniSeriesPage.tsx` (bespoke flagship — keep), `ProductSelectorTable.tsx`
  (filterable cross-series table under /resources/tools — keep for that, not reused here).

## Architecture

### Family mapping (7 DB families → 4 marketing families)

New module `src/data/family-map.ts`:

```
led_module                        → led-signage-modules
psu_led_cv, psu_led_cc            → led-drivers
psu_led_controller, switch_switch_module → control-gear
sensor, accessory_general         → accessories
```

Exports both directions: `dbFamilyToMarketing(code)` → `{ slug, label }`, and
`marketingFamilyToDbFamilies(slug)` → `string[]`. This is the single source for the 7→4
relationship; `PRODUCT_FAMILIES` keeps its marketing copy/images but no longer gates
completeness.

### Series slug derivation

DB `series` codes (e.g. `envo_minilux`, `sc_envo`, `hydro_lume`) become URL slugs:

- A `SERIES_SLUG_OVERRIDES` map bridges DB codes to existing curated slugs where a
  `PRODUCT_FAMILIES` series exists (e.g. `envo_minilux` → `mini-series`, `envo_ecoglo` →
  `eco-series`), so curated URLs and the bespoke mini-series page keep working.
- For DB series with no curated entry, derive: `code.replace(/_/g, '-')`
  (`hydro_lume` → `hydro-lume`). `seriesSlug(code)` and `seriesCodeFromSlug(slug, family)`
  are pure functions in `family-map.ts`. The override map and its inverse are the bridge.
- The 8 products with no `series` (7 sensors + 1 cv) fall into a synthetic `other` series
  bucket per family, so they remain reachable.

### Routing — nested, DB-driven (confirmed: not flat `/products/[sku]`)

The existing folder names are kept: `[slug]` = family segment, `[series]` = series segment.
Only a new `[sku]` level is added. Below, `[family]` denotes the existing `[slug]` dir.

```
/products                              → 4 family cards (existing marketing copy; unchanged)
/products/[slug]                       → DB-driven: list this family's series (grouped from
                                         DB), each a card with product count → series page
/products/[slug]/[series]              → DB-driven: card grid of the SKUs in this series;
                                         mini-series keeps its bespoke MiniSeriesPage
/products/[slug]/[series]/[sku]        → NEW generic SKU detail page (spec table from DB)
```

`generateStaticParams` at each level enumerates from the DB (all families, all series, all
224 SKUs), so every product is statically reachable. SKU URL segment = the product `sku`
verbatim (alphanumeric + hyphens, URL-safe); `getProduct(sku)` resolves it, `notFound()`
otherwise.

### Components

| File | Responsibility |
|------|----------------|
| `src/data/family-map.ts` | 7→4 family map, series slug ↔ code helpers, override map |
| `src/components/products/SeriesGrid.tsx` | card grid of series for a family page (DB-driven) |
| `src/components/products/ProductCardGrid.tsx` | card grid of SKUs for a series page |
| `src/components/products/GenericProductDetail.tsx` | the new SKU detail page body |
| existing `MiniSeriesPage.tsx` | unchanged; still used for `mini-series` |

The two list pages and the family page reuse the **existing** `[slug]/page.module.css`
card styles (`seriesGrid`, `seriesCard`, etc.) for visual continuity — no new design
language. The SKU detail page borrows the mini-series spec-table visual language.

### Generic SKU detail page

`GenericProductDetail` renders from the `Product` object:

- **Header:** breadcrumb (Home › Products › {Family} › {Series} › {name}), product name,
  subtitle, `resolveProductImage` (prefers `clean_image`), short/long description.
- **Spec table** grouped into sections, each section rendered **only if ≥1 of its fields is
  populated** (so a driver shows no LED rows, a module shows no output-channel rows):
  - Electrical: power_w, output_voltage_v, input_voltage_min/max_v, rated_current_a,
    number_of_outputs, operation_mode, dimming_control
  - Light output: brightness_lm, efficacy_lm_w, cct_k, cri, beam_angle_deg, led_chip_colour,
    led_pitch, lifetime_hrs, max_in_series
  - Physical: length/width/height_mm, weight_kg, waterproof (IP), temp_min/max_c, material,
    finish_colour, mounting_info
  - Control (gear): controller_type, output_channel, output_type
  - Certifications: standards_met — **section hidden while empty** (0/224 today); appears
    automatically once Akeneo data lands.
  - Support: warranty_years, spec_sheet_url (datasheet download button)
- A `FORMATTERS` map (same idea as the selector's): dual units `mm (in)`,
  temperature `°C (°F)` per [[feedback_dual-units-metric-imperial]], IP labels, CCT `K`,
  enum→label for operation_mode / dimming / colour.
- **No price.** `price_nzd` is never rendered (brand policy, [[feedback_no-prices-on-brand-site]]).
- **Related products:** up to 4 siblings from the same series (DB), linking to their detail
  pages. (Uses series grouping, not the empty `related_skus` editorial field.)

## Edge cases

- No-series products → synthetic `other` series bucket per family; labelled e.g. "Other
  {Family}". Reachable, listed, detail page works.
- Series with a single product → still gets a series page (grid of one) + detail page.
- A DB family with no marketing mapping → impossible (all 7 mapped); defensive `notFound()`
  if an unknown family/series slug is requested.
- "Coming soon": any series that has DB products is live; the curated coming-soon state only
  remains for curated series that genuinely have zero DB products (if any).

## Non-goals

- No Akeneo sync changes; no data backfill (certs, clean images, short_description, editorial).
- No price display, no cart/checkout.
- No change to `MiniSeriesPage` or the /resources/tools selector.
- No new visual design language — reuse existing card + spec-table styles.

## Verification

1. `npx tsc --noEmit` clean (baseline-only errors).
2. `npm run lint` — no new errors.
3. `vitest run` green; add unit tests for `family-map.ts` pure functions (slug ↔ code,
   7→4 mapping, override resolution).
4. Dev server: spot-check one URL per family + the mini-series bespoke page + 3–4 generic
   SKU pages across families (a CV driver, a controller, a sensor, a module), confirming
   correct spec sections show/hide and breadcrumbs resolve. Headless screenshot at 1440×900.
5. Confirm `generateStaticParams` yields 224 SKU params (every product reachable) — assert
   count in a quick check or test.
6. Confirm no `price_nzd` appears in rendered HTML (grep the built/served page).
