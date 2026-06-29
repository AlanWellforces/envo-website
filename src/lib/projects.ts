// Projects — typed query helpers over the Payload Local API.
// Mirrors src/lib/posts.ts. Industry is multi-select, so filtering uses
// `contains`/`in` semantics rather than equality.

import { getPayload } from 'payload'
import config from '@/payload.config'

export type ProjectIndustry =
  | 'retail'
  | 'hotel'
  | 'storefront'
  | 'architectural'
  | 'canopy'
  | 'other'

export const INDUSTRY_LABELS: Record<ProjectIndustry, string> = {
  retail: 'Retail',
  hotel: 'Hotel & Hospitality',
  storefront: 'Storefront',
  architectural: 'Architectural Facade',
  canopy: 'Canopy',
  other: 'Other',
}

export type ProjectGalleryItem = {
  image: { url: string; alt?: string } | string
  caption?: string
}

export type ProjectSpec = { value: string; label: string }

export type Project = {
  id: string | number
  slug: string
  title: string
  excerpt: string
  cover: { url: string; alt?: string } | string
  body: unknown
  client?: string
  location?: string
  completedYear?: number
  gallery?: ProjectGalleryItem[]
  productsUsed?: string[]      // flattened from [{sku}] to string[]
  specs?: ProjectSpec[]
  testimonial?: string
  industry: ProjectIndustry[]
  tags: string[]
  publishedAt: string
  featured: boolean
  seoTitle?: string
  seoDescription?: string
  ogImage?: { url: string; alt?: string } | string
}

export type GetProjectsOpts = {
  featured?: boolean
  limit?: number
  industry?: ProjectIndustry
  tag?: string
  excludeSlug?: string
}

type RawProject = {
  id: string | number
  slug: string
  title: string
  excerpt: string
  cover: unknown
  body: unknown
  client?: string | null
  location?: string | null
  completedYear?: number | null
  gallery?: Array<{ image: unknown; caption?: string | null }> | null
  productsUsed?: Array<{ sku: string }> | null
  specs?: Array<{ value: string; label: string }> | null
  testimonial?: string | null
  industry: ProjectIndustry[]
  tags?: Array<{ tag: string }> | null
  publishedAt: string
  featured?: boolean | null
  seoTitle?: string | null
  seoDescription?: string | null
  ogImage?: unknown
}

function shape(p: RawProject): Project {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    cover: p.cover as Project['cover'],
    body: p.body,
    client: p.client ?? undefined,
    location: p.location ?? undefined,
    completedYear: p.completedYear ?? undefined,
    gallery: p.gallery?.map((g) => ({
      image: g.image as ProjectGalleryItem['image'],
      caption: g.caption ?? undefined,
    })),
    productsUsed: p.productsUsed?.map((r) => r.sku).filter(Boolean),
    specs: p.specs?.map((s) => ({ value: s.value, label: s.label })).filter((s) => s.value && s.label),
    testimonial: p.testimonial ?? undefined,
    industry: p.industry,
    tags: p.tags?.map((t) => t.tag).filter(Boolean) ?? [],
    publishedAt: p.publishedAt,
    featured: p.featured ?? false,
    seoTitle: p.seoTitle ?? undefined,
    seoDescription: p.seoDescription ?? undefined,
    ogImage: p.ogImage as Project['ogImage'] | undefined,
  }
}

export async function getProjects(opts: GetProjectsOpts = {}): Promise<{
  docs: Project[]
  totalDocs: number
}> {
  const payload = await getPayload({ config })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = { _status: { equals: 'published' } }
  if (opts.featured) where.featured = { equals: true }
  if (opts.industry) where.industry = { contains: opts.industry }
  if (opts.tag) where['tags.tag'] = { equals: opts.tag }
  if (opts.excludeSlug) where.slug = { not_equals: opts.excludeSlug }

  const res = await payload.find({
    collection: 'projects',
    where,
    sort: '-publishedAt',
    limit: opts.limit ?? 50,
    depth: 2,
  })
  return {
    docs: (res.docs as unknown as RawProject[]).map(shape),
    totalDocs: res.totalDocs,
  }
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const payload = await getPayload({ config })
  const res = await payload.find({
    collection: 'projects',
    where: { slug: { equals: slug }, _status: { equals: 'published' } },
    limit: 1,
    depth: 2,
  })
  const doc = res.docs[0] as unknown as RawProject | undefined
  return doc ? shape(doc) : null
}

export async function getRelatedProjects(
  industry: ProjectIndustry,
  excludeSlug: string,
  limit = 3,
): Promise<Project[]> {
  const { docs } = await getProjects({ industry, excludeSlug, limit })
  return docs
}

export async function getAllProjectSlugs(): Promise<string[]> {
  const payload = await getPayload({ config })
  const res = await payload.find({
    collection: 'projects',
    where: { _status: { equals: 'published' } },
    limit: 500,
    pagination: false,
    depth: 0,
  })
  return res.docs.map((d) => (d as { slug: string }).slug).filter(Boolean)
}
