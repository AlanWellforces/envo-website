#!/usr/bin/env npx tsx
/**
 * Akeneo → Payload sync script (uses Payload local API — no auth needed)
 * Usage:  npx tsx --tsconfig tsconfig.json scripts/akeneo-sync.ts          (full sync)
 *         npx tsx --tsconfig tsconfig.json scripts/akeneo-sync.ts --limit 5 (test: first N)
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
import { CERT_CODES } from '../src/lib/cert-codes.ts'

// Env MUST be loaded before `payload`/payload.config are imported: payload.config
// reads process.env.PAYLOAD_SECRET at module-eval time, and importing `payload`
// triggers its nested @next/env, which trips a tsx CJS-interop bug (see
// scripts/generate-types.mts). So we (1) prime @next/env's default export,
// (2) load env here, and (3) import payload + config DYNAMICALLY in main() —
// never as static top-level imports (those would hoist ahead of this).
const root = path.resolve(__dirname, '..')
const nextEnvReq = createRequire(path.join(root, 'node_modules/payload/dist/bin/dummy.js'))
const nextEnv = nextEnvReq('@next/env') as { default?: unknown }
if (!nextEnv.default) nextEnv.default = nextEnv
for (const f of ['.env.local', '.env']) {
  const p = path.join(root, f)
  if (fs.existsSync(p)) dotenv.config({ path: p })
}

const AKENEO_URL    = process.env.AKENEO_URL!
const CLIENT_ID     = process.env.AKENEO_CLIENT_ID!
const CLIENT_SECRET = process.env.AKENEO_CLIENT_SECRET!
const USERNAME      = process.env.AKENEO_USERNAME!
const PASSWORD      = process.env.AKENEO_PASSWORD!

const limitArg = process.argv.indexOf('--limit')
const LIMIT = limitArg !== -1 ? parseInt(process.argv[limitArg + 1]) : null

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

async function getToken(): Promise<string> {
  const res = await fetch(`${AKENEO_URL}/api/oauth/v1/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
    },
    body: JSON.stringify({ grant_type: 'password', username: USERNAME, password: PASSWORD }),
  })
  if (!res.ok) throw new Error(`Akeneo auth failed: ${res.status} ${await res.text()}`)
  const { access_token } = await res.json() as { access_token: string }
  return access_token
}

// ---------------------------------------------------------------------------
// Fetch products
// ---------------------------------------------------------------------------

async function fetchEnvoProducts(token: string): Promise<any[]> {
  const search = encodeURIComponent(JSON.stringify({
    brand: [{ operator: 'IN', value: ['envo'], locale: 'en_US' }],
  }))

  const all: any[] = []
  let page = 1

  while (true) {
    const url = `${AKENEO_URL}/api/rest/v1/products?limit=100&page=${page}&search=${search}`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) throw new Error(`Akeneo fetch failed: ${res.status} ${await res.text()}`)
    const body = await res.json() as { _embedded: { items: any[] } }
    const items = body._embedded?.items ?? []
    all.push(...items)
    if (items.length < 100) break
    if (LIMIT && all.length >= LIMIT) break
    page++
  }

  return LIMIT ? all.slice(0, LIMIT) : all
}

// ---------------------------------------------------------------------------
// Normalise
// ---------------------------------------------------------------------------

function getVal(values: any, attr: string, scope?: string, locale?: string) {
  const arr: any[] = values?.[attr]
  if (!arr || !arr.length) return null
  if (scope) {
    const match = arr.find(v =>
      v.scope === scope && (locale == null || v.locale === locale)
    )
    return match?.data ?? null
  }
  return arr[0]?.data ?? null
}

function getAmount(values: any, attr: string): number | null {
  const d = getVal(values, attr)
  if (d == null) return null
  const n = typeof d === 'object' ? d?.amount : d
  return n != null ? parseFloat(n) : null
}

function getString(values: any, attr: string, scope?: string, locale?: string): string | null {
  const d = getVal(values, attr, scope, locale)
  if (d == null) return null
  if (Array.isArray(d)) return d[0] ?? null
  return String(d)
}

function normalise(p: any) {
  const v = p.values ?? {}

  // Dimming control
  const dimmingRaw: any = getVal(v, 'dimming_control')
  const dimmingArr: string[] = Array.isArray(dimmingRaw) ? dimmingRaw : dimmingRaw ? [dimmingRaw] : []
  const dimmingMap: Record<string, string> = {
    none: 'none', dali: 'dali', dali2: 'dali', '0_10v': '0_10v', '1_10v': '0_10v',
    pwm: 'pwm', triac: 'triac', casambi: 'casambi', dmx: 'dmx', knx: 'knx',
    matter: 'matter', zigbee: 'zigbee',
  }
  const dimming_control = dimmingArr.map(d => dimmingMap[String(d).toLowerCase()] ?? null).filter(Boolean) as string[]

  // Standards — Akeneo emits canonical cert codes ('c_ce', 'c_cul', …) matching
  // our Payload select values 1:1. Keep known codes, log unknowns (don't drop
  // silently; the old re-prefix map dropped every cert → 0/224).
  const stdRaw: any = getVal(v, 'standards_met')
  const stdArr: string[] = Array.isArray(stdRaw) ? stdRaw : stdRaw ? [stdRaw] : []
  const standards_met = stdArr
    .map(s => String(s).toLowerCase())
    .filter(c => {
      if (CERT_CODES.has(c)) return true
      console.warn(`[akeneo-sync] ${p.identifier}: unknown cert code '${c}' — add it to src/lib/cert-codes.ts`)
      return false
    })

  // IP rating
  const ipRaw = getString(v, 'waterproof') ?? ''
  const ipMap: Record<string, string> = {
    non_waterproof: 'non_waterproof', ip20: 'ip20', ip44: 'ip44',
    ip65: 'ip65', ip67: 'ip67', ip68: 'ip68',
  }
  const waterproof = ipMap[ipRaw.toLowerCase()] ?? null

  // Operation mode
  const opRaw = getString(v, 'operation_mode') ?? ''
  const opMap: Record<string, string> = { cv: 'cv', cc: 'cc', cv_cc: 'cv_cc', 'cv+cc': 'cv_cc' }
  const operation_mode = opMap[opRaw.toLowerCase()] ?? null

  // Images
  const imgArr: any[] = v.product_image ?? []
  const image_url_fallback = imgArr[0]?.aws ?? imgArr[0]?._links?.download?.href ?? null

  const cleanArr: any[] = v.product_clean_image ?? v.clean_image ?? []
  const clean_image_url_fallback = cleanArr[0]?.aws ?? cleanArr[0]?._links?.download?.href ?? null

  // Price
  const priceScope = v.price_retail?.find((x: any) => x.scope === 'envo_nz')?.data ?? []
  const priceNzd = priceScope.find((x: any) => x.currency === 'NZD')?.amount ?? null

  // Name — try envo_nz scope, then master_catalogue, then identifier
  const name =
    getVal(v, 'product_name', 'envo_nz', 'en_US') ??
    getVal(v, 'product_name', 'master_catalogue', 'en_US') ??
    getVal(v, 'product_name') ??
    p.identifier

  return {
    sku:                     p.identifier as string,
    family:                  (p.family ?? null) as string | null,
    series:                  getString(v, 'series'),
    brand:                   'envo',
    categories:              (p.categories ?? []).map((c: string) => ({ code: c })),
    akeneo_synced_at:        new Date().toISOString(),

    name:                    String(name),
    subtitle:                getVal(v, 'subtitle', 'envo_nz', 'en_US') ?? getVal(v, 'subtitle') ?? null,
    short_description:       getString(v, 'short_description'),
    description:             getString(v, 'description'),
    enabled:                 p.enabled ?? true,
    hidden:                  false,

    image_url_fallback,
    clean_image_url_fallback,
    // Datasheets: read the absolute `.aws` URL (with the Akeneo download href as
    // fallback) exactly like images above — NOT the raw relative key, which
    // 404s as an href. Mirrors src/lib/akeneo/sync.ts. See src/lib/asset-url.ts.
    spec_sheet_url:          (v.spec_sheet?.[0]?.aws ?? v.spec_sheet?.[0]?._links?.download?.href) ?? getString(v, 'datasheet_url'),

    power_w:                 getAmount(v, 'power_rating'),
    output_voltage_v:        getAmount(v, 'output_voltage'),
    input_voltage_min_v:     getAmount(v, 'input_voltage_min'),
    input_voltage_max_v:     getAmount(v, 'input_voltage_max'),
    rated_current_a:         getAmount(v, 'rated_current'),
    number_of_outputs:       getVal(v, 'number_of_output') as number | null,
    operation_mode,
    dimming_control,

    length_mm:               getAmount(v, 'length'),
    width_mm:                getAmount(v, 'width'),
    height_mm:               getAmount(v, 'height'),
    weight_kg:               getAmount(v, 'weight'),
    waterproof,
    temp_min_c:              getAmount(v, 'temp_min'),
    temp_max_c:              getAmount(v, 'temp_max'),

    standards_met,
    warranty_years:          getVal(v, 'warranty_years') as number | null,

    price_nzd:               priceNzd != null ? parseFloat(priceNzd) : null,
    inventory_type:          getString(v, 'inventory_type'),
    pack_qty:                getVal(v, 'pack_qty') as number | null,
    shipping_lead_days:      getAmount(v, 'shipping_lead_time'),
    manufacturing_lead_days: getAmount(v, 'manufacturing_lead_time'),

    seo_title:               getString(v, 'seo_title'),
    seo_description:         getString(v, 'seo_meta_description'),
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`\nAkeneo sync — ${LIMIT ? `test mode (${LIMIT} products)` : 'full sync'}\n`)

  // Dynamic import AFTER env is loaded (see top-of-file note).
  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config.ts')
  const payload = await getPayload({ config })

  console.log('Authenticating with Akeneo...')
  const token = await getToken()
  console.log('✓ Token obtained\n')

  console.log('Fetching products from Akeneo...')
  const products = await fetchEnvoProducts(token)
  console.log(`✓ Fetched ${products.length} products\n`)

  let ok = 0
  let failed = 0

  for (const p of products) {
    const data = normalise(p)
    try {
      // Check if product exists
      const existing = await payload.find({
        collection: 'products',
        where: { sku: { equals: data.sku } },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        await payload.update({
          collection: 'products',
          id: existing.docs[0].id,
          data: data as any,
        })
      } else {
        await payload.create({
          collection: 'products',
          data: data as any,
        })
      }

      console.log(`  ✓ ${data.sku.padEnd(22)} ${data.name}`)
      ok++
    } catch (e: any) {
      console.error(`  ✗ ${data.sku.padEnd(22)} ${e.message}`)
      failed++
    }
  }

  console.log(`\nDone. ${ok} synced, ${failed} failed.`)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
