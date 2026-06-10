# Signage Series Template Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render every signage (`led_module`) series page as a unified, data-driven 3-tab template (Overview / Specs-selector / Solutions) styled like the Mini Series page, fed by real Akeneo product data + AI-draft editorial copy.

**Architecture:** A single `SeriesTemplate` Client Component (plain JSX + scoped CSS module — *not* a Shadow-DOM port like Mini) renders from props. Editorial **copy** lives in Git (`series-editorial.generated.ts`, AI-draft, re-runnable generator); all **product data** (models, specs, images, datasheets) is pulled **live** from Payload at render and grouped by suffix-less model code (CCT variants WW/NW/CW collapse into one model — see memory `project_series-template-product-grain`). The `[series]` route renders `SeriesTemplate` for any series that has editorial; Mini keeps its hand-built page; other families fall back to existing behaviour. The per-SKU detail route is removed.

**Tech Stack:** Next.js 16 App Router, TypeScript, React Client Component, CSS Modules, Payload CMS (read), vitest.

**Three-source compliance:** product specs/images are NEVER frozen in Git — the generated file holds editorial copy only; specs are computed live from Payload.

---

## File Structure

- `scripts/generate-series-editorial.mts` — **modify**: emit editorial COPY only (drop specs/models/stats).
- `src/data/series-editorial.generated.ts` — **regenerated**: `{ [series]: { aiDraft, label, headline, lede, strengths[], solutions[] } }`.
- `src/lib/series-template.ts` — **create**: `groupSeriesModels()` (pure) + `getSeriesTemplateProps()` (live data assembler).
- `src/lib/series-template.test.ts` — **create**: unit tests for `groupSeriesModels` + stat/feature assembly.
- `src/components/products/series/SeriesTemplate.tsx` — **create**: the Client Component (tabs + panes, JSX from props).
- `src/components/products/series/SeriesTemplate.module.css` — **create**: styles ported from the mockup.
- `src/app/(frontend)/products/[slug]/[series]/page.tsx` — **modify**: route to `SeriesTemplate` when editorial exists.
- `src/app/(frontend)/products/[slug]/[series]/[sku]/` — **delete**: per-SKU route removed.
- `src/app/sitemap.ts`, `src/app/(frontend)/find-your-match/Wizard.tsx`, `src/components/products/ProductCardGrid.tsx`, `src/components/products/GenericProductDetail.tsx` — **modify**: stop linking to `[sku]`; link to the series page.

**Styling source of truth:** `.superpowers/brainstorm/35183-1779324154/content/ultraflare-series-v1.html` (the approved mockup). Port its `<style>` rules into the CSS module, renaming the `:host` scope to `.seriesTpl` and dropping the standalone sidebar/subnav replica (production chrome supplies those).

**Reuse:** `parseLedCount` and `seriesSlug` already exist — import them, do not re-implement.

---

## Task 1: Editorial generator emits copy only

**Files:**
- Modify: `scripts/generate-series-editorial.mts`
- Regenerate: `src/data/series-editorial.generated.ts`

- [ ] **Step 1: Trim the generator output to copy only**

In `scripts/generate-series-editorial.mts`, replace the per-series `out[series] = {...}` assignment (the object that currently includes `overview.stats`, `models`, `cctOptions`, `sharedSpecs`) with copy-only:

```ts
  out[series] = {
    aiDraft: true,
    label: pos.label,
    headline: pos.headline,
    lede: pos.lede,
    strengths: pos.strengths,   // 3 {title, note}
    solutions: pos.solutions,   // N {title, pick}
  }
```

Delete the now-unused spec aggregation in the loop (the `modelRows`, `cctOptions`, `beams`, `ip`, `volts`, `maxLm`, `life`, `certs`, `stats`, `autoFeatures`, `features` blocks) — those move to the live data layer (Task 3). Keep the `payload.find` only if still needed for the `console.log` count; otherwise simplify the log to `console.log('  ✓ ' + series)`. Keep the POSITIONING map and the file banner.

- [ ] **Step 2: Re-run the generator**

Run: `npx tsx --tsconfig tsconfig.json scripts/generate-series-editorial.mts`
Expected: `Wrote 10 series → src/data/series-editorial.generated.ts`, and the file now contains only `aiDraft/label/headline/lede/strengths/solutions` per series (no numeric specs).

