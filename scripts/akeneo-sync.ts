#!/usr/bin/env npx tsx
/**
 * Akeneo → Payload sync script (uses Payload local API — no auth needed).
 * All field mapping lives in src/lib/akeneo/sync.ts (single source — this file
 * is only the CLI bootstrap; the two used to fork and drift, see
 * notes/pim-vs-site-audit-2026-07-31.md).
 *
 * Usage:  npx tsx --tsconfig tsconfig.json scripts/akeneo-sync.ts               (spec-only sync, nightly default)
 *         npx tsx --tsconfig tsconfig.json scripts/akeneo-sync.ts --limit 5     (test: first N)
 *         npx tsx --tsconfig tsconfig.json scripts/akeneo-sync.ts --sku EV-X    (single SKU)
 *         npx tsx --tsconfig tsconfig.json scripts/akeneo-sync.ts --full-fields (also overwrite name/descriptions/seo —
 *                                                                                clobbers manual site copy; deliberate runs only)
 *
 * Spec-only (default) skips SYNC_PROTECTED_FIELDS on updates and skips
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

const limitArg = process.argv.indexOf('--limit')
const LIMIT = limitArg !== -1 ? parseInt(process.argv[limitArg + 1]) : null
const skuArg = process.argv.indexOf('--sku')
const SKU = skuArg !== -1 ? process.argv[skuArg + 1] : undefined
const FULL_FIELDS = process.argv.includes('--full-fields')

async function main() {
  console.log(`\nAkeneo sync — ${SKU ? `single SKU ${SKU}` : LIMIT ? `test mode (${LIMIT} products)` : 'full sync'}${FULL_FIELDS ? ' [FULL FIELDS]' : ' [spec-only]'}\n`)

  // Dynamic imports AFTER env is loaded (see top-of-file note).
  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config.ts')
  const { getAkeneoToken, fetchEnvoProducts, normalise, upsertProduct } = await import('../src/lib/akeneo/sync.ts')
  const payload = await getPayload({ config })

  console.log('Authenticating with Akeneo...')
  const token = await getAkeneoToken()
  console.log('✓ Token obtained\n')

  console.log('Fetching products from Akeneo...')
  const products = await fetchEnvoProducts(token, LIMIT, SKU)
  console.log(`✓ Fetched ${products.length} products\n`)

  let ok = 0
  let skipped = 0
  let failed = 0

  for (const p of products) {
    const data = normalise(p)
    try {
      const res = await upsertProduct(payload, data, { specOnly: !FULL_FIELDS })
      if (res.status === 'skipped_locked') {
        console.log(`  ⏭ ${data.sku.padEnd(22)} sync_locked — skipped`)
        skipped++
      } else {
        console.log(`  ✓ ${data.sku.padEnd(22)} ${res.status}`)
        ok++
      }
    } catch (e) {
      console.error(`  ✗ ${data.sku.padEnd(22)} ${e instanceof Error ? e.message : String(e)}`)
      failed++
    }
  }

  console.log(`\nDone. ${ok} synced, ${skipped} locked-skipped, ${failed} failed.`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch(e => { console.error(e); process.exit(1) })
