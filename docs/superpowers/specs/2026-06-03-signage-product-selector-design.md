# Product Selector — Signage first instance — Design

**Date:** 2026-06-03
**Status:** Approved (design direction)
**Route:** `/resources/tools/signage-selector`
**Supersedes** the "series cross-compare table" sketch in
[`2026-06-02-resources-subpages-architecture-design.md`](2026-06-02-resources-subpages-architecture-design.md)
§2 — the selector is now a **SKU-level filterable table**, not a series-aggregate compare table (see Decisions).

---

## Goal

A fast, engineer-facing tool that lets a signage buyer **filter ENVO signage modules by spec** (output,
beam, IP, size, LED count, voltage, CCT) and reach **the exact model** — then open its series page or
download its datasheet. First instance of a **generalisable** product selector that later serves drivers
and control gear.

## Decisions (the path that got us here)

1. **SKU-level, not series-aggregate.** The spec originally imagined a series cross-compare table
   (columns = series). We pivoted to a **per-SKU filterable table** because the user's real need is
   "filter to my exact spec" — and column filters like *"only 12 V"* and *dimensions* are per-SKU
   attributes, not series aggregates.
2. **The selector owns per-model datasheets; the Downloads page does NOT.** This removes the overlap
   between `/resources/downloads` and the selector. `/resources/downloads` is rescoped to a **minimal
   brand-level library** (catalogue / IES bundles / install guides / templates) — built later, when Wei
   has files to upload. Per-model datasheets live in the selector. See [Out of scope].
3. **Reusable, config-driven component — not signage-only.** Per the project rule "any UI pattern must
   generalise across all four families". One `ProductSelectorTable` driven by a per-family column/filter
   config. Ship signage now; drivers/control are fast-follow configs (no new component).
4. **Find Your Match seam.** The selector is the deterministic "I know my spec → filter" door; Find Your
   Match (still a stub) is the guided "describe my project → recommended bundle" door. Both land on the
   same products. The selector links out to FYM ("Need the full kit?") but does not embed it.
5. **Accessories pairing is NOT in the table.** Belongs on the series detail page ("Pair with") and FYM,
   not as columns in a dense filter table. The table links out instead.
6. **Dual units site-wide.** Dimensions render metric-primary + imperial-muted
   (`43 × 23 × 11.6 mm` / `1.69 × 0.91 × 0.46 in`) via a shared `units.ts` helper. Selector uses it first;
   site-wide rollout (temps, other dimension fields, detail/series pages) is a separate follow-up.

## Architecture

Follows the three-source rule: **product specs = Akeneo (read from the Payload `Products` collection);
editorial labels/taglines = Git `selector-config.ts`; component logic = Git.**

```
src/app/(frontend)/resources/tools/signage-selector/page.tsx   Server Component; reads data, renders shell
src/components/resources/ProductSelectorTable.tsx              Client Component; filtering + table UI
src/lib/product-selector.ts                                    getProductsForSelector(family) reader
src/data/selector-config.ts                                    per-family column + filter definitions, series labels/order
src/lib/units.ts                                               mmToIn(), formatDims() dual-unit helpers
```

- **`getProductsForSelector(family)`** (server, Payload local API): returns the family's products
  flattened to selector rows — `{ sku, name, series, seriesLabel, voltage, power_w, brightness_lm,
  efficacy_lm_w, beam, cct, cri, ip, ledCount, maxInSeries, dims{l,w,h}, specSheetUrl, image, detailHref }`.
  Voltage parsed from `led_light_power_input`; IP from `waterproof`; image prefers
  `clean_image_url_fallback` then `image_url_fallback`; `detailHref`/`seriesLabel` from `selector-config.ts`.
- **`ProductSelectorTable`** is a Client Component: receives the full row array (≤ ~120 rows/family — fine
  to ship client-side) + the family's column/filter config; does in-browser filtering (search + selects +
  range). No server round-trips, no new API route.
- **`selector-config.ts`** holds, per family: ordered column list, which fields are filters (select vs
  range), series label map + display order + `detailHref` (null until a series page exists), and the
  "best for" taglines. This is the small editorial seam (eventually a Payload `Series` collection — deferred).

## Signage column + filter definition

**Columns** (left → right): Image · Model (name + SKU + voltage tag) · Series · **LED count** ·
Output (`lm` + `lm/W` muted) · Power (W) · Beam · CRI · IP · Max run · Dimensions (mm + in muted) · Actions.

