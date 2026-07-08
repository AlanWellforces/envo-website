# Solutions pages — align recommendation cards & links with the customer-category taxonomy

**Date:** 2026-07-09 · **Author:** Claude (approved by marketing)

## Problem

The two solution subpages (`/solutions/signage-lighting`, `/solutions/architectural-lighting`)
still recommend products by **internal series codename** (MiniLux, EcoGlo, UltraFlare,
EdgeLume, ChromaFlux, EV-SL, Zigbee Control) and link to the **old series detail pages**
(`/products/<family>/<series-slug>`). Since #161 the whole site navigates by the
**old-menu customer categories** (Mini / Eco / Pro / RGB / 24V / Sidelit; Screw
Terminal / Linear / Triac Dimmable; Remote & Receiver / Signal Converter / Sensor /
Zigbee & Smart) via catalogue filter deep links (`/products/<family>?series=<option>`).
Solutions was the last surface on the old scheme.

## Decision

Rename recommendation cards to the customer categories and point every product link at
the same `?series=` deep links the sidebar submenus use. Where a category spans several
internal series (Pro = ProGlo + UltraFlare; Sidelit = EdgeLume + EdgeFlare + EdgeBlade)
the blurb names the member series. Kit items keep their concrete product names (they name
a specific part) but link to the category deep link. Cross-links to `/solutions/*`,
`/products/control-gear` (family index) and `/free-layout-design` are unchanged.

## Mapping applied

| Old card / link | New |
|---|---|
| MiniLux → `/products/led-signage-modules/mini-series` | Mini Series → `?series=Mini%20Series` |
| EcoGlo → `…/envo-ecoglo` | Eco Series → `?series=Eco%20Series` |
| UltraFlare → `…/envo-ultraflare` | Pro Series → `?series=Pro%20Series` (blurb: ProGlo + UltraFlare, OSRAM claim dropped) |
| EdgeLume → `…/envo-edgelume` | Sidelit → `?series=Sidelit` |
| ChromaFlux → `…/envo-chromaflux` | RGB Series → `?series=RGB%20Series` |
| EV-SL Linear Driver → `/products/led-drivers/envo-sl-us` | Linear Drivers → `/products/led-drivers?series=Linear` |
| Zigbee Control → `/products/control-gear/envo-zigbee` | Zigbee & Smart → `/products/control-gear?series=Zigbee%20%26%20Smart` |

## Mechanics

`src/data/solutions.ts` is **seed-only**; runtime reads the Payload `solutions`
collection. So the change lands in two steps:

1. Edit `src/data/solutions.ts` (this PR).
2. Re-run `npx tsx --tsconfig tsconfig.json scripts/seed-solutions.mts` against the
   target DB (idempotent upsert by slug). Done for DEV with this PR.
   **⚠️ Must be re-run against PROD at launch** (same list as the channel-copy and
   clean-image launch fixes).

## Out of scope

The series detail pages themselves stay live (still reachable from related-series
recommendations and SKU pages); retiring them is a separate decision.
