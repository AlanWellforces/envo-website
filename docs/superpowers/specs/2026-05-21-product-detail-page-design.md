# Product Detail (SKU) Page — Design Spec

**Date:** 2026-05-21
**Pilot series:** LED Signage Modules → Eco Series
**Status:** Approved — ready for implementation plan

---

## 1. Goal

Build the first front-end page that consumes the Payload `products` collection.
Pilot scope: one series (eco-series) under the LED Signage Modules family.

Every Akeneo-synced SKU in that series gets its own page at
`/products/led-signage-modules/eco-series/[sku]`, with full specs from
Payload and supporting marketing copy reused from the existing series page.

## 2. Out of scope (this round)

- Other series / families (deferred; eco-series proves the pipeline first).
- A new Payload field for variant grouping (e.g. `variant_label`) — solved
  editorially in Git instead.
- SKU-level marketing copy in Payload (features stay at series level).
- AI integration on this page (Find-your-match links to its own page).
- Search / autocomplete entry into SKU pages.

## 3. Architecture

### Routing

```
URL:               /products/[slug]/[series]/[sku]
Example:           /products/led-signage-modules/eco-series/ECO-Q-4K
[sku]:             Akeneo identifier verbatim — no slug mapping.
                   ENVO's identifiers are alphanumeric + `-` / `_`,
                   already URL-safe with no encoding.
generateStaticParams:  All SKUs where enabled=true AND hidden=false AND
                       series='eco-series'
dynamicParams:     false   (unknown SKU → 404)
revalidate:        3600    (1 hour ISR)
Manual bust:       revalidateTag('products') — called after Akeneo sync or
                   editorial change in Payload admin
```

### Data ownership

| Layer | Owns |
|---|---|
| Akeneo PIM | All SKU specs (electrical, LED, physical, sensor, compliance, pricing, datasheet URLs) |
| Payload (synced) | Materialised SKU records; editorially-overrideable when `sync_locked=true` |
| Git (`product-families.ts`) | Series-level copy (features, applications, hero badges), variant taxonomy (which SKUs roll up to which variant card), purchase channels |

Three-source rule honoured: Payload never holds variant taxonomy; Git never
holds SKU specs.

### Entry point

The existing series page `/products/[slug]/[series]` keeps its layout, but
the **Available Variants** section is rewired:

- Variant cards (Single LED / Duo LED / Triple LED / Quad LED) become live
  links to `/.../[defaultSku]`.
- Each card's image, brightness number, etc., comes from the linked SKU's
  Payload record (so they stay in sync with Akeneo).
- A card whose `defaultSku` isn't found / is disabled in Payload renders as
  `Coming soon` (non-clickable), mirroring today's `#` placeholder pattern.

## 4. Page layout (Layout C — Two-Act)

### Act 1 — Marketing

| Block | Source | Fields |
|---|---|---|
| Breadcrumb | Mixed | Home › Products › Family › Series › Variant · CCT |
| Hero | Payload + Git | `name`, `subtitle`, `short_description`, 4 callout badges from `power_w` / `cct_k` / `brightness_lm` / `waterproof`, `image` (with fallback chain), CTAs (Datasheet · Where to buy · Find your match) |
| Key features (4 cards) | Git | `family.series.features[]` — reused as-is, no SKU-level features |
| Where it works | Git | `family.series.applications[]` |

### Act 2 — Datasheet

| Block | Source | Fields |
|---|---|---|
| Specifications | Payload | Full grouped table mirroring Payload's tab groups: **Electrical**, **LED & Light Output**, **Driver / Controller**, **Physical**, **Sensor**, **Compliance**. Empty rows hidden; entirely empty groups hidden. |
| Resources | Payload | `spec_sheet_url` (Datasheet PDF), `standards_met` (compliance badges) |
| Same variant, other CCTs | Payload + Git | From `cctSkus` mapping — links to sibling SKUs that exist in Payload. Hidden if only one CCT is live. |
| Other variants in this series | Payload + Git | Sibling variant cards (excluding current). Hidden if no other variant is live. |

### Act 3 — Conversion

| Block | Source | Fields |
|---|---|---|
| Where to buy | Git | `PURCHASE_CHANNELS` (NZ / US) |
| Final CTA | Git | Find your match · Contact engineering |

### Hero callout selection (v1)

For signage modules specifically, the four hero badges are: **Power**,
**CCT**, **Brightness**, **IP rating**. Hardcoded for this pilot. When other
product families come online (drivers, control gear), each will get its own
callout mapping — that's a later round.

## 5. Variant grouping (key data structure decision)

Eco-series has 4 variants × 3 CCTs = ~12 SKUs. The series page shows 4
variant cards, and the SKU page shows "other CCTs in this variant" — both
require knowing which SKUs roll up to which variant.

**Decision:** keep the variant taxonomy in `product-families.ts` (Git), not
in Payload. Each variant explicitly lists its SKUs.

```ts
// In src/data/product-families.ts, eco-series.variants[] gets two new fields:
variants: [
  {
    name: 'Quad LED',
    badge: 'Most popular',
    specs: [...],
    defaultSku: 'ECO-Q-4K',
    cctSkus: { warm: 'ECO-Q-3K', natural: 'ECO-Q-4K', cool: 'ECO-Q-7K' },
  },
  // Single / Duo / Triple — same shape
]
```

