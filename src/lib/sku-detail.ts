// Data assembly for the SKU detail page (/products/[family]/[sku]) — LED
// Drivers, Control Gear and Accessories only. Signage keeps its merged series
// pages. The page IS the merged series-page layout, scoped to one product
// (user direction 2026-07-08): hero + key specs + datasheet come from THIS
// product alone; the Specifications tab keeps the classic series compare
// table with every sibling model, the viewed SKU tinted + tagged "Current".
import type { Product } from '@/lib/products'
import type { ProductFamily } from '@/data/product-families'
import { seriesLabel } from '@/data/family-map'
import { buildMergedSeriesProps } from '@/lib/merged-series'
import type { MergedSeriesProps } from '@/components/products/merged/MergedSeriesPage'

export function buildSkuDetailProps(
  family: ProductFamily,
  product: Product,
  sameSeries: Product[],
): MergedSeriesProps {
  const series = product.series ?? ''
  // Series-wide assembly drives the compare table + shared rows (identical to
  // the series page); a single-product assembly supplies the exact hero facts.
  // SKU heroes may show up to 8 key specs (user 2026-07-08); series keep 6.
  const base = buildMergedSeriesProps(family, series, sameSeries.length ? sameSeries : [product])
  const solo = buildMergedSeriesProps(family, series, [product], { maxKeySpecs: 8 })

  // groupSeriesModels strips CCT suffixes; the spec-driven families' SKUs are
  // unsuffixed, so modelCode === sku — with a startsWith fallback just in case.
  const variants = base.variants.map((v) =>
    v.modelCode === product.sku || (v.modelCode && product.sku.startsWith(v.modelCode))
      ? { ...v, current: true }
      : v,
  )

  // H1 = the SKU code (Akeneo names are spec soup — those numbers already live
  // in the key-spec grid). The descriptive remainder of the name, stripped of
  // brand + SKU, becomes the one-line subtitle.
  const skuPattern = new RegExp(`\\b${product.sku.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
  const descriptiveName = product.name
    .replace(skuPattern, '')
    .replace(/^\s*envo\s+/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim()

  return {
    ...base,
    breadcrumb: { ...base.breadcrumb, seriesLabel: product.sku },
    eyebrow: `${family.tag.split('·')[0].trim()} · ${seriesLabel(product.series)}`,
    title: product.sku,
    heroSubtitle:
      descriptiveName || (solo.heroSubtitle ?? product.short_description?.trim() ?? product.subtitle?.trim() ?? undefined),
    // exact facts for THIS SKU, never series-wide ranges
    keySpecs: solo.keySpecs,
    datasheetUrl: solo.datasheetUrl,
    downloads: solo.datasheetUrl ? [{ name: `${product.sku} datasheet`, meta: 'PDF', href: solo.datasheetUrl }] : [],
    // hero gallery shows only THIS product (user 2026-07-08): stage = its own
    // image; thumbs keep the strip feature but drop sibling-model tiles —
    // own tile + editorial scene photos only, and a lone tile that would just
    // duplicate the stage is omitted entirely
    heroStage: [solo.variants[0].image],
    thumbs: (() => {
      const own = base.thumbs?.filter((t) => t.cover || t.label === product.sku)
      return own && own.length > 1 ? own : undefined
    })(),
    variants,
  }
}