- [ ] **Step 3: Add the exported type**

Confirm the generated file still ends with `export const SERIES_EDITORIAL = {...} as const` and `export type SeriesEditorial = ...`. The shape per key must be exactly: `{ aiDraft: true; label: string; headline: string; lede: string; strengths: {title:string;note:string}[]; solutions: {title:string;pick:string}[] }`.

- [ ] **Step 4: Commit**

```bash
git add scripts/generate-series-editorial.mts src/data/series-editorial.generated.ts
git commit -m "refactor(products): series editorial generator emits copy only (specs go live)"
```

---

## Task 2: `groupSeriesModels()` — pure grouping helper (TDD)

**Files:**
- Create: `src/lib/series-template.ts`
- Test: `src/lib/series-template.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/series-template.test.ts
import { describe, it, expect } from 'vitest'
import { groupSeriesModels } from './series-template'
import type { Product } from './products'

const p = (over: Partial<Product>): Product => ({
  sku: 'X', name: 'n', productName: null, slug: null, family: 'led_module',
  series: 'envo_ultraflare', brand: 'ENVO', subtitle: null, short_description: null,
  description: null, enabled: true, hidden: false, image_url_fallback: null,
  clean_image_url_fallback: null, spec_sheet_url: null, power_w: null,
  output_voltage_v: null, input_voltage_min_v: null, input_voltage_max_v: null,
  rated_current_a: null, number_of_outputs: null, operation_mode: null,
  dimming_control: [], cc_region_min: null, cc_region_max: null,
  controller_type: null, output_channel: null, output_type: null, module_size: null,
  switch_no_module: null, switch_operation_method: null, switch_back_light: false,
  mounting_info: null, finish_colour: null, material: null, brightness_lm: null,
  efficacy_lm_w: null, cct_k: null, cri: null, beam_angle_deg: null, lifetime_hrs: null,
  ...over,
} as unknown as Product)

describe('groupSeriesModels', () => {
  it('collapses -WW/-NW/-CW into one suffix-less model', () => {
    const rows = groupSeriesModels([
      p({ sku: 'EV-BLUF02LBY-WW', productName: 'UltraFlare Double LED', power_w: 1, brightness_lm: 110, cct_k: 3000 }),
      p({ sku: 'EV-BLUF02LBY-NW', power_w: 1, brightness_lm: 110, cct_k: 4000 }),
      p({ sku: 'EV-BLUF02LBY-CW', power_w: 1, brightness_lm: 110, cct_k: 6500 }),
    ])
    expect(rows).toHaveLength(1)
    expect(rows[0].code).toBe('EV-BLUF02LBY')
    expect(rows[0].leds).toBe('Double')
    expect(rows[0].powerW).toBe(1)
    expect(rows[0].lumens).toBe(110)
  })

  it('sorts models by ascending power', () => {
    const rows = groupSeriesModels([
      p({ sku: 'EV-BLUF04LBY-NW', power_w: 2 }),
      p({ sku: 'EV-BLUF01LBY-NW', power_w: 0.5 }),
    ])
    expect(rows.map((r) => r.code)).toEqual(['EV-BLUF01LBY', 'EV-BLUF04LBY'])
  })

  it('builds dimsMm only when all three dimensions exist', () => {
    const rows = groupSeriesModels([
      p({ sku: 'A-NW', length_mm: 27.8, width_mm: 15.4, height_mm: 10.4 } as Partial<Product>),
    ])
    expect(rows[0].dimsMm).toBe('27.8 × 15.4 × 10.4')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/series-template.test.ts`
Expected: FAIL — `groupSeriesModels` is not exported / module not found.

- [ ] **Step 3: Implement `groupSeriesModels`**

