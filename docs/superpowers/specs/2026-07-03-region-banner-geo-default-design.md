# First-visit region banner + geo-IP silent default — design

Date: 2026-07-03
Status: approved in conversation (banner form + geo mapping + client-only plumbing)

## Problem

New visitors always start on the `nz-ap` default. US/EU visitors see the wrong
distributor (wellforces.co.nz) until they discover the sidebar switcher. Two
agreed additions:

1. **Geo-IP silent default** — on Vercel, use the `x-vercel-ip-country`
   request header to pick the right starting region. Zero interaction, zero
   interruption.
2. **First-visit banner** — a dismissible top strip (per approved screenshot)
   that tells new visitors regions exist and lets them confirm/change in one
   click.

## Decisions (locked)

- **Geo mapping**: country ∈ Asia-Pacific list → `nz-ap`; any other country →
  `us-global`; header missing/unknown (incl. all of dev) → `nz-ap` (current
  behaviour, zero risk). Rationale: powersupplymall is "US · Global region —
  serves international customers outside the Asia-Pacific region", so Europe
  etc. belongs to `us-global`, not just the Americas.
- **Plumbing**: pure client-side; **no middleware, no cookies**. Reading
  `headers()`/`cookies()` in the layout would force the whole site into
  dynamic rendering — not worth it.
- **Silent default is not a choice**: the geo default lives in memory only.
  Only explicit user action (banner Continue/×, sidebar switcher) writes
  `envo-region` to localStorage. Manual choice therefore always wins forever.
- **Banner form** (as approved): non-blocking fixed strip at viewport top,
  renders only when no `envo-region` key exists, dropdown preselected with
  the geo default, **Continue and × both persist the current value** and the
  banner never shows again. No entry animation/delay. Sidebar switcher use
  also dismisses it (change event). Narrow screens stack vertically.

## Components

1. `src/lib/region/geo.ts` — `regionForCountry(country: string | null): RegionId`.
   Pure function + AP country list. Unit-tested.
2. `src/app/api/region-default/route.ts` — GET; reads
   `x-vercel-ip-country`, returns `{ region: 'nz-ap' | 'us-global' }`.
3. `src/components/region/RegionProvider.tsx` — on mount, if no saved
   `envo-region`, fetch `/api/region-default` once and `set()` (in-memory
   only, no localStorage write).
4. `src/components/region/RegionBanner.tsx` — client component, mounted in
   `src/app/(frontend)/layout.tsx` inside `RegionProvider`. Copy: “ENVO works
   with regional partners — set your region for local availability and
   support info.” Dropdown options from `PURCHASE_CHANNELS.regionLabel`.
   Uses `useRegion()`; visible only when localStorage has no `envo-region`;
   hides on the shared change event.

## Testing

- `geo.test.ts`: AP country → nz-ap; non-AP (US, DE, BR) → us-global;
  null/empty/unknown → nz-ap.
- Banner behaviour covered by component logic kept trivially thin; verified
  end-to-end in dev (banner shows on fresh profile, Continue/× persists,
  sidebar switch dismisses).

## Out of scope

- More regions/languages, geo re-prompt when travelling, middleware-based
  SSR banner, analytics on banner interaction.
