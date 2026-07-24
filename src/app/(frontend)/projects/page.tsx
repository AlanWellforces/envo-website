import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ProjectsCatalogue } from '@/components/projects/ProjectsCatalogue'
import { getProjects } from '@/lib/projects'
import '@/components/projects/projects-redesign.css'

// Hourly ISR so a future-dated (scheduled) project appears without a manual
// revalidate once its publishedAt passes; hooks still purge instantly on edits.
export const revalidate = 3600
export const metadata: Metadata = {
  alternates: { canonical: '/projects' },
  title: 'Projects — ENVO',
  description:
    'Signage and architectural installs running ENVO LED modules and drivers.',
}

export default async function ProjectsPage() {
  const { docs: projects } = await getProjects({ limit: 60 })
  // No published projects yet → 404 rather than an indexable empty hub
  // (soft-404). Auto-recovers when the first real install is published.
  if (projects.length === 0) notFound()

  return (
    <div className="pj-wrap">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">›</span>
          <span>Projects</span>
        </div>

        <h1>Our work</h1>
        <p className="pj-lead">
          Signage and architectural installs running ENVO LED modules and drivers.
        </p>

        <ProjectsCatalogue projects={projects} />
      </div>
    </div>
  )
}
