import type { Metadata } from 'next'
import Link from 'next/link'
import { ProjectsCatalogue } from '@/components/projects/ProjectsCatalogue'
import { getProjects } from '@/lib/projects'
import '@/components/projects/projects-redesign.css'

export const metadata: Metadata = {
  title: 'Projects — ENVO',
  description:
    'Signage and architectural installs running ENVO LED modules and drivers.',
}

export default async function ProjectsPage() {
  const { docs: projects } = await getProjects({ limit: 60 })

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