**Filters** (industrial filter bar): Search (name/SKU) · Series · **LED count** · Voltage · CCT · IP ·
Max height (range slider, for cabinet-depth fit). *(LED count + CRI added as columns per review; LED count
is also a filter; CRI is column-only; CCT is filter-only, not a column.)*

**Actions per row:** `View →` (series detail page; greyed when the series page is not built yet) and
`Datasheet ↗` (the Akeneo `spec_sheet_url`). An `IES` action is **designed-in but hidden** until an
`ies_url` source exists (see Dependencies).

**Deliberately excluded** (noise — uniform or too sparse): lifetime (all 50 000 h), warranty (all 5 yr),
LED pitch (only 47/73 populated), weight, chip type.

**Visual direction:** tech / industrial / B2B — graphite filter bar, monospace tabular numerals, dense
rows, uppercase micro-labels, thin grid lines; brand **blue** structural, **lime** for active/focus state.
Series-grouped rows within the result set. No horizontal scroll (series as rows, curated columns).

## Data realities (verified against live Akeneo data, 2026-06-03)

- Signage = **73 SKUs across 11 series** (not the 6 in `product-families.ts`): EcoGlo, ProGlo, UltraFlare,
  MiniLux, HydroLume, OptiLume, ChromaFlux (backlit) + EdgeLume, EdgeFlare, EdgeBlade, EdgeBlade 2 (sidelit).
  Backlit beam 160–180°, sidelit 5–15° → group/separate the two in display.
- 222/224 products have `spec_sheet_url` (175 unique PDFs); signage = 26 unique datasheets.
- `output_voltage_v` is empty for modules — voltage comes from `led_light_power_input` (`power_input_12V`).
- IP rating is the `waterproof` field (e.g. `ip65`).
- LED count is **not a field** — parse from the product name (Single/Duo/Triple/Quad/Double); all 73 parse.
- CRI varies (70/75/80); operating temp has two bands (−25/+60 and −40/+70 for extreme-climate variants).
- `clean_image_url_fallback` exists for only **10/73**; the rest fall back to `image_url_fallback`
  (grey-studio shots). Honouring "use clean images everywhere" needs the image pipeline to fill the gap.
- Series detail pages exist today only for **MiniLux** and **EcoGlo**; the other 9 series have no page.

## Generalisation (later, not now)

Same component + a new config block per family:

| Family | SKUs | Likely columns / filters | Status |
|---|---|---|---|
| Signage | 73 | output · beam · CCT · IP · size · LED count | **this spec** |
| Drivers | 113 | wattage · voltage (12/24/48) · CV/CC · dimming (Triac/0-10V/DALI/PWM) · IP | follow-up |
| Control gear | ~36 | protocol (Zigbee/DALI/Casambi) · channels · zones | follow-up |
| Accessories | 1 | — (no spec data) | skip |

Each follow-up = a `selector-config.ts` entry + a `/resources/tools/<family>-selector` route. No component change.

## Out of scope (YAGNI)

- Driver / control / accessory selector configs and routes (follow-up tasks).
- `/resources/downloads` build — rescoped to a minimal brand-level library, deferred until Wei has files.
- Find Your Match itself (separate, larger project — AI prompt + API route).
- Real IES downloads (no data source yet — see Dependencies).
- Site-wide dual-unit rollout beyond the selector's dimensions (separate task; `units.ts` is the shared seam).
- A Payload `Series` collection (deferred per existing decision; `selector-config.ts` is the interim home).
- `/resources/tools` hub page build — the selector gets a link from it; hub stays a stub for now.

## Dependencies & follow-ups

- **Alan** — add `ies_url` to Akeneo `Products` (unblocks the hidden IES action). Optional this milestone.
- **Series detail pages** — only MiniLux/EcoGlo live; `View →` greys out for the rest until built.
- **Image pipeline** — generate clean (background-removed) images for the 63 signage SKUs lacking one.
- **`selector-config.ts`** — Wei/marketing fill the "best for" taglines and confirm series order/labels.

## Three-source compliance

- Specs, datasheet URLs, images → **Akeneo** (via `Products`). No product data duplicated into Git/Payload.
- Series labels, order, "best for" taglines, detail hrefs → **Git** `selector-config.ts` (interim; Payload later).
- Component, filtering, unit conversion → **Git**.
