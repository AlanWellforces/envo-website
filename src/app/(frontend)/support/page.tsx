import type { Metadata } from 'next'
import Link from 'next/link'
import { EnvoButton } from '@/components/ui/envo-button'
import { RESOURCES } from '@/data/resources'

export const metadata: Metadata = {
  title: 'Support — ENVO',
  description:
    'Product catalogs, specification sheets, installation guides, and IES photometric files — every resource you need to spec, install, and support an ENVO system.',
}

const STATS = [
  { label: 'Resources', value: '24+' },
  { label: 'Formats', value: 'PDF · ZIP · IES' },
  { label: 'Languages', value: '5' },
  { label: 'Response', value: '< 24h' },
]

export default function SupportPage() {
  return (
    <div className="theme-light">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">›</span>
          <span>Support</span>
        </div>
      </div>

      <section className="sig-hero">
        <div className="container">
          <div className="sig-hero-inner">
            <span className="sig-eyebrow">Support · Resources</span>
            <h1>
              Tools, guides, and <em>everything you need.</em>
            </h1>
            <p className="sig-hero-desc">
              Product catalogues, specification sheets, install guides, and photometric IES files —
              all the technical documentation you need to spec and deploy an ENVO system.
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

      <section className="res-section">
        <div className="res-grid">
          {RESOURCES.map((r) => (
            <Link key={r.slug} href={r.href} className="res-card">
              <div className="res-icon">{r.icon}</div>
              <div className="res-name">{r.name}</div>
              <div className="res-desc">{r.desc}</div>
              <div className="res-cta">
                {r.cta} <span>→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="sig-cta-banner">
        <div className="sig-cta-inner">
          <span className="sig-cta-eyebrow">Need something we do not have?</span>
          <h2>
            Talk to <em>an engineer directly.</em>
          </h2>
          <p>
            Project-specific spec sheets, custom photometric files, regional certification
            documentation — our engineering team can provide what is not in the public library.
          </p>
          <div className="sig-cta-actions">
            <EnvoButton href="/contact" variant="primary" arrow>
              Contact engineering
            </EnvoButton>
            <EnvoButton href="/free-layout-design" variant="ghost">
              Free layout design
            </EnvoButton>
          </div>
        </div>
      </section>
    </div>
  )
}
