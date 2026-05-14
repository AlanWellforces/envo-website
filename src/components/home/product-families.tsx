import Link from 'next/link'
import { PRODUCT_FAMILIES } from '@/data/product-families'

export function ProductFamilies() {
  return (
    <section className="pf-section" id="products">
      <div className="pf-head">
        <h2 className="pf-heading">Explore our product families</h2>
      </div>
      <div className="pf-grid">
        {PRODUCT_FAMILIES.map((family) => (
          <article key={family.slug} className="pf-card">
            <div className="pf-img">
              <img src={family.image} alt={family.name} />
            </div>
            <div className="pf-body">
              <Link href={family.href} className="pf-name">
                {family.name}
              </Link>
              <div className="pf-desc">{family.shortDesc}</div>
              <div className="pf-links">
                {family.series.map((s) => (
                  <Link key={s.label} href={s.href}>
                    {s.label}
                  </Link>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
