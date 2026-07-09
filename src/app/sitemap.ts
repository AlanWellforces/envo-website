import type { MetadataRoute } from 'next'
import { listProducts } from '@/lib/products'
// import { getAllSlugs as getAllPostSlugs } from '@/lib/posts' // blog hidden — see below
// import { getAllProjectSlugs } from '@/lib/projects' // projects hidden — see below
import { dbFamilyToMarketing, seriesSlug, MARKETING_FAMILIES } from '@/data/family-map'
import { stripCctSuffix } from '@/components/products/catalogue-data'
import { getSolutions } from '@/lib/solutions'
import { getAllCmsPageSlugs, pageHref } from '@/lib/cms-pages'

const BASE = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

const STATIC_PATHS = [
  '', '/about', '/contact', '/products', '/solutions',
  '/resources', '/resources/downloads', '/resources/tools',
  '/free-layout-design',
]
// Deliberately NOT in the sitemap:
// - /datasheets/<sku> PDFs — the proxy route sends X-Robots-Tag: noindex
//   (PDFs must not compete with product pages in search results).
// - /blog/tag/* — thin pages; crawlable via on-page links but not advertised.
// - /blog + categories + posts — blog has no nav entry until Wei signs it off
//   (user 2026-07-09); restore BLOG_PATHS + the posts loop below to re-expose.
// - /products/accessories — nav-hidden family (hidden-features registry);
//   re-add to the family loop when the family is opened up.

// const BLOG_PATHS = [
//   '/blog', '/blog/category/guides', '/blog/category/tech_insights',
//   '/blog/category/company_news', '/blog/category/industry',
// ]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls = new Set<string>()
  for (const p of STATIC_PATHS) urls.add(p)
  for (const f of MARKETING_FAMILIES) {
    if (f.slug === 'accessories') continue // nav-hidden family — see header note
    urls.add(`/products/${f.slug}`)
  }

  // Dynamic — wrapped so a DB hiccup never breaks the whole sitemap.
  try {
    const { docs } = await listProducts({ limit: 1000 })
    for (const p of docs) {
      const m = dbFamilyToMarketing(p.family ?? '')
      if (!m || m.slug === 'accessories') continue
      // Series page (Set dedupes repeats) + the per-SKU detail page that #156
      // re-added for every family — mirrors generateStaticParams on
      // /products/[slug]/[series], which builds both from the same visibility
      // conditions, so every URL here is a real prerendered page.
      // The no-series "other" bucket page is gone (user 2026-07-09) — those
      // products are reachable through their SKU pages only.
      if (p.series) urls.add(`/products/${m.slug}/${seriesSlug(p.series)}`)
      // Signage detail pages live at the MODEL grain (#173) — the raw
      // CCT-suffixed SKU URLs are 308s and must not be advertised.
      const sku = m.slug === 'led-signage-modules' ? stripCctSuffix(p.sku) : p.sku
      urls.add(`/products/${m.slug}/${encodeURIComponent(sku)}`)
    }
  } catch { /* keep static + family URLs */ }

  // Blog hidden until the nav entry ships — see header note.
  // for (const p of BLOG_PATHS) urls.add(p)
  // try {
  //   for (const slug of await getAllPostSlugs()) urls.add(`/blog/${slug}`)
  // } catch { /* skip posts */ }

  try {
    for (const sol of await getSolutions()) urls.add(`/solutions/${sol.slug}`)
  } catch { /* skip solutions */ }

  try {
    for (const slug of await getAllCmsPageSlugs()) urls.add(pageHref(slug))
  } catch { /* skip cms pages */ }

  // Projects hidden from nav + sitemap until real installs exist (only seeded demos).
  // Restore the /projects entry above and this loop to re-expose.
  // try {
  //   for (const slug of await getAllProjectSlugs()) urls.add(`/projects/${slug}`)
  // } catch { /* skip projects */ }

  return Array.from(urls).map((path) => ({ url: `${BASE}${path}`, changeFrequency: 'weekly', priority: path === '' ? 1 : 0.7 }))
}
