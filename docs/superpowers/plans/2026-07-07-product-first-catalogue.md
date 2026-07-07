# Product-First Catalogue Restructure — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the range/series-first catalogue into a product-first one — SKU-level cards + true SKU detail pages for Drivers / Control Gear / Accessories, while Signage keeps series-level cards and its merged series pages.

**Architecture:** Extend the existing `catalogue-data.ts` card builders and the `CatalogueFilter` `productGrid` layout (both already partly built in WIP) so all four families render the product-grid. Add a single-segment SKU detail route by extending the existing `/products/[slug]/[series]` route to resolve series-first, then SKU. A new `SpecCompareTable` component renders a product-aware comparison sized by same-series count.

**Tech Stack:** Next.js 16 App Router (RSC), TypeScript, Tailwind v4 (CSS-first) + `products-catalogue.css`, Payload local API via `src/lib/products.ts`, Vitest for unit tests.

## Global Constraints

- **Copy:** no prices (never surface `price_nzd`); no online-chat wording; no numeric response-time promises; supply via "authorised channels" / "where to buy" (no on-site checkout wording); ENVO-only branding, contact `contact@envo-led.com`.
- **Tailwind v4 only** — CSS-first `@theme`; no v3 `tailwind.config.js` theme extensions. Repo-wide `*{margin:0}` reset means Tailwind `px-*`/`mx-*` spacing utilities are dead — use `products-catalogue.css` classes.
- **Three-source rule:** product data from Payload/Akeneo (never hardcode SKUs/specs as strings), editorial from CMS, logic in Git.
- **Images:** prefer clean (background-removed) product image via `resolveProductImage`; it already falls back clean → regular → series line-art.
- **Locked decisions (do not break):** keep merged series pages; MiniLux hand-curated page intact; no true single-SKU pages for Signage; existing `/products/[category]/[series]` URLs must keep resolving (series wins over SKU); CCT stays a signage series-page selector.
- **Branch/commit:** work on `feature/product-first-catalogue-2026-07-07` (worktree off `dev`); rebase on `origin/dev` before pushing; PR targets `dev`, not `main`; commit message trailer `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- **Verify command:** `npx vitest run <file>` for unit tests; `npm run build` needs the transaction pooler (`DATABASE_URL` on port 6543) because `generateStaticParams` hits the DB.

---

## File Structure

**Phase 1 (category grids) — modify existing:**
- `src/components/products/catalogue-data.ts` — add `buildDriverProductCards`, `buildAccessoryProductCards`, refactor `buildControlGearProductCards` onto a shared `skuCard()` helper; export a `buildProductCardsFor(slug, family, products)` dispatcher.
- `src/app/(frontend)/products/[slug]/page.tsx` — dispatch layout/cards per family.
- `src/components/products/CatalogueFilter.tsx` — already supports `productGrid`/`resultKind` (from WIP); no logic change expected beyond what WIP carries.
- `src/components/products/products-catalogue.css` — product-grid card styles (from WIP) + signage-series-card tweaks.
- `src/components/products/catalogue-data.test.ts` — add builder tests.

**Phase 2 (SKU detail + route) — create:**
- `src/lib/sku-detail.ts` — `buildSkuDetailProps` + `pickCompareLayout`.
- `src/components/products/sku/SkuDetailPage.tsx` — SKU detail template.
- `src/components/products/sku/SpecCompareTable.tsx` — product-aware comparison table.
- `src/components/products/sku/sku-detail.css` — SKU page + table styles.
- `src/lib/sku-detail.test.ts` — `pickCompareLayout` + `buildSkuDetailProps` tests.

**Phase 2 — modify:**
- `src/app/(frontend)/products/[slug]/[series]/page.tsx` — series-first-then-SKU resolution + `generateStaticParams` SKU entries.
- `src/components/products/catalogue-data.ts` — repoint SKU card `href`/`ctaLabel` to the SKU detail page.

**Phase 3 (polish) — modify:**
- SKU page enquiry/distributor CTA, related products, sparse-editorial fallback, responsive refinements.

---

## PHASE 0 — Branch hygiene & baseline

### Task 0: Isolate a clean branch and carry over only the catalogue WIP

**Files:**
- Worktree: `../envo-wt-catalogue` on branch `feature/product-first-catalogue-2026-07-07`
- Carry over (working-tree changes only): `src/app/(frontend)/products/[slug]/page.tsx`, `src/components/products/CatalogueFilter.tsx`, `src/components/products/catalogue-data.ts`, `src/components/products/products-catalogue.css`

**Interfaces:**
- Produces: a clean worktree branched from `origin/dev` containing exactly the four catalogue files' WIP + the spec doc, with the original branch's dirty tree untouched.

- [ ] **Step 1: Capture the catalogue WIP as a patch (run from the current dirty checkout)**

```bash
cd /Users/marketing/Desktop/envo-website-v2
git fetch origin
git diff HEAD -- \
  'src/app/(frontend)/products/[slug]/page.tsx' \
  src/components/products/CatalogueFilter.tsx \
  src/components/products/catalogue-data.ts \
  src/components/products/products-catalogue.css \
  > /private/tmp/claude-501/-Users-marketing-Desktop-envo-website-v2/06bde2e8-e829-4a3d-98fc-1135bbc8674a/scratchpad/catalogue-wip.patch
wc -l < /private/tmp/claude-501/-Users-marketing-Desktop-envo-website-v2/06bde2e8-e829-4a3d-98fc-1135bbc8674a/scratchpad/catalogue-wip.patch
```
Expected: a non-empty patch (hundreds of lines). The original working tree is unchanged (read-only diff).

- [ ] **Step 2: Audit `FindDistributorCta.tsx` before carrying it (decision gate)**

```bash
git diff HEAD -- src/components/products/merged/FindDistributorCta.tsx
```
Decision: if the diff depends on the region→regionLabel refactor or Supply-Channel rename (e.g. references `regionLabel`, renamed props from `RegionShippingChip`/`purchase-channels`), **do NOT carry it** — leave it to the region stream / Phase 3. If it is self-contained catalogue copy, add it to the patch in Step 1. Record the decision in the task commit message.

- [ ] **Step 3: Create the worktree off `origin/dev` (original dirty tree stays put)**

Use the `superpowers:using-git-worktrees` skill. Equivalent native command:
```bash
git worktree add ../envo-wt-catalogue -b feature/product-first-catalogue-2026-07-07 origin/dev
```
Expected: `Preparing worktree ... HEAD is now at <dev sha>`.

⚠️ Do **not** symlink `node_modules` into the worktree — worktree removal would wipe the real one. Install deps in the worktree if needed (`npm ci`) or run type/build checks from the main checkout after copying files back.

- [ ] **Step 4: Apply the catalogue WIP + spec doc onto the clean branch**

```bash
cd ../envo-wt-catalogue
git apply /private/tmp/claude-501/-Users-marketing-Desktop-envo-website-v2/06bde2e8-e829-4a3d-98fc-1135bbc8674a/scratchpad/catalogue-wip.patch
git checkout feature/sidebar-structure-optimize-2026-07-07 -- docs/superpowers/specs/2026-07-07-product-first-catalogue-design.md docs/superpowers/plans/2026-07-07-product-first-catalogue.md
git status --short
```
Expected: the four catalogue files modified + two docs added; nothing else.

- [ ] **Step 5: Baseline the tests (must pass before new work)**

```bash
npx vitest run src/components/products/catalogue-data.test.ts
```
Expected: PASS (the WIP kept `buildCards`/`buildGroups` behaviour). If any fail, fix the carry-over before proceeding.

- [ ] **Step 6: Commit the baseline**

```bash
git add -A
git commit -m "chore(catalogue): baseline product-first WIP on clean branch

