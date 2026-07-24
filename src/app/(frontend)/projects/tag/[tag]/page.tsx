import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { getProjects } from '@/lib/projects'

// Hourly ISR so a future-dated (scheduled) project appears without a manual
// revalidate once its publishedAt passes; hooks still purge instantly on edits.
export const revalidate = 3600

type Params = Promise<{ tag: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { tag } = await params
  const decoded = decodeURIComponent(tag)
  return {
    alternates: { canonical: `/projects/tag/${tag}` },
    title: `Projects tagged "${decoded}" — ENVO`,
    description: `ENVO LED case studies tagged "${decoded}".`,
  }
}

export default async function TagPage({ params }: { params: Params }) {
  const { tag } = await params
  const decoded = decodeURIComponent(tag)
  const { docs, totalDocs } = await getProjects({ tag: decoded, limit: 60 })
  // Nonexistent / empty tag → 404, not an indexable empty page.
  if (docs.length === 0) notFound()

  return (
    <div className="theme-light">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">›</span>
          <Link href="/projects">Projects</Link>
          <span className="sep">›</span>
          <span>#{decoded}</span>
        </div>
      </div>

      <section className="sig-hero">
        <div className="container">
          <div className="sig-hero-inner">
            <span className="sig-eyebrow">Tag · {decoded}</span>
            <h1>Tagged <em>#{decoded}</em></h1>
          </div>
        </div>
      </section>

      <section className="container projects-list">
        {totalDocs === 0 ? (
          <p className="projects-empty">
            No projects tagged &quot;{decoded}&quot; yet.
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
