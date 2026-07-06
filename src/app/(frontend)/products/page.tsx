import Link from 'next/link'
import type { Metadata } from 'next'
import { PRODUCT_FAMILIES } from '@/data/product-families'
import { getProductsByMarketingFamily } from '@/lib/products'
import { buildCards, buildGroups } from '@/components/products/catalogue-data'
import { CatalogueFilter } from '@/components/products/CatalogueFilter'
import '@/components/products/products-catalogue.css'

export const metadata: Metadata = {
  alternates: { canonical: '/products' },
  title: 'Product catalogue — ENVO',
  description:
    'Modules, drivers, control gear and accessories — engineered to work together as one signage system. Filter the full ENVO catalogue by application, colour temperature and certification.',
}

export default async function ProductsPage() {
  // One catalogue across all families. Each family's series become cards; the
  // category pills navigate to the per-family view (/products/[slug]).
  const allProducts = await Promise.all(
    PRODUCT_FAMILIES.map((f) => getProductsByMarketingFamily(f.slug, { depth: 0 })),
  )
  const countBySlug = new Map(PRODUCT_FAMILIES.map((f, i) => [f.slug, allProducts[i].length]))
  const total = [...countBySlug.values()].reduce((a, b) => a + b, 0)

  const cards = PRODUCT_FAMILIES.flatMap((f, i) => buildCards(f, allProducts[i]))
  const groups = buildGroups(cards)

  return (
    <div className="theme-light pcat">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">›</span>
          <span>Products</span>
        </div>

        <div className="pcat-head">
          <span className="pcat-eyebrow">Shop by category</span>
          <h1>Product catalogue</h1>
          <p className="pcat-lede">
            Modules, drivers, control gear and accessories — engineered to work together as one
            signage system.
          </p>
          <div className="pcat-pills">
            <span className="pcat-pill on">
              All <span className="n">{total}</span>
            </span>
            {PRODUCT_FAMILIES.filter((f) => (countBySlug.get(f.slug) ?? 0) > 0).map((f) => (
              <Link key={f.slug} href={f.href} className="pcat-pill">
                {f.name} <span className="n">{countBySlug.get(f.slug)}</span>
              </Link>
            ))}
          </div>
        </div>

        <CatalogueFilter cards={cards} groups={groups} unit="products" />
      </div>
    </div>
  )
}
