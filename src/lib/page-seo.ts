import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Metadata } from 'next'
import type { PageSeo as PageSeoDoc } from '@/payload-types'

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
  const doc = res.docs[0] as PageSeoDoc | undefined
  if (!doc) return null
  // ogImage is `number | Media | null`; at depth 1 it expands to the Media doc.
  const og = doc.ogImage
  const ogUrl = og && typeof og === 'object' ? (og.url ?? undefined) : undefined
  return {
    seoTitle: doc.seoTitle || undefined,
    metaDescription: doc.metaDescription || undefined,
    ogImage: ogUrl ? { url: ogUrl } : undefined,
  }
}

// Site-wide share image fallback — keep in sync with the root layout default.
const DEFAULT_OG_IMAGE = '/assets/images/hero-signage-poster.jpg'

/** Merge a page's in-code defaults with any page-seo override (override wins). */
export async function metadataForRoute(
  route: string,
  defaults: { title: string; description: string },
): Promise<Metadata> {
  const seo = await getPageSeo(route)
  const title = seo?.seoTitle ?? defaults.title
  const description = seo?.metaDescription ?? defaults.description
  return {
    title,
    description,
    // Canonical = the route itself (resolved against metadataBase).
    alternates: { canonical: route },
    // Page-level openGraph replaces the root-layout default wholesale, so
    // restate siteName/type alongside the per-page title.
    openGraph: {
      type: 'website',
      siteName: 'ENVO',
      title,
      description,
      url: route,
      images: [{ url: seo?.ogImage?.url ?? DEFAULT_OG_IMAGE }],
    },
  }
}
