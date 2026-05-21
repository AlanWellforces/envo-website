# Wire 3 product series to Payload — design spec

**Date:** 2026-05-21
**Branch:** `feature/wire-3-series-2026-05-21`
**Status:** approved (brainstorming complete, awaiting writing-plans)

## Goal

Make 3 more product series renderable as live `/products/[family]/[series]` detail pages, with hero + variant grid pulling Akeneo S3 product imagery via the existing `resolveProductImage` resolver. Today only `envo_ecoglo` is live; 23 placeholder series exist with `href: '#'`.

This is a **stub-only** scope. No marketing copy is fabricated. Editorial enrichment (features, specifications, applications, FAQ) is deferred to Wei.

## Scope

### In scope

Upgrade 3 existing `href: '#'` placeholder entries in `src/data/product-families.ts` to live `LiveSeries` objects:

| Family slug | Label (existing) | seriesCode | DB products | clean coverage |
|---|---|---|---|---|
| `led-drivers` | Linear Series | `envo_sl_us` | 8 | 8 / 8 |
| `led-drivers` | Screw Terminal | `envo_se_us` | 10 | 10 / 10 |
| `control-gear` | Zigbee & Smart | `envo_zigbee` | 17 | 17 / 17 |

### Out of scope

- `sc_envo` (77 SKUs) — needs structural decisions Wei + Alan should make first
- The 19 other placeholder series — defer until clean-image coverage improves or Wei prioritises
- Migrating series data from Git → Payload Series collection — separate project
- Any UI changes to `[series]/page.tsx`, family pages, or `lib/products.ts`
- Editorial enrichment (features, heroBadges, specifications, applications, pairWith, resources, FAQ)
- Hardening 77-SKU pagination / grouping UX (depends on sc_envo's future)

## Architecture decision: Git, not Payload (yet)

`src/data/product-families.ts` is the existing single source of truth for series structure, acknowledged in its header as a stopgap awaiting eventual Payload migration. Reasons to keep this batch in Git:

1. The 1 live series (`envo_ecoglo`) is in Git. Adding 3 siblings is the smallest change.
2. Payload migration is a real project (Series collection schema + fetcher + admin UI + Wei training), not stub work.
3. When migration happens, moving 4 series costs ~the same as moving 1. We don't lose anything by waiting.
4. The stub field set (`slug`, `seriesCode`, `subtitle`, `description`, `variants[]`) maps 1:1 to a future Payload Series schema.

## Implementation

### Per series, fields written

The existing placeholder objects already supply: `label`, `productName`, `shortDesc`, `image`. Keep those.

Add these fields to upgrade `href: '#'` → live:

| Field | Source | Example |
|---|---|---|
| `href` | derived | `/products/led-drivers/linear-series` |
| `slug` | derived (kebab from label) | `linear-series`, `screw-terminal`, `zigbee-smart` |
| `seriesCode` | hand-mapped (see table above) | `envo_sl_us` |
| `subtitle` | `${family.tag} · ${productName}` | `LED Driver · Linear Driver` |
| `description` | reuse `shortDesc` verbatim | (the string Wei already wrote in the placeholder) |
| `variants[]` | DB query at build time → see below | one entry per SKU |

No other `LiveSeries` field is populated. The series detail page conditional-renders every other section, so unset = section omitted.

### `variants[]` derivation

For each of the 3 series, query Payload at build time (or hand-paste into the Git file — see **Variant data — generated or hand-pasted?** below):

```ts
const products = await listProducts({ family: <familyCode>, series: <seriesCode>, limit: 200 })
// Produces, alphabetical by name:
variants: products.docs.map((p) => ({
  name: p.name,
  defaultSku: p.sku,
  specs: [],
}))
```

No `image`, no `badge`, no per-variant description. The Available Variants section renders cards using `resolveProductImage(product, ...)` which selects the Akeneo URL.

#### Variant data — generated or hand-pasted?

Decision: **hand-paste into the Git file**. Reasons:

- `product-families.ts` is the canonical source today — it has to be human-readable
- Build-time query introduces an async dependency between Payload (running locally) and `next build`, which is more failure mode than the data warrants (35 lines total across 3 series)
- When SKUs change in Akeneo, the file diff in PR makes the change visible. Auto-generation would hide it.
- The hand-paste is a one-time tax; ongoing maintenance is rare for stub-mode series

Generation script (one-off, lives in this PR for reproducibility but not committed long-term):

```bash
node -e "
for (const code of ['envo_sl_us','envo_se_us','envo_zigbee']) {
  const r = await fetch(\`http://localhost:3000/api/products?where%5Bseries%5D%5Bequals%5D=\${code}&limit=200&depth=0\`).then(r=>r.json())
  console.log(\`// === \${code} ===\`)
  for (const p of r.docs) console.log(\`{ name: '\${p.name.replace(/'/g,\"\\\\'\")}', defaultSku: '\${p.sku}', specs: [] },\`)
}
"
```

Output gets sorted by name, pasted into the 3 entries.

### Hero SKU selection

No variant gets `badge: 'Most popular'`. `[series]/page.tsx:66-69` falls through to the first variant in the list. Since the list is sorted alphabetical by `product.name`, this gives a deterministic hero per series.

If Wei wants a specific SKU as hero later, she adds `badge: 'Most popular'` to one variant entry. No code change.

### Sections that render

For each new series page:

| Section | Renders? | Why |
|---|---|---|
| Breadcrumb | ✅ | always |
| Hero (image + h1 + description + CTAs) | ✅ | hero image from `resolveProductImage(firstVariant.product, ...)` → Akeneo S3 |
| Key Features | ❌ | no `features` field |
| Specifications | ❌ | no `specifications` field |
| Available Variants | ✅ | one card per SKU, image from Akeneo via resolver |
| Applications | ❌ | no per-series `applications`; verified neither `led-drivers` nor `control-gear` family declares one either |
| Pair With | ❌ | no `pairWith` field |
| Resources | ❌ | no `resources` field |
| FAQ | ❌ | series-level FAQ not modelled today; family page handles its own |
| Where to Buy | ✅ | always (driven by `PURCHASE_CHANNELS`) |
| Final CTA banner | ✅ | always |

### Side effects on family pages

`/products/led-drivers` and `/products/control-gear` already render a "Compare all series" table. The 3 upgraded rows transition from "Coming soon" tag → clickable `Explore →` link. No code change in `[slug]/page.tsx`.

### Side effects on static generation

`generateStaticParams` in `[series]/page.tsx` iterates `PRODUCT_FAMILIES` and emits a static param for every `isLive(s)` entry. Adding `href` ≠ `#` to 3 entries adds them to the static build automatically.

## Verification criteria

Run `npm run dev`, then visit:

- `http://localhost:3000/products/led-drivers/linear-series` — renders hero + 8 variant cards
- `http://localhost:3000/products/led-drivers/screw-terminal` — renders hero + 10 variant cards
- `http://localhost:3000/products/control-gear/zigbee-smart` — renders hero + 17 variant cards

For each, `curl` the HTML and verify:

```bash
curl -sS http://localhost:3000/products/<family>/<series> | grep -oE 'wellforces-akeneo-pim[^"]+' | wc -l
# Expect: 1 (hero) + N (variant cards) URLs minimum
```

All `<img src>` for products must be `https://wellforces-akeneo-pim.s3.ap-southeast-2.amazonaws.com/...`. Zero `/assets/images/cat-*.png` rewrites in the variant grid.

Also verify family pages:

- `/products/led-drivers` — "Linear Series" and "Screw Terminal" rows in the compare table are clickable, "Triac Dimmable" remains "Coming soon"
- `/products/control-gear` — "Zigbee & Smart" row is clickable, others remain disabled

## Risks

1. **URL slugs** — `linear-series` / `screw-terminal` / `zigbee-smart` are my picks, not Wei's. Easy to rename (one string each, pre-launch).
2. **envo_zigbee productName mismatch** — the placeholder calls the series "Zigbee Gateway" but the series actually contains DALI controllers + gateway + remote (3 product types). Hero copy will be inaccurate. Tracked in follow-ups below; **does not block stub**.
3. **TypeScript strictness** — `SeriesLink` is a discriminated union on `href`. Upgrading `href: '#'` → `href: '/...'` adds required fields (`slug`, `seriesCode`, `subtitle`, `description`); TS will catch missing fields at compile time.

## Known follow-ups (post-stub)

These are NOT in scope but are documented so they don't get lost:

### Easy (Wei in Payload — eventually — or directly in `product-families.ts` for now)

Per series, additive — each appears as a new section without code changes:

- `heroEyebrow` (short tagline above H1)
- Better `description` (hero paragraph, replacing the reused `shortDesc`)
- `heroBadges[]` (4-5 inline metric chips)
- `features[]` (5-6 feature cards)
- `specifications[]` (reference variant spec table)
- `applications[]` (per-series application cards)
- `resources[]` (datasheet PDFs etc.)

### Medium

- Restructuring `variants[]` from "one card per SKU" to "grouped by attribute" (e.g., wattage axis for drivers). Requires editorial axis decision (Wei + Alan) + potentially per-variant `skus[]` field.
- URL slug renames post-launch (need 301 redirects).

### Larger (separate projects)

- **envo_zigbee structural split**: decide whether to split the series in Akeneo into 3 cleaner series (controller / gateway / remote), or keep one umbrella with visual subgroups in the UI.
- **`sc_envo` (77 SKUs) treatment**: needs grouping axis decision before it can render usefully.
- **Migrate series data Git → Payload**: build Series collection, write fetcher, train Wei. Stub field shape is migration-friendly.

## What's reversible / easy to change

| Future change | Effort |
|---|---|
| Add `heroEyebrow` / `features` / `specifications` / `applications` / `resources` / better `description` | ✅ Edit one Git object literal, ~5 min per section |
| Rename URL slug pre-launch | ✅ One string change, ~1 min |
| Rename URL slug post-launch | 🟡 Need redirect rule |
| Re-group variants from per-SKU → axis-grouped | 🟡 Restructure `variants[]` array, possibly minor card changes |
| Split envo_zigbee into 3 series (in Akeneo) | 🟡 Alan PIM work + sync + 2 new series entries; no code change |
| envo_zigbee one-series with visual subgroups | 🔴 Requires UI work in `[series]/page.tsx` |
| Delete a series back to placeholder | ✅ Change `href` back to `#`, ~30 sec |
| Migrate Git → Payload | 🔴 Separate project (~few days) |

## Estimated effort

~ 0.5 day end-to-end:

- ~1 hour: query DB, generate variant entries, hand-paste into 3 series objects, wire fields
- ~1 hour: verification (manual visit + curl check + family-page sanity)
- ~1 hour: PR write-up, screenshot, request review from Alan + Wei
- ~0.5 hour: address review comments

## Open questions for user (none — all resolved in brainstorming session 2026-05-21)

- Editorial depth → Minimal stub (resolved)
- sc_envo inclusion → out of scope this batch (resolved)
- Git vs Payload → Git for now (resolved)
- Variant strategy → one card per SKU (resolved)
