# DB-Driven Product Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all 224 ENVO products reachable on the site — DB-driven family → series → SKU pages plus a generic SKU detail page — surfacing existing Payload data without touching the Akeneo sync.

**Architecture:** A pure `family-map.ts` (7 DB families → 4 marketing slugs; series code ↔ slug) + small additions to `src/lib/products.ts` (marketing-family fetch + series grouping) drive three route levels. Curated pages (mini-series bespoke, configured series) are preserved; everything else falls back to generic DB-driven views. `generateStaticParams` enumerates from the DB so every product is statically reachable.

**Tech Stack:** Next.js 16 App Router (server components), TypeScript, Payload local API, vitest. Reuses `slugify`, `units.formatDims`, existing `[slug]/page.module.css` card styles.

---

## Spec

`docs/superpowers/specs/2026-06-04-product-catalog-db-driven-design.md`.

## Testing approach

`family-map.ts` and the `groupProductsBySeries` helper are **pure** → real unit tests (TDD), following the existing `src/lib/*.test.ts` vitest pattern. The route/page work is server-rendered markup → verified by tsc + dev-server render + headless screenshot + a `generateStaticParams` count assertion (no unit tests for JSX).

## Conventions

- Server components, no `'use client'` (the generic pages are static).
- Internal links: `next/link`. Images: follow the existing `resolveProductImage` `isLocal` branch — `next/image` for local assets, plain `<img>` (file-level `/* eslint-disable @next/next/no-img-element */`) for remote S3 URLs.
- Reuse globals utility classes (`theme-light`, `container`, `breadcrumb`, `sig-hero`, `sig-eyebrow`) and `[slug]/page.module.css` (`seriesGrid`, `seriesCard`, `seriesCardThumb`, `seriesCardBody`, `seriesCardName`, `seriesCardDesc`, `seriesCardCta`).
- No `price_nzd` anywhere.

---

### Task 1: `family-map.ts` — pure mapping + slug helpers (TDD)

**Files:**
- Create: `src/data/family-map.ts`
- Test: `src/data/family-map.test.ts`

- [ ] **Step 1: Write the failing test**

`src/data/family-map.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  dbFamilyToMarketing, marketingFamilyToDbFamilies,
  seriesSlug, seriesCodeFromSlug, seriesLabel, MARKETING_FAMILIES,
} from './family-map'

describe('family mapping (7 DB → 4 marketing)', () => {
  it('maps every DB family to a marketing family', () => {
    expect(dbFamilyToMarketing('led_module')?.slug).toBe('led-signage-modules')
    expect(dbFamilyToMarketing('psu_led_cv')?.slug).toBe('led-drivers')
    expect(dbFamilyToMarketing('psu_led_cc')?.slug).toBe('led-drivers')
    expect(dbFamilyToMarketing('psu_led_controller')?.slug).toBe('control-gear')
    expect(dbFamilyToMarketing('switch_switch_module')?.slug).toBe('control-gear')
    expect(dbFamilyToMarketing('sensor')?.slug).toBe('accessories')
    expect(dbFamilyToMarketing('accessory_general')?.slug).toBe('accessories')
  })
  it('returns null for an unknown DB family', () => {
    expect(dbFamilyToMarketing('nope')).toBeNull()
  })
  it('reverse-maps a marketing slug to its DB families', () => {
    expect(marketingFamilyToDbFamilies('led-drivers').sort())
      .toEqual(['psu_led_cc', 'psu_led_cv'])
    expect(marketingFamilyToDbFamilies('control-gear').sort())
      .toEqual(['psu_led_controller', 'switch_switch_module'])
  })
  it('exposes exactly 4 marketing families', () => {
    expect(MARKETING_FAMILIES.map((f) => f.slug).sort())
      .toEqual(['accessories', 'control-gear', 'led-drivers', 'led-signage-modules'])
  })
})

describe('series slug ↔ code', () => {
  it('overrides envo_minilux to the bespoke slug', () => {
    expect(seriesSlug('envo_minilux')).toBe('mini-series')
    expect(seriesCodeFromSlug('mini-series')).toBe('envo_minilux')
  })
  it('derives slug from code for non-curated series', () => {
    expect(seriesSlug('hydro_lume')).toBe('hydro-lume')
    expect(seriesSlug('sc_envo')).toBe('sc-envo')
    expect(seriesCodeFromSlug('hydro-lume')).toBe('hydro_lume')
  })
  it('round-trips a null/empty series to the "other" bucket', () => {
    expect(seriesSlug(null)).toBe('other')
    expect(seriesCodeFromSlug('other')).toBeNull()
  })
  it('gives a human label, preferring the known map', () => {
    expect(seriesLabel('envo_ultraflare')).toBe('UltraFlare')
    expect(seriesLabel('hydro_lume')).toBe('Hydro Lume')   // title-case fallback
    expect(seriesLabel(null)).toBe('Other')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/family-map.test.ts`
