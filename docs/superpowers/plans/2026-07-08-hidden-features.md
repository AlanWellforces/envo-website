# Hidden features registry — what's switched off, where, and how to restore it

> Living doc (started 2026-07-08). Every deliberately-hidden feature must be
> listed here with ALL the places it is hidden and the exact restore steps.
> When you hide something new, add it; when you restore something, remove it.

## 1. Accessories family (hidden 2026-07-08 — zero live products in the DB)

The DB has no live `accessory_general` products (only one disabled loom SKU),
so every entry point to `/products/accessories` is hidden. The route itself
still works (empty state) — only navigation to it is removed.

| Where | File | How |
|---|---|---|
| Sidebar link | `src/components/layout/sidebar.tsx` | `HIDDEN_SECTIONS` set — remove `'accessories'` |
| Footer "Products" column | `src/components/layout/footer.tsx` | commented-out `<li>` — uncomment |
| Home "Shop by category" tile | `src/components/home/shop-by-category.tsx` | commented-out array entry — uncomment |

Notes:
- `/products` index already self-heals: family chips are count-gated
  (`countBySlug > 0`), so Accessories reappears there automatically once
  products exist.
- `PRODUCT_FAMILIES[signage].sections.hardware` carries a "Connectors &
  cables → /products/accessories" card but has NO consumer (dead data) —
  nothing to hide.
- Restore trigger: accessories stocked in Akeneo + synced.

## 2. Sidebar series submenus — RESTORED 2026-07-08 (filter-collection links)

Re-enabled the same day as filter-collection links: children mirror each
family page's Series FILTER options and deep-link to the pre-filtered view
(`?series=<exact filter value>`; CatalogueFilter reads URL params via
useSearchParams — consumers wrapped in `<Suspense>`). Keep children in
lockstep with the filter options when range gating changes.

Control Gear submenu RESTORED later the same day with all four old-menu
categories: three FUNCTION splits (Remote & Receiver / Signal Converter /
Sensor) + "Zigbee & Smart" = the whole zigbee range (old site's
`zigbee-controller` collection — a superset every zigbee product carries in
addition to its function category). Classifier = `controlGearCategories` in
family-map.ts. Nothing hidden here any more.

## 3. Sidebar supply-channel selector (hidden pre-2026-07-08)

Bottom "Find local distributor" region selector; markup + logic intact.

| Where | File | How |
|---|---|---|
| Whole feature | `src/components/layout/sidebar.tsx` | `SHOW_SUPPLY_CHANNEL = false` → `true` |

## 4. Region/channel banner (hidden 2026-07-08)

First-visit banner offering the region choice. The per-purchase-CTA region
picker still covers the choice.

| Where | File | How |
|---|---|---|
| Whole feature | `src/app/(frontend)/layout.tsx` | restore `<RegionBanner />` (see comment in file) |

## 5. TopSubnav category bar (retired 2026-07-08)

Dark horizontal category bar on detail pages — duplicate of the #157 sidebar
which lists all categories as top-level items.

| Where | File | How |
|---|---|---|
| Whole feature | `src/app/(frontend)/layout.tsx` | re-add `<TopSubnav />` (component kept in repo) |

## 6. Catalogue range gating (2026-07-08 — ranges not stocked on envo-led.com)

`RANGES_NOT_ON_OLD_SITE` in `src/lib/products.ts` (`visibleProductConditions`)
hides whole series with zero SKUs on the old site: `sc_envo`, `envo_sng`,
`sr_triac`, `envo_casambi`, `envo_dali`, `envo_sensor`, `hydro_lume`,
`edge_blade_2`, plus null-series `psu_led_cv` (KVS). Drop a list entry to
relaunch a range.

## 7. Find Your Match (hidden since #124)

Rules engine + tests kept; nav links removed. Successor idea = dimension-input
layout calculator (#125).

## 8. Product selector table (on hold — PR #120 kept as DRAFT)

`/resources/tools` product-selector stays hidden; #120 is the pickup point —
do NOT merge as-is.
