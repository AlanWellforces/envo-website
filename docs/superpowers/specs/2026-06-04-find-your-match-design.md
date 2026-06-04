# Find Your Match — Design Spec

**Date:** 2026-06-04
**Branch:** `feature/find-your-match-2026-06-04` (off `dev`)
**Author:** marketing + Claude

## Goal

A guided "spec your setup in ~60 seconds" tool that turns 5 multiple-choice answers into a
recommended **module + driver (or driver spec) + control** bundle, with a short
engineering-toned rationale and links to the relevant product pages. Replaces the
`/find-your-match` "Coming soon" placeholder.

**Positioning / tone (important):** ENVO is a **supplier site**, not an aggressive sales
funnel. The tool is a low-pressure **selection aid** — it reads like an engineer's advice,
not a "buy now / give us your details" funnel. CTAs are understated (view the modules /
confirm with a free layout / where to buy). Wellforces (the Shopify distributor) can reuse
the same engine later with a more conversion-oriented UI.

## Approach (confirmed)

Hybrid (option C): a **deterministic, catalogue-agnostic rules engine** does the matching
(reliable, instant, testable, zero API cost); an **LLM generates only the natural-language
rationale** (optional — falls back to a template when no API key is configured).

## Architecture

```
src/lib/find-your-match/
  types.ts          FymAnswers, FymRecommendation, DriverSpec
  match.ts          pure engine: (answers, catalog: Product[]) → FymRecommendation
  match.test.ts     unit tests with a mocked catalog
  copy.ts           question definitions + option labels (drives the wizard UI)
  explain.ts        buildRationale(rec): template string (AI-free fallback)
src/app/api/find-your-match/route.ts   POST: run engine on the live ENVO catalog,
                                       optionally call Anthropic for the rationale
src/app/(frontend)/find-your-match/
  page.tsx          server page (intro + mounts the wizard)
  Wizard.tsx        'use client' stepper (5 questions) → POSTs → renders result
  page.module.css
```

**Catalogue-agnostic engine** is the key design point: `match(answers, catalog)` takes the
product list as a parameter — it does NOT import a hardcoded ENVO catalogue. On this site
the API route feeds it the ENVO catalogue (`listProducts({ limit: 1000 })`, brand=envo). On
Wellforces, the same engine can be fed the broader distributor catalogue (ENVO + third-party
PSUs) so it can name specific third-party drivers there — no logic change.

**AI boundary:** the Anthropic call lives only in the API route (server-side; key never
reaches the browser). Install `@anthropic-ai/sdk`; read `process.env.ANTHROPIC_API_KEY`. If
the key is absent, the route returns the template rationale from `explain.ts` and the tool
still fully works. Model: a small fast model (e.g. Haiku) — the rationale is one short
paragraph.

## Wizard inputs (`FymAnswers`)

5 single-select questions (all click, no typing) + one optional free-text note:

1. **application**: `channel_letters` | `light_box` | `facade` | `other`
2. **environment**: `indoor` | `outdoor`
3. **colour**: `white_warm` | `white_neutral` | `white_cool` | `single` | `rgb`
4. **size**: `small` | `medium` | `large` (representative module counts: 20 / 60 / 150)
5. **control**: `onoff` | `dimmable` | `smart`
6. **notes** (optional string) — passed to the AI rationale only; does not affect matching.

## Matching rules (`match.ts`, pure)

**Module** — filter the catalogue to signage modules, then rank by fit:
- `environment: outdoor` → require IP65+ (`waterproof` in ip65/ip67/ip68).
- `colour: rgb` → prefer RGB modules (e.g. ChromaFlux / `led_chip_colour` rgb/rgbw);
  `white_*` → prefer the matching CCT (`cct_k` band: warm ≤3500, neutral 3500–5000, cool ≥5000);
  `single` → single-colour modules.
- `application` → bias series/beam: channel_letters → standard backlit (MiniLux/EcoGlo);
  light_box → wide-beam backlit; facade → higher-output (UltraFlare/ProGlo); other → general.
- Pick the best-scoring in-stock/enabled module; fall back to the closest if no exact match
  (never return nothing — degrade to the nearest signage module + note the compromise).

**Driver** — size from the load:
- `estimatedLoadW = representativeModuleCount(size) × module.power_w × 1.2` (safety margin).
- Voltage from the chosen module (default 12V if unknown); IP from `environment`.
- Search the catalogue for a driver (`psu_led_cv`/`psu_led_cc`) with `power_w ≥ estimatedLoadW`,
  matching voltage and IP, smallest sufficient wattage.
- **Fallback (the third-party gap):** if no ENVO driver fits, return a `DriverSpec`
  (`{ powerW, voltageV, ip, mode }`) instead of a product, with copy "available via your
  regional distributor" — NOT a fabricated SKU. (On Wellforces the same search hits the
  broader catalogue and returns a real product.)

**Control** — only if `control !== 'onoff'`:
- `dimmable` → a dimmable driver / triac or 0-10V control gear.
- `smart` → a Zigbee/Casambi controller (`psu_led_controller`).
- If none fits → spec + distributor note, same pattern as driver.

`FymRecommendation = { module, driver: {product|spec}, control?, estimatedLoadW, explanation }`.
Each item carries a one-line `reason`.

## Result presentation (supplier tone)

- A "Your match" summary: the module + driver(or spec) + control, each as a compact card with
  the reason and a link to its product page (or, for a spec, the requirement + "where to buy").
- One short **rationale paragraph** (AI or template) — factual/engineering voice.
- Understated CTAs: *View the modules* · *Confirm with a free layout* (`/free-layout-design`)
  · *Where to buy* (region channels, [[purchase-channels]]). No hard lead-capture.
- A "start over" / adjust-answers affordance.

## Reuse seam (Wellforces / Shopify)

The engine + `/api/find-your-match` are the reusable core. Wellforces (Shopify) integrates
later by either embedding a small widget (iframe / script) or calling the API from a theme
section, feeding its own catalogue. No cross-site infrastructure is built now (YAGNI) — the
only requirement honoured today is keeping the engine catalogue-agnostic and the API clean.

## Non-goals

- No accounts, cart or checkout (that is Wellforces' job).
- No third-party PSU data stored on the ENVO site (three-source rule; distributor routing
  covers the gap here).
- AI does not do open-ended chat — it only writes the fixed-shape rationale, and is optional.
- No persistence of submissions in this phase (a real lead-capture/Resend hook is a follow-up,
  consistent with the contact/free-layout demo forms).

## Verification

1. `match.test.ts` — unit-test the pure engine against a small mocked catalogue: outdoor →
   IP-rated module; rgb → RGB module; driver sized above load; no-fit driver → returns a
   `DriverSpec` not a product; smart → controller selected; degraded fallback never returns null.
2. `npx tsc --noEmit` clean; `npm run lint` no new errors; full `vitest` green.
3. Dev server: complete the wizard for 2–3 scenarios (small indoor white channel letters; large
   outdoor RGB facade) → result renders, links resolve, rationale present. Headless screenshot
   at 1440×900.
4. Works with NO `ANTHROPIC_API_KEY` set (template rationale path) — verified before any key
   wiring.