```ts
// src/lib/series-template.ts
import type { Product } from './products'
import { resolveProductImage } from './products'
import { parseLedCount } from './product-selector'

export type SeriesModel = {
  code: string                 // suffix-less model code, e.g. EV-BLUF02LBY
  leds: string                 // Single | Double | Triple | Quad | —
  powerW: number | null
  lumens: number | null
  dimsMm: string | null
  image: { src: string; isLocal: boolean; alt: string }
  datasheetUrl: string | null
}

const stripCct = (sku: string) => sku.replace(/-(WW|NW|CW)$/i, '')
const num = (n: unknown): number | null =>
  typeof n === 'number' && !Number.isNaN(n) ? n : null

/** Collapse CCT variants into suffix-less models, sorted by ascending power. */
export function groupSeriesModels(products: Product[]): SeriesModel[] {
  const byCode = new Map<string, Product[]>()
  for (const prod of products) {
    const code = stripCct(prod.sku)
    const list = byCode.get(code) ?? []
    list.push(prod)
    byCode.set(code, list)
  }
  const rows: SeriesModel[] = []
  for (const [code, skus] of byCode) {
    const rep = skus[0]
    const lwh = [num((rep as any).length_mm), num((rep as any).width_mm), num((rep as any).height_mm)]
    rows.push({
      code,
      leds: parseLedCount(rep.productName ?? rep.name) ?? '—',
      powerW: num(rep.power_w),
      lumens: num(rep.brightness_lm),
      dimsMm: lwh.every((x) => x != null) ? lwh.join(' × ') : null,
      image: resolveProductImage(rep, ''),
      datasheetUrl: rep.spec_sheet_url ?? null,
    })
  }
  return rows.sort((a, b) => (a.powerW ?? 0) - (b.powerW ?? 0))
}
```

> Note: `parseLedCount` returns `string | null`; if its real signature differs, adapt the `?? '—'` fallback. Verify by reading `src/lib/product-selector.ts` before implementing.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/series-template.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/series-template.ts src/lib/series-template.test.ts
git commit -m "feat(products): groupSeriesModels — collapse CCT variants into models"
```

---

## Task 3: `getSeriesTemplateProps()` — live data assembler (TDD)

**Files:**
- Modify: `src/lib/series-template.ts`
- Test: `src/lib/series-template.test.ts`

- [ ] **Step 1: Write the failing test for the pure assembly helpers**

Append to `src/lib/series-template.test.ts`:

```ts
import { buildStats, buildFeatures, type SeriesSpecs } from './series-template'

const specs: SeriesSpecs = {
  beamDeg: 170, ip: 'IP67', voltsDc: 12, lifetimeHrs: 50000,
  cctOptions: ['WW=3000K', 'NW=4000K', 'CW=6500K'], certs: ['UL', 'CE', 'TÜV'],
}

describe('buildStats', () => {
  it('produces up to 4 hero stats from specs + max lumens', () => {
    const stats = buildStats(specs, 180)
    expect(stats).toEqual([
      { value: '180 lm', label: 'max / module' },
      { value: '170°', label: 'beam angle' },
      { value: 'IP67', label: 'ingress' },
      { value: '3 CCT', label: 'colour temps' },
    ])
  })
})

