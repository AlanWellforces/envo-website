# Find Your Match Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A 5-question wizard that turns answers into a recommended module + driver(or driver spec) + control bundle via a catalogue-agnostic rules engine, with an optional AI-written rationale — replacing the `/find-your-match` placeholder.

**Architecture:** Pure engine `recommend(answers, catalog)` (no hardcoded catalogue → reusable on Wellforces) + a server API route that feeds it the live ENVO catalogue and optionally calls Anthropic for the rationale (template fallback when no key) + a client wizard UI.

**Tech Stack:** Next.js App Router, TypeScript, vitest, `@anthropic-ai/sdk` (optional at runtime), existing `listProducts`/`Product` from `src/lib/products.ts`, `EnvoButton`.

---

## Spec
`docs/superpowers/specs/2026-06-04-find-your-match-design.md`.

## Spec refinement (applied here)
The `colour` answer drops `single` (no single-colour-non-white modules exist in the catalogue). Final values: `white_warm | white_neutral | white_cool | rgb`.

## Testing approach
The engine (`match.ts`) and template (`explain.ts`) are **pure** → real unit tests (TDD) with a small mocked catalogue, following `src/lib/*.test.ts`. The API route and wizard UI are verified by tsc + dev-server run + a wizard walkthrough + screenshot (no unit tests for the route's network/AI call).

---

### Task 1: Types + question copy

**Files:**
- Create: `src/lib/find-your-match/types.ts`
- Create: `src/lib/find-your-match/copy.ts`

- [ ] **Step 1: Create `types.ts`**

```ts
import type { Product } from '@/lib/products'

export type FymAnswers = {
  application: 'channel_letters' | 'light_box' | 'facade' | 'other'
  environment: 'indoor' | 'outdoor'
  colour: 'white_warm' | 'white_neutral' | 'white_cool' | 'rgb'
  size: 'small' | 'medium' | 'large'
  control: 'onoff' | 'dimmable' | 'smart'
  notes?: string
}

export type DriverSpec = { powerW: number; voltageV: number; ip: string; mode: 'cv' | 'cc' }

export type ModulePick = { product: Product; reason: string } | null
export type DriverPick =
  | { kind: 'product'; product: Product; reason: string }
  | { kind: 'spec'; spec: DriverSpec; reason: string }
export type ControlPick =
  | { kind: 'product'; product: Product; reason: string }
  | { kind: 'note'; reason: string }
  | null

export type Recommendation = {
  module: ModulePick
  driver: DriverPick
  control: ControlPick
  estimatedLoadW: number
}

export type FymResult = Recommendation & { explanation: string }
```

- [ ] **Step 2: Create `copy.ts`** (drives the wizard UI; pure data)

```ts
export type FymQuestion = {
  key: 'application' | 'environment' | 'colour' | 'size' | 'control'
  label: string
  options: { value: string; label: string }[]
}

export const FYM_QUESTIONS: FymQuestion[] = [
  { key: 'application', label: 'What are you lighting?', options: [
    { value: 'channel_letters', label: 'Channel letters' },
    { value: 'light_box', label: 'Light box' },
    { value: 'facade', label: 'Facade / architectural' },
    { value: 'other', label: 'Other signage' },
  ] },
  { key: 'environment', label: 'Where will it be installed?', options: [
    { value: 'indoor', label: 'Indoor' },
    { value: 'outdoor', label: 'Outdoor / wet' },
  ] },
  { key: 'colour', label: 'What colour?', options: [
    { value: 'white_warm', label: 'Warm white' },
    { value: 'white_neutral', label: 'Neutral white' },
    { value: 'white_cool', label: 'Cool white' },
    { value: 'rgb', label: 'RGB colour-changing' },
  ] },
  { key: 'size', label: 'Roughly how big?', options: [
    { value: 'small', label: 'Small — up to ~2 m' },
    { value: 'medium', label: 'Medium — a storefront' },
    { value: 'large', label: 'Large — facade / multi-sign' },
  ] },
  { key: 'control', label: 'How will you control it?', options: [
    { value: 'onoff', label: 'On / off only' },
    { value: 'dimmable', label: 'Dimmable' },
    { value: 'smart', label: 'Smart — app / Zigbee' },
  ] },
]
```

- [ ] **Step 3: Verify** — `npx tsc --noEmit` → PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/find-your-match/types.ts src/lib/find-your-match/copy.ts
git commit -m "feat(fym): answer/recommendation types + wizard question copy"
```

---

### Task 2: The rules engine (TDD)

**Files:**
- Create: `src/lib/find-your-match/match.ts`
- Test: `src/lib/find-your-match/match.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/find-your-match/match.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { recommend } from './match'
import type { FymAnswers } from './types'
import type { Product } from '@/lib/products'

const mod = (over: Partial<Product>): Product => ({
  sku: 'M', family: 'led_module', name: 'Module', series: 'envo_ecoglo',
  power_w: 1.3, waterproof: 'ip65', led_chip_colour: 'warm_white', cct_k: 3000,
  brightness_lm: 120, enabled: true, hidden: false,
} as unknown as Product)
const drv = (over: Partial<Product>): Product => ({
  sku: 'D', family: 'psu_led_cv', name: 'Driver', series: 'sc_envo',
  power_w: 60, output_voltage_v: 12, waterproof: 'ip67', dimming_control: [],
  enabled: true, hidden: false, ...over,
} as unknown as Product)
const ctrl = (over: Partial<Product>): Product => ({
  sku: 'C', family: 'psu_led_controller', name: 'Zigbee Controller', series: 'envo_zigbee',
  controller_type: ['zigbee'], enabled: true, hidden: false, ...over,
} as unknown as Product)

const base: FymAnswers = {
  application: 'channel_letters', environment: 'indoor',
  colour: 'white_warm', size: 'small', control: 'onoff',
}

describe('recommend — module', () => {
  it('picks an IP-rated module for outdoor', () => {
    const catalog = [
      mod({ sku: 'IN', waterproof: 'ip20' }),
      mod({ sku: 'OUT', waterproof: 'ip67' }),
    ]
    const r = recommend({ ...base, environment: 'outdoor' }, catalog)
    expect(r.module?.product.sku).toBe('OUT')
  })
  it('picks an RGB module when colour is rgb', () => {
    const catalog = [mod({ sku: 'W', led_chip_colour: 'warm_white' }), mod({ sku: 'RGB', led_chip_colour: 'rgb' })]
    expect(recommend({ ...base, colour: 'rgb' }, catalog).module?.product.sku).toBe('RGB')
  })
  it('never returns a null module when any module exists (graceful degrade)', () => {
    const catalog = [mod({ sku: 'ONLY', waterproof: 'ip20', led_chip_colour: 'cool_white' })]
    expect(recommend({ ...base, environment: 'outdoor', colour: 'rgb' }, catalog).module?.product.sku).toBe('ONLY')
  })
})

describe('recommend — driver', () => {
  it('sizes the driver above estimated load and picks the smallest sufficient', () => {
    // small=20 modules × 1.3W × 1.2 = 31.2W
    const catalog = [mod({}), drv({ sku: 'D40', power_w: 40, output_voltage_v: 12 }), drv({ sku: 'D100', power_w: 100, output_voltage_v: 12 })]
    const r = recommend(base, catalog)
    expect(r.estimatedLoadW).toBeCloseTo(31.2, 1)
    expect(r.driver.kind).toBe('product')
    if (r.driver.kind === 'product') expect(r.driver.product.sku).toBe('D40')
  })
  it('returns a driver SPEC (not a fabricated product) when no ENVO driver fits', () => {
    const catalog = [mod({}), drv({ sku: 'TINY', power_w: 10, output_voltage_v: 12 })]
    const r = recommend(base, catalog)
    expect(r.driver.kind).toBe('spec')
    if (r.driver.kind === 'spec') {
      expect(r.driver.spec.powerW).toBeGreaterThanOrEqual(32)
      expect(r.driver.spec.voltageV).toBe(12)
    }
  })
})

describe('recommend — control', () => {
  it('is null for on/off', () => {
    expect(recommend({ ...base, control: 'onoff' }, [mod({}), drv({})]).control).toBeNull()
  })
  it('picks a Zigbee controller for smart', () => {
    const r = recommend({ ...base, control: 'smart' }, [mod({}), drv({}), ctrl({ sku: 'ZB' })])
    expect(r.control?.kind === 'product' && r.control.product.sku).toBe('ZB')
  })
  it('returns a note when smart control requested but none available', () => {
    const r = recommend({ ...base, control: 'smart' }, [mod({}), drv({})])
    expect(r.control?.kind).toBe('note')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/find-your-match/match.test.ts`
Expected: FAIL — `Cannot find module './match'`.

- [ ] **Step 3: Implement `match.ts`**

```ts
import type { Product } from '@/lib/products'
import type { FymAnswers, Recommendation, DriverPick, ControlPick, ModulePick } from './types'

const SIZE_MODULE_COUNT: Record<FymAnswers['size'], number> = { small: 20, medium: 60, large: 150 }
const SAFETY = 1.2
const IP_RATED = new Set(['ip65', 'ip67', 'ip68'])
const WHITE_BY_COLOUR: Record<string, string> = {
  white_warm: 'warm_white', white_neutral: 'natural_white', white_cool: 'cool_white',
}

const isModule = (p: Product) => p.family === 'led_module'
const isCvDriver = (p: Product) => p.family === 'psu_led_cv'
const isController = (p: Product) => p.family === 'psu_led_controller'
const live = (p: Product) => p.enabled !== false && p.hidden !== true
const ipRated = (p: Product) => !!p.waterproof && IP_RATED.has(p.waterproof)
const isRgb = (p: Product) => p.led_chip_colour === 'rgb' || p.led_chip_colour === 'rgbw'

function scoreModule(p: Product, a: FymAnswers): number {
  let s = 0
  if (a.environment === 'outdoor') s += ipRated(p) ? 3 : -3
  else s += 1
  if (a.colour === 'rgb') s += isRgb(p) ? 4 : -2
  else {
    const want = WHITE_BY_COLOUR[a.colour]
    if (p.led_chip_colour === want) s += 3
    else if (p.led_chip_colour === 'tunable_white') s += 2
    else if (!isRgb(p)) s += 1
    else s -= 1
  }
  // facade favours brighter modules
  if (a.application === 'facade' && (p.brightness_lm ?? 0) >= 150) s += 1
  return s
}

function selectModule(a: FymAnswers, catalog: Product[]): ModulePick {
  const mods = catalog.filter((p) => isModule(p) && live(p))
  if (mods.length === 0) return null
  const best = mods
    .map((p) => ({ p, s: scoreModule(p, a) }))
    .sort((x, y) => y.s - x.s || (x.p.power_w ?? 0) - (y.p.power_w ?? 0))[0].p
  const bits: string[] = []
  if (a.environment === 'outdoor') bits.push(ipRated(best) ? `${best.waterproof?.toUpperCase()} rated for outdoor use` : 'closest available for outdoor use')
  if (a.colour === 'rgb') bits.push(isRgb(best) ? 'RGB colour-changing' : 'nearest colour option')
  else bits.push('matched to your colour temperature')
  return { product: best, reason: bits.join(' · ') }
}

function selectDriver(a: FymAnswers, module: Product | null, catalog: Product[], estimatedLoadW: number): DriverPick {
  const voltageV = module?.output_voltage_v ?? 12
  const outdoor = a.environment === 'outdoor'
  const fits = catalog.filter((p) =>
    isCvDriver(p) && live(p) && (p.power_w ?? 0) >= estimatedLoadW &&
    (p.output_voltage_v == null || p.output_voltage_v === voltageV) &&
    (!outdoor || ipRated(p)),
  ).sort((x, y) => (x.power_w ?? 0) - (y.power_w ?? 0))
  if (fits.length > 0) {
    return { kind: 'product', product: fits[0], reason: `${fits[0].power_w} W constant-voltage driver, sized above your ~${Math.round(estimatedLoadW)} W load` }
  }
  return {
    kind: 'spec',
    spec: { powerW: Math.ceil(estimatedLoadW), voltageV, ip: outdoor ? 'ip67' : 'ip20', mode: 'cv' },
    reason: `You need roughly a ${Math.ceil(estimatedLoadW)} W · ${voltageV} V${outdoor ? ' · IP67' : ''} constant-voltage driver — available through your regional distributor`,
  }
}

function selectControl(a: FymAnswers, catalog: Product[]): ControlPick {
  if (a.control === 'onoff') return null
  if (a.control === 'smart') {
    const ctrl = catalog.find((p) => isController(p) && live(p) &&
      (p.controller_type ?? []).some((c) => c === 'zigbee' || c === 'casambi'))
    return ctrl
      ? { kind: 'product', product: ctrl, reason: 'Smart controller for app / Zigbee control' }
      : { kind: 'note', reason: 'Add a Zigbee or Casambi controller for smart control — ask your distributor for the current model' }
  }
  // dimmable
  const dim = catalog.find((p) => (isCvDriver(p) || isController(p)) && live(p) && (p.dimming_control ?? []).length > 0)
  return dim
    ? { kind: 'product', product: dim, reason: 'Supports dimming' }
    : { kind: 'note', reason: 'Pair with a dimmable (triac / 0–10 V) driver — your distributor can supply one' }
}

export function recommend(answers: FymAnswers, catalog: Product[]): Recommendation {
  const module = selectModule(answers, catalog)
  const perModuleW = module?.product.power_w ?? 1.3
  const estimatedLoadW = SIZE_MODULE_COUNT[answers.size] * perModuleW * SAFETY
  const driver = selectDriver(answers, module?.product ?? null, catalog, estimatedLoadW)
  const control = selectControl(answers, catalog)
  return { module, driver, control, estimatedLoadW }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/find-your-match/match.test.ts`
Expected: PASS (all describe blocks).

- [ ] **Step 5: Commit**

```bash
git add src/lib/find-your-match/match.ts src/lib/find-your-match/match.test.ts
git commit -m "feat(fym): catalogue-agnostic rules engine (module/driver/control) + tests"
```

---

### Task 3: Template rationale (`explain.ts`)

**Files:**
- Create: `src/lib/find-your-match/explain.ts`
- Test: `src/lib/find-your-match/explain.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/find-your-match/explain.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { templateExplanation } from './explain'
import { recommend } from './match'
import type { FymAnswers } from './types'
import type { Product } from '@/lib/products'

const a: FymAnswers = { application: 'channel_letters', environment: 'outdoor', colour: 'white_warm', size: 'small', control: 'onoff' }
const catalog = [
  { sku: 'M', family: 'led_module', name: 'EcoGlo Module', series: 'envo_ecoglo', power_w: 1.3, waterproof: 'ip67', led_chip_colour: 'warm_white', enabled: true, hidden: false } as unknown as Product,
  { sku: 'D40', family: 'psu_led_cv', name: '40W Driver', power_w: 40, output_voltage_v: 12, waterproof: 'ip67', enabled: true, hidden: false } as unknown as Product,
]

describe('templateExplanation', () => {
  it('mentions the module and driver and is non-empty', () => {
    const text = templateExplanation(a, recommend(a, catalog))
    expect(text).toContain('EcoGlo Module')
    expect(text).toContain('40W Driver')
    expect(text.length).toBeGreaterThan(40)
  })
  it('describes the driver spec when no driver product fits', () => {
    const text = templateExplanation(a, recommend(a, [catalog[0]]))
    expect(text.toLowerCase()).toContain('distributor')
  })
})
```

- [ ] **Step 2: Run** — `npx vitest run src/lib/find-your-match/explain.test.ts` → FAIL (module missing).

- [ ] **Step 3: Implement `explain.ts`**

```ts
import type { FymAnswers, Recommendation } from './types'

const APP_LABEL: Record<FymAnswers['application'], string> = {
  channel_letters: 'channel letters', light_box: 'light box', facade: 'facade', other: 'signage',
}

export function templateExplanation(a: FymAnswers, rec: Recommendation): string {
  const parts: string[] = []
  if (rec.module) {
    parts.push(`For ${a.environment === 'outdoor' ? 'an outdoor' : 'an indoor'} ${APP_LABEL[a.application]} build, the ${rec.module.product.name} is the closest fit — ${rec.module.reason}.`)
  }
  if (rec.driver.kind === 'product') {
    parts.push(`Pair it with the ${rec.driver.product.name}: ${rec.driver.reason}.`)
  } else {
    parts.push(`${rec.driver.reason}.`)
  }
  if (rec.control?.kind === 'product') parts.push(`${rec.control.product.name} handles control — ${rec.control.reason}.`)
  else if (rec.control?.kind === 'note') parts.push(`${rec.control.reason}.`)
  parts.push('Send us the sign drawing for a free layout to confirm exact module spacing and driver sizing.')
  return parts.join(' ')
}

/** The instruction used when an LLM rationale is generated (Task 5). Kept here so the
    engine package owns the wording; the route passes the recommendation as JSON. */
export function rationalePrompt(a: FymAnswers, rec: Recommendation): string {
  return [
    'You are an LED signage engineer at ENVO, a components supplier. Write ONE short, factual paragraph (max 70 words)',
    'explaining why this recommended setup suits the customer\'s sign. Plain, helpful, NOT salesy. Do not invent specs.',
    `Customer answers: ${JSON.stringify(a)}`,
    `Recommended (from our catalogue): ${JSON.stringify({
      module: rec.module?.product.name ?? null,
      driver: rec.driver.kind === 'product' ? rec.driver.product.name : rec.driver.spec,
      control: rec.control?.kind === 'product' ? rec.control.product.name : (rec.control?.reason ?? null),
      estimatedLoadW: Math.round(rec.estimatedLoadW),
    })}`,
  ].join('\n')
}
```

- [ ] **Step 4: Run** — `npx vitest run src/lib/find-your-match/explain.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/find-your-match/explain.ts src/lib/find-your-match/explain.test.ts
git commit -m "feat(fym): template rationale + LLM rationale prompt builder"
```

---

### Task 4: Install Anthropic SDK + API route

**Files:**
- Modify: `package.json` (add dependency)
- Create: `src/app/api/find-your-match/route.ts`
- Modify: `.env.example` (document the optional key)

- [ ] **Step 1: Install the SDK**

Run: `npm install @anthropic-ai/sdk`
Expected: adds `@anthropic-ai/sdk` to dependencies, `npm ci`-clean lockfile.

- [ ] **Step 2: Create the API route**

`src/app/api/find-your-match/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { listProducts } from '@/lib/products'
import { recommend } from '@/lib/find-your-match/match'
import { templateExplanation, rationalePrompt } from '@/lib/find-your-match/explain'
import type { FymAnswers } from '@/lib/find-your-match/types'

export async function POST(req: Request) {
  let answers: FymAnswers
  try {
    answers = (await req.json()) as FymAnswers
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Feed the engine the live ENVO catalogue. (On Wellforces, a different
  // catalogue source would be passed — engine is catalogue-agnostic.)
  const { docs } = await listProducts({ limit: 1000 })
  const rec = recommend(answers, docs)

  let explanation = templateExplanation(answers, rec)
  const key = process.env.ANTHROPIC_API_KEY
  if (key) {
    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk')
      const client = new Anthropic({ apiKey: key })
      const msg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{ role: 'user', content: rationalePrompt(answers, rec) }],
      })
      const text = msg.content.find((b) => b.type === 'text')
      if (text && 'text' in text && text.text.trim()) explanation = text.text.trim()
    } catch {
      // Fall back to the template explanation on any AI error.
    }
  }

  return NextResponse.json({ ...rec, explanation })
}
```

- [ ] **Step 3: Document the optional key in `.env.example`**

Add this line:
```
# Optional — enables AI-written rationale on /find-your-match. Falls back to a template if unset.
ANTHROPIC_API_KEY=
```

- [ ] **Step 4: Verify** — `npx tsc --noEmit` → PASS. Then confirm the route responds (engine path, no key needed):

Run:
```bash
curl -s -X POST http://localhost:3000/api/find-your-match -H 'Content-Type: application/json' \
  -d '{"application":"channel_letters","environment":"outdoor","colour":"white_warm","size":"small","control":"smart"}' \
  | python3 -m json.tool | head -30
```
Expected: JSON with `module`, `driver`, `control`, `estimatedLoadW`, `explanation` (template text since no key).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/app/api/find-your-match/route.ts .env.example
git commit -m "feat(fym): API route — engine on live catalogue + optional Anthropic rationale"
```

---

### Task 5: Wizard UI + page

**Files:**
- Modify (overwrite): `src/app/(frontend)/find-your-match/page.tsx`
- Create: `src/app/(frontend)/find-your-match/Wizard.tsx`
- Create: `src/app/(frontend)/find-your-match/page.module.css`

- [ ] **Step 1: Create `page.module.css`**

```css
.hero { padding: 36px 0 8px; }
.eyebrow { display: inline-flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 600;
  letter-spacing: .18em; text-transform: uppercase; color: var(--color-brand-blue); }
.eyebrow::before { content: ''; width: 18px; height: 1.5px; background: var(--color-brand-lime); }
.title { margin: 14px 0 0; font-size: clamp(32px, 4.6vw, 50px); line-height: 1.04; letter-spacing: -.03em; font-weight: 700; color: var(--color-text-primary); }
.desc { margin: 14px 0 0; font-size: clamp(15px, 1.3vw, 18px); line-height: 1.55; color: var(--color-text-muted); max-width: 56ch; }

.wrap { padding: 16px 0 72px; max-width: 760px; }
.progress { font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: var(--color-text-subtle); margin: 0 0 12px; }
.q { font-size: clamp(22px, 2.4vw, 30px); font-weight: 700; letter-spacing: -.02em; color: var(--color-text-primary); margin: 0 0 20px; }
.opts { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.opt { text-align: left; border: 1px solid var(--color-line-strong); background: var(--color-surface-card); border-radius: 12px;
  padding: 16px 18px; font: inherit; font-size: 15px; font-weight: 600; color: var(--color-text-primary); cursor: pointer; transition: .14s; }
.opt:hover { border-color: var(--color-brand-blue); transform: translateY(-1px); }
.back { margin-top: 18px; background: none; border: none; color: var(--color-text-muted); font: inherit; font-size: 14px; cursor: pointer; }

.result { }
.resultCard { display: flex; gap: 16px; align-items: flex-start; border: 1px solid var(--color-line-strong); border-radius: 16px; padding: 20px; margin: 0 0 12px; background: var(--color-surface-card); }
.resultRole { font-size: 11px; text-transform: uppercase; letter-spacing: .12em; color: var(--color-text-subtle); margin: 0 0 4px; }
.resultName { font-size: 16px; font-weight: 700; color: var(--color-text-primary); margin: 0; }
.resultReason { font-size: 13.5px; line-height: 1.5; color: var(--color-text-muted); margin: 6px 0 0; }
.resultLink { font-size: 13px; font-weight: 600; color: var(--color-brand-blue); text-decoration: none; }
.rationale { border-left: 3px solid var(--color-brand-lime); padding: 4px 0 4px 16px; margin: 20px 0; color: var(--color-text-primary); line-height: 1.6; font-size: 15px; }
.ctaRow { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 24px; }
.loading { color: var(--color-text-muted); font-size: 15px; padding: 24px 0; }

@media (max-width: 640px) { .opts { grid-template-columns: 1fr; } }
```

- [ ] **Step 2: Create `Wizard.tsx`**

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { EnvoButton } from '@/components/ui/envo-button'
import { FYM_QUESTIONS } from '@/lib/find-your-match/copy'
import { dbFamilyToMarketing, seriesSlug } from '@/data/family-map'
import type { FymResult } from '@/lib/find-your-match/types'
import type { Product } from '@/lib/products'
import styles from './page.module.css'

function productHref(p: Product): string {
  const m = dbFamilyToMarketing(p.family ?? '')
  if (!m) return '/products'
  return `/products/${m.slug}/${seriesSlug(p.series)}/${p.sku}`
}

export function Wizard() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<FymResult | null>(null)
  const [loading, setLoading] = useState(false)

  async function choose(key: string, value: string) {
    const next = { ...answers, [key]: value }
    setAnswers(next)
    if (step < FYM_QUESTIONS.length - 1) {
      setStep(step + 1)
      return
    }
    setLoading(true)
    const res = await fetch('/api/find-your-match', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(next),
    })
    setResult(await res.json())
    setLoading(false)
  }

  function restart() {
    setStep(0); setAnswers({}); setResult(null)
  }

  if (loading) return <div className={styles.loading}>Finding your match…</div>

  if (result) {
    const Card = ({ role, name, reason, href }: { role: string; name: string; reason: string; href?: string }) => (
      <div className={styles.resultCard}>
        <div>
          <p className={styles.resultRole}>{role}</p>
          <p className={styles.resultName}>{name}</p>
          <p className={styles.resultReason}>{reason}</p>
          {href && <Link className={styles.resultLink} href={href}>View product →</Link>}
        </div>
      </div>
    )
    return (
      <div className={styles.result}>
        {result.module && (
          <Card role="Module" name={result.module.product.name} reason={result.module.reason} href={productHref(result.module.product)} />
        )}
        {result.driver.kind === 'product'
          ? <Card role="Driver" name={result.driver.product.name} reason={result.driver.reason} href={productHref(result.driver.product)} />
          : <Card role="Driver" name={`~${result.driver.spec.powerW} W · ${result.driver.spec.voltageV} V driver`} reason={result.driver.reason} />}
        {result.control?.kind === 'product' && (
          <Card role="Control" name={result.control.product.name} reason={result.control.reason} href={productHref(result.control.product)} />
        )}
        {result.control?.kind === 'note' && <Card role="Control" name="Control gear" reason={result.control.reason} />}

        <p className={styles.rationale}>{result.explanation}</p>

        <div className={styles.ctaRow}>
          <EnvoButton href="/free-layout-design" variant="primary" arrow>Confirm with a free layout</EnvoButton>
          <EnvoButton href="/products" variant="ghost">Browse the range</EnvoButton>
          <button className={styles.back} onClick={restart}>Start over</button>
        </div>
      </div>
    )
  }

  const q = FYM_QUESTIONS[step]
  return (
    <div>
      <p className={styles.progress}>Step {step + 1} of {FYM_QUESTIONS.length}</p>
      <h2 className={styles.q}>{q.label}</h2>
      <div className={styles.opts}>
        {q.options.map((o) => (
          <button key={o.value} className={styles.opt} onClick={() => choose(q.key, o.value)}>{o.label}</button>
        ))}
      </div>
      {step > 0 && <button className={styles.back} onClick={() => setStep(step - 1)}>← Back</button>}
    </div>
  )
}
```

- [ ] **Step 3: Overwrite `page.tsx`**

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { Wizard } from './Wizard'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Find your match — ENVO',
  description:
    'Answer five quick questions and we suggest the right ENVO module, driver and control for your sign — a fast selection aid, no commitment.',
}

export default function FindYourMatchPage() {
  return (
    <div className="theme-light">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">›</span>
          <span>Find your match</span>
        </div>

        <section className={styles.hero}>
          <span className={styles.eyebrow}>Find your match</span>
          <h1 className={styles.title}>Spec your setup in about a minute.</h1>
          <p className={styles.desc}>
            Five quick questions about your sign — we suggest the right module, driver and control
            from the ENVO range. A selection aid, not a quote.
          </p>
        </section>

        <div className={styles.wrap}>
          <Wizard />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify** — `npx tsc --noEmit` → PASS; `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/find-your-match` → 200; page no longer contains `has not been ported`.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(frontend)/find-your-match"
git commit -m "feat(fym): wizard UI + result page (supplier tone)"
```

---

### Task 6: Full verification

- [ ] **Step 1: tsc + lint + unit tests**

Run:
```bash
npx tsc --noEmit                                   # clean
npx eslint src/lib/find-your-match "src/app/(frontend)/find-your-match" src/app/api/find-your-match   # clean
npx vitest run src/lib/find-your-match              # all pass
npm test                                           # full suite green
```

- [ ] **Step 2: Walk the wizard (dev server, no API key set)**

Headless screenshot the page, then verify the API for two scenarios:
```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --hide-scrollbars \
  --window-size=1440,1000 --screenshot=/tmp/fym.png http://localhost:3000/find-your-match
# small indoor warm-white channel letters, on/off
curl -s -X POST http://localhost:3000/api/find-your-match -H 'Content-Type: application/json' \
  -d '{"application":"channel_letters","environment":"indoor","colour":"white_warm","size":"small","control":"onoff"}' | python3 -m json.tool
# large outdoor RGB facade, smart
curl -s -X POST http://localhost:3000/api/find-your-match -H 'Content-Type: application/json' \
  -d '{"application":"facade","environment":"outdoor","colour":"rgb","size":"large","control":"smart"}' | python3 -m json.tool
```
Expected: scenario 1 returns a warm-white module + a sized driver (or spec) + null control; scenario 2 returns an IP-rated RGB module + larger driver/spec + a smart controller (or note). `explanation` is the template text. Read `/tmp/fym.png` — the first question renders with click options, supplier tone, no hard-sell.

- [ ] **Step 3: User confirmation** of the wizard flow + result before finishing.

---

## Self-review notes

- **Spec coverage:** 5-question wizard (Task 1 copy + Task 5 UI); catalogue-agnostic engine `recommend(answers, catalog)` (Task 2); module/driver-sizing/control + spec fallback (Task 2); AI rationale optional with template fallback (Tasks 3 + 4); API route feeds live ENVO catalogue (Task 4); supplier-tone result + understated CTAs (Task 5); Wellforces reuse seam = the engine + route are catalogue-agnostic (no extra infra, per spec); non-goals (no cart/persistence/third-party data/open chat) respected. Verification incl. no-key path (Task 6).
- **Name consistency:** `FymAnswers`, `Recommendation`, `FymResult`, `DriverSpec`, `ModulePick`/`DriverPick`/`ControlPick`, `recommend`, `templateExplanation`, `rationalePrompt`, `FYM_QUESTIONS` used identically across tasks. `productHref` in the wizard reuses `dbFamilyToMarketing`/`seriesSlug` from the already-merged `family-map.ts`.
- **Placeholder scan:** none — every step has full code; the only literal `TODO`-like text is the AI catch-block comment (intentional fallback).
- **Colour refinement:** `single` removed from the spec's colour set (noted at top); engine + copy use warm/neutral/cool/rgb only.
