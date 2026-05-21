import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { EnvoButton } from '@/components/ui/envo-button'
import { SOLUTIONS } from '@/data/solutions'

export const metadata: Metadata = {
  title: 'Solutions — ENVO',
  description:
    'Channel letters, light boxes, edge-lit signage, and architectural lighting — solutions engineered for outdoor durability and warranty-grade longevity.',
}

const STATS = [
  { label: 'Solution areas', value: '2' },
  { label: 'Application types', value: '8+' },
  { label: 'Output range', value: '10–80k lm' },
  { label: 'Warranty', value: '5 years' },
]

export default function SolutionsPage() {
  return (
    <div className="theme-light">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">›</span>
          <span>Solutions</span>
        </div>
      </div>

      <section className="sig-hero">
        <div className="container">
          <div className="sig-hero-inner">
            <span className="sig-eyebrow">Solutions · Overview</span>
            <h1>
              Lighting solutions for <em>signage and architecture.</em>
            </h1>
            <p className="sig-hero-desc">
              From channel letters to facade illumination — modular LED systems engineered to
              deliver consistent colour, uniform brightness, and warranty-grade durability across
              every application.
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

      <section className="sol-section">
        <div className="sol-grid">
          {SOLUTIONS.map((s) => (
            <Link key={s.slug} href={s.href} className="sol-card">
              <div className="sol-card-img">
                <Image
                  src={s.img}
                  alt={s.name}
                  fill
                  sizes="(min-width: 700px) 50vw, 100vw"
                />
              </div>
              <div className="sol-card-body">
                <div className="sol-name">{s.name}</div>
                <div className="sol-desc">{s.longDesc}</div>
                <div className="sol-cta">
                  Explore {s.name.toLowerCase()} <span>→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="sig-cta-banner">
        <div className="sig-cta-inner">
          <span className="sig-cta-eyebrow">Find your match · 60-sec wizard</span>
          <h2>
            Not sure which solution fits? <em>We will spec the full system.</em>
          </h2>
          <p>
            Tell us your project type, dimensions and install environment — our engineers spec the
            modules, drivers, controllers and accessories as a complete bundle.
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
