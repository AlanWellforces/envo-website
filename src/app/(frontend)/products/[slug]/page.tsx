/* eslint-disable @next/next/no-img-element */
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PRODUCT_FAMILIES } from '@/data/product-families'
import { TrustIcon } from '@/components/ui/trust-icon'
import { getProductsByMarketingFamily, groupProductsBySeries, resolveProductImage } from '@/lib/products'
import { seriesSlug, seriesLabel } from '@/data/family-map'
import styles from './page.module.css'

type Params = Promise<{ slug: string }>

export async function generateStaticParams() {
  return PRODUCT_FAMILIES.map((f) => ({ slug: f.slug }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const family = PRODUCT_FAMILIES.find((f) => f.slug === slug)
  if (!family) return {}
  return {
    title: `${family.name} — ENVO`,
    description: family.longDesc,
  }
}

export default async function ProductFamilyPage({ params }: { params: Params }) {
  const { slug } = await params
  const family = PRODUCT_FAMILIES.find((f) => f.slug === slug)
  if (!family) notFound()

  // Series list is DB-driven: group this family's real products by series.
  const products = await getProductsByMarketingFamily(slug)
  const groups = groupProductsBySeries(products)

  // All four product families render a BOUNCE /signage/-style landing:
  // page header + a grid of series cards (image · name · short description
  // · View Range), followed by the trust strip. Live series link to their
  // detail page; unpublished series show a muted "Coming soon".
  return (
    <div className="theme-light">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">›</span>
          <Link href="/products">Products</Link>
          <span className="sep">›</span>
          <span>{family.name}</span>
        </div>
      </div>

      <section className="sig-hero">
        <div className="container">
          <div className="sig-hero-inner">
            <span className="sig-eyebrow">{family.tag}</span>
            <h1>{family.name}</h1>
            <p className="sig-hero-desc">{family.longDesc}</p>
          </div>
        </div>
      </section>

      <section className={styles.sectionWrap}>
        <div className={styles.seriesGrid}>
          {groups.map((g) => {
            const rep = g.products[0]
            const img = resolveProductImage(rep, '/assets/images/cat-modules.png')
            return (
              <Link
                key={g.code ?? 'other'}
                href={`/products/${slug}/${seriesSlug(g.code)}`}
                className={styles.seriesCard}
              >
                <div className={`${styles.seriesCardThumb} ${styles.seriesCardThumbBrand}`}>
                  {img.isLocal ? (
                    <Image
                      src={img.src}
                      alt={img.alt}
                      width={400}
                      height={250}
                      sizes="(min-width: 1000px) 33vw, (min-width: 621px) 50vw, 100vw"
                    />
                  ) : (
                    <img src={img.src} alt={img.alt} />
                  )}
                </div>
                <div className={styles.seriesCardBody}>
                  <h3 className={styles.seriesCardName}>{seriesLabel(g.code)}</h3>
                  <p className={styles.seriesCardDesc}>{g.products.length} products</p>
                  <span className={styles.seriesCardCta}>View range <span>→</span></span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {family.trustBadges && family.trustBadges.length > 0 && (
        <section className={styles.sectionTinted}>
          <div className={styles.sectionWrap}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionEyebrow}>Why ENVO</span>
              <h2 className={styles.sectionHeading}>
                Built for {family.name.toLowerCase()} that ship and last
              </h2>
            </div>
            <div className={styles.badgesGrid}>
              {family.trustBadges.map((b) => (
                <div key={b.title} className={styles.badge}>
                  <span className={styles.badgeIcon}>
                    <TrustIcon name={b.icon} />
                  </span>
                  <h3 className={styles.badgeTitle}>{b.title}</h3>
                  <p className={styles.badgeDesc}>{b.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
