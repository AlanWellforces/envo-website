import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { PRODUCT_FAMILIES } from '@/data/product-families'
import familyStyles from './[slug]/page.module.css'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Products — ENVO',
  description:
    'A complete ecosystem for LED lighting. From the driver to the module to the control — every ENVO component is engineered to work together.',
}

/** Single-word category eyebrow per family, as in the reference catalog. */
const EYEBROW: Record<string, string> = {
  'led-signage-modules': 'Signage',
  'led-drivers': 'Power',
  'control-gear': 'Control',
  accessories: 'Accessory',
}

export default function ProductsPage() {
  return (
    <div className="theme-light">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">›</span>
          <span>Products</span>
        </div>
      </div>

      {/* ============== HERO ============== */}
      <section className="sig-hero">
        <div className="container">
          <div className="sig-hero-inner">
            <span className="sig-eyebrow">Our products</span>
            <h1>
              A complete ecosystem for <em>LED lighting.</em>
            </h1>
            <p className="sig-hero-desc">
              From the driver to the module to the control — every ENVO component is engineered
              to work together for clean, reliable installations.
            </p>
          </div>
        </div>
      </section>

      {/* ============== 4 FAMILY CARDS ============== */}
      <section className={familyStyles.sectionWrap}>
        <div className={styles.familyGrid}>
          {PRODUCT_FAMILIES.map((f) => (
            <Link
              key={f.slug}
              href={f.href}
              className={`${styles.familyCard}${f.popular ? ` ${styles.familyCardPopular}` : ''}`}
            >
              {f.popular && <span className={styles.familyBadge}>Most popular</span>}
              <div className={styles.familyImg}>
                <Image
                  src={f.image}
                  alt={f.name}
                  width={800}
                  height={600}
                  sizes="(min-width: 1100px) 25vw, (min-width: 640px) 50vw, 100vw"
                />
              </div>
              <div className={styles.familyBody}>
                <span className={styles.familyTag}>{EYEBROW[f.slug] ?? f.tag}</span>
                <h2 className={styles.familyName}>{f.name}</h2>
                <p className={styles.familyDesc}>{f.longDesc}</p>
                <span className={styles.familyCta}>
                  Explore <span>→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
