import { getPayload } from 'payload'
import config from '@/payload.config'

export const LEGAL_ROOT_SLUGS: Record<string, string> = {
  'terms-of-service': '/terms-of-service',
  'privacy-policy': '/privacy-policy',
  'cookie-policy': '/cookie-policy',
  'acceptable-use-policy': '/acceptable-use-policy',
}

export function pageHref(slug: string): string {
  return LEGAL_ROOT_SLUGS[slug] ?? `/pages/${slug}`
}

export type CmsPage = {
  title: string
  slug: string
  content: unknown
  seoTitle?: string
  metaDescription?: string
  updatedAt?: string
  lastUpdated?: string
}

export async function getPageBySlug(slug: string): Promise<CmsPage | null> {
  const payload = await getPayload({ config })
  const res = await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, limit: 1 })
  const d = res.docs[0]
  if (!d) return null
  return {
    title: d.title,
    slug: d.slug ?? slug,
    content: d.content,
    seoTitle: d.seoTitle || undefined,
    metaDescription: d.metaDescription || undefined,
    updatedAt: d.updatedAt ?? undefined,
    lastUpdated: d.lastUpdated ?? undefined,
  }
}

export async function getFooterLegalPages(): Promise<{ label: string; href: string }[]> {
  try {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: 'pages',
      where: { showInFooter: { equals: true } },
      limit: 50,
      sort: 'title',
    })
    return res.docs.map((d) => ({ label: d.title, href: pageHref(d.slug ?? '') }))
  } catch {
    return []
  }
}

export async function getAllCmsPageSlugs(): Promise<string[]> {
  const payload = await getPayload({ config })
  const res = await payload.find({ collection: 'pages', limit: 200, depth: 0 })
  return res.docs.map((d) => d.slug).filter((s): s is string => !!s)
}
