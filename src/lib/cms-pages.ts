import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Metadata } from 'next'

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

// Site-wide share image fallback — keep in sync with the root layout default.
const DEFAULT_OG_IMAGE = '/assets/images/hero-signage-poster.jpg'

/** Metadata for a CMS-authored page (legal set + /pages/[slug]) — title and
 *  description come from the doc, with in-code fallbacks. Page-level openGraph
 *  replaces the root-layout default wholesale, so siteName/type/url/image are
 *  restated here (og:url in particular is never derived from the canonical). */
export function cmsPageMetadata(
  page: CmsPage | null,
  canonical: string,
  fallbackTitle: string,
  fallbackDescription?: string,
): Metadata {
  const title = page?.seoTitle ?? fallbackTitle
  const description = page?.metaDescription ?? fallbackDescription
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      siteName: 'ENVO',
      title,
      description,
      url: canonical,
      images: [{ url: DEFAULT_OG_IMAGE }],
    },
  }
}

export async function getPageBySlug(slug: string): Promise<CmsPage | null> {
  const payload = await getPayload({ config })
  // drafts are NOT auto-filtered — never render an unpublished page publicly
  const res = await payload.find({
    collection: 'pages',
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    limit: 1,
  })
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
      // drafts are NOT auto-filtered — a draft legal page must not leak a link
      where: { and: [{ showInFooter: { equals: true } }, { _status: { equals: 'published' } }] },
      limit: 50,
      sort: 'title',
    })
    return res.docs.map((d) => ({ label: d.title, href: pageHref(d.slug ?? '') }))
  } catch {
    return []
  }
}

/** Slug + Payload's updatedAt per CMS page — feeds the sitemap's lastModified. */
export async function getAllCmsPageStubs(): Promise<{ slug: string; updatedAt?: string }[]> {
  const payload = await getPayload({ config })
  const res = await payload.find({ collection: 'pages', limit: 200, depth: 0 })
  return res.docs
    .filter((d): d is typeof d & { slug: string } => !!d.slug)
    .map((d) => ({ slug: d.slug, updatedAt: d.updatedAt ?? undefined }))
}

export async function getAllCmsPageSlugs(): Promise<string[]> {
  return (await getAllCmsPageStubs()).map((s) => s.slug)
}
