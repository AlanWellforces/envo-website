import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ProjectCard } from '@/components/projects/ProjectCard'
import {
  getProjects,
  INDUSTRY_LABELS,
  type ProjectIndustry,
} from '@/lib/projects'

type Params = Promise<{ industry: string }>

const VALID: ProjectIndustry[] = [
  'retail',
  'hotel',
  'storefront',
  'architectural',
  'canopy',
  'other',
]

function isValid(v: string): v is ProjectIndustry {
  return (VALID as string[]).includes(v)
}

// Hourly ISR so a future-dated (scheduled) project appears without a manual
// revalidate once its publishedAt passes; hooks still purge instantly on edits.
export const revalidate = 3600
export async function generateStaticParams() {
  return VALID.map((industry) => ({ industry }))
}

// true, or layout-level revalidation NoFallbackError-404s these pages until
// the next rebuild (prod incident 2026-07-23) — see products/[slug]/[series].
// isValid() below keeps unknown industries at 404.
export const dynamicParams = true

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { industry } = await params
  if (!isValid(industry)) return {}
  return {
    alternates: { canonical: `/projects/industry/${industry}` },
    title: `${INDUSTRY_LABELS[industry]} projects — ENVO`,
    description: `ENVO LED installations in the ${INDUSTRY_LABELS[industry].toLowerCase()} sector.`,
  }
}

export default async function IndustryPage({ params }: { params: Params }) {
  const { industry } = await params
  if (!isValid(industry)) notFound()

  const { docs, totalDocs } = await getProjects({ industry, limit: 60 })
  // Valid industry but nothing published for it → 404, not an empty indexable page.
  if (docs.length === 0) notFound()
  const label = INDUSTRY_LABELS[industry]

  return (
    <div className="theme-light">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">›</span>
          <Link href="/projects">Projects</Link>
          <span className="sep">›</span>
          <span>{label}</span>
        </div>
      </div>

      <section className="sig-hero">
        <div className="container">
          <div className="sig-hero-inner">
            <span className="sig-eyebrow">Industry · {label}</span>
            <h1>{label} <em>installations.</em></h1>
            <p className="sig-hero-desc">
              ENVO LED case studies in the {label.toLowerCase()} sector.
            </p>
          </div>
        </div>
      </section>

      <section className="container projects-list">
        {totalDocs === 0 ? (
          <p className="projects-empty">
            No {label.toLowerCase()} case studies published yet — check back soon.
          </p>
        ) : (
          <div className="projects-grid">
            {docs.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}
      </section>
    </div>
  )
}
