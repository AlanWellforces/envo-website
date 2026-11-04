#!/usr/bin/env npx tsx
/* eslint-disable @typescript-eslint/no-explicit-any --
   Akeneo REST payloads and Payload docs are handled as loose shapes here by
   design, same as src/lib/akeneo/sync.ts. */
/**
 * PIM → Payload sync script (new PIM since 2026-11-05, via src/lib/pim/newpim.ts) (uses Payload local API — no auth needed).
 * All field mapping lives in src/lib/akeneo/sync.ts (single source — this file
 * is only the CLI orchestration; the two used to fork and drift, see
 * notes/pim-vs-site-audit-2026-07-31.md).
 *
 * Usage:  npx tsx --tsconfig tsconfig.json scripts/akeneo-sync.ts               (spec-only sync, nightly default)
 *         npx tsx --tsconfig tsconfig.json scripts/akeneo-sync.ts --limit 5     (test: first N)
 *         npx tsx --tsconfig tsconfig.json scripts/akeneo-sync.ts --sku EV-X    (single SKU)
 *         npx tsx --tsconfig tsconfig.json scripts/akeneo-sync.ts --full-fields (also overwrite name/descriptions/seo —
 *                                                                                clobbers manual site copy; deliberate runs only)
 *         npx tsx --tsconfig tsconfig.json scripts/akeneo-sync.ts --force       (bypass the safety guards below)
 *
 * Unattended-run safety (the nightly job runs this with nobody watching):
 *   1. Catalogue-size guard — a full run aborts if Akeneo returns fewer than
 *      --min-products (default 250): a tiny result set means an API/filter
 *      problem, not a real catalogue.
 *   2. Change-budget guard — the run first computes, read-only, which products
 *      actually differ; if more than --max-changed (default 100) would be
 *      written, it aborts before touching the DB. A sweeping PIM accident
 *      (bulk attribute wipe) should page a human, not propagate.
 *   3. Diff-aware writes — unchanged products are not rewritten, so a normal
 *      night touches a handful of rows, not all 313.
 *   4. Post-write verify — every written product is read back and re-diffed;
 *      any residual difference fails the run (exit 1).
 *   Guard aborts exit 2 so the runner can tell "refused to act" from "acted
 *   and something failed".
 *
 * Spec-only (default) never overwrites SYNC_PROTECTED_FIELDS and skips
 * sync_locked products entirely; creates always carry every field.
 *
 * Schema must be in sync first. If a Payload Collection was added/changed but
 * the DB schema wasn't pushed, EVERY upsert fails with an opaque
 * "Failed query … payload_locked_documents". Push additive schema once with:
 *   PAYLOAD_DB_PUSH=true npx tsx --tsconfig tsconfig.json scripts/akeneo-sync.ts --limit 1
 * (No migrations dir exists — push is gated by PAYLOAD_DB_PUSH, payload.config.ts.)
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
import { createRequire } from 'node:module'

// Env MUST be loaded before `payload`/payload.config/lib sync are imported:
// payload.config reads process.env.PAYLOAD_SECRET at module-eval time (and the
// lib reads AKENEO_*), and importing `payload` triggers its nested @next/env,
// which trips a tsx CJS-interop bug (see scripts/generate-types.mts). So we
// (1) prime @next/env's default export, (2) load env here, and (3) import
// everything DYNAMICALLY in main() — never as static top-level imports.
// dotenv does NOT override pre-set env vars, so a caller-supplied DATABASE_URL
// (e.g. the nightly runner pointing at prod through a tunnel) wins.
const root = path.resolve(__dirname, '..')
const nextEnvReq = createRequire(path.join(root, 'node_modules/payload/dist/bin/dummy.js'))
const nextEnv = nextEnvReq('@next/env') as { default?: unknown }
if (!nextEnv.default) nextEnv.default = nextEnv
for (const f of ['.env.local', '.env']) {
  const p = path.join(root, f)
  if (fs.existsSync(p)) dotenv.config({ path: p })
}

function intFlag(name: string, dflt: number): number {
  const i = process.argv.indexOf(name)
  return i !== -1 ? parseInt(process.argv[i + 1]) : dflt
}
const limitArg = process.argv.indexOf('--limit')
const LIMIT = limitArg !== -1 ? parseInt(process.argv[limitArg + 1]) : null
const skuArg = process.argv.indexOf('--sku')
const SKU = skuArg !== -1 ? process.argv[skuArg + 1] : undefined
const FULL_FIELDS = process.argv.includes('--full-fields')
const FORCE = process.argv.includes('--force')
const MIN_PRODUCTS = intFlag('--min-products', 250)
const MAX_CHANGED = intFlag('--max-changed', 100)
// --plan-only: read-only dry run. Prints every field that would change with its
// stored and incoming value, writes the full plan to --plan-out (JSON), and
// exits before the write phase. Used to validate the new-PIM adapter.
const PLAN_ONLY = process.argv.includes('--plan-only')
const planOutArg = process.argv.indexOf('--plan-out')
const PLAN_OUT = planOutArg !== -1 ? process.argv[planOutArg + 1] : null

async function main() {
  console.log(`\nAkeneo sync — ${SKU ? `single SKU ${SKU}` : LIMIT ? `test mode (${LIMIT} products)` : 'full sync'}${FULL_FIELDS ? ' [FULL FIELDS]' : ' [spec-only]'}${FORCE ? ' [guards bypassed]' : ''}\n`)

  // Dynamic imports AFTER env is loaded (see top-of-file note).
  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config.ts')
  const { normalise, diffProductFields, stripProtectedFields } =
    await import('../src/lib/akeneo/sync.ts')
  // Product source: the new PIM (Akeneo retired 2026-11-05). The adapter returns
  // products in the legacy Akeneo shape, so normalise() and the guards are unchanged.
  const { fetchEnvoProducts } = await import('../src/lib/pim/newpim.ts')
  const payload = await getPayload({ config })

  console.log('Fetching products from the new PIM...')
  const products = await fetchEnvoProducts(LIMIT, SKU)
  console.log(`✓ Fetched ${products.length} products\n`)

  // Guard 1: a full run on a suspiciously small catalogue is an upstream
  // problem — refuse rather than mass-disable/mass-null.
  const isFullRun = !SKU && !LIMIT
  if (isFullRun && !FORCE && products.length < MIN_PRODUCTS) {
    console.error(`ABORT: the PIM returned only ${products.length} products (< ${MIN_PRODUCTS}). Refusing full sync — rerun with --force if this is genuinely expected.`)
    process.exit(2)
  }

  // Plan phase (read-only): one bulk read, then diff everything in memory.
  const existingAll = await payload.find({ collection: 'products', pagination: false, depth: 0 })
  const bySku = new Map(existingAll.docs.map((d: any) => [d.sku, d]))

  type Plan = { kind: 'create' | 'update'; sku: string; data: Record<string, any>; id?: number | string; fields?: string[] }
  const plans: Plan[] = []
  let unchanged = 0
  let locked = 0

  for (const p of products) {
    const data = normalise(p)
    const existing = bySku.get(data.sku) as any
    if (!existing) {
      plans.push({ kind: 'create', sku: data.sku, data })
      continue
    }
    if (existing.sync_locked) { locked++; continue }
    const updateData = FULL_FIELDS ? data : stripProtectedFields(data)
    const fields = diffProductFields(existing, updateData)
    if (!fields.length) { unchanged++; continue }
    plans.push({ kind: 'update', sku: data.sku, data: updateData, id: existing.id, fields })
  }

  console.log(`Plan: ${plans.filter(p => p.kind === 'create').length} create, ${plans.filter(p => p.kind === 'update').length} update, ${unchanged} unchanged, ${locked} locked\n`)
  for (const pl of plans.slice(0, 40)) {
    console.log(`  ~ ${pl.sku.padEnd(22)} ${pl.kind}${pl.fields ? ': ' + pl.fields.join(', ') : ''}`)
  }
  if (plans.length > 40) console.log(`  … and ${plans.length - 40} more`)

  if (PLAN_ONLY) {
    const detail = plans.map(pl => {
      const ex = bySku.get(pl.sku) as any
      const fields = pl.fields ?? Object.keys(pl.data)
      return {
        sku: pl.sku, kind: pl.kind,
        changes: Object.fromEntries(fields.map(f => [f, { stored: ex?.[f] ?? null, incoming: pl.data[f] ?? null }])),
      }
    })
    if (PLAN_OUT) fs.writeFileSync(PLAN_OUT, JSON.stringify({ fetched: products.length, unchanged, locked, plans: detail }, null, 1))
    console.log(`\nPLAN-ONLY: no writes performed.${PLAN_OUT ? ` Plan written to ${PLAN_OUT}` : ''}`)
    process.exit(0)
  }

  // Guard 2: a change set this large is not a nightly drift — it's either a
  // deliberate migration (rerun with --force) or a PIM-side accident.
  if (isFullRun && !FORCE && plans.length > MAX_CHANGED) {
    console.error(`\nABORT: ${plans.length} products would change (> ${MAX_CHANGED}). No writes performed. Inspect the plan above; rerun with --force for a deliberate mass update.`)
    process.exit(2)
  }

  // Write phase.
  let ok = 0
  let failed = 0
  for (const pl of plans) {
    try {
      if (pl.kind === 'update') {
        await payload.update({ collection: 'products', id: pl.id!, data: pl.data as any })
      } else {
        await payload.create({ collection: 'products', data: pl.data as any })
      }
      ok++
    } catch (e) {
      console.error(`  ✗ ${pl.sku.padEnd(22)} ${e instanceof Error ? e.message : String(e)}`)
      failed++
    }
  }

  // Verify phase: read back everything we wrote and re-diff. Anything still
  // different means a write was silently lost or mangled.
  let verifyFailed = 0
  for (const pl of plans) {
    const re = await payload.find({ collection: 'products', where: { sku: { equals: pl.sku } }, limit: 1, depth: 0 })
    const doc = re.docs[0] as any
    const residual = doc ? diffProductFields(doc, pl.data) : ['<product missing>']
    if (residual.length) {
      console.error(`  ✗ verify ${pl.sku.padEnd(22)} still differs: ${residual.join(', ')}`)
      verifyFailed++
    }
  }

  console.log(`\nDone. ${ok} written (${unchanged} unchanged, ${locked} locked-skipped), ${failed} write failures, ${verifyFailed} verify failures.`)
  // Machine-readable marker for the nightly runner: lets it skip the full-tree
  // revalidate + CF purge on nights where nothing changed.
  console.log(`::changed=${ok}::`)
  process.exit(failed > 0 || verifyFailed > 0 ? 1 : 0)
}

main().catch(e => { console.error(e); process.exit(1) })
