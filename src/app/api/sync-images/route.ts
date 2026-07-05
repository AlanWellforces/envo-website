import { NextRequest, NextResponse } from 'next/server'
import { getPayload, type Where } from 'payload'
import config from '@/payload.config'
import path from 'node:path'

type ImageField = 'image' | 'clean_image'
type FallbackField = 'image_url_fallback' | 'clean_image_url_fallback'

const PAIRS: Array<{ field: ImageField; fallback: FallbackField }> = [
  { field: 'image',       fallback: 'image_url_fallback'       },
  { field: 'clean_image', fallback: 'clean_image_url_fallback' },
]

async function downloadImage(url: string): Promise<{ data: Buffer; mimetype: string; ext: string }> {
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const contentType = res.headers.get('content-type') ?? 'image/jpeg'
  const mime = contentType.split(';')[0].trim()
  const extMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg':  'jpg',
    'image/png':  'png',
    'image/webp': 'webp',
    'image/gif':  'gif',
  }
  const ext = extMap[mime] ?? path.extname(new URL(url).pathname).slice(1) ?? 'jpg'
  const data = Buffer.from(await res.arrayBuffer())
  return { data, mimetype: mime, ext }
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sku    = searchParams.get('sku')    ?? undefined
  const limit  = parseInt(searchParams.get('limit') ?? '0', 10) || 0
  const force  = searchParams.get('force') === 'true'

  const payload = await getPayload({ config })

  // Find products to process
  const where: Where = sku
    ? { sku: { equals: sku } }
    : force
      ? { image_url_fallback: { not_equals: null } }
      : {
          and: [
            { image_url_fallback: { not_equals: null } },
            { image:              { equals: null }     },
          ],
        }

  const found = await payload.find({
    collection: 'products',
    where,
    limit: limit || 500,
    depth: 0,
    select: { id: true, sku: true, name: true, image_url_fallback: true, clean_image_url_fallback: true, image: true, clean_image: true },
  })

  const results: { sku: string; status: 'ok' | 'failed' | 'skipped'; error?: string }[] = []

  type ProductRow = { id: number | string; sku: string; name?: string | null } & {
    [K in ImageField | FallbackField]?: unknown
  }
  for (const product of found.docs as ProductRow[]) {
    let anyDownloaded = false
    const errors: string[] = []

    for (const { field, fallback } of PAIRS) {
      const url = product[fallback]
      if (typeof url !== 'string' || !url) continue

      // Skip if already has an image and not forcing
      if (!force && product[field]) continue

      try {
        const { data, mimetype, ext } = await downloadImage(url)
        const suffix = field === 'clean_image' ? '-clean' : ''
        const filename = `${product.sku}${suffix}.${ext}`

        const media = await payload.create({
          collection: 'media',
          data: { alt: `${product.name ?? product.sku}${suffix ? ' — clean' : ''}` },
          file: { data, mimetype, name: filename, size: data.length },
        })

        await payload.update({
          collection: 'products',
          id: product.id,
          data: { [field]: media.id },
        })

        anyDownloaded = true
      } catch (err) {
        errors.push(`${field}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    if (errors.length) {
      results.push({ sku: product.sku, status: 'failed', error: errors.join('; ') })
    } else if (!anyDownloaded) {
      results.push({ sku: product.sku, status: 'skipped' })
    } else {
      results.push({ sku: product.sku, status: 'ok' })
    }
  }

  const ok      = results.filter(r => r.status === 'ok').length
  const failed  = results.filter(r => r.status === 'failed').length
  const skipped = results.filter(r => r.status === 'skipped').length

  return NextResponse.json({
    total: found.docs.length,
    ok,
    failed,
    skipped,
    failures: results.filter(r => r.status === 'failed'),
  })
}
