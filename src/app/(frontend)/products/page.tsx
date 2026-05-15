import Link from 'next/link'
import type { Metadata } from 'next'
import { EnvoButton } from '@/components/ui/envo-button'
import { PRODUCT_FAMILIES } from '@/data/product-families'

export const metadata: Metadata = {
  title: 'Products — ENVO',
  description:
    'A complete LED ecosystem: modules, drivers, controllers and accessories engineered, tested and warranted as one system.',
}

const STATS = [
  { label: 'Module families', value: '6' },
  { label: 'Driver families', value: '3' },
  { label: 'Control protocols', value: '4' },
  { label: 'Warranty', value: '5 years' },
]

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

      <section className="sig-hero">
        <div className="container">
          <div className="sig-hero-inner">
            <span className="sig-eyebrow">Product · Overview</span>
            <h1>
              A complete LED ecosystem for <em>every signage install.</em>
            </h1>
            <p className="sig-hero-desc">
              Four product families that work together by design — modules, drivers, controllers
              and accessories engineered, tested and warranted as one system.
            </p>
          </div>
        </div>
      </section>

      <div className="sig-stats">
        {STATS.map((s) => (
          <div key={s.label} className="sig-stat">
            <div className="sig-stat-label">{s.label}</div>
            <div className="sig-stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      <section className="sig-grid-section">
        <div className="sig-grid">
          {PRODUCT_FAMILIES.map((f) => (
            <Link
              key={f.slug}
              href={f.href}
              className={`sig-card${f.popular ? ' is-popular' : ''}`}
            >
              <div className="sig-img">
                <img src={f.image} alt={f.name} />
              </div>
              <div className="sig-body">
                <span className="sig-tag">{f.tag}</span>
                <div className="sig-name">{f.name}</div>
                <div className="sig-sku">{f.sku}</div>
                <p className="sig-desc">{f.longDesc}</p>
                <div className="sig-meta">
                  {f.pills.map((p) => (
                    <span key={p} className="sig-meta-pill">
                      <strong>{p}</strong>
                    </span>
                  ))}
                </div>
                <span className="sig-cta">
                  {f.cta} <span>→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="sig-cta-banner">
        <div className="sig-cta-inner">
          <span className="sig-cta-eyebrow">Find your match · 60-sec wizard</span>
          <h2>
            Need help selecting across families? <em>We will spec the full BOM.</em>
          </h2>
          <p>
            Tell us your sign type, dimensions and install environment — we will spec modules,
            driver, controller and accessories as a complete bundled order.
          </p>
          <div className="sig-cta-actions">
            <EnvoButton href="/find-your-match" variant="primary" arrow>
              Try Find your match
            </EnvoButton>
            <EnvoButton href="#" variant="ghost">
              Download full product catalogue (PDF)
            </EnvoButton>
          </div>
        </div>
      </section>
    </div>
  )
}
