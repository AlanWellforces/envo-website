import type { MetadataRoute } from 'next'
import { listProducts } from '@/lib/products'
import { getAllSlugs as getAllPostSlugs } from '@/lib/posts'
// import { getAllProjectSlugs } from '@/lib/projects' // projects hidden — see below
import { dbFamilyToMarketing, seriesSlug, MARKETING_FAMILIES } from '@/data/family-map'
import { getSolutions } from '@/lib/solutions'
import { getAllCmsPageSlugs, pageHref } from '@/lib/cms-pages'

const BASE = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

const STATIC_PATHS = [
  '', '/about', '/contact', '/products', '/solutions', '/blog',
  '/blog/category/guides', '/blog/category/tech_insights',
  '/blog/category/company_news', '/blog/category/industry',
  '/resources', '/resources/downloads', '/resources/tools',
  '/free-layout-design',
]
// Deliberately NOT in the sitemap:
// - /datasheets/<sku> PDFs — the proxy route sends X-Robots-Tag: noindex
//   (PDFs must not compete with product pages in search results).
// - /blog/tag/* — thin pages; crawlable via on-page links but not advertised.

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls = new Set<string>()
  for (const p of STATIC_PATHS) urls.add(p)
  for (const f of MARKETING_FAMILIES) urls.add(`/products/${f.slug}`)


  // Dynamic — wrapped so a DB hiccup never breaks the whole sitemap.
  try {
    const { docs } = await listProducts({ limit: 1000 })
    for (const p of docs) {
      const m = dbFamilyToMarketing(p.family ?? '')
      if (!m) continue
      // Series page (Set dedupes repeats) + the per-SKU detail page that #156
      // re-added for every family — mirrors generateStaticParams on
      // /products/[slug]/[series], which builds both from the same visibility
      // conditions, so every URL here is a real prerendered page.
      urls.add(`/products/${m.slug}/${seriesSlug(p.series)}`)
      urls.add(`/products/${m.slug}/${encodeURIComponent(p.sku)}`)
    }
  } catch { /* keep static + family URLs */ }

  try {
    for (const slug of await getAllPostSlugs()) urls.add(`/blog/${slug}`)
  } catch { /* skip posts */ }

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
