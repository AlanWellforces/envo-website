import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EnvoButton } from '@/components/ui/envo-button'
import { PRODUCT_FAMILIES } from '@/data/product-families'
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
            <div className="sig-meta" style={{ marginTop: 28 }}>
              {family.pills.map((pill) => (
                <span key={pill} className="sig-meta-pill">
                  <strong>{pill}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className={styles.heroImage}>
        <div className={styles.heroImageInner}>
          <Image
            src={family.image}
            alt={family.name}
            fill
            sizes="(min-width: 1400px) 1320px, 100vw"
            style={{ objectFit: 'contain', padding: '5%' }}
            priority
          />
        </div>
      </div>

      <div className="sig-stats">
        <div className="sig-stat">
          <div className="sig-stat-label">Range</div>
          <div className="sig-stat-value">{family.sku}</div>
        </div>
        <div className="sig-stat">
          <div className="sig-stat-label">Category</div>
          <div className="sig-stat-value">{family.tag.split('·')[0].trim()}</div>
        </div>
        <div className="sig-stat">
          <div className="sig-stat-label">Series count</div>
          <div className="sig-stat-value">{family.series.length}</div>
        </div>
        <div className="sig-stat">
          <div className="sig-stat-label">Warranty</div>
          <div className="sig-stat-value">5 years</div>
        </div>
      </div>

      <section className={styles.seriesSection}>
        <div className="container">
          <h2 className={styles.seriesHeading}>Series in this family</h2>
          <p className={styles.seriesIntro}>
            {family.series.length} series tuned for different applications. Detail pages for each
            series are being rolled out — start with the ones marked below, or talk to engineering
            for the rest.
          </p>
          <div className={styles.seriesList}>
            {family.series.map((s) =>
              s.href === '#' ? (
                <span key={s.label} className={styles.seriesItemDisabled}>
                  {s.label}
                  <em>· Coming soon</em>
                </span>
              ) : (
                <Link key={s.label} href={s.href} className={styles.seriesItem}>
                  {s.label} →
                </Link>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="sig-cta-banner">
        <div className="sig-cta-inner">
          <span className="sig-cta-eyebrow">Find your match · 60-sec wizard</span>
          <h2>
            Need help selecting in this family? <em>Spec the full BOM.</em>
          </h2>
          <p>
            Tell us your sign type, dimensions and install environment — we will spec the right
            series in this family, plus matching driver, controller and accessories.
          </p>
          <div className="sig-cta-actions">
            <EnvoButton href="/find-your-match" variant="primary" arrow>
              Try Find your match
            </EnvoButton>
            <EnvoButton href="/contact" variant="ghost">
              Contact engineering
            </EnvoButton>
          </div>
        </div>
      </section>
    </div>
  )
}
