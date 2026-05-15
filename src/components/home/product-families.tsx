import Image from 'next/image'
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
              <Image
                src={family.image}
                alt={family.name}
                width={600}
                height={450}
                sizes="(min-width: 1100px) 25vw, (min-width: 540px) 50vw, 100vw"
              />
            </div>
            <div className="pf-body">
              <Link href={family.href} className="pf-name">
                {family.name}
              </Link>
              <div className="pf-desc">{family.shortDesc}</div>
              <div className="pf-links">
                {family.series.map((s) =>
                  s.href === '#' ? (
                    <span key={s.label} aria-disabled="true">
                      {s.label}
                    </span>
                  ) : (
                    <Link key={s.label} href={s.href}>
                      {s.label}
                    </Link>
                  ),
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
