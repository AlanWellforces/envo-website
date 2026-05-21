import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { EnvoButton } from '@/components/ui/envo-button'
import { PROJECTS } from '@/data/projects'

export const metadata: Metadata = {
  title: 'Projects — ENVO',
  description:
    'Real-world ENVO LED installations: retail signage, hotel facades, premium storefronts, and canopy lighting. Field-proven across 60+ countries.',
}

const STATS = [
  { label: 'Installations', value: '500+' },
  { label: 'Countries', value: '60+' },
  { label: 'Years deployed', value: '10+' },
  { label: 'Repeat clients', value: '80%' },
]

export default function ProjectsPage() {
  return (
    <div className="theme-light">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">›</span>
          <span>Projects</span>
        </div>
      </div>

      <section className="sig-hero">
        <div className="container">
          <div className="sig-hero-inner">
            <span className="sig-eyebrow">Projects · Case studies</span>
            <h1>
              Proven in <em>real-world installations.</em>
            </h1>
            <p className="sig-hero-desc">
              Retail signage, hotel facades, storefronts, and outdoor canopy lighting — ENVO
              modules and drivers are running today on installations across 60+ countries.
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

      <section className="proj-section">
        <div className="proj-grid">
          {PROJECTS.map((p) => (
            <Link key={p.slug} href={p.href} className="proj-card">
              <div className="proj-img">
                <Image
                  src={p.img}
                  alt={p.name}
                  fill
                  sizes="(min-width: 1100px) 25vw, (min-width: 540px) 50vw, 100vw"
                />
              </div>
              <div className="proj-body">
                <div className="proj-name">{p.name}</div>
                <div className="proj-desc">{p.desc}</div>
                <div className="proj-cta">
                  View case <span>→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="sig-cta-banner">
        <div className="sig-cta-inner">
          <span className="sig-cta-eyebrow">Want your project featured?</span>
          <h2>
            Working on a build worth <em>showing off?</em>
          </h2>
          <p>
            Share photos and specs of your finished install — projects with strong visuals get
            featured in our case study library and product collateral.
          </p>
          <div className="sig-cta-actions">
            <EnvoButton href="/contact" variant="primary" arrow>
              Submit a project
            </EnvoButton>
            <EnvoButton href="/products" variant="ghost">
              Browse products
            </EnvoButton>
          </div>
        </div>
      </section>
    </div>
  )
}