Carried only the four catalogue files from feature/sidebar-structure-optimize;
region/regionLabel and Supply-Channel rename intentionally excluded. FindDistributorCta: <carried|excluded — reason>.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## PHASE 1 — Product-first category grids for all families

### Task 1: Extract a shared `skuCard()` helper and refactor Control Gear onto it

**Files:**
- Modify: `src/components/products/catalogue-data.ts`
- Test: `src/components/products/catalogue-data.test.ts`

**Interfaces:**
- Produces:
  - `skuCard(family: ProductFamily, p: Product, parts: { desc: string; facts: string[]; facets: Record<string, string[]>; section: string; maxPowerForChips?: number | null }): CatalogueCard`
  - `buildControlGearProductCards` unchanged in signature/output — now implemented via `skuCard`.
- Consumes: existing `resolveProductImage`, `seriesLineArt`, `seriesSlug`, `buildChips`, `datasheetHref`.

- [ ] **Step 1: Write the failing test for `skuCard` output shape (via Control Gear, which must keep working)**

Add to `catalogue-data.test.ts`:
```ts
import { buildControlGearProductCards } from './catalogue-data'

describe('control-gear SKU cards (post-refactor parity)', () => {
  const products = [
    p({ sku: 'CA-1', name: 'ENVO Casambi Low Voltage Controller, 12-48V 5 Channel',
        family: 'psu_led_controller', series: 'envo_casambi', dimming_control: ['casambi'],
        controller_type: ['rgbw'], output_channel: '5_channel', spec_sheet_url: 'x.pdf' }),
  ]
  const [card] = buildControlGearProductCards(CONTROL, products)

  it('is one card per SKU carrying the SKU and per-unit facts', () => {
    expect(card.sku).toBe('CA-1')
    expect(card.modelCount).toBe(1)
    expect(card.facts?.length).toBeGreaterThan(0)
    expect(card.facets.protocol).toEqual(['casambi'])
    expect(card.facets.channels).toEqual(['5'])
  })
  it('never surfaces a price', () => {
    expect(JSON.stringify(card)).not.toMatch(/nzd|price/i)
  })
})
```

- [ ] **Step 2: Run the test to confirm current WIP passes (refactor is behaviour-preserving)**

Run: `npx vitest run src/components/products/catalogue-data.test.ts -t "control-gear SKU cards"`
Expected: PASS against the carried WIP (this locks parity before refactor).

- [ ] **Step 3: Refactor — introduce `skuCard()` and route Control Gear through it**

In `catalogue-data.ts`, add the shared helper and rewrite `buildControlGearProductCards`'s per-product `.map` body to call it. `skuCard` builds the common shell; family-specific `desc`/`facts`/`facets`/`section` are passed in:
```ts
/** Common per-SKU catalogue-card shell. Family builders supply the derived
 *  desc/facts/facets/section; image, chips, CTA and identity are shared. */
function skuCard(
  family: ProductFamily,
  p: Product,
  parts: { desc: string; facts: string[]; facets: Record<string, string[]>; section: string; maxPowerForChips?: number | null },
): CatalogueCard {
  const familyLabel = family.tag.split('·')[0].trim()
  const img = resolveProductImage(p, seriesLineArt(p.series, family.slug))
  const seriesHref = `/products/${family.slug}/${seriesSlug(p.series)}`
  const sheetHref = p.spec_sheet_url ? datasheetHref(p.sku) : null
  return {
    key: `${family.slug}:${p.sku}`,
    // Phase 1 interim: link to the series page (SKU detail route lands in Phase 2,
    // which repoints this href + ctaLabel). Datasheet stays a detail-page CTA.
    href: seriesHref,
    familyLabel,
    name: p.name,
    desc: parts.desc,
    imgSrc: img.src,
    imgLocal: img.isLocal,
    imgAlt: img.alt,
    chips: buildChips(parts.facets, parts.maxPowerForChips ?? null),
    sku: p.sku,
    facts: parts.facts,
    ctaLabel: 'View series',
    modelCount: 1,
    section: parts.section,
    certified: (p.standards_met ?? []).length > 0,
    facets: parts.facets,
  }
}
```
Then `buildControlGearProductCards` becomes:
```ts
export function buildControlGearProductCards(family: ProductFamily, products: Product[]): CatalogueCard[] {
  return products
    .map((p) => {
      const protocol = protocolValues(p)
      const fn = functionValue(p)
      const controlTypes = controlTypeValues(p)
      const channel = channelsValue(p)
      const facets = { protocol, function: uniq([fn]), controltype: controlTypes, channels: uniq([channel]) }
      return skuCard(family, p, {
        desc: controlGearDesc(protocol, fn, controlTypes),
        facts: controlGearFacts(p, fn, controlTypes, channel),
        facets,
        section: seriesSectionTitle(family.slug, [p]),
      })
    })
    .sort((a, b) => (sectionOrder(a.section) - sectionOrder(b.section)) || a.name.localeCompare(b.name))
}
```
Note: the old WIP set `ctaLabel: sheetHref ? 'Datasheet' : 'View series'`. This refactor standardises Phase-1 CTA to "View series" for all SKU families; datasheet moves to the detail page (per spec). The parity test above does not assert `ctaLabel`, so it stays green.

- [ ] **Step 4: Run the full catalogue test file**

