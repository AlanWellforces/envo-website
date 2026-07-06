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
  '/resources', '/resources/downloads', '/resources/tools',
  '/free-layout-design',
]

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
      // Per-SKU pages were removed 2026-07-06 (the series page is the product
      // grain) — emit only the series URL (Set dedupes repeats).
      urls.add(`/products/${m.slug}/${seriesSlug(p.series)}`)
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
