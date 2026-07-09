// Server-only — builds the /resources document library from real backend data.
//
// Today the only document type with a backend source is the per-product
// datasheet (`products.spec_sheet_url`, from Akeneo). Guides, CAD/IES,
// certificate PDFs and warranty docs have no backend source yet, so they are
// intentionally omitted (the page routes those to "Request a document").
// When a Documents collection / file library lands, extend this accessor.

import { getPayload } from 'payload'
import config from '@/payload.config'
import { resolveAssetUrl, datasheetHref } from '@/lib/asset-url'
import { visibleProductConditions } from '@/lib/products'
import { dbFamilyToMarketing } from '@/data/family-map'
import type { DatasheetDoc } from '@/lib/resource-library-types'

export type { DatasheetDoc } from '@/lib/resource-library-types'

const RANGE_SHORT: Record<string, string> = {
  'led-signage-modules': 'Signage',
  'led-drivers': 'Drivers',
  'control-gear': 'Control gear',
  accessories: 'Accessories',
}

function rangeLabel(family: string | null): string {
  const m = family ? dbFamilyToMarketing(family) : null
  return (m && RANGE_SHORT[m.slug]) || 'Other'
}

type ProductRow = {
  id: number
  sku: string | null
  name: string
  family: string | null
  spec_sheet_url: string | null
}

/**
 * Every publicly visible product that carries a datasheet, deduped by the resolved file
 * URL (signage modules share one datasheet across SKUs), titled by product name
 * and tagged with a short range label. URLs are run through `resolveAssetUrl`
 * so the relative Akeneo paths become absolute, downloadable links.
 */
export async function getDatasheetLibrary(): Promise<DatasheetDoc[]> {
  const p = await getPayload({ config })
  const res = await p.find({
    collection: 'products',
    where: { and: [...visibleProductConditions(), { spec_sheet_url: { exists: true } }] },
    sort: 'name',
    limit: 1000,
    depth: 0,
  })

  // Dedup by the real file (signage modules share one datasheet across SKUs),
  // but link via the /datasheets/<sku> proxy so the S3 host stays hidden.
  const seen = new Set<string>()
  const docs: DatasheetDoc[] = []
  for (const d of res.docs as unknown as ProductRow[]) {
    const file = resolveAssetUrl(d.spec_sheet_url)
    const href = datasheetHref(d.sku)
    if (!file || !href || seen.has(file)) continue
    seen.add(file)
    // model grain: one datasheet covers every CCT variant, so the row shows
    // the SKU minus -NW/-WW/-CW (functional suffixes like -RGBW stay)
    const model = d.sku!.replace(/-(NW|WW|CW)$/, '')
    docs.push({ id: d.sku!, title: d.name, model, url: href, range: rangeLabel(d.family) })
  }
  return docs
}
