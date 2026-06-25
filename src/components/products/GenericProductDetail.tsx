/* eslint-disable @next/next/no-img-element */
import { Fragment } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { resolveProductImage, type Product } from '@/lib/products'
import { datasheetHref } from '@/lib/asset-url'
import { SPEC_GROUPS, heroStats } from './spec-groups'
import { dbFamilyToMarketing, seriesSlug, seriesLabel } from '@/data/family-map'
import styles from './GenericProductDetail.module.css'

function ProductImg({ product }: { product: Product }) {
  const img = resolveProductImage(product, '/assets/images/cat-modules.png')
  return img.isLocal
    ? <Image src={img.src} alt={img.alt} width={520} height={520} />
    : <img src={img.src} alt={img.alt} />
}

export function GenericProductDetail({
  product, related,
}: { product: Product; related: Product[] }) {
  const marketing = dbFamilyToMarketing(product.family ?? '')
  const familySlug = marketing?.slug ?? 'led-signage-modules'
  const familyLabel = marketing?.label ?? 'Products'
  const sSlug = seriesSlug(product.series)
  const sLabel = seriesLabel(product.series)
  const stats = heroStats(product)

  return (
    <div className="theme-light">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link><span className="sep">›</span>
          <Link href="/products">Products</Link><span className="sep">›</span>
          <Link href={`/products/${familySlug}`}>{familyLabel}</Link><span className="sep">›</span>
          <Link href={`/products/${familySlug}/${sSlug}`}>{sLabel}</Link><span className="sep">›</span>
          <span>{product.name}</span>
        </div>
      </div>

      <section className={styles.hero}>
        <div className={styles.eyebrow}>{sLabel}</div>
        <h1 className={styles.h1}>{product.name}</h1>
        {product.subtitle && <p className={styles.tagline}>{product.subtitle}</p>}
        {product.short_description && <p className={styles.lede}>{product.short_description}</p>}
        {stats.length > 0 && (
          <div className={styles.stats}>
            {stats.map((s) => (
              <div key={s.label} className={styles.stat}>
                <span className={styles.statValue}>{s.value}</span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        )}
        {product.spec_sheet_url && (
          <a
            className={styles.pill}
            href={datasheetHref(product.sku)!}
            target="_blank"
            rel="noopener noreferrer"
          >
            Datasheet (PDF) →
          </a>
        )}
        <p className={styles.sku}>SKU {product.sku}</p>
      </section>

      <section className={styles.imageBand}>
        <ProductImg product={product} />
      </section>

      <section className="container">
        <div className={styles.body}>
          {/* Description is HTML authored in Akeneo (trusted, server-synced PIM source). */}
          {product.description && (
            <div className={styles.desc} dangerouslySetInnerHTML={{ __html: product.description }} />
          )}

          <table className={styles.specTable}>
            <tbody>
              {SPEC_GROUPS.map((group) => {
                const rows = group.rows
                  .map((r) => ({ label: r.label, value: r.value(product) }))
                  .filter((r) => r.value)
                if (rows.length === 0) return null
                return (
                  <Fragment key={group.title}>
                    <tr><td className={styles.groupTitle} colSpan={2}>{group.title}</td></tr>
                    {rows.map((r) => (
                      <tr key={group.title + r.label}><th>{r.label}</th><td>{r.value}</td></tr>
                    ))}
                  </Fragment>
                )
              })}
            </tbody>
          </table>

          {related.length > 0 && (
            <div className={styles.relatedWrap}>
              <h2 className={styles.relatedHead}>More in {sLabel}</h2>
              <div className={styles.related}>
                {related.map((r) => (
                  <Link
                    key={r.sku}
                    href={`/products/${familySlug}/${seriesSlug(r.series)}/${r.sku}`}
                    className={styles.relatedCard}
                  >
                    {r.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
