// Datasheet proxy: serves a product's spec sheet through our own domain
// (envo.com/datasheets/<sku>) by streaming the file from the Akeneo S3 bucket
// server-side. Keeps the raw S3 host (which contains the "wellforces" bucket
// name) off the customer-facing URL, and gives the file a clean name.
//
// Durable alternative is a branded CDN domain on the bucket (Alan); until then
// this proxy is how datasheet links stay envo-only.

import { NextRequest } from 'next/server'
import { getProduct } from '@/lib/products'
import { isAllowedAssetUrl, resolveAssetUrl } from '@/lib/asset-url'

const FETCH_TIMEOUT_MS = 8000
const MAX_BYTES = 30 * 1024 * 1024

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
  // SSRF guard: only ever fetch the Akeneo asset bucket. Anything else stored
  // in spec_sheet_url (bad data, tampering) is treated as "no datasheet".
  if (!product || !src || !isAllowedAssetUrl(src)) {
    return new Response('Datasheet not found', { status: 404 })
  }

  let upstream: Response
  try {
    // No redirects: the S3 bucket serves directly; a 3xx means something is
    // trying to bounce us off the allowlisted host.
    upstream = await fetch(src, {
      redirect: 'error',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
  } catch {
    return new Response('Datasheet unavailable', { status: 502 })
  }
  const size = Number(upstream.headers.get('content-length'))
  if (!upstream.ok || !upstream.body || !Number.isFinite(size) || size > MAX_BYTES) {
    return new Response('Datasheet unavailable', { status: 502 })
  }

  return new Response(upstream.body, {
    headers: {
      // Forced (not passed through from upstream): inline HTML/SVG served as
      // itself would run same-origin on envolighting.com. Datasheets are PDFs.
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${cleanFilename(product.name)}"`,
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      // Proxied PDFs shouldn't compete with product pages in search results.
      'X-Robots-Tag': 'noindex',
    },
  })
}
