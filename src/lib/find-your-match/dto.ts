// Public-safe projection of a Recommendation. The API must never ship full
// Product objects — they carry price_nzd, inventory_type and lead-time fields
// that CLAUDE.md forbids surfacing. Only the four fields the client actually
// needs (name for display, sku/family/series for the product link) cross the
// wire.
import type { Product } from '@/lib/products'
import type { Recommendation } from './types'

export type ProductDto = { name: string; sku: string; family: string | null; series: string | null }

export type RecommendationDto = {
  module: { product: ProductDto; reason: string } | null
  driver:
    | { kind: 'product'; product: ProductDto; reason: string }
    | { kind: 'spec'; spec: { powerW: number; voltageV: number; ip: string; mode: 'cv' | 'cc' }; reason: string }
  control:
    | { kind: 'product'; product: ProductDto; reason: string }
    | { kind: 'note'; reason: string }
    | null
  estimatedLoadW: number
}

const pick = (p: Product): ProductDto => ({
  name: p.name,
  sku: p.sku,
  family: p.family ?? null,
  series: p.series ?? null,
})

export function toRecommendationDto(rec: Recommendation): RecommendationDto {
  return {
    module: rec.module ? { product: pick(rec.module.product), reason: rec.module.reason } : null,
    driver:
      rec.driver.kind === 'product'
        ? { kind: 'product', product: pick(rec.driver.product), reason: rec.driver.reason }
        : { kind: 'spec', spec: rec.driver.spec, reason: rec.driver.reason },
    control:
      rec.control?.kind === 'product'
        ? { kind: 'product', product: pick(rec.control.product), reason: rec.control.reason }
        : rec.control?.kind === 'note'
          ? { kind: 'note', reason: rec.control.reason }
          : null,
    estimatedLoadW: rec.estimatedLoadW,
  }
}
