#!/usr/bin/env npx tsx
/**
 * One-off fix: retag 16 SKUs from c_fc → c_fcc in Akeneo PIM.
 * "FC" is a mis-entry of FCC (see PR #81 comment).
 * Run: npx tsx --tsconfig tsconfig.json scripts/fix-cfc-to-cfcc.mts
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

const root = path.resolve(import.meta.dirname, '..')
for (const f of ['.env.local', '.env']) {
  const p = path.join(root, f)
  if (fs.existsSync(p)) dotenv.config({ path: p })
}

const AKENEO_URL    = process.env.AKENEO_URL!
const CLIENT_ID     = process.env.AKENEO_CLIENT_ID!
const CLIENT_SECRET = process.env.AKENEO_CLIENT_SECRET!
const USERNAME      = process.env.AKENEO_USERNAME!
const PASSWORD      = process.env.AKENEO_PASSWORD!

const SKUS_TO_FIX = [
  'EV-ZB1029-5C', 'EV-ZB2803-G4-5C', 'EV-ZB2835PAC(US)', 'EV-ZB2868K7-5C',
  'EV-ZB2868K7-DIM', 'EV-ZB9001K12-DIM-Z4', 'EV-ZB9041A-D', 'EV-ZB9101CS',
  'EV-ZB9101SAC-HP', 'EV-ZB9101SAC-HPS2CH', 'EV-ZBDA-2421', 'EV-ZBGW',
  'EV-ZBP2801KS', 'SR-2303AC', 'SR-2309PRO-5C', 'KVS-24096-A',
]

async function getToken(): Promise<string> {
  const res = await fetch(`${AKENEO_URL}/api/oauth/v1/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
    },
    body: JSON.stringify({ grant_type: 'password', username: USERNAME, password: PASSWORD }),
  })
  if (!res.ok) throw new Error(`Auth failed: ${res.status} ${await res.text()}`)
  const { access_token } = await res.json() as { access_token: string }
  return access_token
}

async function getProduct(token: string, sku: string): Promise<any> {
  const res = await fetch(`${AKENEO_URL}/api/rest/v1/products/${encodeURIComponent(sku)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`GET ${sku} failed: ${res.status} ${await res.text()}`)
  return res.json()
}

async function patchProduct(token: string, sku: string, values: Record<string, any>): Promise<void> {
  const res = await fetch(`${AKENEO_URL}/api/rest/v1/products/${encodeURIComponent(sku)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  })
  if (!res.ok && res.status !== 204) throw new Error(`PATCH ${sku} failed: ${res.status} ${await res.text()}`)
}

async function main() {
  console.log('Authenticating with Akeneo…')
  const token = await getToken()
  console.log('OK\n')

  let fixed = 0, skipped = 0, errored = 0

  for (const sku of SKUS_TO_FIX) {
    try {
      const product = await getProduct(token, sku)
      const certEntry = product.values?.standards_met?.[0]
      const certs: string[] = certEntry?.data ?? []

      if (!certs.includes('c_fc')) {
        console.log(`SKIP  ${sku} — c_fc not found (certs: ${certs.join(', ') || 'none'})`)
        skipped++
        continue
      }

      // Replace c_fc → c_fcc (dedup in case c_fcc somehow already present)
      const updated = [...new Set(certs.map(c => c === 'c_fc' ? 'c_fcc' : c))]

      await patchProduct(token, sku, {
        standards_met: [{ locale: null, scope: null, data: updated }],
      })

      console.log(`FIXED ${sku}: [${certs.join(', ')}] → [${updated.join(', ')}]`)
      fixed++
    } catch (e) {
      console.error(`ERROR ${sku}:`, (e as Error).message)
      errored++
    }
  }

  console.log(`\nDone — ${fixed} fixed, ${skipped} skipped, ${errored} errored`)
  if (fixed > 0) {
    console.log('\nNext steps:')
    console.log('  1. Run npx tsx scripts/akeneo-sync.ts to pull updated certs into Payload')
    console.log('  2. Remove c_fc from src/lib/cert-codes.ts')
  }
}

main().catch(console.error)
