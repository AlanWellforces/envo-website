// Every public path a single product appears on — the same SKU→URL mapping
// the sitemap uses, factored out so the Products afterChange/afterDelete hooks
// can invalidate exactly those pages when a product is edited or synced.

import { dbFamilyToMarketing, seriesSlug } from '@/data/family-map'
import { stripCctSuffix } from '@/components/products/catalogue-data'

type ProductLike = { sku?: string | null; family?: string | null; series?: string | null }

export function productPaths(doc: ProductLike): string[] {
  const paths = new Set<string>([
    '/products', // catalogue grid
    '/sitemap.xml', // model-grain sitemap
    // (/resources/downloads dropped 2026-07-24 — the hub is hidden/404 now)
  ])

  const m = doc.family ? dbFamilyToMarketing(doc.family) : null
  if (m) {
    paths.add(`/products/${m.slug}`) // family catalogue
    if (doc.series) paths.add(`/products/${m.slug}/${seriesSlug(doc.series)}`) // series page
    if (doc.sku) paths.add(`/products/${m.slug}/${stripCctSuffix(doc.sku)}`) // model detail
  }

  return Array.from(paths)
}