Expected: FAIL — `Cannot find module './family-map'`.

- [ ] **Step 3: Implement `family-map.ts`**

```ts
// Maps the 7 Akeneo DB families to the 4 marketing families used in the URL/IA,
// and converts DB `series` codes to URL slugs (and back). Pure — no I/O.
import { slugify } from '@/lib/slugify'

export type MarketingFamily = { slug: string; label: string; dbFamilies: string[] }

export const MARKETING_FAMILIES: MarketingFamily[] = [
  { slug: 'led-signage-modules', label: 'LED Signage Modules', dbFamilies: ['led_module'] },
  { slug: 'led-drivers',         label: 'LED Drivers',         dbFamilies: ['psu_led_cv', 'psu_led_cc'] },
  { slug: 'control-gear',        label: 'Control Gear',        dbFamilies: ['psu_led_controller', 'switch_switch_module'] },
  { slug: 'accessories',         label: 'Accessories',         dbFamilies: ['sensor', 'accessory_general'] },
]

export function dbFamilyToMarketing(dbFamily: string): MarketingFamily | null {
  return MARKETING_FAMILIES.find((f) => f.dbFamilies.includes(dbFamily)) ?? null
}

export function marketingFamilyToDbFamilies(slug: string): string[] {
  return MARKETING_FAMILIES.find((f) => f.slug === slug)?.dbFamilies ?? []
}

// Series that have a bespoke/curated page keep their existing slug.
const SERIES_SLUG_OVERRIDES: Record<string, string> = { envo_minilux: 'mini-series' }
const SLUG_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(SERIES_SLUG_OVERRIDES).map(([code, slug]) => [slug, code]),
)

// Human-friendly series labels with correct casing (envo-led taxonomy);
// anything not listed falls back to title-case of the de-prefixed code.
const SERIES_LABELS: Record<string, string> = {
  envo_minilux: 'MiniLux', envo_ecoglo: 'EcoGlo', envo_ultraflare: 'UltraFlare',
  envo_proglo: 'ProGlo', envo_optilume: 'OptiLume', envo_edgelume: 'EdgeLume',
  envo_edgeflare: 'EdgeFlare', hydro_lume: 'Hydro Lume', envo_zigbee: 'Zigbee Smart',
  envo_casambi: 'Casambi', envo_dali: 'DALI', sr_triac: 'Triac', sc_envo: 'Standard',
}

export function seriesSlug(code: string | null | undefined): string {
  if (!code) return 'other'
  return SERIES_SLUG_OVERRIDES[code] ?? code.replace(/_/g, '-')
}

export function seriesCodeFromSlug(slug: string): string | null {
  if (slug === 'other') return null
  return SLUG_TO_CODE[slug] ?? slug.replace(/-/g, '_')
}

export function seriesLabel(code: string | null | undefined): string {
  if (!code) return 'Other'
  if (SERIES_LABELS[code]) return SERIES_LABELS[code]
  const deprefixed = code.replace(/^(envo|sc|sr|hydro)_/, '')
  return slugify(deprefixed)
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
```

