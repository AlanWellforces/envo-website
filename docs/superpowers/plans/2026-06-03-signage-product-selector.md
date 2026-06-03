# Signage Product Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a SKU-level, filterable signage module selector at `/resources/tools/signage-selector`, built on a reusable, config-driven `ProductSelectorTable`.

**Architecture:** A Server Component page reads signage products via a new `getProductsForSelector()` helper (over the existing Payload `Products` collection) and hands rows + a per-family config to a Client Component table that does in-browser filtering. Pure helpers (`units.ts`, LED-count parser, the reader's row mapping) are TDD'd; the component and page are verified by running the route. Editorial bits (series labels/order, "best for", detail hrefs) live in Git `selector-config.ts`.

**Tech Stack:** Next.js 16 App Router, TypeScript, Payload local API, Vitest, CSS Modules (Tailwind v4 tokens).

**Spec:** [`docs/superpowers/specs/2026-06-03-signage-product-selector-design.md`](../specs/2026-06-03-signage-product-selector-design.md)

---

## File Structure

- Create: `src/lib/units.ts` — `mmToIn()`, `formatDims()` dual-unit helpers (pure).
- Create: `src/lib/units.test.ts` — unit tests.
- Create: `src/data/selector-config.ts` — per-family selector config; signage entry (columns, filters, series label/order/detailHref/bestFor).
- Create: `src/lib/product-selector.ts` — `parseLedCount()` + `getProductsForSelector(familyCode)` reader → `SelectorRow[]`.
- Create: `src/lib/product-selector.test.ts` — unit tests for the parser + row mapping.
- Create: `src/components/resources/ProductSelectorTable.tsx` — `'use client'` table + filter bar.
- Create: `src/components/resources/ProductSelectorTable.module.css` — industrial styling.
- Create: `src/app/(frontend)/resources/tools/signage-selector/page.tsx` — Server Component page.
- Modify: `src/app/(frontend)/resources/tools/page.tsx` — replace stub body with a link to the selector.

---

## Task 1: Dual-unit helpers (`units.ts`)

**Files:**
- Create: `src/lib/units.ts`
- Test: `src/lib/units.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/units.test.ts
import { describe, it, expect } from 'vitest'
import { mmToIn, formatDims } from './units'

describe('mmToIn', () => {
  it('converts mm to inches rounded to 2 dp', () => {
    expect(mmToIn(25.4)).toBe(1)
    expect(mmToIn(43)).toBe(1.69)
  })
  it('returns null for null input', () => {
    expect(mmToIn(null)).toBeNull()
  })
})

describe('formatDims', () => {
  it('formats L×W×H in mm and inches', () => {
    expect(formatDims(43, 23, 11.6)).toEqual({
      mm: '43 × 23 × 11.6 mm',
      in: '1.69 × 0.91 × 0.46 in',
    })
  })
  it('returns null when any dimension is missing', () => {
    expect(formatDims(43, null, 11.6)).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/units.test.ts`
Expected: FAIL — "Failed to resolve import './units'".

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/units.ts
// Pure unit helpers. Brand rule: metric primary, US imperial in parentheses,
// so US installers (powersupplymall.com) never have to do mental math.

/** Millimetres → inches, rounded to 2 dp. Null-safe. */
export function mmToIn(mm: number | null | undefined): number | null {
  if (mm == null) return null
  return Math.round((mm / 25.4) * 100) / 100
}

/** Format an L×W×H triple as dual-unit strings, or null if any side is missing. */
export function formatDims(
  l: number | null | undefined,
  w: number | null | undefined,
  h: number | null | undefined,
): { mm: string; in: string } | null {
  if (l == null || w == null || h == null) return null
  return {
    mm: `${l} × ${w} × ${h} mm`,
    in: `${mmToIn(l)} × ${mmToIn(w)} × ${mmToIn(h)} in`,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/units.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/units.ts src/lib/units.test.ts
git commit -m "feat(units): dual-unit mm/inch helpers"
```

---

## Task 2: LED-count parser

**Files:**
- Create: `src/lib/product-selector.ts` (parser only this task)
- Test: `src/lib/product-selector.test.ts`

LED count is not an Akeneo field — it is encoded in the product name (e.g. "Backlit - Quad LED"). All 73 signage names parse with the tokens Single / Duo / Double / Triple / Quad, plus a numeric "N LED" fallback.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/product-selector.test.ts
import { describe, it, expect } from 'vitest'
import { parseLedCount } from './product-selector'

describe('parseLedCount', () => {
  it('maps word tokens to a normalised label', () => {
    expect(parseLedCount('ENVO EcoGlo LED Module Backlit - Quad LED')).toBe('Quad')
    expect(parseLedCount('ENVO MiniLux LED Module Backlit - Triple LED')).toBe('Triple')
    expect(parseLedCount('ENVO EdgeLume LED Module Sidelit - Single LED')).toBe('Single')
    expect(parseLedCount('ENVO EcoGlo Backlit - Duo LED')).toBe('Duo')
    expect(parseLedCount('ENVO EdgeBlade2 Sidelit - Double LED')).toBe('Double')
  })
  it('maps a numeric "N LED" to a word label', () => {
    expect(parseLedCount('ENVO Something 2 LED Module')).toBe('Duo')
    expect(parseLedCount('ENVO Something 4 LED')).toBe('Quad')
  })
  it('returns null when no LED count is present', () => {
    expect(parseLedCount('ENVO Mystery Module')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/product-selector.test.ts`
Expected: FAIL — "Failed to resolve import './product-selector'".

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/product-selector.ts
// Server-only. Reads signage/driver/etc. products from the Payload `Products`
// collection and flattens them into rows for the <ProductSelectorTable>.
// Do NOT import from a client component.

const NUM_TO_WORD: Record<number, string> = { 1: 'Single', 2: 'Duo', 3: 'Triple', 4: 'Quad' }

/** Extract an LED-count label from a product name, or null. */
export function parseLedCount(name: string): string | null {
  const word = name.match(/\b(Single|Duo|Double|Triple|Quad)\b/i)
  if (word) return word[1][0].toUpperCase() + word[1].slice(1).toLowerCase()
  const num = name.match(/\b(\d+)\s*LED\b/i)
  if (num) return NUM_TO_WORD[Number(num[1])] ?? `${num[1]}-LED`
  return null
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/product-selector.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/product-selector.ts src/lib/product-selector.test.ts
git commit -m "feat(selector): LED-count name parser"
```

---

## Task 3: Selector config (`selector-config.ts`)

**Files:**
- Create: `src/data/selector-config.ts`

Holds editorial + display config per family. Signage only this milestone. `detailHref` is null for series whose detail page is not built yet (only MiniLux & EcoGlo are live). `order` controls column position; series not listed fall back to a humanised label and sort last.

- [ ] **Step 1: Write the config (no test — pure data; consumed/typed in Task 4 & 5)**

```ts
// src/data/selector-config.ts
// Editorial + display config for the product selector tables (Git-owned, per
// the three-source rule). Product spec VALUES come from Akeneo; this file only
// names/orders series and declares which columns/filters a family shows.
// Eventually superseded by a Payload `Series` collection (deferred).

export type SelectorColumn =
  | 'image' | 'model' | 'series' | 'ledCount' | 'output' | 'power'
  | 'beam' | 'cri' | 'ip' | 'maxRun' | 'dims' | 'actions'

export type SelectorFilter = 'search' | 'series' | 'ledCount' | 'voltage' | 'cct' | 'ip' | 'maxHeight'

export type SeriesMeta = {
  /** Akeneo `series` value, e.g. "envo_ecoglo". */
  code: string
  /** Display name, e.g. "EcoGlo". */
  label: string
  /** "Best for" tagline shown in the series group header. */
  bestFor: string
  /** 'backlit' | 'sidelit' — groups the table into two zones. */
  type: 'backlit' | 'sidelit'
  /** Detail page href, or null if the series page is not built yet. */
  detailHref: string | null
}

export type FamilySelectorConfig = {
  familyCode: string
  title: string
  intro: string
  columns: SelectorColumn[]
  filters: SelectorFilter[]
  /** Ordered; first match wins. Series absent here render with a humanised label, sorted last. */
  series: SeriesMeta[]
}

export const SIGNAGE_SELECTOR: FamilySelectorConfig = {
  familyCode: 'led_module',
  title: 'Signage module selector',
  intro:
    'Filter ENVO signage modules by output, beam, ingress rating and size — find the exact model, then open its series page or grab the datasheet.',
  columns: ['image', 'model', 'series', 'ledCount', 'output', 'power', 'beam', 'cri', 'ip', 'maxRun', 'dims', 'actions'],
  filters: ['search', 'series', 'ledCount', 'voltage', 'cct', 'ip', 'maxHeight'],
  series: [
    { code: 'envo_ecoglo',     label: 'EcoGlo',     bestFor: 'Everyday workhorse',          type: 'backlit', detailHref: '/products/led-signage-modules/eco-series' },
    { code: 'envo_proglo',     label: 'ProGlo',     bestFor: 'High-clarity mid-range',      type: 'backlit', detailHref: null },
    { code: 'envo_ultraflare', label: 'UltraFlare', bestFor: 'Deep lightboxes, big letters', type: 'backlit', detailHref: null },
    { code: 'envo_minilux',    label: 'MiniLux',    bestFor: 'Shallow cabinets · 8.9 mm',    type: 'backlit', detailHref: '/products/led-signage-modules/mini-series' },
    { code: 'hydro_lume',      label: 'HydroLume',  bestFor: 'Wet / coastal installs',       type: 'backlit', detailHref: null },
    { code: 'envo_optilume',   label: 'OptiLume',   bestFor: 'Long 24 V runs',               type: 'backlit', detailHref: null },
    { code: 'envo_chromaflux', label: 'ChromaFlux', bestFor: 'Full-colour RGB signs',        type: 'backlit', detailHref: null },
    { code: 'envo_edgelume',   label: 'EdgeLume',   bestFor: 'Thin edge-lit',                type: 'sidelit', detailHref: null },
    { code: 'envo_edgeflare',  label: 'EdgeFlare',  bestFor: 'Edge-lit, brighter',           type: 'sidelit', detailHref: null },
    { code: 'envo_edgeblade',  label: 'EdgeBlade',  bestFor: 'Edge-lit, max output',         type: 'sidelit', detailHref: null },
    { code: 'edge_blade_2',    label: 'EdgeBlade 2', bestFor: 'Edge-lit, double-row',        type: 'sidelit', detailHref: null },
  ],
}

export const SELECTOR_CONFIGS: Record<string, FamilySelectorConfig> = {
  signage: SIGNAGE_SELECTOR,
}
```

- [ ] **Step 2: Type-check the new file compiles**

Run: `npx tsc --noEmit 2>&1 | grep selector-config || echo "no selector-config type errors"`
Expected: `no selector-config type errors`.

- [ ] **Step 3: Commit**

```bash
git add src/data/selector-config.ts
git commit -m "feat(selector): signage family config (columns, filters, series meta)"
```

---

## Task 4: `getProductsForSelector()` reader + row mapping

**Files:**
- Modify: `src/lib/product-selector.ts`
- Test: `src/lib/product-selector.test.ts`

Reuses the existing `listProducts({ family })` (in `src/lib/products.ts`) and `resolveProductImage`. Maps each `Product` to a flat `SelectorRow`. Voltage from `led_light_power_input` (`power_input_12V` → `'12V'`); IP from `waterproof`; series label/type/detailHref from `selector-config.ts`; dims via `formatDims`.

- [ ] **Step 1: Write the failing test (append to existing test file)**

```ts
// append to src/lib/product-selector.test.ts
import { vi } from 'vitest'

const mockList = vi.fn()
vi.mock('./products', async (orig) => ({
  ...(await orig<typeof import('./products')>()),
  listProducts: (...a: unknown[]) => mockList(...a),
}))

import { getProductsForSelector } from './product-selector'

describe('getProductsForSelector', () => {
  it('maps signage products to selector rows', async () => {
    mockList.mockResolvedValue({ docs: [{
      sku: 'EV-BLEG04LBY-NW', name: 'ENVO EcoGlo LED Module Backlit - Quad LED',
      series: 'envo_ecoglo', led_light_power_input: ['power_input_12V'],
      power_w: 1.6, brightness_lm: 160, efficacy_lm_w: 100, cri: 80, beam_angle_deg: 170,
      waterproof: 'ip65', max_in_series: 20, length_mm: 70, width_mm: 22, height_mm: 12,
      cct_k: 4000, clean_image_url_fallback: 'https://x/clean.png', image_url_fallback: null,
    }], totalDocs: 1, totalPages: 1 })

    const rows = await getProductsForSelector('signage')
    expect(mockList).toHaveBeenCalledWith({ family: 'led_module' })
    expect(rows[0]).toMatchObject({
      sku: 'EV-BLEG04LBY-NW', seriesLabel: 'EcoGlo', seriesType: 'backlit',
      voltage: '12V', ledCount: 'Quad', cct: '4K', ip: 'IP65',
      detailHref: '/products/led-signage-modules/eco-series',
      image: 'https://x/clean.png',
    })
    expect(rows[0].dims).toEqual({ mm: '70 × 22 × 12 mm', in: '2.76 × 0.87 × 0.47 in' })
  })

  it('falls back to a humanised label + null detailHref for unconfigured series', async () => {
    mockList.mockResolvedValue({ docs: [{
      sku: 'X', name: 'ENVO Foo Backlit - Single LED', series: 'envo_unknown',
      led_light_power_input: ['power_input_24V'], waterproof: 'ip67', cct_k: 7000,
    }], totalDocs: 1, totalPages: 1 })
    const rows = await getProductsForSelector('signage')
    expect(rows[0]).toMatchObject({ seriesLabel: 'Envo Unknown', detailHref: null, voltage: '24V' })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/product-selector.test.ts`
Expected: FAIL — "getProductsForSelector is not a function".

- [ ] **Step 3: Implement the reader (append to `src/lib/product-selector.ts`)**

```ts
// append to src/lib/product-selector.ts
import { listProducts, resolveProductImage, type Product } from './products'
import { formatDims } from './units'
import { SELECTOR_CONFIGS, type SeriesMeta } from '@/data/selector-config'

export type SelectorRow = {
  sku: string
  name: string
  seriesCode: string
  seriesLabel: string
  seriesType: 'backlit' | 'sidelit'
  detailHref: string | null
  voltage: string | null
  ledCount: string | null
  power_w: number | null
  brightness_lm: number | null
  efficacy_lm_w: number | null
  beam: string | null
  cct: string | null
  cri: number | null
  ip: string | null
  maxInSeries: number | null
  heightMm: number | null
  dims: { mm: string; in: string } | null
  image: string
  specSheetUrl: string | null
}

function humanise(code: string): string {
  return code.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function voltageOf(p: Product): string | null {
  const first = (p.led_light_power_input ?? [])[0]
  return first ? first.replace('power_input_', '') : null
}

export async function getProductsForSelector(family: string): Promise<SelectorRow[]> {
  const cfg = SELECTOR_CONFIGS[family]
  if (!cfg) throw new Error(`No selector config for family "${family}"`)
  const { docs } = await listProducts({ family: cfg.familyCode })
  const metaByCode = new Map<string, SeriesMeta>(cfg.series.map((s) => [s.code, s]))

  return docs.map((p): SelectorRow => {
    const meta = p.series ? metaByCode.get(p.series) : undefined
    return {
      sku: p.sku,
      name: p.name.replace(/^ENVO\s+/, '').replace(/\s+LED Module/, ''),
      seriesCode: p.series ?? '',
      seriesLabel: meta?.label ?? (p.series ? humanise(p.series) : '—'),
      seriesType: meta?.type ?? 'backlit',
      detailHref: meta?.detailHref ?? null,
      voltage: voltageOf(p),
      ledCount: parseLedCount(p.name),
      power_w: p.power_w,
      brightness_lm: p.brightness_lm,
      efficacy_lm_w: p.efficacy_lm_w,
      beam: p.beam_angle_deg != null ? `${p.beam_angle_deg}°` : null,
      cct: p.cct_k != null ? `${Math.round(p.cct_k / 1000)}K` : null,
      cri: p.cri,
      ip: p.waterproof ? p.waterproof.toUpperCase() : null,
      maxInSeries: p.max_in_series,
      heightMm: p.height_mm,
      dims: formatDims(p.length_mm, p.width_mm, p.height_mm),
      image: resolveProductImage(p, '/assets/images/cat-modules.png').src,
      specSheetUrl: p.spec_sheet_url,
    }
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/product-selector.test.ts`
Expected: PASS (all describe blocks).

- [ ] **Step 5: Commit**

```bash
git add src/lib/product-selector.ts src/lib/product-selector.test.ts
git commit -m "feat(selector): getProductsForSelector reader + row mapping"
```

---

## Task 5: `ProductSelectorTable` client component

**Files:**
- Create: `src/components/resources/ProductSelectorTable.tsx`
- Create: `src/components/resources/ProductSelectorTable.module.css`

Client Component. Receives `rows: SelectorRow[]` + `config: FamilySelectorConfig`. Renders the industrial filter bar (search + selects derived from the data + a max-height range) and a series-grouped table (Backlit zone then Sidelit zone). No server round-trips. This component is verified by running the page in Task 6 (the repo unit-tests lib logic only, not components).

- [ ] **Step 1: Write the CSS module**

```css
/* src/components/resources/ProductSelectorTable.module.css */
.bar { display:flex; flex-wrap:wrap; gap:10px; align-items:flex-end; background:#1e293b; border-radius:10px 10px 0 0; padding:14px 16px; }
.f { display:flex; flex-direction:column; gap:4px; }
.f label { font-size:9.5px; letter-spacing:.12em; text-transform:uppercase; color:#7c8aa0; font-weight:700; }
.f select, .f input { background:#0b1220; color:#e2e8f0; border:1px solid #334155; border-radius:6px; padding:7px 9px; font-size:12.5px; min-width:104px; }
.f select:focus, .f input:focus { outline:none; border-color:#aec90b; }
.search { flex:1; min-width:150px; }
.right { margin-left:auto; display:flex; align-items:center; gap:14px; }
.count { color:#cbd5e1; font-size:12px; } .count b { color:#fff; font-size:15px; }
.reset { background:none; border:1px solid #475569; color:#cbd5e1; border-radius:6px; padding:7px 11px; font-size:11.5px; cursor:pointer; }
.tableWrap { background:#fff; border:1px solid #dbe2ea; border-top:none; border-radius:0 0 10px 10px; overflow:hidden; }
table { border-collapse:collapse; width:100%; }
th, td { padding:9px 11px; text-align:left; border-bottom:1px solid #dbe2ea; }
thead th { background:#f1f5f9; font-size:9.5px; letter-spacing:.09em; text-transform:uppercase; color:#64748b; font-weight:800; border-bottom:2px solid #cbd5e1; }
.num { text-align:right; font-variant-numeric:tabular-nums; }
.thumb { width:66px; height:66px; border-radius:8px; background:#f1f5f9; border:1px solid #dbe2ea; object-fit:contain; display:block; }
.tag { display:inline-block; font-size:10px; font-weight:700; padding:1px 6px; border-radius:4px; background:#eef4f9; color:#0071bc; margin-left:6px; }
.sub { display:block; color:#94a3b8; font-size:10.5px; }
.group td { background:#f8fafc; font-weight:800; font-size:10.5px; letter-spacing:.08em; text-transform:uppercase; color:#0071bc; }
.view { color:#0071bc; font-weight:700; text-decoration:none; font-size:11.5px; }
.view[aria-disabled="true"] { color:#cbd5e1; pointer-events:none; }
.pdf { display:block; color:#64748b; font-size:11px; text-decoration:none; margin-top:3px; }
.none { padding:30px; text-align:center; color:#94a3b8; }
.hint { font-size:11.5px; color:#94a3b8; margin:10px 2px 0; }
```

- [ ] **Step 2: Write the component**

```tsx
// src/components/resources/ProductSelectorTable.tsx
'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { SelectorRow } from '@/lib/product-selector'
import type { FamilySelectorConfig } from '@/data/selector-config'
import styles from './ProductSelectorTable.module.css'

const uniq = (xs: (string | null)[]) =>
  [...new Set(xs.filter((x): x is string => !!x))].sort()

export function ProductSelectorTable({
  rows,
  config,
}: {
  rows: SelectorRow[]
  config: FamilySelectorConfig
}) {
  const [q, setQ] = useState('')
  const [series, setSeries] = useState('')
  const [led, setLed] = useState('')
  const [volt, setVolt] = useState('')
  const [cct, setCct] = useState('')
  const [ip, setIp] = useState('')
  const [maxH, setMaxH] = useState(40)

  const opts = useMemo(
    () => ({
      series: uniq(rows.map((r) => r.seriesLabel)),
      led: uniq(rows.map((r) => r.ledCount)),
      volt: uniq(rows.map((r) => r.voltage)),
      cct: uniq(rows.map((r) => r.cct)),
      ip: uniq(rows.map((r) => r.ip)),
    }),
    [rows],
  )

  const filtered = rows.filter(
    (r) =>
      (!q || (r.name + ' ' + r.sku).toLowerCase().includes(q.toLowerCase())) &&
      (!series || r.seriesLabel === series) &&
      (!led || r.ledCount === led) &&
      (!volt || r.voltage === volt) &&
      (!cct || r.cct === cct) &&
      (!ip || r.ip === ip) &&
      (maxH >= 40 || (r.heightMm != null && r.heightMm <= maxH)),
  )

  const backlit = filtered.filter((r) => r.seriesType === 'backlit')
  const sidelit = filtered.filter((r) => r.seriesType === 'sidelit')

  const reset = () => {
    setQ(''); setSeries(''); setLed(''); setVolt(''); setCct(''); setIp(''); setMaxH(40)
  }

  return (
    <div>
      <div className={styles.bar}>
        <div className={`${styles.f} ${styles.search}`}>
          <label>Search</label>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="model or SKU…" />
        </div>
        <Select label="Series" value={series} set={setSeries} opts={opts.series} />
        <Select label="LED count" value={led} set={setLed} opts={opts.led} />
        <Select label="Voltage" value={volt} set={setVolt} opts={opts.volt} />
        <Select label="CCT" value={cct} set={setCct} opts={opts.cct} />
        <Select label="IP rating" value={ip} set={setIp} opts={opts.ip} />
        <div className={styles.f}>
          <label>Max height {maxH >= 40 ? 'any' : `≤${maxH}mm`}</label>
          <input type="range" min={6} max={40} step={1} value={maxH} onChange={(e) => setMaxH(+e.target.value)} />
        </div>
        <div className={styles.right}>
          <span className={styles.count}><b>{filtered.length}</b> modules</span>
          <button className={styles.reset} onClick={reset}>Reset</button>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table>
          <thead>
            <tr>
              <th></th><th>Model</th><th>Series</th><th>LED</th>
              <th className={styles.num}>Output</th><th className={styles.num}>Power</th>
              <th className={styles.num}>Beam</th><th className={styles.num}>CRI</th><th>IP</th>
              <th className={styles.num}>Max run</th><th>Dimensions (L×W×H)</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td className={styles.none} colSpan={12}>No modules match these filters.</td></tr>
            )}
            <Zone title="Backlit modules" rows={backlit} />
            <Zone title="Sidelit / edge-emitting" rows={sidelit} />
          </tbody>
        </table>
      </div>
      <p className={styles.hint}>
        ↗ <b>View</b> opens the series detail page; greyed = page not built yet.
        Need the full kit? → <Link href="/find-your-match">Find your match</Link>.
      </p>
    </div>
  )

  function Select({ label, value, set, opts }: { label: string; value: string; set: (v: string) => void; opts: string[] }) {
    if (!config.filters.length) return null
    return (
      <div className={styles.f}>
        <label>{label}</label>
        <select value={value} onChange={(e) => set(e.target.value)}>
          <option value="">All</option>
          {opts.map((o) => <option key={o}>{o}</option>)}
        </select>
      </div>
    )
  }

  function Zone({ title, rows }: { title: string; rows: SelectorRow[] }) {
    if (!rows.length) return null
    let cur = ''
    const out: React.ReactNode[] = [
      <tr key={title} className={styles.group}><td colSpan={12}>{title} — {rows.length}</td></tr>,
    ]
    for (const r of rows) {
      if (r.seriesLabel !== cur) {
        cur = r.seriesLabel
        out.push(
          <tr key={`${title}-${cur}`} className={styles.group}>
            <td colSpan={12} style={{ paddingLeft: 22 }}>{cur} — {rows.filter((x) => x.seriesLabel === cur).length}</td>
          </tr>,
        )
      }
      out.push(
        <tr key={r.sku}>
          <td><img className={styles.thumb} loading="lazy" src={r.image} alt="" /></td>
          <td><strong>{r.name}</strong>{r.voltage && <span className={styles.tag}>{r.voltage}</span>}<span className={styles.sub}>{r.sku}</span></td>
          <td><span className={styles.tag} style={{ margin: 0 }}>{r.seriesLabel}</span></td>
          <td>{r.ledCount ?? '—'}</td>
          <td className={styles.num}>{r.brightness_lm ?? '—'} lm<span className={styles.sub}>{r.efficacy_lm_w ?? '—'} lm/W</span></td>
          <td className={styles.num}>{r.power_w ?? '—'} W</td>
          <td className={styles.num}>{r.beam ?? '—'}</td>
          <td className={styles.num}>{r.cri ?? '—'}</td>
          <td>{r.ip ?? '—'}</td>
          <td className={styles.num}>{r.maxInSeries ?? '—'}</td>
          <td>{r.dims ? <>{r.dims.mm}<span className={styles.sub}>{r.dims.in}</span></> : '—'}</td>
          <td>
            <Link className={styles.view} href={r.detailHref ?? '#'} aria-disabled={!r.detailHref}>View →</Link>
            {r.specSheetUrl && <a className={styles.pdf} href={r.specSheetUrl} target="_blank" rel="noopener noreferrer">Datasheet ↗</a>}
          </td>
        </tr>,
      )
    }
    return <>{out}</>
  }
}
```

- [ ] **Step 3: Type-check compiles**

Run: `npx tsc --noEmit 2>&1 | grep ProductSelectorTable || echo "no ProductSelectorTable type errors"`
Expected: `no ProductSelectorTable type errors`.

- [ ] **Step 4: Commit**

```bash
git add src/components/resources/ProductSelectorTable.tsx src/components/resources/ProductSelectorTable.module.css
git commit -m "feat(selector): ProductSelectorTable client component"
```

---

## Task 6: Signage selector page (route)

**Files:**
- Create: `src/app/(frontend)/resources/tools/signage-selector/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
// src/app/(frontend)/resources/tools/signage-selector/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { getProductsForSelector } from '@/lib/product-selector'
import { SIGNAGE_SELECTOR } from '@/data/selector-config'
import { ProductSelectorTable } from '@/components/resources/ProductSelectorTable'

export const metadata: Metadata = {
  title: 'Signage module selector — ENVO',
  description:
    'Filter ENVO signage LED modules by output, beam, colour temperature, ingress rating and size, then download the datasheet.',
}

// Akeneo data changes only on sync — revalidate hourly.
export const revalidate = 3600

export default async function SignageSelectorPage() {
  const rows = await getProductsForSelector('signage')

  return (
    <div className="theme-light">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/resources">Resources</Link>
          <span className="sep">›</span>
          <Link href="/resources/tools">Tools</Link>
          <span className="sep">›</span>
          <span>Signage selector</span>
        </div>
        <h1>{SIGNAGE_SELECTOR.title}</h1>
        <p>{SIGNAGE_SELECTOR.intro}</p>
        <ProductSelectorTable rows={rows} config={SIGNAGE_SELECTOR} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Start the dev server (if not running)**

Run: `cat /tmp/envo-dev.pid 2>/dev/null && kill -0 $(cat /tmp/envo-dev.pid) 2>/dev/null && echo running || (nohup npm run dev > /tmp/envo-dev.log 2>&1 & echo $! > /tmp/envo-dev.pid)`
Expected: `running` or a new PID.

- [ ] **Step 3: Verify the route renders with data**

Run: `curl -s -o /dev/null -w "%{http_code}\n" --max-time 90 http://localhost:3000/resources/tools/signage-selector`
Expected: `200`.

Run: `curl -s http://localhost:3000/resources/tools/signage-selector | grep -c "Datasheet"`
Expected: a number `> 0` (datasheet links rendered).

- [ ] **Step 4: Visual check (headless screenshot)**

Run (macOS Chrome headless):
```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
  --screenshot=/tmp/selector.png --window-size=1440,1600 \
  http://localhost:3000/resources/tools/signage-selector && echo saved
```
Then Read `/tmp/selector.png`. Confirm: industrial dark filter bar, series-grouped rows, thumbnails, dual-unit dimensions, View/Datasheet actions.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(frontend)/resources/tools/signage-selector/page.tsx"
git commit -m "feat(selector): /resources/tools/signage-selector page"
```

---

## Task 7: Link the selector from the Tools hub

**Files:**
- Modify: `src/app/(frontend)/resources/tools/page.tsx`

The hub stays a stub (per spec) but must surface the new selector. Add a single link below the stub.

- [ ] **Step 1: Replace the file with a stub that links to the selector**

```tsx
// src/app/(frontend)/resources/tools/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { PageStub } from '@/components/ui/page-stub'

export const metadata: Metadata = { title: 'Tools & Guides — ENVO' }

export default function ToolsPage() {
  return (
    <div>
      <PageStub
        eyebrow="Resources · Tools & Guides"
        title="Sizing tools, wiring guides, install how-tos."
        description="Interactive calculators, layout templates and step-by-step guides to spec the right ENVO setup for your project."
        breadcrumb={[
          { href: '/resources', label: 'Resources' },
          { label: 'Tools' },
        ]}
      />
      <div className="container" style={{ paddingBottom: 48 }}>
        <Link href="/resources/tools/signage-selector">→ Signage module selector</Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify both pages still render**

Run: `for p in /resources/tools /resources/tools/signage-selector; do echo -n "$p "; curl -s -o /dev/null -w "%{http_code}\n" --max-time 90 "http://localhost:3000$p"; done`
Expected: both `200`.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(frontend)/resources/tools/page.tsx"
git commit -m "feat(tools): link the signage selector from the Tools hub"
```

---

## Task 8: Final verification

- [ ] **Step 1: Run the full unit-test suite for new code**

Run: `npx vitest run src/lib/units.test.ts src/lib/product-selector.test.ts`
Expected: all PASS.

- [ ] **Step 2: Type-check the whole project (no NEW errors)**

Run: `npx tsc --noEmit 2>&1 | grep -E "units|product-selector|selector-config|ProductSelectorTable|signage-selector" || echo "no new type errors in selector files"`
Expected: `no new type errors in selector files`. (Pre-existing repo TS/ESLint debt is out of scope — see memory `known-tech-debt-typecheck-lint`.)

- [ ] **Step 3: Lint the new files**

Run: `npx eslint src/lib/units.ts src/lib/product-selector.ts src/data/selector-config.ts src/components/resources/ProductSelectorTable.tsx "src/app/(frontend)/resources/tools/signage-selector/page.tsx"`
Expected: no errors (warnings tolerable).

- [ ] **Step 4: Confirm filtering works end-to-end (spot-check counts)**

Run: `curl -s http://localhost:3000/resources/tools/signage-selector | grep -oE "[0-9]+ modules" | head -1`
Expected: a count (≈73 unfiltered). The number reflects the live signage SKU count.

---

## Self-Review

- **Spec coverage:** SKU-level filterable table (Tasks 5–6) ✓ · reusable config-driven component (Tasks 3, 5) ✓ · signage columns incl. LED count + CRI (Tasks 3, 5) ✓ · filters incl. voltage/CCT/IP/max-height/LED (Task 5) ✓ · dual-unit dims (Tasks 1, 4, 5) ✓ · View greyed when no detail page (Tasks 3, 5) ✓ · datasheet per row (Tasks 4, 5) ✓ · IES seam — intentionally NOT rendered (no `ies_url`; covered by omission, noted in spec) ✓ · FYM link (Task 5) ✓ · Tools-hub link (Task 7) ✓ · backlit/sidelit split (Tasks 3, 5) ✓ · generalisation seam = `SELECTOR_CONFIGS` map (Task 3) ✓.
- **Placeholder scan:** no TBD/TODO; every code step is complete.
- **Type consistency:** `SelectorRow`, `FamilySelectorConfig`, `SeriesMeta`, `SIGNAGE_SELECTOR`, `SELECTOR_CONFIGS`, `getProductsForSelector`, `parseLedCount`, `formatDims`, `mmToIn` are defined once and used with matching signatures across tasks. `getProductsForSelector('signage')` keys into `SELECTOR_CONFIGS` whose `familyCode` is `'led_module'` (the Akeneo value passed to `listProducts`).

## Out of scope (per spec)

Driver/control selector configs + routes; `/resources/downloads` build; Find Your Match; real IES downloads (need `ies_url`); site-wide dual-unit rollout; Payload `Series` collection; clean-image backfill for 63 SKUs.
