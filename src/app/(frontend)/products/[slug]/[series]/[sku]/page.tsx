import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  getProduct, getProductsByMarketingFamily, listProducts, type Product,
} from '@/lib/products'
import { dbFamilyToMarketing, seriesSlug } from '@/data/family-map'
import { GenericProductDetail } from '@/components/products/GenericProductDetail'

type Params = Promise<{ slug: string; series: string; sku: string }>

export const dynamicParams = false

export async function generateStaticParams() {
  const { docs } = await listProducts({ limit: 1000 })
  return docs
    .map((p) => {
      const m = dbFamilyToMarketing(p.family ?? '')
      if (!m) return null
      // Signage (led_module): CCT variants (-WW/-NW/-CW) collapse into one model
      // shown via the series template's spec selector — no per-SKU page.
      if (p.family === 'led_module') return null
      return { slug: m.slug, series: seriesSlug(p.series), sku: p.sku }
    })
    .filter((x): x is { slug: string; series: string; sku: string } => x !== null)
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { sku } = await params
  const product = await getProduct(sku)
  if (!product) return {}
  return {
    title: `${product.name} — ENVO`,
    description: product.short_description ?? product.subtitle ?? undefined,
  }
}

export default async function ProductDetailPage({ params }: { params: Params }) {
  const { slug, sku } = await params
  const product = await getProduct(sku)
  if (!product || product.hidden) notFound()
  // Signage uses the series template (spec selector + CCT switch); it has no
  // per-SKU page, so a signage SKU URL must 404 here.
  if (product.family === 'led_module') notFound()
  // Guard: the family in the URL must match the product's actual family.
  const m = dbFamilyToMarketing(product.family ?? '')
  if (!m || m.slug !== slug) notFound()

  // Related = up to 4 siblings in the same series (excluding self).
  const family = await getProductsByMarketingFamily(slug)
  const related = family
    .filter((p: Product) => p.series === product.series && p.sku !== product.sku)
    .slice(0, 4)

  return <GenericProductDetail product={product} related={related} />
}
