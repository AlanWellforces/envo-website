import Link from 'next/link'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import { PRODUCT_FAMILIES } from '@/data/product-families'
import { getProductsByMarketingFamily } from '@/lib/products'
import { buildProductCardsFor, buildGroups } from '@/components/products/catalogue-data'
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
  // Fetched sequentially on purpose — the dev pooler's connection cap (each
  // marketing family already fans out to several db-family queries inside).
  const allProducts: Awaited<ReturnType<typeof getProductsByMarketingFamily>>[] = []
  for (const f of PRODUCT_FAMILIES) {
    allProducts.push(await getProductsByMarketingFamily(f.slug, { depth: 0 }))
  }
  const countBySlug = new Map(PRODUCT_FAMILIES.map((f, i) => [f.slug, allProducts[i].length]))

  // Same granularity as the category pages (user 2026-07-08): drivers /
  // control gear / accessories list actual models, signage keeps series
  // cards — all in one product grid, Category filter first.
  const cards = PRODUCT_FAMILIES.flatMap((f, i) => buildProductCardsFor(f.slug, f, allProducts[i]).cards)
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
          <h1>Product catalogue</h1>
          <p className="pcat-lede">
            Modules, drivers, control gear and accessories — engineered to work together as one
            signage system.
          </p>
          <div className="pcat-pills">
            <span className="pcat-pill on">All</span>
            {PRODUCT_FAMILIES.filter((f) => (countBySlug.get(f.slug) ?? 0) > 0).map((f) => (
              <Link key={f.slug} href={f.href} className="pcat-pill">
                {f.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Suspense: CatalogueFilter reads useSearchParams (deep-linkable filters) */}
        <Suspense>
          <CatalogueFilter cards={cards} groups={groups} resultKind="products" layout="productGrid" showSections />
        </Suspense>
      </div>
    </div>
  )
}
