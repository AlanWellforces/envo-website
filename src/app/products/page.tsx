import Link from 'next/link'
import type { Metadata } from 'next'
import { EnvoButton } from '@/components/ui/envo-button'

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

const FAMILIES = [
  {
    href: '/products/led-signage-modules',
    name: 'Signage Modules',
    tag: 'Modules · Light source',
    sku: '6 series · 0.36–1.92 W',
    desc: 'Six module families calibrated for every cabinet depth, brightness target and signage type — from compact channel letters to deep floodlit Quads.',
    pills: ['6 series', 'IP65 / IP68', '5-yr warranty'],
    cta: 'Explore modules',
    img: '/assets/images/cat-modules.png',
    popular: true,
  },
  {
    href: '/products/led-drivers',
    name: 'LED Drivers',
    tag: 'Drivers · Power',
    sku: '3 series · 30–320 W',
    desc: 'Constant-voltage power supplies tuned for signage and architectural duty — wide input, low ripple, full protections, weatherproof or panel-mount.',
    pills: ['3 series', '12 / 24 V', 'IP20 / IP67'],
    cta: 'Explore drivers',
    img: '/assets/images/cat-drivers.png',
  },
  {
    href: '/products/control-gear',
    name: 'Control Gear',
    tag: 'Control · Logic',
    sku: '4 series · IR / RF / DMX / Zigbee',
    desc: 'From single-zone remote dimmers to multi-protocol Zigbee gateways — bridge ENVO drivers to the rest of the lighting ecosystem.',
    pills: ['4 series', '1–32 zones', 'Smart-home ready'],
    cta: 'Explore controls',
    img: '/assets/images/cat-controllers.png',
  },
  {
    href: '/products/accessories',
    name: 'Accessories',
    tag: 'Accessories · Hardware',
    sku: 'Connectors · Cables · Boxes · Hardware',
    desc: 'Waterproof connectors, pre-tinned cables, junction boxes and mounting brackets — the small parts that make every install cleaner and weather-tight.',
    pills: ['4 categories', 'IP65 / IP68', 'UL listed'],
    cta: 'Explore accessories',
    img: '/assets/images/cat-sensors.png',
  },
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
          {FAMILIES.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className={`sig-card${f.popular ? ' is-popular' : ''}`}
            >
              <div className="sig-img">
                <img src={f.img} alt={f.name} />
              </div>
              <div className="sig-body">
                <span className="sig-tag">{f.tag}</span>
                <div className="sig-name">{f.name}</div>
                <div className="sig-sku">{f.sku}</div>
                <p className="sig-desc">{f.desc}</p>
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