Run: `npx vitest run src/components/products/catalogue-data.test.ts`
Expected: PASS (parity + all pre-existing tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/products/catalogue-data.ts src/components/products/catalogue-data.test.ts
git commit -m "refactor(catalogue): extract skuCard() shared helper; route control gear through it

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: `buildDriverProductCards` — SKU cards for LED Drivers

**Files:**
- Modify: `src/components/products/catalogue-data.ts`
- Test: `src/components/products/catalogue-data.test.ts`

**Interfaces:**
- Produces: `buildDriverProductCards(family: ProductFamily, products: Product[]): CatalogueCard[]`
- Consumes: existing `outvBand`, `powerBand`, `dimmingValues`, `opmodeValues`, `environmentValues`, `formfactorValues`, `catalogueSeriesMeta`, `seriesSectionTitle`, `sectionOrderIndex` (from `family-map`), `skuCard`.

- [ ] **Step 1: Write the failing tests**

Add to `catalogue-data.test.ts`:
```ts
import { buildDriverProductCards } from './catalogue-data'

describe('driver SKU cards', () => {
  it('emits one card per SKU with driver facets and human-readable facts', () => {
    const products = [
      p({ sku: 'EV-SNG-350-24', name: 'Envo EV-SNG-350-24 LED Driver 350W 24V Waterproof IP67',
          series: 'envo_sng', operation_mode: 'cv', power_w: 350, output_voltage_v: 24, waterproof: 'ip67' }),
    ]
    const [card] = buildDriverProductCards(DRIVERS, products)
    expect(card.sku).toBe('EV-SNG-350-24')
    expect(card.modelCount).toBe(1)
    expect(card.facets.outv).toEqual(['24'])
    expect(card.facets.power).toEqual(['p151'])
    expect(card.facets.opmode).toEqual(['cv'])
    expect(card.facets.environment).toEqual(expect.arrayContaining(['outdoor', 'ip67']))
    expect(card.facts).toEqual(expect.arrayContaining(['350 W', '24 V', 'Constant voltage', 'IP67']))
  })

  it('derives triac dimming from the name when dimming_control is empty', () => {
    const products = [
      p({ sku: 'EV-SP-30-12US-TDM', name: 'ENVO EV-SP-30-12US-TDM Triac Dimmable LED Driver 30W 12V',
          series: 'envo_sp_us', operation_mode: 'cv', power_w: 30, output_voltage_v: 12, waterproof: 'ip20' }),
    ]
    const [card] = buildDriverProductCards(DRIVERS, products)
    expect(card.facets.dimming).toContain('triac')
    expect(card.chips[0]).toBe('Triac dimmable')
  })

  it('sorts CV before CC then by name', () => {
    const products = [
      p({ sku: 'B-CC', name: 'B CC', series: 'sr_triac', family: 'psu_led_cc', operation_mode: 'cc' }),
      p({ sku: 'A-CV', name: 'A CV', series: 'envo_se_us', family: 'psu_led_cv', operation_mode: 'cv' }),
    ]
    const cards = buildDriverProductCards(DRIVERS, products)
    expect(cards.map((c) => c.sku)).toEqual(['A-CV', 'B-CC'])
  })

  it('never surfaces a price', () => {
    const products = [p({ sku: 'X', series: 'envo_sng', power_w: 100, output_voltage_v: 24, price_nzd: 99 })]
    expect(JSON.stringify(buildDriverProductCards(DRIVERS, products))).not.toMatch(/nzd|"price"/i)
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/components/products/catalogue-data.test.ts -t "driver SKU cards"`
Expected: FAIL — `buildDriverProductCards is not a function`.

- [ ] **Step 3: Implement `buildDriverProductCards` + its fact/desc helpers**

Add to `catalogue-data.ts`:
```ts
/** Card facts for a driver SKU: power → output voltage → dimming → CV/CC → IP. */
function driverFacts(p: Product, facets: Record<string, string[]>): string[] {
  const facts: (string | undefined)[] = [
    p.power_w != null ? `${p.power_w} W` : undefined,
    p.output_voltage_v != null ? `${p.output_voltage_v} V` : undefined,
    facets.dimming?.includes('triac') ? 'Triac dimmable'
      : facets.dimming?.includes('dali') ? 'DALI'
      : facets.dimming?.includes('none') ? 'Non-dimmable' : undefined,
    facets.opmode?.includes('cv') ? 'Constant voltage' : facets.opmode?.includes('cc') ? 'Constant current' : undefined,
    waterproofLabel(p.waterproof),
  ]
  return [...new Set(facts.filter((x): x is string => !!x))].slice(0, 5)
}

/** One short line describing the driver from its op-mode + IP. */
function driverDesc(facets: Record<string, string[]>, p: Product): string {
  const mode = facets.opmode?.includes('cc') ? 'Constant-current' : 'Constant-voltage'
  const env = p.waterproof && p.waterproof !== 'non_waterproof' && p.waterproof !== 'ip20' ? ` · ${p.waterproof.toUpperCase()}` : ''
  return `${mode} LED driver${env}.`
}

export function buildDriverProductCards(family: ProductFamily, products: Product[]): CatalogueCard[] {
  const authored = (code: string | null) => catalogueSeriesMeta(family.slug, code)
  return products
    .map((p) => {
      const facets: Record<string, string[]> = {
        outv: uniq([outvBand(p.output_voltage_v)]),
        power: uniq([powerBand(p.power_w)]),
        dimming: dimmingValues(p),
        opmode: opmodeValues(p.operation_mode),
        environment: environmentValues(p.waterproof),
        formfactor: formfactorValues(p, authored(p.series)?.formFactor ?? []),
      }
      return skuCard(family, p, {
        desc: driverDesc(facets, p),
        facts: driverFacts(p, facets),
        facets,
        section: seriesSectionTitle(family.slug, [p]),
        maxPowerForChips: p.power_w,
      })
    })
    .sort((a, b) => (sectionOrder(a.section) - sectionOrder(b.section)) || a.name.localeCompare(b.name))
}
```
Note: `sectionOrder` (defined in Task 1's file) covers control-gear section names; extend it to also order driver sections by delegating to `family-map`'s `sectionOrderIndex` when the section isn't a control-gear one:
```ts
function sectionOrder(section: string): number {
  const order = ['Controllers', 'Switches', 'Sensors']
  const i = order.indexOf(section)
  if (i >= 0) return i
  // driver sections (Constant-voltage / Constant-current) — keep CV before CC
  return section.toLowerCase().includes('current') ? 101 : 100
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/components/products/catalogue-data.test.ts`
Expected: PASS (new driver tests + all prior).

- [ ] **Step 5: Commit**

```bash
git add src/components/products/catalogue-data.ts src/components/products/catalogue-data.test.ts
git commit -m "feat(catalogue): per-SKU driver product cards

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: `buildAccessoryProductCards` — SKU cards for Accessories

**Files:**
- Modify: `src/components/products/catalogue-data.ts`
- Test: `src/components/products/catalogue-data.test.ts`

**Interfaces:**
- Produces: `buildAccessoryProductCards(family: ProductFamily, products: Product[]): CatalogueCard[]`
- Consumes: `skuCard`, `waterproofLabel`, `formatDims` from `@/lib/units` (already used elsewhere), `seriesSectionTitle`.

- [ ] **Step 1: Write the failing tests**

Add to `catalogue-data.test.ts`:
```ts
import { buildAccessoryProductCards } from './catalogue-data'

describe('accessory SKU cards', () => {
  it('emits one card per SKU with material/IP facts and no forced facets', () => {
    const products = [
      p({ sku: 'ACC-1', name: 'ENVO Aluminium Mounting Clip', family: 'accessory_general',
          series: null, material: 'Aluminium', waterproof: 'ip65' }),
    ]
    const [card] = buildAccessoryProductCards(ACCESSORIES, products)
    expect(card.sku).toBe('ACC-1')
    expect(card.modelCount).toBe(1)
    expect(card.facts).toEqual(expect.arrayContaining(['Aluminium', 'IP65']))
    expect(card.facets).toEqual({}) // accessories carry no filter facets
  })

  it('never surfaces a price', () => {
    const products = [p({ sku: 'ACC-2', family: 'accessory_general', price_nzd: 5 })]
    expect(JSON.stringify(buildAccessoryProductCards(ACCESSORIES, products))).not.toMatch(/nzd|"price"/i)
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/components/products/catalogue-data.test.ts -t "accessory SKU cards"`
Expected: FAIL — `buildAccessoryProductCards is not a function`.

- [ ] **Step 3: Implement**

Add to `catalogue-data.ts` (add `import { formatDims } from '@/lib/units'` at top if not present):
```ts
function accessoryFacts(p: Product): string[] {
  const d = formatDims(p.length_mm, p.width_mm, p.height_mm)
  const facts: (string | undefined)[] = [
    p.material ?? undefined,
    d ? d.mm : undefined,
    waterproofLabel(p.waterproof),
  ]
  return [...new Set(facts.filter((x): x is string => !!x))].slice(0, 3)
}

export function buildAccessoryProductCards(family: ProductFamily, products: Product[]): CatalogueCard[] {
  return products
    .map((p) =>
      skuCard(family, p, {
        desc: p.short_description ?? '',
        facts: accessoryFacts(p),
        facets: {}, // accessories: no filter facets (buildGroups returns [] for this family)
        section: seriesSectionTitle(family.slug, [p]),
      }),
    )
    .sort((a, b) => a.name.localeCompare(b.name))
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/components/products/catalogue-data.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/products/catalogue-data.ts src/components/products/catalogue-data.test.ts
git commit -m "feat(catalogue): per-SKU accessory product cards

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Card dispatcher + wire all four family category pages

**Files:**
- Modify: `src/components/products/catalogue-data.ts` (add dispatcher)
- Modify: `src/app/(frontend)/products/[slug]/page.tsx`
- Test: `src/components/products/catalogue-data.test.ts`

**Interfaces:**
- Produces: `buildProductCardsFor(slug: string, family: ProductFamily, products: Product[]): { cards: CatalogueCard[]; layout: 'rows' | 'productGrid'; resultKind: 'series' | 'products' }`
- Consumes: `buildCards`, `buildControlGearProductCards`, `buildDriverProductCards`, `buildAccessoryProductCards`.

- [ ] **Step 1: Write the failing test for the dispatcher**

Add to `catalogue-data.test.ts`:
```ts
import { buildProductCardsFor } from './catalogue-data'

describe('per-family card dispatcher', () => {
  const one = (over: Record<string, unknown>) => [p(over)]

  it('drivers/control-gear/accessories → per-SKU productGrid', () => {
    for (const [slug, fam] of [['led-drivers', DRIVERS], ['control-gear', CONTROL], ['accessories', ACCESSORIES]] as const) {
      const r = buildProductCardsFor(slug, fam, one({ sku: `${slug}-1`, series: 'sc_envo', family: 'psu_led_cv' }))
      expect(r.layout).toBe('productGrid')
      expect(r.resultKind).toBe('products')
      expect(r.cards[0].sku).toBe(`${slug}-1`)
    }
  })

  it('signage → series cards in productGrid layout (no per-SKU explosion)', () => {
    const SIGNAGE = PRODUCT_FAMILIES.find((f) => f.slug === 'led-signage-modules')!
    const r = buildProductCardsFor('led-signage-modules', SIGNAGE, [
      p({ sku: 'EV-A', series: 'envo_ecoglo', cct_k: 4000 }),
      p({ sku: 'EV-B', series: 'envo_ecoglo', cct_k: 6500 }),
    ])
    expect(r.layout).toBe('productGrid')
    expect(r.resultKind).toBe('series')
    expect(r.cards).toHaveLength(1) // one series card, not two SKU cards
    expect(r.cards[0].sku).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/components/products/catalogue-data.test.ts -t "per-family card dispatcher"`
Expected: FAIL — `buildProductCardsFor is not a function`.

- [ ] **Step 3: Implement the dispatcher**

Add to `catalogue-data.ts`:
```ts
/** Pick the card set + layout for a family's category page.
 *  Drivers / Control Gear / Accessories → per-SKU product cards.
 *  Signage → series cards, but rendered in the product-grid layout. */
export function buildProductCardsFor(
  slug: string,
  family: ProductFamily,
  products: Product[],
): { cards: CatalogueCard[]; layout: 'rows' | 'productGrid'; resultKind: 'series' | 'products' } {
  switch (slug) {
    case 'control-gear':
      return { cards: buildControlGearProductCards(family, products), layout: 'productGrid', resultKind: 'products' }
    case 'led-drivers':
      return { cards: buildDriverProductCards(family, products), layout: 'productGrid', resultKind: 'products' }
    case 'accessories':
      return { cards: buildAccessoryProductCards(family, products), layout: 'productGrid', resultKind: 'products' }
    default: // led-signage-modules: series cards, product-grid look
      return { cards: buildCards(family, products), layout: 'productGrid', resultKind: 'series' }
  }
}
```

- [ ] **Step 4: Wire the family category page**

In `src/app/(frontend)/products/[slug]/page.tsx`, replace the `productFirst`/`cards` block (currently lines ~42-45 and the `<CatalogueFilter .../>` props) with:
```tsx
import { buildProductCardsFor, buildGroups } from '@/components/products/catalogue-data'
// ...
  const { cards, layout, resultKind } = buildProductCardsFor(slug, family, products)
  const groups = buildGroups(cards, slug)
// ...
        <CatalogueFilter
          cards={cards}
          groups={groups}
          resultKind={resultKind}
          layout={layout}
          showSections
        />
```
Remove the now-unused `buildCards`/`buildControlGearProductCards` imports from this file (the dispatcher owns them).

- [ ] **Step 5: Run unit tests + typecheck**

```bash
npx vitest run src/components/products/catalogue-data.test.ts
npx tsc --noEmit -p tsconfig.json
```
Expected: tests PASS; tsc reports no NEW errors in the touched files (see the known-tech-debt note — pre-existing errors elsewhere are not in scope).

- [ ] **Step 6: Verify in the running app (all four category pages)**

Use the `run` skill (or `superpowers:verification-before-completion`). Start dev (detached, port from `/tmp/envo-dev.pid` pattern) and load each page; confirm: drivers/control-gear/accessories show per-SKU cards with SKU + 2–3 facts + "View series" CTA; signage shows ~9 series cards in grid style with "View series"; category-specific filters render and narrow the grid.
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/products/led-drivers
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/products/control-gear
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/products/accessories
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/products/led-signage-modules
```
Expected: `200` for each. Then screenshot each at 1440×900 for review.

- [ ] **Step 7: Commit**

```bash
git add 'src/app/(frontend)/products/[slug]/page.tsx' src/components/products/catalogue-data.ts src/components/products/catalogue-data.test.ts
git commit -m "feat(catalogue): product-first grids for all four families via dispatcher

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Signage series-card polish + product-grid CSS

**Files:**
- Modify: `src/components/products/products-catalogue.css`
- Modify: `src/components/products/CatalogueFilter.tsx` (only if a series card needs a "View series" label branch not already handled by `ctaLabel`)

**Interfaces:**
- Consumes: `.pcat-product-grid` / `.pcat-product-card` styles carried from WIP.

- [ ] **Step 1: Confirm the grid responsive breakpoints**

The WIP grid is `grid-template-columns: repeat(auto-fit, minmax(260px, 1fr))`. Verify at 1440 (→ 4-up), ~1100 (→ 3-up), ~760 (→ 2-up), 375 (→ 1-up). If 4-up doesn't trigger on large desktop, raise the container max or lower the `minmax` floor to ~240px. Edit only `.pcat-product-grid` in `products-catalogue.css`. Do not use Tailwind spacing utilities (dead in this repo).

- [ ] **Step 2: Ensure signage series cards read cleanly in the grid**

Signage cards have no `sku` and `chips` of IP/voltage/beam. Confirm the card template hides the SKU line when `c.sku` is undefined (it already conditionals on `c.sku`) and that the CTA shows "View series". No image distortion (series images are photographic; SKU images are clean cut-outs) — verify `object-fit` in `.pcat-product-media img`.

- [ ] **Step 3: Verify visually at all four breakpoints, then commit**

```bash
git add src/components/products/products-catalogue.css src/components/products/CatalogueFilter.tsx
git commit -m "style(catalogue): product-grid breakpoints + signage series-card polish

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 4: Open the Phase 1 PR against `dev`**

```bash
git fetch origin && git rebase origin/dev
git push -u origin feature/product-first-catalogue-2026-07-07
gh pr create --base dev --title "feat(catalogue): product-first category grids (Phase 1)" --body "<summary + screenshots; 🤖 Generated with [Claude Code](https://claude.com/claude-code)>"
```
Phase 1 is independently shippable: SKU cards link to series pages (interim); Phase 2 introduces SKU detail pages and repoints the links.

---

## PHASE 2 — SKU detail routing + page template + comparison table

### Task 6: `pickCompareLayout` — count-based table selection

**Files:**
- Create: `src/lib/sku-detail.ts`
- Test: `src/lib/sku-detail.test.ts`

**Interfaces:**
- Produces: `pickCompareLayout(sameSeriesCount: number): 'none' | 'horizontal' | 'rows'`

- [ ] **Step 1: Write the failing test**

Create `src/lib/sku-detail.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { pickCompareLayout } from './sku-detail'

describe('pickCompareLayout', () => {
  it('renders nothing for a singleton series', () => {
    expect(pickCompareLayout(1)).toBe('none')
    expect(pickCompareLayout(0)).toBe('none')
  })
  it('uses a horizontal table for 2–6', () => {
    for (const n of [2, 3, 6]) expect(pickCompareLayout(n)).toBe('horizontal')
  })
  it('uses a row-based table for >6', () => {
    for (const n of [7, 12, 40]) expect(pickCompareLayout(n)).toBe('rows')
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/sku-detail.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/lib/sku-detail.ts`:
```ts
/** Product-aware comparison-table layout, chosen by same-series product count.
 *  1 (or 0) → no table; 2–6 → horizontal (specs as rows, SKUs as columns);
 *  >6 → row-based (one row per SKU). See the design spec §4. */
export function pickCompareLayout(sameSeriesCount: number): 'none' | 'horizontal' | 'rows' {
  if (sameSeriesCount <= 1) return 'none'
  if (sameSeriesCount <= 6) return 'horizontal'
  return 'rows'
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/sku-detail.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sku-detail.ts src/lib/sku-detail.test.ts
git commit -m "feat(sku): pickCompareLayout table-selection rule

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: `buildSkuDetailProps` — assemble the SKU page data

**Files:**
- Modify: `src/lib/sku-detail.ts`
- Test: `src/lib/sku-detail.test.ts`

**Interfaces:**
- Produces:
  - `type CompareColumn = { key: string; label: string; value: (p: Product) => string | null }`
  - `type CompareRow = { sku: string; name: string; href: string; isCurrent: boolean; cells: string[] }`
  - `type SkuDetailProps = { breadcrumb: { familyName: string; familyHref: string; name: string }; sku: string; name: string; image: { src: string; local: boolean; alt: string }; coreSpecs: { label: string; value: string }[]; datasheetUrl?: string; compare: { layout: 'none' | 'horizontal' | 'rows'; columns: CompareColumn[]; rows: CompareRow[]; currentSku: string } }`
  - `buildSkuDetailProps(family: ProductFamily, product: Product, sameSeries: Product[]): SkuDetailProps`
  - `compareColumnsFor(slug: string): CompareColumn[]`
- Consumes: `resolveProductImage`, `seriesLineArt`, `seriesSlug`, `datasheetHref`, `formatDims`, `Product`, `ProductFamily`.

- [ ] **Step 1: Write the failing tests**

Add to `src/lib/sku-detail.test.ts`:
```ts
import { buildSkuDetailProps, compareColumnsFor } from './sku-detail'
import { PRODUCT_FAMILIES } from '@/data/product-families'
import type { Product } from '@/lib/products'

const DRIVERS = PRODUCT_FAMILIES.find((f) => f.slug === 'led-drivers')!
const mk = (over: Partial<Product>): Product => ({ /* minimal Product — mirror the p() factory fields */
  id: 1, sku: 'X', name: 'n', family: 'psu_led_cv', series: 'envo_sng', brand: 'ENVO',
  spec_sheet_url: null, power_w: null, output_voltage_v: null, operation_mode: null,
  dimming_control: [], waterproof: null, standards_met: [], length_mm: null, width_mm: null, height_mm: null,
  ...over,
} as unknown as Product)

describe('buildSkuDetailProps', () => {
  const current = mk({ sku: 'EV-SNG-350-24', name: 'SNG 350W 24V', power_w: 350, output_voltage_v: 24, operation_mode: 'cv', waterproof: 'ip67', spec_sheet_url: 's.pdf' })
  const sibling = mk({ sku: 'EV-SNG-350-12', name: 'SNG 300W 12V', power_w: 300, output_voltage_v: 12, operation_mode: 'cv', waterproof: 'ip67' })

  it('marks the current SKU and links siblings to their SKU pages', () => {
    const props = buildSkuDetailProps(DRIVERS, current, [current, sibling])
    expect(props.sku).toBe('EV-SNG-350-24')
    expect(props.compare.layout).toBe('horizontal') // 2 products
    const cur = props.compare.rows.find((r) => r.sku === 'EV-SNG-350-24')!
    const sib = props.compare.rows.find((r) => r.sku === 'EV-SNG-350-12')!
    expect(cur.isCurrent).toBe(true)
    expect(sib.isCurrent).toBe(false)
    expect(sib.href).toBe('/products/led-drivers/EV-SNG-350-12')
    expect(props.datasheetUrl).toBeTruthy()
  })

  it('drops the compare block for a singleton series', () => {
    const props = buildSkuDetailProps(DRIVERS, current, [current])
    expect(props.compare.layout).toBe('none')
  })

  it('never includes a price field', () => {
    const props = buildSkuDetailProps(DRIVERS, mk({ sku: 'Y', price_nzd: 9 } as Partial<Product>), [mk({ sku: 'Y' })])
    expect(JSON.stringify(props)).not.toMatch(/nzd|"price"/i)
  })
})

describe('compareColumnsFor', () => {
  it('gives drivers power/voltage/dimming/mode/IP columns', () => {
    const keys = compareColumnsFor('led-drivers').map((c) => c.key)
    expect(keys).toEqual(expect.arrayContaining(['power', 'outv', 'dimming', 'opmode', 'ip']))
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/sku-detail.test.ts`
Expected: FAIL — `buildSkuDetailProps is not a function`.

- [ ] **Step 3: Implement column sets + props builder**

Add to `src/lib/sku-detail.ts`:
```ts
import { resolveProductImage, type Product } from '@/lib/products'
import type { ProductFamily } from '@/data/product-families'
import { seriesSlug, seriesLineArt } from '@/data/family-map'
import { datasheetHref } from '@/lib/asset-url'
import { formatDims } from '@/lib/units'

export type CompareColumn = { key: string; label: string; value: (p: Product) => string | null }
export type CompareRow = { sku: string; name: string; href: string; isCurrent: boolean; cells: string[] }
export type SkuDetailProps = {
  breadcrumb: { familyName: string; familyHref: string; name: string }
  sku: string
  name: string
  image: { src: string; local: boolean; alt: string }
  coreSpecs: { label: string; value: string }[]
  datasheetUrl?: string
  compare: { layout: 'none' | 'horizontal' | 'rows'; columns: CompareColumn[]; rows: CompareRow[]; currentSku: string }
}

const dimText = (p: Product): string | null => {
  if (/triac[- ]?dim/i.test(p.name) || p.dimming_control?.includes('triac')) return 'Triac'
  if (p.dimming_control?.includes('dali')) return 'DALI'
  if (p.dimming_control?.includes('0_10v')) return '0–10 V'
  if (/non[- ]?dimmable/i.test(p.name)) return 'None'
  return p.dimming_control?.length ? p.dimming_control.join(' / ') : null
}
const modeText = (p: Product): string | null =>
  p.operation_mode === 'cv' ? 'CV' : p.operation_mode === 'cc' ? 'CC' : p.operation_mode === 'cv_cc' ? 'CV/CC' : null
const ipText = (p: Product): string | null =>
  p.waterproof && p.waterproof !== 'non_waterproof' ? p.waterproof.toUpperCase() : null

const DRIVER_COLUMNS: CompareColumn[] = [
  { key: 'power', label: 'Power', value: (p) => (p.power_w != null ? `${p.power_w} W` : null) },
  { key: 'outv', label: 'Output', value: (p) => (p.output_voltage_v != null ? `${p.output_voltage_v} V` : null) },
  { key: 'dimming', label: 'Dimming', value: dimText },
  { key: 'opmode', label: 'Mode', value: modeText },
  { key: 'ip', label: 'IP', value: ipText },
]
const CONTROL_COLUMNS: CompareColumn[] = [
  { key: 'protocol', label: 'Protocol', value: (p) => (p.dimming_control?.length ? p.dimming_control.join(' / ') : null) },
  { key: 'channels', label: 'Channels', value: (p) => (p.output_channel?.match(/(\d+)/)?.[1] ?? null) },
  { key: 'controltype', label: 'Control type', value: (p) => (p.controller_type?.length ? p.controller_type.join(' / ') : null) },
  { key: 'inv', label: 'Input', value: (p) => (p.input_voltage_min_v != null ? `${p.input_voltage_min_v}${p.input_voltage_max_v && p.input_voltage_max_v !== p.input_voltage_min_v ? `–${p.input_voltage_max_v}` : ''} V` : null) },
]
const ACCESSORY_COLUMNS: CompareColumn[] = [
  { key: 'material', label: 'Material', value: (p) => p.material ?? null },
  { key: 'dims', label: 'Dimensions', value: (p) => formatDims(p.length_mm, p.width_mm, p.height_mm)?.mm ?? null },
  { key: 'ip', label: 'IP', value: ipText },
]

export function compareColumnsFor(slug: string): CompareColumn[] {
  if (slug === 'led-drivers') return DRIVER_COLUMNS
  if (slug === 'control-gear') return CONTROL_COLUMNS
  return ACCESSORY_COLUMNS
}

function coreSpecs(slug: string, p: Product): { label: string; value: string }[] {
  return compareColumnsFor(slug)
    .map((c) => ({ label: c.label, value: c.value(p) }))
    .filter((s): s is { label: string; value: string } => s.value != null)
}

export function buildSkuDetailProps(family: ProductFamily, product: Product, sameSeries: Product[]): SkuDetailProps {
  const img = resolveProductImage(product, seriesLineArt(product.series, family.slug))
  const columns = compareColumnsFor(family.slug)
  const layout = pickCompareLayout(sameSeries.length)
  const rows: CompareRow[] = sameSeries
    .slice()
    .sort((a, b) => (a.power_w ?? 0) - (b.power_w ?? 0) || a.sku.localeCompare(b.sku))
    .map((p) => ({
      sku: p.sku,
      name: p.name,
      href: `/products/${family.slug}/${encodeURIComponent(p.sku)}`,
      isCurrent: p.sku === product.sku,
      cells: columns.map((c) => c.value(p) ?? '—'),
    }))
  return {
    breadcrumb: { familyName: family.name, familyHref: family.href, name: product.name },
    sku: product.sku,
    name: product.name,
    image: { src: img.src, local: img.isLocal, alt: img.alt },
    coreSpecs: coreSpecs(family.slug, product),
    datasheetUrl: product.spec_sheet_url ? (datasheetHref(product.sku) ?? undefined) : undefined,
    compare: { layout, columns, rows, currentSku: product.sku },
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/lib/sku-detail.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sku-detail.ts src/lib/sku-detail.test.ts
git commit -m "feat(sku): buildSkuDetailProps + per-family compare columns

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: `SpecCompareTable` component

**Files:**
- Create: `src/components/products/sku/SpecCompareTable.tsx`
- Create: `src/components/products/sku/sku-detail.css`

**Interfaces:**
- Consumes: `SkuDetailProps['compare']` shape (`{ layout, columns, rows, currentSku }`) — note the component receives `columns` as `{ key, label }[]` only (drop the `value` fn at the RSC boundary; cells are precomputed in `rows`).
- Produces: `<SpecCompareTable compare={...} />` (client-free RSC-compatible; pure presentational).

- [ ] **Step 1: Implement the component**

Create `src/components/products/sku/SpecCompareTable.tsx`:
```tsx
import Link from 'next/link'
import './sku-detail.css'

type Row = { sku: string; name: string; href: string; isCurrent: boolean; cells: string[] }
type Compare = { layout: 'none' | 'horizontal' | 'rows'; columns: { key: string; label: string }[]; rows: Row[]; currentSku: string }

export function SpecCompareTable({ compare }: { compare: Compare }) {
  if (compare.layout === 'none') return null
  const { columns, rows } = compare

  // Row-based (>6): one row per SKU, action column. Also the mobile form for all layouts.
  const RowBased = (
    <table className="skc-table skc-rows">
      <thead>
        <tr><th>Model</th>{columns.map((c) => <th key={c.key}>{c.label}</th>)}<th aria-label="action" /></tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.sku} className={r.isCurrent ? 'is-current' : undefined}>
            <th scope="row">{r.sku}</th>
            {r.cells.map((cell, i) => <td key={columns[i].key}>{cell}</td>)}
            <td>{r.isCurrent ? <span className="skc-current">Current</span> : <Link href={r.href} className="skc-view">View product</Link>}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  // Horizontal (2–6): specs as rows, SKUs as columns, current column highlighted.
  const Horizontal = (
    <table className="skc-table skc-horizontal">
      <thead>
        <tr>
          <th />
          {rows.map((r) => (
            <th key={r.sku} className={r.isCurrent ? 'is-current' : undefined}>
              {r.sku}
              {r.isCurrent ? <span className="skc-current">Current</span> : <Link href={r.href} className="skc-view">View</Link>}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {columns.map((c, ci) => (
          <tr key={c.key}>
            <th scope="row">{c.label}</th>
            {rows.map((r) => <td key={r.sku} className={r.isCurrent ? 'is-current' : undefined}>{r.cells[ci]}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  )

  return (
    <div className="skc-compare">
      <div className="skc-desktop">{compare.layout === 'rows' ? RowBased : Horizontal}</div>
      {/* Mobile always uses the readable row-based form (no wide horizontal scroll). */}
      <div className="skc-mobile">{RowBased}</div>
    </div>
  )
}
```

- [ ] **Step 2: Style it (light theme, current highlight, mobile switch)**

Create `src/components/products/sku/sku-detail.css`. Use existing catalogue tokens (`--bg-card`, `--line`, `#0071bc` structure blue). Requirements: `.skc-desktop` shown ≥720px, `.skc-mobile` shown <720px (`@media`); `.is-current` gets a subtle `rgba(0,113,188,.08)` background; the whole table wrapped so it `overflow-x:auto` inside its own container (page body never scrolls horizontally); `.skc-current` is a small pill, `.skc-view` a blue text link. No Tailwind spacing utilities.
```css
.skc-compare { margin: 28px 0; }
.skc-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.skc-table th, .skc-table td { padding: 10px 12px; border-bottom: 1px solid var(--line); text-align: left; }
.skc-table .is-current { background: rgba(0,113,188,.08); }
.skc-current { display:inline-block; font-weight:600; color:#0071bc; }
.skc-view { color:#0071bc; text-decoration:none; }
.skc-view:hover { text-decoration:underline; }
.skc-desktop { overflow-x:auto; }
.skc-mobile { display:none; }
@media (max-width: 720px) { .skc-desktop { display:none; } .skc-mobile { display:block; } }
```

- [ ] **Step 3: Commit**

```bash
git add src/components/products/sku/SpecCompareTable.tsx src/components/products/sku/sku-detail.css
git commit -m "feat(sku): SpecCompareTable (horizontal / row-based / mobile-stacked)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: `SkuDetailPage` template

**Files:**
- Create: `src/components/products/sku/SkuDetailPage.tsx`
- Modify: `src/components/products/sku/sku-detail.css`

**Interfaces:**
- Consumes: `SkuDetailProps` (Task 7), `SpecCompareTable` (Task 8).
- Produces: `export default function SkuDetailPage(props: SkuDetailProps)`.

- [ ] **Step 1: Implement the template**

Create `src/components/products/sku/SkuDetailPage.tsx`:
```tsx
import Link from 'next/link'
import Image from 'next/image'
import { SpecCompareTable } from './SpecCompareTable'
import type { SkuDetailProps } from '@/lib/sku-detail'
import './sku-detail.css'

export default function SkuDetailPage(props: SkuDetailProps) {
  const { breadcrumb, sku, name, image, coreSpecs, datasheetUrl, compare } = props
  return (
    <div className="theme-light pcat">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link><span className="sep">›</span>
          <Link href="/products">Products</Link><span className="sep">›</span>
          <Link href={breadcrumb.familyHref}>{breadcrumb.familyName}</Link><span className="sep">›</span>
          <span>{sku}</span>
        </div>

        <div className="sku-hero">
          <div className="sku-hero-media">
            {image.local
              ? <Image src={image.src} alt={image.alt} width={520} height={420} sizes="(max-width:720px) 100vw, 460px" />
              : <img src={image.src} alt={image.alt} />}
          </div>
          <div className="sku-hero-body">
            <div className="sku-eyebrow">{breadcrumb.familyName} · {sku}</div>
            <h1 className="sku-name">{name}</h1>
            {coreSpecs.length > 0 && (
              <dl className="sku-specs">
                {coreSpecs.map((s) => (<div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>))}
              </dl>
            )}
            <div className="sku-cta">
              {datasheetUrl && <a className="btn-blue" href={datasheetUrl} target="_blank" rel="noopener">Datasheet (PDF)</a>}
              <Link className="btn-outline" href="/contact">Ask our engineers</Link>
            </div>
          </div>
        </div>

        {compare.layout !== 'none' && (
          <section className="sku-section">
            <h2>Compare the series</h2>
            <SpecCompareTable compare={{ layout: compare.layout, columns: compare.columns.map((c) => ({ key: c.key, label: c.label })), rows: compare.rows, currentSku: compare.currentSku }} />
          </section>
        )}
      </div>
    </div>
  )
}
```
Copy-rule check: CTA routes to `/contact` ("Ask our engineers"), no chat, no price, no response-time promise. Uses existing `.btn-blue`/`.btn-outline` (site-wide blue-pill buttons, PR #153) — confirm those classes exist in `envo.css`; if the class names differ, match the existing button classes.

- [ ] **Step 2: Add hero + section styles to `sku-detail.css`**

Add: `.sku-hero` two-column grid (image left, body right) collapsing to one column <720px; `.sku-specs` a compact `dt/dd` grid; `.sku-cta` a flex row with gap; `.sku-section` top margin + `h2` styling consistent with `.pcat-section`. Relative units + `max-width:100%` on images.

- [ ] **Step 3: Commit**

```bash
git add src/components/products/sku/SkuDetailPage.tsx src/components/products/sku/sku-detail.css
git commit -m "feat(sku): SkuDetailPage template (hero, core specs, datasheet + enquiry CTA)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Route resolution — series-first, then SKU

**Files:**
- Modify: `src/app/(frontend)/products/[slug]/[series]/page.tsx`
- Modify: `src/components/products/catalogue-data.ts` (repoint SKU card `href` + `ctaLabel`)

**Interfaces:**
- Consumes: `getProduct`, `getProductsByMarketingFamily`, `seriesSlug`, `SkuDetailPage`, `buildSkuDetailProps`.

- [ ] **Step 1: Repoint SKU card links to the SKU detail page**

In `catalogue-data.ts`, in `skuCard()`, change the interim `href`/`ctaLabel`:
```ts
    href: `/products/${family.slug}/${encodeURIComponent(p.sku)}`,
    // ...
    ctaLabel: 'View product',
```
(Signage still uses `buildCards`, which keeps `href` = series page + "View range"/series CTA; only the three SKU families flow through `skuCard`.)

- [ ] **Step 2: Add SKU resolution to the `[series]` route**

In `[slug]/[series]/page.tsx`, after the existing series resolution attempts and BEFORE `notFound()`, add a SKU branch. The current flow: MiniLux special-case → generic series (`products.filter(seriesSlug === series)`). Change the generic branch so that when NO products match the slug as a *series*, it tries the slug as a *SKU* for the three spec-driven families:
```tsx
import SkuDetailPage from '@/components/products/sku/SkuDetailPage'
import { buildSkuDetailProps } from '@/lib/sku-detail'
import { getProduct } from '@/lib/products'

const SKU_DETAIL_FAMILIES = new Set(['led-drivers', 'control-gear', 'accessories'])
// ...
  // ── Every other series: generic, data-driven merged page ──
  const all = await getProductsByMarketingFamily(slug, { depth: 0 })
  const products = all.filter((p) => toSeriesSlug(p.series) === series)

  if (products.length === 0) {
    // Not a series slug — try it as a SKU (spec-driven families only). Series
    // always wins the segment; SKU is the fallback. (Design spec §3.)
    if (SKU_DETAIL_FAMILIES.has(slug)) {
      const decoded = decodeURIComponent(series)
      const product = await getProduct(decoded)
      if (product && all.some((p) => p.sku === product.sku)) {
        const sameSeries = all.filter((p) => toSeriesSlug(p.series) === toSeriesSlug(product.series))
        return <SkuDetailPage {...buildSkuDetailProps(family, product, sameSeries)} />
      }
    }
    notFound()
  }
```

- [ ] **Step 3: Add SKU entries to `generateStaticParams`**

Extend the existing loop so the three spec-driven families also emit one param per SKU (series params stay):
```tsx
export async function generateStaticParams() {
  const params: { slug: string; series: string }[] = []
  for (const f of ['led-signage-modules', 'led-drivers', 'control-gear', 'accessories']) {
    const products = await getProductsByMarketingFamily(f, { depth: 0 })
    const slugs = new Set(products.map((p) => toSeriesSlug(p.series)))
    for (const s of slugs) params.push({ slug: f, series: s })
    if (['led-drivers', 'control-gear', 'accessories'].includes(f)) {
      for (const p of products) params.push({ slug: f, series: encodeURIComponent(p.sku) })
    }
  }
  return params
}
```
Note: `dynamicParams = false` stays — every series slug and SKU is pre-listed, so no unknown segment renders. A SKU that collides with a series slug would resolve as the series (series branch runs first) — acceptable and matches the "series wins" rule.

- [ ] **Step 4: Verify routing end-to-end in the running app**

Rebuild types / restart dev cleanly (stale `.next/dev/types` cause phantom tsc errors after route edits — `rm -rf .next/dev/types` if needed). Then:
```bash
# an existing series URL must still 200 (regression guard)
curl -s -o /dev/null -w "series %{http_code}\n" http://localhost:3000/products/led-drivers/envo-sng
# a real driver SKU must 200 as a detail page (use a live SKU from the DB)
curl -s -o /dev/null -w "sku %{http_code}\n" "http://localhost:3000/products/led-drivers/EV-SNG-350-24"
# nonsense must 404
curl -s -o /dev/null -w "junk %{http_code}\n" http://localhost:3000/products/led-drivers/not-a-thing
```
Expected: `series 200`, `sku 200`, `junk 404`. Load the SKU page in a browser: hero image is the individual product, core specs present, compare table matches the count rule (singleton → none), sibling links navigate to their SKU pages, current is highlighted. Screenshot at 1440×900 and 375 wide.

- [ ] **Step 5: Run the unit suite + commit**

```bash
npx vitest run src/lib/sku-detail.test.ts src/components/products/catalogue-data.test.ts
git add 'src/app/(frontend)/products/[slug]/[series]/page.tsx' src/components/products/catalogue-data.ts
git commit -m "feat(sku): series-first-then-SKU route resolution; cards link to SKU detail pages

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 6: Open the Phase 2 PR against `dev`**

```bash
git fetch origin && git rebase origin/dev
git push --force-with-lease
gh pr create --base dev --title "feat(catalogue): SKU detail pages + product-aware comparison (Phase 2)" --body "<summary + screenshots; 🤖 Generated with [Claude Code](https://claude.com/claude-code)>"
```

---

## PHASE 3 — Polish

### Task 11: Region-aware enquiry/distributor CTA

**Files:**
- Modify: `src/components/products/sku/SkuDetailPage.tsx`
- Possibly reuse: `src/components/products/merged/FindDistributorCta.tsx` (only if Task 0 confirmed it is region-stream-independent; otherwise wait for the region stream to land on `dev` first, then rebase)

- [ ] **Step 1:** Replace the plain "Ask our engineers" link with the region-aware `FindDistributorCta` (where-to-buy via authorised channels + `/contact`), matching how the merged series page uses it. Keep copy rules: authorised channels, no checkout, no prices, no response-time promise. Verify the CTA renders for both a detected region and the undetected default (both distributors). Commit.

### Task 12: Related products on the SKU page

**Files:**
- Modify: `src/lib/sku-detail.ts` (add `related` to `SkuDetailProps`)
- Modify: `src/components/products/sku/SkuDetailPage.tsx`
- Test: `src/lib/sku-detail.test.ts`

- [ ] **Step 1:** Write a test that `buildSkuDetailProps` populates up to 3 related items (other series in the same family, or complementary families via the existing `pickRelatedSeries`/`COMPLEMENT_FAMILIES` used by the merged page). **Step 2:** Implement using the existing related-series helpers (do not invent a new mechanism). **Step 3:** Render a related-cards row reusing the catalogue card visual. Commit.

### Task 13: Sparse-editorial fallback + design refinements

**Files:**
- Modify: `src/components/products/sku/SkuDetailPage.tsx`, `src/components/products/sku/sku-detail.css`

- [ ] **Step 1:** Confirm every optional section (shared series content, related, compare) renders only when it has data — no empty shells for driver/control-gear series with thin editorial. **Step 2:** Responsive pass at 1440 / 1100 / 760 / 375; confirm no horizontal body scroll, tables scroll within their own container, images `max-width:100%`. **Step 3:** Final visual review, then open the Phase 3 PR against `dev`.

---

## Self-Review

**Spec coverage:**
- IA (category / series / SKU) → Tasks 4, 10, 9. ✅
- Per-family strategy (SKU vs series cards) → Task 4 dispatcher (tested). ✅
- Category filters already implemented (`buildGroups`) — unchanged, guarded by existing tests. ✅
- Grid responsiveness → Task 5. ✅
- Card content (image/SKU/name/2–3 chips/CTA wording; datasheet on detail page) → Tasks 1–5 (interim CTA) + Task 10 (final "View product" + href). ✅
- Series pages unchanged → no task modifies the merged template; MiniLux branch untouched. ✅
- SKU route series-first-then-SKU + `generateStaticParams` + encoded SKUs → Task 10. ✅
- SKU page structure (hero/specs/datasheet/enquiry/compare/related/editorial) → Tasks 9, 11, 12, 13. ✅
- Comparison thresholds (1 none / 2–6 horizontal / >6 rows) + mobile stacked + per-family columns → Tasks 6, 7, 8. ✅
- Branch hygiene (worktree off dev, catalogue-only, FindDistributorCta audit) → Task 0. ✅
- Global copy/price/chat/branding rules → Global Constraints + explicit price-absence tests in Tasks 1, 2, 3, 7. ✅

**Placeholder scan:** Phase 3 tasks (11–13) are intentionally lighter — they are polish whose exact code depends on Phase-2 review outcomes and the region stream's merge state; each still names files, the helper to reuse, and a test. All Phase 0–2 code steps carry complete code. No "TBD/handle edge cases" placeholders in Phase 0–2.

**Type consistency:** `CatalogueCard` fields (`sku?`, `facts?`, `ctaLabel?`) match the WIP type. `skuCard` signature is consumed identically by Tasks 1–3. `SkuDetailProps` / `CompareColumn` / `CompareRow` defined in Task 7 and consumed unchanged in Tasks 8–9 (component drops the `value` fn at the RSC boundary — noted explicitly). `pickCompareLayout` return union (`'none'|'horizontal'|'rows'`) is identical across Tasks 6, 7, 8. `buildProductCardsFor` return shape matches the `CatalogueFilter` `layout`/`resultKind` props from the WIP.
