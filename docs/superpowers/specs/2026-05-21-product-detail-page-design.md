# Product Series Page — Design Spec

**Date:** 2026-05-21 (revised same-day after design reference review)
**Pilot series:** LED Signage Modules → Eco Series
**Status:** Implemented

---

## 1. Goal

Make the series page (`/products/[slug]/[series]`) the canonical product
landing page — one page per series, no SKU-level drill-down. The page reuses
Payload product data for the live variant cards (image, marketing data) but
the page itself stays at the series level, listing all LED-count variants and
CCT options as aggregates.

## 2. Direction change from the first draft

The initial draft proposed an SKU-level route at
`/products/[slug]/[series]/[sku]` with CCT-switching siblings. After reviewing
the reference design (marketing-cyber.github.io/envo-website/products/signage-mini-series.html)
we pivoted to a series-level page only — same depth as today, no per-CCT
detail pages. SKU-level data still feeds the page through the variant cards,
but every URL terminates at the series.

## 3. Out of scope

- SKU detail pages (`/.../[sku]`) — removed.
- CCT switcher / per-CCT pages — covered by the variantsFootnote naming
  convention (-WW / -NW / -CW).
- A new Payload field for variant grouping — solved editorially in Git.
- SKU-level marketing copy in Payload (features stay at series level).

## 4. Architecture

### Routing

```
URL:        /products/[slug]/[series]
Example:    /products/led-signage-modules/eco-series
[sku]:      not exposed as a URL — Payload data is consumed inside the series
            page via getProduct(defaultSku) for each variant card
ISR:        revalidate=3600 + revalidateTag('products') after Akeneo sync
```

### Data ownership

| Layer | Owns |
|---|---|
| Akeneo PIM | All SKU specs |
| Payload | Materialised SKU records; powers variant card images + (future) live data |
| Git (`product-families.ts`) | Series-level copy, variant taxonomy, resources list, applications, pairWith, hero, key features |

### Series page = "one product page" for the series

The series page is the lowest-grained URL we expose. Every "buy / spec /
download" intent must be satisfied at this depth — there is no deeper page
to send the user to. Variant cards are informational.

## 5. Page layout (matches reference)

| # | Block | Source | Notes |
|---|---|---|---|
| 1 | Breadcrumb | Mixed | Home › Products › Family › Series |
| 2 | Hero | Git | name + subtitle + badges + Datasheet / Where-to-buy CTAs |
| 3 | Key Features (6 cards) | Git | series.features |
| 4 | Specifications (table) | Git | series.specifications — reference variant |
| 5 | Available Variants (4 cards) | **Payload-driven** | series.variants × getProduct(defaultSku) for image |
| 6 | Regional Availability | Git | PURCHASE_CHANNELS |
| 7 | Where It Works | Git | series.applications |
| 8 | **Resources Grid** | Git | series.resources — datasheet + 3 placeholders |
| 9 | Pair With | Git | series.pairWith |
| 10 | Design Assistance | Static | Free layout design banner |
| 11 | Sibling Series | Git | family.series — others in family |
| 12 | Final CTA | Static | Find your match · Contact |

## 6. Payload integration (the only Payload-driven block)

`Available Variants` is the only block that consumes Payload. For each
`SeriesVariant` with a `defaultSku`, the page calls `getProduct(defaultSku)`
and renders the card with:

- **Image:** Payload upload (`product.image.url`) → Akeneo S3 fallback
  (`product.image_url_fallback`) → series-level fallback (`v.image ??
  seriesObj.image`). See `resolveProductImage()` in `src/lib/products.ts`.
- **Card text:** stays from Git (`v.name`, `v.specs`, `v.badge`).

The card is **not a link**. The reference design treats variants as
informational — the user converts via the page-level CTAs (Where to buy,
Datasheet, Find your match), not through a per-variant deep link.

When `defaultSku` is missing or unresolvable in Payload, the card falls back
to the Git image (`v.image ?? seriesObj.image`) and renders normally — no
"Coming soon" state needed since the card is always informative.

## 7. Resources Grid (new in this round)

`ResourceCard[]` type added to `product-families.ts`:

```ts
type ResourceCard = {
  label: string          // "Datasheet" | "Photometric" | "Guide" | "Compliance"
  title: string          // "EcoGlo Datasheet"
  description?: string
  url?: string           // omit → renders "Request via contact" → /contact
  meta?: string          // "PDF" / "On request" / etc.
}
```

For eco-series, 4 cards: Datasheet (real Akeneo S3 URL), Photometric files
(on request), Stroke width guide (on request), Compliance pack (on request).
The 3 "on request" cards point at `/contact` until URLs come in.

This is intentionally Git-only for now — when other resources land we add
them to `product-families.ts` next to the series; no Payload schema change
needed.

## 8. Error handling & edge cases

| Situation | Behaviour |
|---|---|
| Series slug unknown | `notFound()` (existing behaviour, unchanged) |
| Variant `defaultSku` missing in Payload | Card uses Git image fallback, still renders |
| Variant has no `defaultSku` | Card uses `v.image ?? seriesObj.image` |
| Resource `url` missing | Renders as "Request via contact" link to /contact |

## 9. Files changed (this round)

```
src/data/product-families.ts
  - Added SeriesVariant.defaultSku (no cctSkus — dropped from earlier draft)
  - Added ResourceCard type + SeriesLink.resources field
  - Populated eco-series.variants[].defaultSku (4 entries)
  - Populated eco-series.resources (4 entries)

src/lib/products.ts
  - Added resolveProductImage(product, fallback) — 3-step image fallback chain

src/app/(frontend)/products/[slug]/[series]/page.tsx
  - Variants block: now pulls product image from Payload via getProduct()
  - Added Resources Grid section between Where-It-Works and Pair-With

src/app/(frontend)/products/[slug]/[series]/page.module.css
  - Added .resourcesGrid + .resourceCard + .resourceLabel/.resourceTitle/
    .resourceDesc/.resourceCta styles
  - No structural changes to other blocks

REMOVED (from the initial SKU-detail-page draft):
  - src/app/(frontend)/products/[slug]/[series]/[sku]/     entire dir deleted
  - SeriesVariant.cctSkus field
```

## 10. Verification

```
Series page:   /products/led-signage-modules/eco-series → 200
Old SKU URL:   /products/led-signage-modules/eco-series/EV-BLEG04LBY-NW → 404
Variant cards: 4 cards, 0 outbound links, all using Payload images
Resources:     1 Download (Datasheet PDF) + 3 Request-via-contact cards
No regressions: home / catalogue / family page all 200
TypeScript:    clean (one pre-existing listProducts type warning, unchanged)
```

## 11. Open follow-ups

- Real URLs for photometric / stroke width / compliance pack resources.
- Promote variant card data beyond image (e.g., show Payload brightness_lm
  numbers in the card if needed).
- When other series go live, populate their `defaultSku` + `resources`.
- Per-family hero-callout configuration (deferred until non-signage series
  go live).
