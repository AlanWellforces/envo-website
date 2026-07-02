import Image from 'next/image'
import Link from 'next/link'
import { resolveProductImage, type Product } from '@/lib/products'
import { seriesSlug } from '@/data/family-map'
import styles from '@/app/(frontend)/products/[slug]/page.module.css'

export function ProductCardGrid({ products, familySlug }: { products: Product[]; familySlug: string }) {
  return (
    <div className={styles.seriesGrid}>
      {products.map((p) => {
        const img = resolveProductImage(p, '/assets/images/cat-modules.png')
        return (
          <Link key={p.sku} href={`/products/${familySlug}/${seriesSlug(p.series)}/${p.sku}`} className={styles.seriesCard}>
            <div className={`${styles.seriesCardThumb} ${styles.seriesCardThumbBrand}`}>
              <Image src={img.src} alt={img.alt} width={400} height={250} sizes="(min-width:1000px) 33vw, 50vw" />
            </div>
            <div className={styles.seriesCardBody}>
              <h3 className={styles.seriesCardName}>{p.name}</h3>
              {p.subtitle && <p className={styles.seriesCardDesc}>{p.subtitle}</p>}
              <span className={styles.seriesCardCta}>View details <span>→</span></span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