Note: `seriesLabel('hydro_lume')` → strips `hydro_` → `lume` → "Lume" by the fallback. The test expects "Hydro Lume", so `hydro_lume` is in `SERIES_LABELS` (it is). The de-prefix regex only removes the listed vendor prefixes; verify the SERIES_LABELS entries cover the asserted cases.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/family-map.test.ts`
Expected: PASS (all assertions).

- [ ] **Step 5: Commit**

```bash
git add src/data/family-map.ts src/data/family-map.test.ts
git commit -m "feat(products): family-map — 7 DB families → 4 marketing, series slug helpers"
```

---

### Task 2: products lib — marketing-family fetch + series grouping (TDD for the pure part)

**Files:**
- Modify: `src/lib/products.ts` (append two exports after `getProductsByFamily`)
- Test: `src/lib/products-grouping.test.ts`

- [ ] **Step 1: Write the failing test for the pure grouping helper**

`src/lib/products-grouping.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { groupProductsBySeries } from './products'
import type { Product } from './products'

const p = (sku: string, series: string | null): Product =>
  ({ sku, series, name: sku } as unknown as Product)

describe('groupProductsBySeries', () => {
  it('groups by series code, null → "other" bucket, preserves order of first appearance', () => {
    const groups = groupProductsBySeries([
      p('A', 'envo_minilux'), p('B', 'hydro_lume'), p('C', 'envo_minilux'), p('D', null),
    ])
    expect(groups.map((g) => g.code)).toEqual(['envo_minilux', 'hydro_lume', null])
    expect(groups[0].products.map((x) => x.sku)).toEqual(['A', 'C'])
    expect(groups[2].code).toBeNull()
    expect(groups[2].products[0].sku).toBe('D')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/products-grouping.test.ts`
Expected: FAIL — `groupProductsBySeries is not exported`.

- [ ] **Step 3: Append to `src/lib/products.ts`**

```ts
import {
  marketingFamilyToDbFamilies,
} from '@/data/family-map'

/** A series group within a family: the DB series code (null = no series) + its products. */
export type SeriesGroup = { code: string | null; products: Product[] }

/** Pure: group products by `series`, null last, preserving first-seen order. */
export function groupProductsBySeries(products: Product[]): SeriesGroup[] {
  const order: (string | null)[] = []
  const map = new Map<string | null, Product[]>()
  for (const prod of products) {
    const key = prod.series ?? null
    if (!map.has(key)) { map.set(key, []); order.push(key) }
    map.get(key)!.push(prod)
  }
  // null bucket sorts last
  order.sort((a, b) => (a === null ? 1 : 0) - (b === null ? 1 : 0))
  return order.map((code) => ({ code, products: map.get(code)! }))
}

/** All enabled/visible products across the DB families a marketing slug maps to. */
export async function getProductsByMarketingFamily(marketingSlug: string): Promise<Product[]> {
  const dbFamilies = marketingFamilyToDbFamilies(marketingSlug)
  if (dbFamilies.length === 0) return []
  const lists = await Promise.all(dbFamilies.map((f) => getProductsByFamily(f)))
  return lists.flat()
}
```

(Place the `import` with the other top-of-file imports; place the functions after `getProductsByFamily`.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/products-grouping.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/products.ts src/lib/products-grouping.test.ts
git commit -m "feat(products): getProductsByMarketingFamily + groupProductsBySeries"
```

---

### Task 3: Spec-group config for the generic detail page

**Files:**
- Create: `src/components/products/spec-groups.ts`

- [ ] **Step 1: Create `spec-groups.ts`**

```ts
// Declarative spec layout for the generic product detail page. Each group renders
// only if ≥1 of its rows has a value. Formatters keep dual units / enum labels
// consistent with the rest of the site.
import { formatDims, mmToIn } from '@/lib/units'
import type { Product } from '@/lib/products'

export type SpecRow = { label: string; value: (p: Product) => string | null }
export type SpecGroup = { title: string; rows: SpecRow[] }

const num = (v: number | null | undefined, unit = ''): string | null =>
  v == null ? null : `${v}${unit}`
const dimsImperial = (mm: number | null | undefined): string | null => {
  const inch = mmToIn(mm ?? null)
  return mm == null ? null : `${mm} mm (${inch} in)`
}
const list = (v: string[] | null | undefined): string | null =>
  v && v.length ? v.join(', ') : null
const OP_MODE: Record<string, string> = { cv: 'Constant voltage', cc: 'Constant current', cv_cc: 'CV / CC' }

export const SPEC_GROUPS: SpecGroup[] = [
  {
    title: 'Electrical',
    rows: [
      { label: 'Power', value: (p) => num(p.power_w, ' W') },
      { label: 'Output voltage', value: (p) => num(p.output_voltage_v, ' V') },
      { label: 'Input voltage', value: (p) =>
        p.input_voltage_min_v != null && p.input_voltage_max_v != null
          ? `${p.input_voltage_min_v}–${p.input_voltage_max_v} V` : null },
      { label: 'Rated current', value: (p) => num(p.rated_current_a, ' A') },
      { label: 'Outputs', value: (p) => num(p.number_of_outputs) },
      { label: 'Operation mode', value: (p) => p.operation_mode ? OP_MODE[p.operation_mode] ?? p.operation_mode : null },
      { label: 'Dimming / control', value: (p) => list(p.dimming_control) },
    ],
  },
  {
    title: 'Light output',
    rows: [
      { label: 'Brightness', value: (p) => num(p.brightness_lm, ' lm') },
      { label: 'Efficacy', value: (p) => num(p.efficacy_lm_w, ' lm/W') },
      { label: 'Colour temperature', value: (p) => num(p.cct_k, ' K') },
      { label: 'CRI', value: (p) => num(p.cri) },
      { label: 'Beam angle', value: (p) => num(p.beam_angle_deg, '°') },
      { label: 'LED colour', value: (p) => p.led_chip_colour ?? null },
      { label: 'Max in series', value: (p) => num(p.max_in_series) },
      { label: 'Lifetime', value: (p) => num(p.lifetime_hrs, ' h') },
    ],
  },
  {
    title: 'Control',
    rows: [
      { label: 'Controller type', value: (p) => list(p.controller_type) },
      { label: 'Output channels', value: (p) => p.output_channel ?? null },
      { label: 'Output type', value: (p) => p.output_type ?? null },
    ],
  },
  {
    title: 'Physical',
    rows: [
      { label: 'Dimensions', value: (p) => formatDims(p.length_mm, p.width_mm, p.height_mm) },
      { label: 'Weight', value: (p) => num(p.weight_kg, ' kg') },
      { label: 'IP rating', value: (p) => p.waterproof ? p.waterproof.toUpperCase().replace('IP', 'IP') : null },
      { label: 'Operating temp', value: (p) =>
        p.temp_min_c != null && p.temp_max_c != null
          ? `${p.temp_min_c} °C to ${p.temp_max_c} °C` : null },
      { label: 'Material', value: (p) => p.material ?? null },
      { label: 'Finish', value: (p) => p.finish_colour ?? null },
      { label: 'Mounting', value: (p) => p.mounting_info ?? null },
    ],
  },
  {
    title: 'Certifications',
    rows: [
      { label: 'Standards', value: (p) => list(p.standards_met) },
    ],
  },
  {
    title: 'Support',
    rows: [
      { label: 'Warranty', value: (p) => num(p.warranty_years, p.warranty_years === 1 ? ' year' : ' years') },
    ],
  },
]
```

(`dimsImperial` is defined for reference but `formatDims` from `units.ts` already emits dual units; use `formatDims`. If lint flags `dimsImperial`/`num` unused, delete `dimsImperial`.)

- [ ] **Step 2: Verify** — `npx tsc --noEmit` → PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/products/spec-groups.ts
git commit -m "feat(products): declarative spec-group config for detail page"
```

---

### Task 4: `GenericProductDetail` component

**Files:**
- Create: `src/components/products/GenericProductDetail.tsx`
- Create: `src/components/products/GenericProductDetail.module.css`

- [ ] **Step 1: Create `GenericProductDetail.module.css`**

```css
.specTable { width: 100%; border-collapse: collapse; margin: 0 0 28px; }
.groupTitle { font-size: 13px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
  color: var(--envo-blue, #0071bc); padding: 22px 0 8px; }
.specTable tr { border-bottom: 1px solid var(--color-border, #e4e9f0); }
.specTable th { text-align: left; font-weight: 500; color: #5a6b82; padding: 11px 16px 11px 0; width: 40%; vertical-align: top; }
.specTable td { padding: 11px 0; font-weight: 600; color: #14233b; }
.layout { display: grid; grid-template-columns: 1fr 1.2fr; gap: 40px; align-items: start; }
.imgCol { border: 1px solid var(--color-border, #e4e9f0); border-radius: 16px; overflow: hidden; background: #fff; aspect-ratio: 1/1; display: flex; align-items: center; justify-content: center; }
.imgCol img { width: 86%; height: 86%; object-fit: contain; }
.related { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-top: 18px; }
@media (max-width: 900px) { .layout { grid-template-columns: 1fr; } .related { grid-template-columns: repeat(2, 1fr); } }
```

- [ ] **Step 2: Create `GenericProductDetail.tsx`**

```tsx
/* eslint-disable @next/next/no-img-element */
import { Fragment } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { resolveProductImage, type Product } from '@/lib/products'
import { SPEC_GROUPS } from './spec-groups'
import { dbFamilyToMarketing, seriesSlug, seriesLabel } from '@/data/family-map'
import styles from './GenericProductDetail.module.css'

function ProductImg({ product }: { product: Product }) {
  const img = resolveProductImage(product, '/assets/images/cat-modules.png')
  return img.isLocal
    ? <Image src={img.src} alt={img.alt} width={520} height={520} />
    : <img src={img.src} alt={img.alt} />
}

export function GenericProductDetail({
  product, related,
}: { product: Product; related: Product[] }) {
  const marketing = dbFamilyToMarketing(product.family ?? '')
  const familySlug = marketing?.slug ?? 'led-signage-modules'
  const familyLabel = marketing?.label ?? 'Products'
  const sSlug = seriesSlug(product.series)
  const sLabel = seriesLabel(product.series)

  return (
    <div className="theme-light">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link><span className="sep">›</span>
          <Link href="/products">Products</Link><span className="sep">›</span>
          <Link href={`/products/${familySlug}`}>{familyLabel}</Link><span className="sep">›</span>
          <Link href={`/products/${familySlug}/${sSlug}`}>{sLabel}</Link><span className="sep">›</span>
          <span>{product.name}</span>
        </div>
      </div>

      <section className="sig-hero">
        <div className="container">
          <div className={styles.layout}>
            <div className={styles.imgCol}><ProductImg product={product} /></div>
            <div>
              <span className="sig-eyebrow">{sLabel}</span>
              <h1>{product.name}</h1>
              {product.subtitle && <p className="sig-hero-desc">{product.subtitle}</p>}
              {product.short_description && <p>{product.short_description}</p>}
              <p style={{ color: '#5a6b82', fontSize: 13 }}>SKU: {product.sku}</p>
              {product.spec_sheet_url && (
                <a className="v4-btn v4-btn-primary" href={product.spec_sheet_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', marginTop: 12 }}>
                  Datasheet (PDF)
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="container" style={{ padding: '32px 0 64px' }}>
        {product.description && <p style={{ maxWidth: '70ch', marginBottom: 28 }}>{product.description}</p>}
        <table className={styles.specTable}>
          <tbody>
            {SPEC_GROUPS.map((group) => {
              const rows = group.rows.map((r) => ({ label: r.label, value: r.value(product) })).filter((r) => r.value)
              if (rows.length === 0) return null
              return (
                <Fragment key={group.title}>
                  <tr><td className={styles.groupTitle} colSpan={2}>{group.title}</td></tr>
                  {rows.map((r) => (
                    <tr key={group.title + r.label}><th>{r.label}</th><td>{r.value}</td></tr>
                  ))}
                </Fragment>
              )
            })}
          </tbody>
        </table>

        {related.length > 0 && (
          <>
            <h2 style={{ fontSize: 20, marginBottom: 4 }}>More in {sLabel}</h2>
            <div className={styles.related}>
              {related.map((r) => (
                <Link key={r.sku} href={`/products/${familySlug}/${seriesSlug(r.series)}/${r.sku}`} className="seriesCard">
                  {r.name}
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
```

- [ ] **Step 3: Verify** — `npx tsc --noEmit` → PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/products/GenericProductDetail.tsx src/components/products/GenericProductDetail.module.css
git commit -m "feat(products): GenericProductDetail — DB-field spec table, empty groups hidden, no price"
```

---

### Task 5: SKU detail route `/products/[slug]/[series]/[sku]`

**Files:**
- Create: `src/app/(frontend)/products/[slug]/[series]/[sku]/page.tsx`

- [ ] **Step 1: Create the route**

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProduct, getProductsByMarketingFamily, type Product } from '@/lib/products'
import { dbFamilyToMarketing, seriesSlug } from '@/data/family-map'
import { listProducts } from '@/lib/products'
import { GenericProductDetail } from '@/components/products/GenericProductDetail'

type Params = Promise<{ slug: string; series: string; sku: string }>

export const dynamicParams = false

export async function generateStaticParams() {
  const { docs } = await listProducts({ limit: 1000 })
  return docs
    .map((p) => {
      const m = dbFamilyToMarketing(p.family ?? '')
      if (!m) return null
      return { slug: m.slug, series: seriesSlug(p.series), sku: p.sku }
    })
    .filter((x): x is { slug: string; series: string; sku: string } => x !== null)
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { sku } = await params
  const product = await getProduct(sku)
  if (!product) return {}
  return {
    title: `${product.name} — ENVO`,
    description: product.short_description ?? product.subtitle ?? undefined,
  }
}

export default async function ProductDetailPage({ params }: { params: Params }) {
  const { slug, sku } = await params
  const product = await getProduct(sku)
  if (!product || product.hidden) notFound()
  // Guard: the family in the URL must match the product's actual family.
  const m = dbFamilyToMarketing(product.family ?? '')
  if (!m || m.slug !== slug) notFound()

  // Related = up to 4 siblings in the same series (excluding self).
  const family = await getProductsByMarketingFamily(slug)
  const related = family
    .filter((p: Product) => p.series === product.series && p.sku !== product.sku)
    .slice(0, 4)

  return <GenericProductDetail product={product} related={related} />
}
```

- [ ] **Step 2: Verify** — `npx tsc --noEmit` → PASS.

- [ ] **Step 3: Verify static params count (every product reachable)**

Start/confirm dev server, then build params count by querying the API (proxy for generateStaticParams):
Run:
```bash
curl -s "http://localhost:3000/api/products?limit=0&depth=0" | python3 -c "import sys,json;print('products:',json.load(sys.stdin)['totalDocs'])"
```
Expected: `products: 224`. (Confirms the route will emit ~224 SKU pages; a few may drop if `family` is unmapped — none are, per the map.)

- [ ] **Step 4: Commit**

```bash
git add "src/app/(frontend)/products/[slug]/[series]/[sku]/page.tsx"
git commit -m "feat(products): generic SKU detail route, DB-driven static params"
```

---

### Task 6: Generic series view + branch in the series page

**Files:**
- Create: `src/components/products/ProductCardGrid.tsx`
- Modify: `src/app/(frontend)/products/[slug]/[series]/page.tsx`

- [ ] **Step 1: Create `ProductCardGrid.tsx`**

```tsx
/* eslint-disable @next/next/no-img-element */
import Image from 'next/image'
import Link from 'next/link'
import { resolveProductImage, type Product } from '@/lib/products'
import { seriesSlug } from '@/data/family-map'
import styles from '@/app/(frontend)/products/[slug]/page.module.css'

export function ProductCardGrid({ products, familySlug }: { products: Product[]; familySlug: string }) {
  return (
    <div className={styles.seriesGrid}>
      {products.map((p) => {
        const img = resolveProductImage(p, '/assets/images/cat-modules.png')
        return (
          <Link key={p.sku} href={`/products/${familySlug}/${seriesSlug(p.series)}/${p.sku}`} className={styles.seriesCard}>
            <div className={`${styles.seriesCardThumb} ${styles.seriesCardThumbBrand}`}>
              {img.isLocal
                ? <Image src={img.src} alt={img.alt} width={400} height={250} sizes="(min-width:1000px) 33vw, 50vw" />
                : <img src={img.src} alt={img.alt} />}
            </div>
            <div className={styles.seriesCardBody}>
              <h3 className={styles.seriesCardName}>{p.name}</h3>
              {p.subtitle && <p className={styles.seriesCardDesc}>{p.subtitle}</p>}
              <span className={styles.seriesCardCta}>View details <span>→</span></span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Modify the series page — add a DB-driven generic fallback branch + DB static params**

In `src/app/(frontend)/products/[slug]/[series]/page.tsx`:

(a) Replace `generateStaticParams` so every DB series is emitted (keeps curated ones too):

```tsx
import { getProductsByMarketingFamily } from '@/lib/products'
import { seriesSlug as toSeriesSlug, seriesLabel } from '@/data/family-map'
import { ProductCardGrid } from '@/components/products/ProductCardGrid'

export async function generateStaticParams() {
  const params: { slug: string; series: string }[] = []
  for (const f of ['led-signage-modules', 'led-drivers', 'control-gear', 'accessories']) {
    const products = await getProductsByMarketingFamily(f)
    const slugs = new Set(products.map((p) => toSeriesSlug(p.series)))
    for (const s of slugs) params.push({ slug: f, series: s })
  }
  return params
}
```

(b) At the **end** of `SeriesDetailPage`, replace the existing `if (!seriesObj) notFound()` (line ~49) so that, instead of 404-ing when there is no curated config, it renders the generic grid:

Change:
```tsx
  const seriesObj = family.series.find((s): s is LiveSeries => isLive(s) && s.slug === series)
  if (!seriesObj) notFound()
```
to:
```tsx
  const seriesObj = family.series.find((s): s is LiveSeries => isLive(s) && s.slug === series)
  if (!seriesObj) {
    // No curated config → DB-driven generic series view.
    const all = await getProductsByMarketingFamily(slug)
    const products = all.filter((p) => toSeriesSlug(p.series) === series)
    if (products.length === 0) notFound()
    return (
      <div className="theme-light">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link><span className="sep">›</span>
            <Link href="/products">Products</Link><span className="sep">›</span>
            <Link href={`/products/${slug}`}>{family.name}</Link><span className="sep">›</span>
            <span>{seriesLabel(products[0].series)}</span>
          </div>
        </div>
        <section className="sig-hero"><div className="container"><div className="sig-hero-inner">
          <span className="sig-eyebrow">{family.name}</span>
          <h1>{seriesLabel(products[0].series)}</h1>
          <p className="sig-hero-desc">{products.length} products in this series</p>
        </div></div></section>
        <section className={familyStyles.sectionWrap}>
          <ProductCardGrid products={products} familySlug={slug} />
        </section>
      </div>
    )
  }
```

(The `family` lookup above `seriesObj` already runs and `notFound()`s on an unknown family, so `family` is defined here. `familyStyles` is already imported as `'../page.module.css'`.)

- [ ] **Step 3: Verify** — `npx tsc --noEmit` → PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/products/ProductCardGrid.tsx "src/app/(frontend)/products/[slug]/[series]/page.tsx"
git commit -m "feat(products): generic DB-driven series view + DB-driven series static params"
```

---

### Task 7: Family page — DB-driven series list

**Files:**
- Modify: `src/app/(frontend)/products/[slug]/page.tsx`

- [ ] **Step 1: Replace the series grid with DB-derived series**

Keep the hero + trust-badges sections (curated, fine). Replace the `<section className={styles.sectionWrap}>…</section>` block (lines 62-101) with a DB-driven series grid. Add imports and fetch:

```tsx
import { getProductsByMarketingFamily, groupProductsBySeries, resolveProductImage } from '@/lib/products'
import { seriesSlug, seriesLabel } from '@/data/family-map'
```

In the component body, after `if (!family) notFound()`:

```tsx
  const products = await getProductsByMarketingFamily(slug)
  const groups = groupProductsBySeries(products)
```

Replace the series `<section>` with:

```tsx
      <section className={styles.sectionWrap}>
        <div className={styles.seriesGrid}>
          {groups.map((g) => {
            const rep = g.products[0]
            const img = resolveProductImage(rep, '/assets/images/cat-modules.png')
            return (
              <Link
                key={g.code ?? 'other'}
                href={`/products/${slug}/${seriesSlug(g.code)}`}
                className={styles.seriesCard}
              >
                <div className={`${styles.seriesCardThumb} ${styles.seriesCardThumbBrand}`}>
                  {img.isLocal
                    ? <Image src={img.src} alt={img.alt} width={400} height={250} sizes="(min-width:1000px) 33vw, 50vw" />
                    : <img src={img.src} alt={img.alt} />}
                </div>
                <div className={styles.seriesCardBody}>
                  <h3 className={styles.seriesCardName}>{seriesLabel(g.code)}</h3>
                  <p className={styles.seriesCardDesc}>{g.products.length} products</p>
                  <span className={styles.seriesCardCta}>View range <span>→</span></span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
```

Add `/* eslint-disable @next/next/no-img-element */` as the file's first line (it now uses `<img>` for remote images). Remove the now-unused `SeriesLink` import and `isLive` helper if they are no longer referenced.

- [ ] **Step 2: Verify** — `npx tsc --noEmit` → PASS.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(frontend)/products/[slug]/page.tsx"
git commit -m "feat(products): family page lists real DB series with product counts"
```

---

### Task 8: Full verification

- [ ] **Step 1: tsc + lint + unit tests**

Run:
```bash
npx tsc --noEmit                       # expect: clean
npx eslint src/data/family-map.ts src/lib/products.ts src/components/products "src/app/(frontend)/products"   # expect: clean
npx vitest run src/data/family-map.test.ts src/lib/products-grouping.test.ts   # expect: all pass
npm test                               # full suite still green
```

- [ ] **Step 2: Render spot-checks (dev server on :3000)**

Pick real SKUs from each family and confirm 200 + correct content:
```bash
# A module (mini-series stays bespoke), a CV driver, a controller, a sensor
curl -s -o /dev/null -w "drivers family: %{http_code}\n"  "http://localhost:3000/products/led-drivers"
curl -s -o /dev/null -w "a cv series: %{http_code}\n"     "http://localhost:3000/products/led-drivers/sc-envo"
curl -s -o /dev/null -w "mini-series: %{http_code}\n"     "http://localhost:3000/products/led-signage-modules/mini-series"
curl -s -o /dev/null -w "a sku page: %{http_code}\n"      "http://localhost:3000/products/led-drivers/sc-envo/SRP-2305N-65CC500-1500"
tail -20 /tmp/envo-dev.log
```
Expected: all 200, clean log. (Use an actual SKU from the API if the example differs.)

- [ ] **Step 3: Headless screenshot of a generic SKU page at 1440×900**

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --hide-scrollbars \
  --window-size=1440,900 --screenshot=/tmp/sku-detail.png "http://localhost:3000/products/led-drivers/sc-envo/<REAL_SKU>"
```
Read the screenshot: breadcrumb resolves, image shows, spec groups render with only-populated rows, no certs section (empty today), **no price** anywhere.

- [ ] **Step 4: Confirm no price leak**

```bash
curl -s "http://localhost:3000/products/led-drivers/sc-envo/<REAL_SKU>" | grep -i "price\|\\$[0-9]" || echo "no price in HTML — OK"
```
Expected: `no price in HTML — OK`.

- [ ] **Step 5: User visual confirmation** before finishing.

---

## Self-review notes

- **Spec coverage:** family map (T1), series slug/label (T1), marketing-family fetch + grouping (T2), generic detail page + spec groups + hidden-empty-groups + no-price (T3/T4/T5), nested SKU route + DB static params (T5), generic series view (T6), DB-driven family page (T7), edge case no-series → `other` bucket (T1 `seriesSlug(null)`, grouping null last, series page generic branch), mini-series + curated series preserved (T6 keeps the existing branches above the fallback), verification incl. 224 count + price-leak check (T8). Non-goals (no sync/data/price/cart) respected.
- **Name consistency:** `dbFamilyToMarketing`, `marketingFamilyToDbFamilies`, `seriesSlug`, `seriesCodeFromSlug`, `seriesLabel`, `groupProductsBySeries`, `getProductsByMarketingFamily`, `SeriesGroup`, `SPEC_GROUPS`, `GenericProductDetail`, `ProductCardGrid` — used identically across tasks. The series page imports `seriesSlug` aliased as `toSeriesSlug` to avoid colliding with any local symbol.
- **Placeholder scan:** `<REAL_SKU>` in T8 is intentional (the engineer substitutes a SKU from the live API) — every code file is complete.
