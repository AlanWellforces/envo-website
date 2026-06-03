import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Metadata } from 'next'

export type PageSeo = {
  seoTitle?: string
  metaDescription?: string
  ogImage?: { url: string }
}

/**
 * Per-route SEO override from the `page-seo` collection. Returns null when no
 * row exists for the route. Callers MUST fall back to their in-code defaults —
 * an absent or empty field must never blank out a page's SEO.
 */
export async function getPageSeo(route: string): Promise<PageSeo | null> {
  const payload = await getPayload({ config })
  const res = await payload.find({
    collection: 'page-seo',
    where: { route: { equals: route } },
    depth: 1,
    limit: 1,
  })
  const doc = res.docs[0] as
    | { seoTitle?: string; metaDescription?: string; ogImage?: { url?: string } | null }
    | undefined
  if (!doc) return null
  return {
    seoTitle: doc.seoTitle || undefined,
    metaDescription: doc.metaDescription || undefined,
    ogImage: doc.ogImage?.url ? { url: doc.ogImage.url } : undefined,
  }
}

/** Merge a page's in-code defaults with any page-seo override (override wins). */
export async function metadataForRoute(
  route: string,
  defaults: { title: string; description: string },
): Promise<Metadata> {
  const seo = await getPageSeo(route)
  return {
    title: seo?.seoTitle ?? defaults.title,
    description: seo?.metaDescription ?? defaults.description,
    ...(seo?.ogImage ? { openGraph: { images: [{ url: seo.ogImage.url }] } } : {}),
  }
}
