import type { Metadata } from 'next'
import Link from 'next/link'
import { EnvoButton } from '@/components/ui/envo-button'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { getProjects } from '@/lib/projects'

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

export default async function ProjectsPage() {
  const { docs: projects, totalDocs } = await getProjects({ limit: 60 })

  return (
    <div className="theme-light projects-page">
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

      {/* GRID — all projects, in order, 3 per row */}
      <section className="container projects-list">
        {totalDocs === 0 ? (
          <p className="projects-empty">
            Case studies coming soon — check back as our latest installs land.
          </p>
        ) : (
          <div className="projects-grid">
            {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}
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