### Why this over a Payload `variant_label` field

- Akeneo unchanged → no sync-script work, no new attribute coordinated with
  Wei.
- Payload schema unchanged → no migration.
- Variant taxonomy is editorial copy (it groups SKUs into marketing
  concepts), so it belongs alongside the rest of the series editorial in
  Git.
- Explicit > convention: SKU-naming conventions break the moment a SKU is
  renamed or follows a different scheme in a future series.
- New SKUs added in Akeneo don't appear on the website until Git is updated
  — this is a *feature*, not a bug: it forces a deliberate "this is shipped"
  moment.

### Lookup helpers (`src/lib/products.ts`)

Add (or co-locate in a new file if `products.ts` grows past ~250 lines):

- `getVariantForSku(sku)` — walks `PRODUCT_FAMILIES`, returns
  `{ family, series, variant }` or `null`.
- `getOtherCctSkus(variant, currentSku)` — returns the other CCT SKUs from
  `cctSkus`, filtered to those that exist + enabled in Payload.
- `getOtherVariantsInSeries(series, currentVariant)` — returns sibling
  variants with their `defaultSku` Payload data.

## 6. Data flow

```
[Akeneo PIM]
   ↓ scripts/akeneo-sync.ts (existing)
[Payload products collection]
   ↓ src/lib/products.ts → getProduct(sku), listProducts({series}), ...
[Server Component /products/[slug]/[series]/[sku]/page.tsx]
   ↑ also reads PRODUCT_FAMILIES (Git) to find variant + features + apps
[Rendered HTML, cached for 1h]
   ↓
[Browser]

Series page entry:
[/products/[slug]/[series]/page.tsx]
   ↓ for each variant in family.series.variants:
   ↓   getProduct(variant.defaultSku) — if present & enabled, render live card
   ↓   else render "Coming soon"
```

## 7. Error handling & edge cases

| Situation | Behaviour |
|---|---|
| `[sku]` not in Payload | `notFound()` |
| SKU `enabled=false` or `hidden=true` | `notFound()` (also excluded from `generateStaticParams`) |
| SKU in Payload but not registered in `product-families.ts` | `notFound()` — orphan data not exposed |
| No `image` AND no `image_url_fallback` | Fall back to `seriesObj.image` |
| No `spec_sheet_url` | "Datasheet (PDF)" CTA becomes "Request datasheet" → `/contact` |
| Entire spec group empty | That group's section is not rendered |
| Individual spec field empty | That row is not rendered |
| A `cctSkus` entry points to a missing/disabled SKU | That CCT link silently omitted; section still renders if ≥ 1 sibling exists |
| Only the current CCT exists for this variant | "Same variant, other CCTs" hidden |
| Only the current variant is live in this series | "Other variants in this series" hidden |
| `standards_met` empty array | Compliance badge row in Resources hidden |
| `defaultSku` on series page card not found in Payload | Card renders as `Coming soon`, non-clickable (parity with today's `#` pattern) |

## 8. Files to change / create

```
src/data/product-families.ts
  - eco-series.variants[]: add defaultSku + cctSkus per variant
    (Single LED / Duo LED / Triple LED / Quad LED)

src/app/(frontend)/products/[slug]/[series]/[sku]/page.tsx        NEW
src/app/(frontend)/products/[slug]/[series]/[sku]/page.module.css NEW

src/app/(frontend)/products/[slug]/[series]/page.tsx
  - Variants block: replace hardcoded card content with
    getProduct(variant.defaultSku) data
  - Wrap card in <Link> to /.../[defaultSku] when SKU resolves
  - Keep "Coming soon" rendering for unmapped or missing SKUs

src/lib/products.ts (or new file if it grows)
  - getVariantForSku(sku)
  - getOtherCctSkus(variant, currentSku)
  - getOtherVariantsInSeries(series, currentVariant)
```

## 9. Verification plan

```
Build:   npm run build  — generateStaticParams emits one path per enabled
                          eco-series SKU (4 variants × up to 3 CCTs = up to
                          12 paths). At minimum the 4 defaultSku paths must
                          be present.

Routes:  dev server — visit each of:
         /products/led-signage-modules/eco-series/<each default SKU>
         (actual identifiers TBD — check Payload after sync)

Visual:  desktop + mobile screenshots for each variant page
         - hero renders with image + 4 callouts + CTAs
         - specs table groups render and obey empty-hide rules
         - CCT switcher shows the right siblings
         - sibling-variants block shows the other 3 variants

Entry:   /products/led-signage-modules/eco-series — Variants section
         - 4 live cards with Payload images
         - clicking each lands on the right SKU
         - any unmapped/disabled SKU appears as "Coming soon"

404:     /products/led-signage-modules/eco-series/NOT-A-REAL-SKU → 404
```

## 10. Open issues / follow-ups (later rounds)

- Roll the SKU page out to remaining series (each will need its own variant
  mapping in `product-families.ts`).
- Per-family hero-callout configuration (currently hardcoded for signage).
- SKU-level marketing copy in Payload, once Wei wants it.
- Admin button in Payload to call `revalidateTag('products')`.
- Search / find-your-match deep-linking into SKU pages.
