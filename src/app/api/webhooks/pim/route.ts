import { createHmac, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getAkeneoToken, fetchEnvoProducts, normalise, upsertProduct, disableProduct } from '@/lib/akeneo/sync'

const WEBHOOK_SECRET = process.env.AKENEO_WEBHOOK_SECRET

// Akeneo signs with HMAC-SHA256(secret, timestamp + rawBody) — timestamp first, no separator.
// We also check the timestamp to reject replayed requests older than 5 min.
function verifySignature(rawBody: string, timestamp: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) return false
  const expected = createHmac('sha256', WEBHOOK_SECRET).update(timestamp + rawBody).digest('hex')
  try {
    return timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const timestamp = req.headers.get('x-akeneo-request-timestamp') ?? ''
  const signature = req.headers.get('x-akeneo-request-signature') ?? ''

  if (WEBHOOK_SECRET) {
    if (!verifySignature(rawBody, timestamp, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    const ts = parseInt(timestamp)
    if (!ts || Math.abs(Date.now() / 1000 - ts) > 300) {
      return NextResponse.json({ error: 'Request timestamp too old' }, { status: 401 })
    }
  }

  type PimEvent = { action?: string; data?: { resource?: { identifier?: string } } }
  let body: { events?: PimEvent[] }
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const events = body.events ?? []
  if (events.length === 0) {
    return NextResponse.json({ processed: 0 })
  }

  // De-duplicate: if the same SKU appears multiple times, last action wins.
  // Akeneo can batch rapid edits into one delivery.
  const toUpsert = new Map<string, string>() // sku → action
  const toDisable: string[] = []

  for (const event of events) {
    const sku = event.data?.resource?.identifier
    if (!sku) continue
    const action: string = event.action ?? ''
    if (action === 'product.removed') {
      toDisable.push(sku)
      toUpsert.delete(sku)
    } else if (action === 'product.created' || action === 'product.updated') {
      toUpsert.set(sku, action)
    }
  }

  const payload = await getPayload({ config })
  const results: { sku: string; action: string; status: string; error?: string }[] = []

  if (toUpsert.size > 0) {
    let token: string
    try {
      token = await getAkeneoToken()
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return NextResponse.json({ error: `Akeneo auth failed: ${msg}` }, { status: 502 })
    }

    for (const [sku, action] of toUpsert) {
      try {
        const products = await fetchEnvoProducts(token, null, sku)
        const p = products[0]
        if (!p?.family) {
          results.push({ sku, action, status: 'skipped' })
          continue
        }
        const data = normalise(p)
        const result = await upsertProduct(payload, data)
        results.push({ sku, action, ...result })
      } catch (e) {
        results.push({ sku, action, status: 'error', error: e instanceof Error ? e.message : String(e) })
      }
    }
  }

  for (const sku of toDisable) {
    try {
      const result = await disableProduct(payload, sku)
      results.push({ sku, action: 'product.removed', ...result })
    } catch (e) {
      results.push({ sku, action: 'product.removed', status: 'error', error: e instanceof Error ? e.message : String(e) })
    }
  }

  console.log(`[webhook/pim] processed ${results.length} SKU(s):`, results)
  return NextResponse.json({ processed: results.length, results })
}
