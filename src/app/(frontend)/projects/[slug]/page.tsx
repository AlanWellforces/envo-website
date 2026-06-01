import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ProjectHero } from '@/components/projects/ProjectHero'
import { ProjectGallery } from '@/components/projects/ProjectGallery'
import { ProductsUsedList } from '@/components/projects/ProductsUsedList'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { RichTextRenderer } from '@/components/blog/RichTextRenderer'
import {
  getProjectBySlug,
  getAllProjectSlugs,
  getRelatedProjects,
} from '@/lib/projects'

type Params = Promise<{ slug: string }>

export async function generateStaticParams() {
  const slugs = await getAllProjectSlugs()
  return slugs.map((slug) => ({ slug }))
}

export const dynamicParams = true

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) return {}
  const cover = typeof project.cover === 'string' ? project.cover : project.cover?.url
  const og = typeof project.ogImage === 'string' ? project.ogImage : project.ogImage?.url
  const ogImage = og ?? cover
  return {
    title: project.seoTitle ?? `${project.title} — ENVO Projects`,
    description: project.seoDescription ?? project.excerpt,
    openGraph: { images: ogImage ? [ogImage as string] : undefined },
  }
}

export default async function ProjectDetailPage({ params }: { params: Params }) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) notFound()

  const primaryIndustry = project.industry[0]
  const related = primaryIndustry
    ? await getRelatedProjects(primaryIndustry, project.slug, 3)
    : []

  return (
    <article className="theme-light">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">›</span>
          <Link href="/projects">Projects</Link>
          <span className="sep">›</span>
          <span>{project.title}</span>
        </div>
      </div>

      <ProjectHero project={project} />

      <div className="project-body container">
        <RichTextRenderer doc={project.body} />
      </div>

      {project.gallery && project.gallery.length > 0 && (
        <ProjectGallery items={project.gallery} />
      )}

      {project.productsUsed && project.productsUsed.length > 0 && (
        <ProductsUsedList skus={project.productsUsed} />
      )}

      {project.testimonial && (
        <section className="project-testimonial container">
          <blockquote className="project-testimonial-quote">
            “{project.testimonial}”
          </blockquote>
        </section>
      )}

      {related.length >= 2 && (
        <section className="container project-related">
          <h2 className="project-related-heading">Related projects</h2>
          <div className="projects-grid">
            {related.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        </section>
      )}
    </article>
  )
}
