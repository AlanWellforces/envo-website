# LED Drivers catalogue: customer-facing series meta, chips, driver-shaped filters

Approved 2026-07-06. Keep the series-card structure and URLs exactly as they are —
customers order by series/SKU. This upgrades card content and filters only.

## Problem

On `/products/led-drivers` the series cards show internal abbreviations ("SE",
"Standard"), fall back to "N models in the X range." descriptions, carry no
feature chips (the `compareSpec` source is stale), and the adaptive filter rail
only surfaces voltage + CV/CC — not how anyone actually picks a driver. The
`sr_triac` series is mislabelled "Triac" when its products are DALI DT6
constant-current drivers.

## Decisions (user-locked)

- **URLs unchanged.** No route or slug changes anywhere.
- **sr_triac** displays as **"SR DALI CC Driver"**, filters into **DALI +
  Constant current**, never Triac. "Triac" is reserved for genuinely
  triac-dimmable drivers (SP).
- **Chips: max 5**, priority order **dimming/protocol → CV/CC → voltage →
  environment/IP → form factor** (High-power counts as the last tier).
- **Section headings** (CV / CC drivers) render only while no filter or search
  is active; any active filter flattens the list.
- Control Gear gets a **Protocol** facet (Casambi/DALI/Zigbee); Accessories get
  no facets; signage modules and the all-families `/products` view keep today's
  behaviour.

## Design

**New `src/data/series-catalogue-meta.ts`** — a Git-owned static map (same
user-authorised three-source exception as `SERIES_BLURBS`; delete when Akeneo
grows real attributes). Keyed by `"<marketingFamily>:<seriesCode>"` because
`sr_triac` exists in both led-drivers (CC drivers) and control-gear (relay /
converter modules) with different meanings. Each entry: customer-facing
`title`, real-usage `blurb`, optional `formFactor[]`.

**`catalogue-data.ts`**
- Card name: meta title → `productName` → `seriesLabel`.
- Card desc: meta blurb → `SERIES_BLURBS` → `shortDesc` → *empty* (the "N models
  in the range" fallback is deleted).
- New derived facets, computed from live products:
  - `outv`: output_voltage_v ∈ {12, 24, 48}
  - `power`: ≤30 W / 31–75 W / 76–150 W / 151 W+
  - `dimming`: `dimming_control` union name-derived (`/triac dimmable/i` →
    triac, `/non-?dimmable/i` → none). Never derived from series labels.
  - `formfactor`: meta `formFactor` union name-derived (linear, slim/ultra-thin)
  - `environment`: waterproof → indoor / outdoor / IP67 (IP67 also counts as outdoor)
  - `protocol`: dimming_control ∈ {casambi, dali, zigbee}
- `buildGroups(cards, familySlug?)` becomes per-family:
  - led-drivers → outv, power, dimming, formfactor, environment, opmode
  - control-gear → protocol
  - accessories → none
  - led-signage-modules → size, ledconfig, brightness, cct (unchanged)
  - no slug (`/products` all) → today's generic list (unchanged)
  - The adaptive ≥2-values rule stays for every group.
- Chips builder for non-signage cards per the locked priority; signage cards
  keep their `compareSpec` chips.

**`CatalogueFilter.tsx`** — cards gain `section?`; the family page opts in via a
`showSections` prop. Headings render only when `activeCount === 0` and more
than one section is visible.

**`merged-series.tsx`** — series-page intro chain gains the meta blurb ahead of
Akeneo copy: `editorial lede → meta blurb → SERIES_BLURBS → short_description →
subtitle → model count`, killing the garbled driver intros
("SP30(UL)seriesisan…") without touching signage.

## Testing

TDD on the pure derivations in `catalogue-data`: power bands, dimming name
derivation (SP triac, KVS non-dimmable), environment mapping, per-family group
selection (control-gear sees only protocol; accessories none), chip priority +
cap, and the **sr_triac regression case** — DALI CC products must produce
`dimming=['dali']`, `opmode=['cc']`, title "SR DALI CC Driver", and no Triac
value anywhere.
