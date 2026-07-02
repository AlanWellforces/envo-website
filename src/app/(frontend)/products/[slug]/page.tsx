import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PRODUCT_FAMILIES } from '@/data/product-families'
import { getProductsByMarketingFamily, countProductsByMarketingFamily } from '@/lib/products'
import { buildCards, buildGroups } from '@/components/products/catalogue-data'
import { CatalogueFilter } from '@/components/products/CatalogueFilter'
import '@/components/products/products-catalogue.css'

type Params = Promise<{ slug: string }>

export async function generateStaticParams() {
  return PRODUCT_FAMILIES.map((f) => ({ slug: f.slug }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const family = PRODUCT_FAMILIES.find((f) => f.slug === slug)
  if (!family) return {}
  return { title: `${family.name} — ENVO`, description: family.longDesc, alternates: { canonical: `/products/${slug}` } }
}

export default async function ProductFamilyPage({ params }: { params: Params }) {
  const { slug } = await params
  const family = PRODUCT_FAMILIES.find((f) => f.slug === slug)
  if (!family) notFound()

  // Same unified catalogue, scoped to one family. Fetch only THIS family's
  // products fully (depth 0 — images come from URL columns); the other families
  // contribute only a cheap count for their pill badge.
  const products = await getProductsByMarketingFamily(slug, { depth: 0 })
  const countEntries = await Promise.all(
    PRODUCT_FAMILIES.map(
      async (f) =>
        [f.slug, f.slug === slug ? products.length : await countProductsByMarketingFamily(f.slug)] as const,
    ),
  )
  const countBySlug = new Map(countEntries)
  const total = [...countBySlug.values()].reduce((a, b) => a + b, 0)

  const cards = buildCards(family, products)
  const groups = buildGroups(cards)
  const unit = slug === 'led-signage-modules' ? 'modules' : 'models'

  return (
    <div className="theme-light pcat">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">›</span>
          <Link href="/products">Products</Link>
          <span className="sep">›</span>
          <span>{family.name}</span>
        </div>

        <div className="pcat-head">
          <span className="pcat-eyebrow">{family.tag}</span>
          <h1>{family.name}</h1>
          <p className="pcat-lede">{family.longDesc}</p>
          <div className="pcat-pills">
            <Link href="/products" className="pcat-pill">
              All <span className="n">{total}</span>
            </Link>
            {PRODUCT_FAMILIES.map((f) =>
              f.slug === slug ? (
                <span key={f.slug} className="pcat-pill on">
                  {f.name} <span className="n">{countBySlug.get(f.slug)}</span>
                </span>
              ) : (
                <Link key={f.slug} href={f.href} className="pcat-pill">
                  {f.name} <span className="n">{countBySlug.get(f.slug)}</span>
                </Link>
              ),
            )}
          </div>
        </div>

        <CatalogueFilter cards={cards} groups={groups} unit={unit} />
      </div>
    </div>
  )
}
