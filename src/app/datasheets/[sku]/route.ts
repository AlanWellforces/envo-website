// Datasheet proxy: serves a product's spec sheet through our own domain
// (envo.com/datasheets/<sku>) by streaming the file from the Akeneo S3 bucket
// server-side. Keeps the raw S3 host (which contains the "wellforces" bucket
// name) off the customer-facing URL, and gives the file a clean name.
//
// Durable alternative is a branded CDN domain on the bucket (Alan); until then
// this proxy is how datasheet links stay envo-only.

import { NextRequest } from 'next/server'
import { getProduct } from '@/lib/products'
import { resolveAssetUrl } from '@/lib/asset-url'

function cleanFilename(name: string): string {
  const base = name
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
  return `${base || 'datasheet'}.pdf`
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ sku: string }> }) {
  const { sku } = await params
  const product = await getProduct(decodeURIComponent(sku))
  const src = resolveAssetUrl(product?.spec_sheet_url)
  if (!product || !src) {
    return new Response('Datasheet not found', { status: 404 })
  }

  const upstream = await fetch(src)
  if (!upstream.ok || !upstream.body) {
    return new Response('Datasheet unavailable', { status: 502 })
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'application/pdf',
      'Content-Disposition': `inline; filename="${cleanFilename(product.name)}"`,
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  })
}
