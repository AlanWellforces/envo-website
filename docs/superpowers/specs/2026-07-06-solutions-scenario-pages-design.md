# Solutions scenario pages — design

**Date:** 2026-07-06
**Routes:** `/solutions`, `/solutions/[slug]`
**Goal:** turn the two big cards into application-scenario entry points, deepen each
detail page with buyer-useful structure, link kits to real series pages, remove
internal lead-gen phrasing, and stop Architectural looking like a signage re-skin.

## Constraints

- Three-source rule: all editorial copy lives in Payload (`solutions` collection).
  Structural labels ("Best for", "Design considerations") stay in the component,
  same as the existing "The recommended kit" tag.
- No prices, no response-time promises, envo-only branding, no distributor phones.
- Series links must use the live route grain `/products/<family>/<series>` with
  slugs derived from DB series codes (verified against dev DB 2026-07-06).
  Never copy slugs from `PRODUCT_FAMILIES` (stale).

## 1. /solutions list page

Each solution card gains a **use-case chip row** under the description
(new `useCases` array field, text-only). Seed values:

- Signage Lighting: Channel letters · Light boxes · Edge-lit signage · Pylon signs
- Architectural Lighting: Facade accent · Control systems

Chips are non-interactive labels (the whole card already has one CTA); they make
the card read as a scenario index rather than a brochure row. Checklist ticks stay.

## 2. Detail page structure (both solutions)

Section order — existing sections marked (=):

1. (=) Hero: eyebrow, title, desc, checklist, gallery
2. **Best for** — `bestFor[]` `{scenario, note}` — card grid of concrete applications
3. **Design considerations** — `considerations[]` `{title, text}` — numbered list
4. **Recommended ENVO series** — `series[]` `{name, blurb, href, imagePath/image}` —
   cards using `/assets/images/series/*.jpg`, linking to real series pages
5. (=) **Typical kit** — existing kit section; tag renamed "The typical kit";
   kit item hrefs fixed to series pages
6. **When to choose alternatives** — `alternatives[]` `{when, choose, href?}` —
   honest routing rows ("If X → use Y instead")
7. **Free layout design CTA** — component-level band → `/free-layout-design`
8. (=) Distributor CTA — reworded (below)

## 3. Copy fix (SolutionDetail.tsx, hardcoded)

Replace "ENVO is a lead-gen brand — pricing and stock sit with our distributors…"
with: "ENVO products are supplied through authorised regional distributors, who
hold pricing and stock and ship the ENVO parts and the compatible parts together
in one order."

## 4. Series links (verified against dev DB)

| Item | href |
|---|---|
| MiniLux | /products/led-signage-modules/envo-minilux |
| EcoGlo | /products/led-signage-modules/envo-ecoglo |
| UltraFlare | /products/led-signage-modules/envo-ultraflare |
| ChromaFlux | /products/led-signage-modules/envo-chromaflux |
| EdgeLume | /products/led-signage-modules/envo-edgelume |
| EV-SL Linear Driver | /products/led-drivers/envo-sl-us |
| Zigbee control | /products/control-gear/envo-zigbee |
| DALI control | /products/control-gear/envo-dali |

## 5. Imagery

Architectural currently heroes `app-mini-hospitality-facade.jpg` (an illuminated
hotel *sign*) and reuses signage gallery shots — the root of "looks like signage
re-use". Fix:

- Keep `ind-architectural.jpg` (real linear/cove scene) in the gallery.
- Generate 3 photoreal dusk scenes with gpt-image-1 matching the existing photo
  style: facade grazing (hero), linear soffit/cove run, landscape/step accent.
  Saved as `public/assets/images/app-arch-*.jpg`.
- Signage page keeps its authentic signage imagery; drop `outline-trim` from the
  architectural gallery.

## 6. Data flow / mechanics

- `Solutions.ts` collection: add `useCases`, `bestFor`, `considerations`,
  `series`, `alternatives` (arrays, image-override-or-path convention for series).
- Regenerate `payload-types.ts` (required whenever Payload fields change).
- Extend `src/data/solutions.ts` types + seed content; extend mapper in
  `src/lib/solutions.ts`; update `scripts/seed-solutions.mts`.
- Schema push (additive tables) + re-seed via
  `yes | PAYLOAD_DB_PUSH=true npx tsx --tsconfig tsconfig.json scripts/seed-solutions.mts`.
  DB verified identical to seed (no human edits to clobber).
- New CSS in `solutions-dark.css` following existing dark-band patterns.

## Alternatives considered

- **Hardcode the new sections in the component** — rejected: violates the
  three-source rule; Wei must be able to edit copy.
- **Per-use-case landing pages** (6 routes) — rejected for now: content depth
  isn't there; chips + Best-for sections deliver the scenario-entry feel without
  6 thin pages. Revisit if SEO demands it.
- **Link chips to detail-page anchors** — rejected: two competing affordances on
  one card; the card CTA already navigates.
