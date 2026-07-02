import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RichTextRenderer } from '@/components/blog/RichTextRenderer'
import { getProduct, resolveProductImage } from '@/lib/products'
import { datasheetHref } from '@/lib/asset-url'
import {
  getProjectBySlug,
  getAllProjectSlugs,
  getRelatedProjects,
  INDUSTRY_LABELS,
  type Project,
} from '@/lib/projects'
import '@/components/projects/projects-redesign.css'

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
  const cover = imgUrl(project.cover)
  const og = imgUrl(project.ogImage)
  const ogImage = og ?? cover
  return {
    alternates: { canonical: `/projects/${slug}` },
    title: project.seoTitle ?? `${project.title} — ENVO Projects`,
    description: project.seoDescription ?? project.excerpt,
    openGraph: { images: ogImage ? [ogImage] : undefined },
  }
}

function imgUrl(v: { url?: string } | string | undefined): string | undefined {
  return typeof v === 'string' ? v : v?.url
}

export default async function ProjectDetailPage({ params }: { params: Params }) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) notFound()

  const primaryIndustry = project.industry[0]
  const related = primaryIndustry
    ? await getRelatedProjects(primaryIndustry, project.slug, 3)
    : []

  // Resolve "products used" SKUs → catalogue products (server-side).
  const products = project.productsUsed?.length
    ? await Promise.all(
        project.productsUsed.map(async (sku) => ({ sku, product: await getProduct(sku) })),
      )
    : []

  const cover = imgUrl(project.cover)

  return (
    <article className="pj-detail">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">›</span>
          <Link href="/projects">Projects</Link>
          <span className="sep">›</span>
          <span>{project.title}</span>
        </div>

        {/* HERO — dark, full-bleed cover */}
        <div className="pj-hero" style={{ backgroundImage: cover ? `url('${cover}')` : undefined }}>
          <div className="pj-ov">
            <div className="pj-eyebrow">
              {primaryIndustry ? INDUSTRY_LABELS[primaryIndustry] : 'Project'}
              {project.location ? ` · ${project.location}` : ''}
            </div>
            <h1>{project.title}</h1>
            <div className="pj-meta">
              {[project.client, project.location, project.completedYear ? `Completed ${project.completedYear}` : null]
                .filter(Boolean)
                .join(' · ')}
            </div>
          </div>
        </div>
      </div>

      {/* LIGHT BODY */}
      <div className="pj-detail-body">
        <div className="container">
          {project.specs && project.specs.length > 0 && (
            <div className="pj-specbar">
              {project.specs.map((s, i) => (
                <div key={i}>
                  <div className="v">{s.value}</div>
                  <div className="l">{s.label}</div>
                </div>
              ))}
              <div className="pj-actions">
                <Link href="/products" className="pj-btn ghost">Browse products</Link>
                <Link href="/contact" className="pj-btn primary">Start a project</Link>
              </div>
            </div>
          )}

          <div className="pj-cols">
            <div className="pj-story">
              {project.excerpt && <p className="pj-lead-p">{project.excerpt}</p>}
              <RichTextRenderer doc={project.body} />
            </div>
            <aside className="pj-facts">
              <h3>PROJECT FACTS</h3>
              {project.client && (
                <div className="row"><span className="k">Client</span><span className="v">{project.client}</span></div>
              )}
              {project.location && (
                <div className="row"><span className="k">Location</span><span className="v">{project.location}</span></div>
              )}
              {project.completedYear && (
                <div className="row"><span className="k">Completed</span><span className="v">{project.completedYear}</span></div>
              )}
              {primaryIndustry && (
                <div className="row"><span className="k">Industry</span><span className="v">{INDUSTRY_LABELS[primaryIndustry]}</span></div>
              )}
            </aside>
          </div>

          {project.gallery && project.gallery.length > 0 && (
            <>
              <h2 className="pj-sec">GALLERY</h2>
              <div className="pj-gallery">
                {project.gallery.map((g, i) => {
                  const u = imgUrl(g.image)
                  return (
                    <div
                      key={i}
                      className={`g${i === 0 ? ' big' : ''}`}
                      style={{ backgroundImage: u ? `url('${u}')` : undefined }}
                      title={g.caption}
                    />
                  )
                })}
              </div>
            </>
          )}

          {products.length > 0 && (
            <>
              <h2 className="pj-sec">PRODUCTS USED</h2>
              <div className="pj-prod">
                {products.map(({ sku, product }) => {
                  const ds = product?.spec_sheet_url ? datasheetHref(product.sku) : null
                  const img = product ? resolveProductImage(product, '') : null
                  const inner = (
                    <>
                      <span
                        className="sw"
                        style={img?.src ? { backgroundImage: `url('${img.src}')` } : undefined}
                      />
                      <div>
                        <div className="nm">{product?.name ?? `ENVO ${sku}`}</div>
                        <div className="sub">{product ? product.sku : 'SKU not in catalog'}</div>
                      </div>
                      {ds && <span className="ar">↗</span>}
                    </>
                  )
                  return ds ? (
                    <a key={sku} href={ds} target="_blank" rel="noopener noreferrer" className="pj-prod-card">
                      {inner}
                    </a>
                  ) : (
                    <div key={sku} className="pj-prod-card">{inner}</div>
                  )
                })}
              </div>
            </>
          )}

          {project.testimonial && (
            <div className="pj-quote">
              <p>“{project.testimonial}”</p>
            </div>
          )}

          {related.length >= 2 && (
            <>
              <h2 className="pj-sec">RELATED PROJECTS</h2>
              <div className="pj-rel">
                {related.map((p: Project) => {
                  const u = imgUrl(p.cover)
                  return (
                    <Link
                      key={p.id}
                      href={`/projects/${p.slug}`}
                      className="pj-rcard"
                      style={{ backgroundImage: u ? `url('${u}')` : undefined }}
                    >
                      <div className="ov">
                        <h3>{p.title}</h3>
                        <div className="m">{[p.location, p.tags?.[0]].filter(Boolean).join(' · ')}</div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </>
          )}

          <div className="pj-ctaband">
            <div>
              <h3>Planning a facade or signage install?</h3>
              <p>We&apos;ll route you to the right ENVO distributor for your region.</p>
            </div>
            <Link href="/contact" className="pj-btn primary">Find your distributor →</Link>
          </div>
        </div>
      </div>
    </article>
  )
}
