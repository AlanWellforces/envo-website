import Image from 'next/image'
import { EnvoButton } from '@/components/ui/envo-button'

const USED_PRODUCTS = [
  { name: 'EcoGlo Quad', meta: 'EV-BLEG04LBY', img: '/assets/images/mod-eco.png' },
  { name: 'EV-SL Linear', meta: '12V/100W', img: '/assets/images/mod-pro.png' },
  { name: 'EV-ZBGW Hub', meta: 'Zigbee gateway', img: '/assets/images/mod-rgb.png' },
]

export function FeaturedDetail() {
  return (
    <section className="featured-detail">
      <div className="diamond-bg" aria-hidden="true" />
      <div className="container">
        <div className="featured-grid">
          <div className="featured-image reveal">
            <span className="featured-image-tag">★ Featured project</span>
          </div>
          <div className="featured-content reveal" data-delay="1">
            <div className="section-eyebrow" style={{ marginBottom: 16 }}>
              Auckland CBD · Commercial facade
            </div>
            <h3>
              One specification.
              <br />
              <em>Years of consistent light.</em>
            </h3>
            <p>
              EcoGlo Quad modules, Linear driver banks, and a single zigbee gateway delivered
              facade-grade uniformity across multiple installation phases — same colour binning,
              same drive current, no return visits.
            </p>
            <div className="used-products-label">Products used</div>
            <div className="used-products">
              {USED_PRODUCTS.map((p) => (
                <div key={p.name} className="used-product">
                  <Image src={p.img} alt={p.name} width={40} height={40} />
                  <div className="used-product-text">
                    <div className="used-product-name">{p.name}</div>
                    <div className="used-product-meta">{p.meta}</div>
                  </div>
                </div>
              ))}
            </div>
            <EnvoButton href="/projects" variant="ghost" arrow>
              Read full case study
            </EnvoButton>
          </div>
        </div>
      </div>
    </section>
  )
}
