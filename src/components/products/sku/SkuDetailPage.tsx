// SKU detail page = the merged series-page layout for ONE product (user
// direction 2026-07-08: same layout as /products/[family]/[series], single
// product). Hero gallery + key specs + regional purchase CTA come from
// MergedSeriesPage; the same-series comparison renders in the afterSpecs slot.
import MergedSeriesPage from '@/components/products/merged/MergedSeriesPage'
import { SpecCompareTable } from './SpecCompareTable'
import type { SkuDetailProps } from '@/lib/sku-detail'
import './sku-detail.css'

export default function SkuDetailPage({ merged, compare }: SkuDetailProps) {
  const afterSpecs =
    compare.layout !== 'none' ? (
      <div className="skc-block">
        <div className="lead">
          <h2>Compare the {merged.eyebrow.split('·')[1]?.trim() ?? ''} series.</h2>
        </div>
        <SpecCompareTable
          compare={{
            layout: compare.layout,
            columns: compare.columns.map((c) => ({ key: c.key, label: c.label })),
            rows: compare.rows,
            currentSku: compare.currentSku,
          }}
        />
      </div>
    ) : undefined

  return <MergedSeriesPage {...merged} afterSpecs={afterSpecs} />
}
