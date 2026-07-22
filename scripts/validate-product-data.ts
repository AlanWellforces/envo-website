/**
 * Product-data sanity validator (external audit 2026-07-21).
 *
 * Cross-checks the physics-linked spec fields against each other and flags
 * values that cannot be right — the class of error that shipped "29 A" on a
 * 35 W / 12 V driver (dropped decimal point) and "2 kg" on a 14 mm signage
 * module (grams stored in a kg column).
 *
 * Checks:
 *   current   rated_current_a ≈ power_w ÷ output_voltage_v   (drivers)
 *   efficacy  efficacy_lm_w   ≈ brightness_lm ÷ power_w
 *   weight    plausible kg for the family (modules are grams-light)
 *   dims      0 < mm < 2000
 *   spelling  known catalogue typos in name/short_description
 *   style     brand casing (ENVO), term canon (Zigbee/Colour/In-Wall/…),
 *             stray whitespace — rules live in scripts/lib/product-lexicon.ts
 *   datasheet CCT-variant groups where only SOME variants carry a datasheet
 *
 * Usage:  npx tsx --tsconfig tsconfig.json scripts/validate-product-data.ts
 * Reads DATABASE_URL via .env.local (falls back to .env) — run it on the box
 * against prod, or locally after db-refresh-from-prod.sh. Read-only.
 * Exits 1 when any issue is found, so it can gate a publish step.
 */
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import { lintCopy } from './lib/product-lexicon'
dotenv.config({ path: fs.existsSync('.env.local') ? '.env.local' : '.env' })

// Verified-correct outliers that a naive P = V·I check would "fix" back into
// being wrong. EV-SL/SNL-150-12 is genuinely derated: the datasheet says
// 0–11 A and 132 W rated on the 150 W/12 V nameplate (checked 2026-07-17 —
// see notes/prod-data-fixes-2026-07-17.md §5). Never flag these.
const CURRENT_WHITELIST = new Set(['EV-SL-150-12', 'EV-SNL-150-12'])

type Row = {
  sku: string
  name: string
  family: string | null
  power_w: number | null
  output_voltage_v: number | null
  rated_current_a: number | null
  brightness_lm: number | null
  efficacy_lm_w: number | null
  weight_kg: number | null
  length_mm: number | null
  width_mm: number | null
  height_mm: number | null
  short_description: string | null
  spec_sheet_url: string | null
  operation_mode: string | null
}

type Issue = { sku: string; check: string; detail: string }

const stripCct = (sku: string) => sku.replace(/-(WW|NW|CW)$/i, '')

export function validate(rows: Row[]): Issue[] {
  const issues: Issue[] = []
  const push = (sku: string, check: string, detail: string) => issues.push({ sku, check, detail })

  for (const p of rows) {
    // ── current ≈ power ÷ voltage (CV drivers carry all three) ──
    if (
      !CURRENT_WHITELIST.has(p.sku) &&
      p.rated_current_a != null && p.power_w != null && p.output_voltage_v != null &&
      p.rated_current_a > 0 && p.power_w > 0 && p.output_voltage_v > 0
    ) {
      const expected = p.power_w / p.output_voltage_v
      const ratio = p.rated_current_a / expected
      // Asymmetric band: derating only ever puts real current BELOW P÷V
      // (EV-SL-150-12 sits at ×0.88), so allow down to ×0.7 — but a current
      // ABOVE what the wattage can deliver is physically wrong (the 150 W/24 V
      // model carried the 200 W model's 8.33 A, ×1.33), so the ceiling is
      // rounding-tolerance only.
      if (ratio < 0.7 || ratio > 1.15) {
        push(p.sku, 'current', `rated_current_a=${p.rated_current_a} but ${p.power_w}W ÷ ${p.output_voltage_v}V ≈ ${expected.toFixed(2)}A (×${ratio.toFixed(2)})`)
      }
    }

    // ── efficacy ≈ lumens ÷ watts ──
    if (p.efficacy_lm_w != null && p.brightness_lm != null && p.power_w != null && p.power_w > 0) {
      const expected = p.brightness_lm / p.power_w
      const ratio = p.efficacy_lm_w / expected
      if (ratio < 0.9 || ratio > 1.1) {
        push(p.sku, 'efficacy', `efficacy_lm_w=${p.efficacy_lm_w} but ${p.brightness_lm}lm ÷ ${p.power_w}W ≈ ${expected.toFixed(2)} lm/W`)
      }
    }

    // ── weight plausibility (kg) ──
    if (p.weight_kg != null) {
      if (p.weight_kg <= 0) push(p.sku, 'weight', `weight_kg=${p.weight_kg} — non-positive`)
      else if (p.family === 'led_module' && p.weight_kg > 0.5)
        push(p.sku, 'weight', `weight_kg=${p.weight_kg} on a signage module — modules weigh grams; grams stored as kg?`)
      else if (p.weight_kg > 20)
        push(p.sku, 'weight', `weight_kg=${p.weight_kg} — implausibly heavy`)
    }

    // ── dimension plausibility (mm) ──
    for (const [field, v] of [['length_mm', p.length_mm], ['width_mm', p.width_mm], ['height_mm', p.height_mm]] as const) {
      if (v != null && (v <= 0 || v > 2000)) push(p.sku, 'dims', `${field}=${v} — outside 0–2000 mm`)
    }

    // ── spelling & style (rules: scripts/lib/product-lexicon.ts) ──
    for (const [field, text] of [['name', p.name], ['short_description', p.short_description]] as const) {
      if (!text) continue
      for (const i of lintCopy(text)) {
        push(p.sku, i.kind === 'typo' ? 'spelling' : 'style', `${field}: "${i.found}" → "${i.fix}"`)
      }
    }
  }

  // ── datasheet coverage per CCT-variant group: all or nothing ──
  const groups = new Map<string, Row[]>()
  for (const p of rows) {
    if (p.family !== 'led_module') continue
    const code = stripCct(p.sku)
    if (code === p.sku) continue // unsuffixed — no variant group
    groups.set(code, [...(groups.get(code) ?? []), p])
  }
  for (const [code, variants] of groups) {
    const withSheet = variants.filter((v) => v.spec_sheet_url)
    if (withSheet.length > 0 && withSheet.length < variants.length) {
      const missing = variants.filter((v) => !v.spec_sheet_url).map((v) => v.sku)
      push(code, 'datasheet', `only ${withSheet.length}/${variants.length} CCT variants carry a datasheet — missing: ${missing.join(', ')}`)
    }
  }

  return issues
}

async function main() {
  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config.ts')
  const payload = await getPayload({ config })

  const rows: Row[] = []
  let page = 1
  for (;;) {
    const r = await payload.find({ collection: 'products', limit: 200, page, depth: 0, sort: 'sku' })
    rows.push(...(r.docs as unknown as Row[]))
    if (!r.hasNextPage) break
    page++
  }
  console.log(`checked ${rows.length} products`)

  const issues = validate(rows)
  if (!issues.length) {
    console.log('✓ no data issues found')
    process.exit(0)
  }
  const byCheck = new Map<string, Issue[]>()
  for (const i of issues) byCheck.set(i.check, [...(byCheck.get(i.check) ?? []), i])
  for (const [check, list] of byCheck) {
    console.log(`\n── ${check} (${list.length}) ──`)
    for (const i of list) console.log(`  ${i.sku}: ${i.detail}`)
  }
  console.log(`\n${issues.length} issue(s) found`)
  process.exit(1)
}

// Import-safe for unit tests: only run when executed directly.
if (process.argv[1]?.endsWith('validate-product-data.ts')) main()