describe('buildFeatures', () => {
  it('keeps 3 strengths then appends spec-derived bullets, capped at 6', () => {
    const features = buildFeatures(
      [{ title: 'Osram emitters', note: 'Premium binned chips.' }],
      specs,
      4,
    )
    expect(features[0]).toEqual({ title: 'Osram emitters', note: 'Premium binned chips.' })
    expect(features.length).toBeLessThanOrEqual(6)
    expect(features.some((f) => f.title === '12 V DC')).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/series-template.test.ts`
Expected: FAIL — `buildStats`/`buildFeatures`/`SeriesSpecs` not exported.

- [ ] **Step 3: Implement the assembler + helpers**

Append to `src/lib/series-template.ts`:

```ts
import { getProductsByMarketingFamily } from './products' // if not already importable, use the existing series query helper
import { SERIES_EDITORIAL } from '@/data/series-editorial.generated'

export type SeriesSpecs = {
  beamDeg: number | null
  ip: string | null
  voltsDc: number | null
  lifetimeHrs: number | null
  cctOptions: string[]
  certs: string[]
}

export type Feature = { title: string; note: string }

export function buildStats(specs: SeriesSpecs, maxLm: number | null): { value: string; label: string }[] {
  return [
    maxLm ? { value: `${maxLm} lm`, label: 'max / module' } : null,
    specs.beamDeg ? { value: `${specs.beamDeg}°`, label: 'beam angle' } : null,
    specs.ip ? { value: specs.ip, label: 'ingress' } : null,
    specs.cctOptions.length ? { value: `${specs.cctOptions.length} CCT`, label: 'colour temps' } : null,
  ].filter(Boolean) as { value: string; label: string }[]
}

export function buildFeatures(strengths: Feature[], specs: SeriesSpecs, modelCount: number): Feature[] {
  const auto: Feature[] = [
    specs.voltsDc ? { title: `${specs.voltsDc} V DC`, note: `${modelCount} models, one platform.` } : null,
    specs.lifetimeHrs ? { title: `${specs.lifetimeHrs.toLocaleString()} h`, note: 'Rated lifetime.' } : null,
    specs.certs.length ? { title: `${specs.certs.length} marks`, note: specs.certs.slice(0, 6).join(' · ') } : null,
  ].filter(Boolean) as Feature[]
  return [...strengths, ...auto].slice(0, 6)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/series-template.test.ts`
Expected: PASS (5 tests total).

- [ ] **Step 5: Implement `getSeriesTemplateProps` (integration, no unit test — verified via the route)**

Append to `src/lib/series-template.ts`. This reads the live products for a series, groups them, computes specs, and merges the editorial copy:

```ts
const CERT_NAME: Record<string, string> = {
  c_ul: 'UL', c_cul: 'cUL', c_ce: 'CE', c_tuv: 'TÜV', c_rohs: 'RoHS',
  c_cb: 'CB', c_bis: 'BIS', c_ccc: 'CCC', c_fcc: 'FCC', c_fc: 'FCC', c_selv: 'SELV', c_lm80: 'LM-80',
}
const uniq = <T,>(a: T[]) => [...new Set(a)]

export type SeriesTemplateProps = {
  label: string
  headline: string
  lede: string
  stats: { value: string; label: string }[]
  features: Feature[]
  solutions: { title: string; pick: string }[]
  models: SeriesModel[]
  specs: SeriesSpecs
  heroImage: { src: string; isLocal: boolean; alt: string }
  aiDraft: boolean
}

/** Returns null if the series has no editorial — caller falls back to generic. */
export async function getSeriesTemplateProps(
  series: string,
  products: Product[],
): Promise<SeriesTemplateProps | null> {
  const copy = (SERIES_EDITORIAL as Record<string, any>)[series]
  if (!copy || !products.length) return null

  const models = groupSeriesModels(products)
  const beam = products.map((d) => num(d.beam_angle_deg)).find(Boolean) ?? null
  const ipField = products.map((d) => (d as any).waterproof as string | null).find((w) => w && /^ip\d+$/i.test(w))
  const ipSub = products.map((d) => d.subtitle?.match(/IP\s?(\d{2})/i)?.[1]).find(Boolean)
  const ip = ipField ? ipField.toUpperCase() : ipSub ? `IP${ipSub}` : null
  const volts = products
    .map((d) => num(d.input_voltage_min_v) ?? num(d.output_voltage_v) ?? (Number(d.subtitle?.match(/(\d+)\s*V\b/i)?.[1]) || null))
    .find(Boolean) ?? null
  const cctOptions = uniq(
    products.map((d) => ({ c: d.sku.match(/-(WW|NW|CW)$/i)?.[1], k: num(d.cct_k) }))
      .filter((x) => x.c && x.k).map((x) => `${x.c}=${x.k}K`),
  )
  const certs = uniq(products.flatMap((d) => ((d as any).standards_met as string[] | null) ?? []))
    .map((c) => CERT_NAME[c] ?? c)
  const lifetimeHrs = products.map((d) => num(d.lifetime_hrs)).find(Boolean) ?? null
  const maxLm = Math.max(0, ...products.map((d) => num(d.brightness_lm) ?? 0)) || null

  const specs: SeriesSpecs = { beamDeg: beam, ip, voltsDc: volts, lifetimeHrs, cctOptions, certs }
  return {
    label: copy.label,
    headline: copy.headline,
    lede: copy.lede,
    stats: buildStats(specs, maxLm),
    features: buildFeatures(copy.strengths, specs, models.length),
    solutions: copy.solutions,
    models,
    specs,
    heroImage: models[0]?.image ?? { src: '', isLocal: true, alt: copy.label },
    aiDraft: !!copy.aiDraft,
  }
}
```

> Before implementing, read `src/lib/products.ts` to confirm the exact helper that returns the enabled products for one `series` value (e.g. filter `getProductsByMarketingFamily` by series, or add a thin `getProductsBySeries(series)`). The caller in Task 5 passes those products in, keeping this function pure of the query.

- [ ] **Step 6: Commit**

```bash
git add src/lib/series-template.ts src/lib/series-template.test.ts
git commit -m "feat(products): getSeriesTemplateProps — merge editorial copy with live specs"
```

---

## Task 4: `SeriesTemplate` component + CSS module

**Files:**
- Create: `src/components/products/series/SeriesTemplate.tsx`
- Create: `src/components/products/series/SeriesTemplate.module.css`

- [ ] **Step 1: Create the component**

```tsx
// src/components/products/series/SeriesTemplate.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { SeriesTemplateProps } from '@/lib/series-template'
import styles from './SeriesTemplate.module.css'

type Tab = 'overview' | 'specs' | 'solutions'

export default function SeriesTemplate(props: SeriesTemplateProps) {
  const [tab, setTab] = useState<Tab>('overview')
  const { label, headline, lede, stats, features, solutions, models, specs, heroImage } = props

  return (
    <div className={styles.seriesTpl}>
      <div className={styles.subnav}>
        <span className={styles.path}>{label}</span>
        <nav className={styles.tabs}>
          <button className={tab === 'overview' ? styles.active : ''} onClick={() => setTab('overview')}>Overview</button>
          <button className={tab === 'specs' ? styles.active : ''} onClick={() => setTab('specs')}>Specs</button>
          <button className={tab === 'solutions' ? styles.active : ''} onClick={() => setTab('solutions')}>Solutions</button>
        </nav>
      </div>

      {tab === 'overview' && (
        <section className={styles.pane}>
          {props.aiDraft && <div className={styles.draftFlag}>🟡 AI draft — pending review</div>}
          <h1 className={styles.h1}>{headline}</h1>
          <p className={styles.lede}>{lede}</p>
          <div className={styles.stats}>
            {stats.map((s) => (
              <div key={s.label} className={styles.stat}><strong>{s.value}</strong><span>{s.label}</span></div>
            ))}
          </div>
          {heroImage.src && (
            <div className={styles.heroImg}>
              {heroImage.isLocal
                ? <Image src={heroImage.src} alt={heroImage.alt} width={520} height={360} />
                : <img src={heroImage.src} alt={heroImage.alt} />}
            </div>
          )}
          <div className={styles.featureGrid}>
            {features.map((f) => (
              <div key={f.title} className={styles.featureCard}><h3>{f.title}</h3><p>{f.note}</p></div>
            ))}
          </div>
        </section>
      )}

      {tab === 'specs' && (
        <section className={styles.pane}>
          <h2 className={styles.h2}>Pick a model. Pick a colour.</h2>
          {specs.cctOptions.length > 0 && (
            <div className={styles.cctRow}>
              <span className={styles.cctLabel}>COLOUR TEMP · ALL MODELS</span>
              <div className={styles.cctPills}>
                {specs.cctOptions.map((c) => <span key={c}>{c.replace('=', ' · ')}</span>)}
              </div>
              <span className={styles.cctNote}>Same module, different colours — not separate products.</span>
            </div>
          )}
          <table className={styles.table}>
            <thead>
              <tr><th>Model</th><th>LED</th><th>Power</th><th>Output</th><th>Size (mm)</th><th>Datasheet</th></tr>
            </thead>
            <tbody>
              {models.map((m) => (
                <tr key={m.code}>
                  <td className={styles.modelCode}>{m.code}</td>
                  <td>{m.leds}</td>
                  <td>{m.powerW != null ? `${m.powerW} W` : '—'}</td>
                  <td>{m.lumens != null ? `${m.lumens} lm` : '—'}</td>
                  <td>{m.dimsMm ?? '—'}</td>
                  <td>{m.datasheetUrl ? <a href={m.datasheetUrl} target="_blank" rel="noreferrer">PDF →</a> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className={styles.specFoot}>
            All models · {[specs.beamDeg && `${specs.beamDeg}° beam`, specs.ip, specs.voltsDc && `${specs.voltsDc} V DC`, specs.lifetimeHrs && `${specs.lifetimeHrs.toLocaleString()} h`, ...specs.certs].filter(Boolean).join(' · ')}
          </p>
        </section>
      )}

      {tab === 'solutions' && (
        <section className={styles.pane}>
          <h2 className={styles.h2}>Where {label.replace(/ Series$/, '')} fits.</h2>
          <div className={styles.solGrid}>
            {solutions.map((s) => (
              <div key={s.title} className={styles.solCard}>
                <div className={styles.solImg}>SCENE PHOTO — TBD</div>
                <h3>{s.title}</h3>
                <p>{s.pick}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create the CSS module (port from the mockup)**

Open `.superpowers/brainstorm/35183-1779324154/content/ultraflare-series-v1.html`. Copy the rules for the kept blocks (tab-hero/`h1`/`lede`/`stats`/`stat`, `feature-grid`/`feature-card`, the selector table, `sol-card`) into `SeriesTemplate.module.css`, mapping the mockup's `:host` design tokens onto a `.seriesTpl` wrapper and renaming class selectors to the module class names used above. Minimum rules to author (fill values from the mockup tokens — `--blue:#0071bc`, `--lime:#aec90b`, `--text:#1a2332`, `--bg:#f4f5f7`, etc.):

```css
.seriesTpl { --blue:#0071bc; --lime:#aec90b; --text:#1a2332; --muted:#6a7a8a; --bg:#f4f5f7; --line:#e2e7ec; color:var(--text); background:var(--bg); }
.subnav { display:flex; justify-content:space-between; align-items:center; height:44px; border-bottom:1px solid var(--line); padding:0 24px; }
.path { font-weight:600; }
.tabs button { background:none; border:none; padding:0 14px; height:44px; font-size:14px; color:var(--muted); cursor:pointer; border-bottom:2px solid transparent; }
.tabs button.active { color:var(--text); border-bottom-color:var(--lime); }
.pane { padding:40px 48px; max-width:1080px; }
.draftFlag { font:600 11px ui-monospace,monospace; color:#b59a00; letter-spacing:.06em; margin-bottom:10px; }
.h1 { font-size:44px; font-weight:800; line-height:1.05; letter-spacing:-0.02em; margin:0 0 14px; }
.h2 { font-size:30px; font-weight:800; margin:0 0 18px; }
.lede { font-size:18px; color:var(--muted); max-width:620px; }
.stats { display:flex; gap:48px; margin:28px 0; border-top:1px solid var(--line); border-bottom:1px solid var(--line); padding:18px 0; }
.stat strong { display:block; font-size:24px; font-weight:700; }
.stat span { font-size:12px; color:var(--muted); }
.heroImg { background:#fff; border:1px solid var(--line); border-radius:14px; padding:32px; display:flex; justify-content:center; margin:24px 0; }
.heroImg img, .heroImg :global(img) { max-height:300px; width:auto; object-fit:contain; }
.featureGrid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-top:24px; }
.featureCard { background:#fff; border:1px solid var(--line); border-radius:12px; padding:18px; }
.featureCard h3 { margin:0 0 4px; font-size:15px; }
.featureCard p { margin:0; font-size:13px; color:var(--muted); }
.cctRow { display:flex; align-items:center; gap:14px; flex-wrap:wrap; margin:0 0 22px; }
.cctLabel { font:600 12px ui-monospace,monospace; letter-spacing:.06em; color:var(--muted); }
.cctPills { display:inline-flex; border:1px solid #d4dae1; border-radius:9px; overflow:hidden; }
.cctPills span { padding:8px 16px; font-size:13px; font-weight:600; border-right:1px solid #d4dae1; }
.cctPills span:last-child { border-right:none; }
.cctNote { font-size:12.5px; color:#9aa7b4; }
.table { width:100%; border-collapse:collapse; background:#fff; border:1px solid var(--line); border-radius:12px; overflow:hidden; font-size:14px; }
.table th { background:#f5f7f9; text-align:left; padding:12px 16px; font:600 11px ui-monospace,monospace; letter-spacing:.05em; color:var(--muted); }
.table td { padding:14px 16px; border-top:1px solid #eef1f4; }
.modelCode { font-weight:700; color:var(--blue); }
.table a { color:var(--blue); font-weight:600; }
.specFoot { margin-top:14px; font-size:13px; color:var(--muted); line-height:1.6; }
.solGrid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
.solCard { background:#fff; border:1px solid var(--line); border-radius:12px; overflow:hidden; }
.solImg { height:150px; display:flex; align-items:center; justify-content:center; background:#eef1f4; color:#9aa7b4; font:600 10px ui-monospace,monospace; letter-spacing:.06em; }
.solCard h3 { margin:14px 16px 4px; font-size:15px; }
.solCard p { margin:0 16px 16px; font-size:13px; color:var(--muted); }
@media (max-width:860px){ .featureGrid,.solGrid{grid-template-columns:1fr 1fr;} .pane{padding:28px 20px;} }
```

- [ ] **Step 3: Commit**

```bash
git add src/components/products/series/SeriesTemplate.tsx src/components/products/series/SeriesTemplate.module.css
git commit -m "feat(products): SeriesTemplate component (data-driven 3-tab series page)"
```

---

## Task 5: Wire the `[series]` route + verify all 10 signage series

**Files:**
- Modify: `src/app/(frontend)/products/[slug]/[series]/page.tsx`

- [ ] **Step 1: Branch the route to SeriesTemplate when editorial exists**

In `page.tsx`, after the `mini-series` special-case and before the existing generic render, add:

```tsx
import SeriesTemplate from '@/components/products/series/SeriesTemplate'
import { getSeriesTemplateProps } from '@/lib/series-template'
// ... inside the component, `series` is the DB series value (e.g. 'envo_ultraflare'),
// and `products` is the enabled products for this series (reuse the existing query
// used for the generic listing; if it currently fetches by family+series, keep that):
const tplProps = await getSeriesTemplateProps(series, products)
if (tplProps) {
  return <SeriesTemplate {...tplProps} />
}
```

> Read the current `page.tsx` to find the variable already holding this series' products (the generic branch builds `variantData`/lists). If the route only has marketing-family products, filter to `series`. Confirm `series` here is the raw DB value matching `SERIES_EDITORIAL` keys (e.g. `envo_ultraflare`), not the URL slug (`envo-ultraflare`) — map with the existing slug↔series helper if needed.

- [ ] **Step 2: Confirm TopSubnav doesn't double-render**

Per memory `feedback_topsubnav-null-on-custom-subnav`: SeriesTemplate renders its own subnav tabs. Verify `TopSubnav` returns `null` for these series routes (same mechanism Mini uses). If Mini is special-cased by slug in TopSubnav, extend that check to "any series with editorial".

- [ ] **Step 3: Build + start the dev server**

Run: `git stash -- node_modules 2>/dev/null; yes | nohup npm run dev > /tmp/envo-dev.log 2>&1 &` (per memory `reference_dev-server-runtime`), wait for ready.

- [ ] **Step 4: Verify each of the 10 signage series renders (screenshot loop)**

For each series slug — `envo-ultraflare, envo-proglo, envo-ecoglo, envo-optilume, hydrolume, envo-chromaflux, envo-edgelume, envo-edgeflare, envo-edgeblade, edgeblade2` (confirm exact slugs via `curl -s localhost:3000/products/led-signage-modules | grep -oE 'href="/products/led-signage-modules/[^"]+"'`):

Run: `curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/products/led-signage-modules/<slug>"` → expect `200`.
Then headless screenshot each (`--window-size=1440,1600`) and confirm: 3 tabs present, hero headline = the editorial copy, stat row populated, selector table lists suffix-less models, no Mini content bleed.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(frontend)/products/[slug]/[series]/page.tsx"
git commit -m "feat(products): render signage series via SeriesTemplate"
```

**▶ EARLY VISIBLE WIN: after Task 5 all signage series render in the new template. Tasks 6–8 remove the now-orphaned per-SKU route.**

---

## Task 6: Remove the per-SKU detail route

**Files:**
- Delete: `src/app/(frontend)/products/[slug]/[series]/[sku]/` (whole folder)

- [ ] **Step 1: Delete the route**

Run: `git rm -r "src/app/(frontend)/products/[slug]/[series]/[sku]"`

- [ ] **Step 2: Verify build has no broken imports**

Run: `npx tsc --noEmit 2>&1 | grep -v "$(known pre-existing errors)" | head` — expect no NEW errors referencing the deleted route. (Pre-existing tech debt per memory `project_known-tech-debt-typecheck-lint` is acceptable.)

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat(products): drop per-SKU detail route (CCT is a selector option, not a page)"
```

---

## Task 7: Re-point links away from `[sku]`

**Files:**
- Modify: `src/app/sitemap.ts:27`
- Modify: `src/app/(frontend)/find-your-match/Wizard.tsx:15`
- Modify: `src/components/products/ProductCardGrid.tsx:14`
- Modify: `src/components/products/GenericProductDetail.tsx:99`

- [ ] **Step 1: sitemap — emit series URLs, dedup**

In `src/app/sitemap.ts`, change the per-product loop to add the **series** URL instead of the sku URL:

```ts
if (m) urls.add(`/products/${m.slug}/${seriesSlug(p.series)}`)
```

(The `Set` already dedupes the now-repeated series URLs.)

- [ ] **Step 2: find-your-match Wizard — link to the series page**

In `Wizard.tsx`, change the result href builder:

```ts
return `/products/${m.slug}/${seriesSlug(p.series)}`
```

- [ ] **Step 3: ProductCardGrid — link cards to the series page**

In `ProductCardGrid.tsx:14`, change the card `href` to the series page:

```tsx
<Link key={p.sku} href={`/products/${familySlug}/${seriesSlug(p.series)}`} className={styles.seriesCard}>
```

> Note: this means multiple SKUs in the same series now link to the same series page. If `ProductCardGrid` is used to list SKUs within a series (where every card would collide), confirm with the route author whether this grid is still used for signage after Task 5 — for non-editorial families (drivers/control/accessories) it remains the series listing and per-SKU links are gone, so cards should instead group by series. If grouping is non-trivial, leave drivers/control/accessories on their existing generic flow and only guarantee correctness for families without `[sku]` consumers. Document any such limitation with a code comment.

- [ ] **Step 4: GenericProductDetail related-products — link to series**

In `GenericProductDetail.tsx:99`:

```tsx
href={`/products/${familySlug}/${seriesSlug(r.series)}`}
```

- [ ] **Step 5: Verify no remaining `[sku]`-shaped links**

Run: `grep -rnE 'seriesSlug\([^)]*\)\}/\$\{' src/ | grep -i sku` → expect no matches.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "fix(products): re-point product links from removed [sku] route to series page"
```

---

## Task 8: Full verification + regression

- [ ] **Step 1: Unit tests pass**

Run: `npx vitest run` → expect all pass (including new `series-template.test.ts`).

- [ ] **Step 2: Regression — Mini still hand-built**

Screenshot `http://localhost:3000/products/led-signage-modules/mini-series` → confirm unchanged (still its own page, not SeriesTemplate).

- [ ] **Step 3: Regression — non-editorial families still work**

Screenshot `http://localhost:3000/products/led-drivers/sr-triac` and `/products/led-drivers` → confirm they still render (generic flow) with no broken per-SKU links (cards now point to the series page and resolve 200).

- [ ] **Step 4: Sitemap resolves**

Run: `curl -s localhost:3000/sitemap.xml | grep -c "/products/led-signage-modules/"` → expect series URLs present, no `[sku]` paths.

- [ ] **Step 5: Final commit / open PR**

```bash
git fetch origin && git rebase origin/dev
git push -u origin feature/series-editorial-generator-2026-06-09
gh pr create --base dev --title "feat(products): data-driven signage series template" --body "..."
```

---

## Self-Review Notes

- **Spec coverage:** editorial copy generation (T1), CCT-collapse grouping (T2), live specs (T3), component (T4), routing (T5), SKU-route removal (T6) + link migration (T7), regression (T8). All covered.
- **Type consistency:** `SeriesModel`, `SeriesSpecs`, `Feature`, `SeriesTemplateProps` defined in T2/T3 and consumed unchanged in T4/T5. `groupSeriesModels`/`buildStats`/`buildFeatures`/`getSeriesTemplateProps` names are stable across tasks.
- **Open risk flagged in T7/Step 3:** `ProductCardGrid` per-SKU→series link collision for families that still list SKUs. Resolve during execution by reading the actual usage; do not silently collapse.
- **Three-source:** specs/images never frozen in Git (T1 strips them; T3 computes live). ✅
