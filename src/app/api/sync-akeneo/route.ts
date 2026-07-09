import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getAkeneoToken, fetchEnvoProducts, normalise, upsertProduct } from '@/lib/akeneo/sync'

export async function GET(req: NextRequest) {
  const limitParam = req.nextUrl.searchParams.get('limit')
  const limit = limitParam ? parseInt(limitParam) : null
  const sku = req.nextUrl.searchParams.get('sku') ?? undefined

  const results: { sku: string; status: string; error?: string }[] = []

  try {
    const payload = await getPayload({ config })
    const token = await getAkeneoToken()
    const products = await fetchEnvoProducts(token, limit, sku)

    for (const p of products) {
      if (!p.family) {
        results.push({ sku: p.identifier, status: 'skipped' })
        continue
      }
      const data = normalise(p)
      try {
        const result = await upsertProduct(payload, data)
        results.push({ sku: data.sku, ...result })
      } catch (e) {
        results.push({ sku: data.sku, status: 'error', error: e instanceof Error ? e.message : String(e) })
      }
    }

    const ok      = results.filter(r => r.status === 'created' || r.status === 'updated').length
    const failed  = results.filter(r => r.status === 'error').length
    const skipped = results.filter(r => r.status === 'skipped').length
    return NextResponse.json({ ok, failed, skipped, results })

  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
