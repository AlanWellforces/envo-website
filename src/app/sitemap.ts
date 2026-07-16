import type { MetadataRoute } from 'next'
import { listProducts } from '@/lib/products'
import { getPostSitemapEntries, getPostCounts } from '@/lib/posts'
// import { getAllProjectSlugs } from '@/lib/projects' // projects hidden — see below
import { dbFamilyToMarketing, seriesSlug, MARKETING_FAMILIES } from '@/data/family-map'
import { stripCctSuffix } from '@/components/products/catalogue-data'
import { getSolutions } from '@/lib/solutions'
import { getAllCmsPageStubs, pageHref } from '@/lib/cms-pages'
import { SITE_URL as BASE } from '@/lib/site-url'

const STATIC_PATHS = [
  '', '/about', '/contact', '/products', '/solutions',
  '/resources', '/resources/downloads', '/resources/tools', '/resources/tools/signage-selector',
  '/free-layout-design',
]
// Deliberately NOT in the sitemap:
// - /datasheets/<sku> PDFs — the proxy route sends X-Robots-Tag: noindex
//   (PDFs must not compete with product pages in search results).
// - /blog/tag/* — thin pages; crawlable via on-page links but not advertised.
// - /products/accessories — nav-hidden family (hidden-features registry);
//   re-add to the family loop when the family is opened up.

// Category listings are added dynamically below — only those with ≥1 published
// post. An empty, sitemapped listing page ("No articles found") reads as thin
// content / soft-404 to crawlers (live audit 2026-07-17).
const BLOG_PATHS = ['/blog']
const BLOG_CATEGORIES = ['guides', 'tech_insights', 'company_news', 'industry'] as const

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // path → newest real modification date (ISO), where a source provides one.
  // Pages with no trustworthy signal (static copy, category indexes) omit
  // lastModified on purpose — a fake date is worse than none.
  const urls = new Map<string, string | undefined>()
  const add = (path: string, iso?: string) => {
    const cur = urls.get(path)
    urls.set(path, iso && (!cur || iso > cur) ? iso : cur)
  }

  for (const p of STATIC_PATHS) add(p)
  for (const f of MARKETING_FAMILIES) {
    if (f.slug === 'accessories') continue // nav-hidden family — see header note
    add(`/products/${f.slug}`)
  }

  // Dynamic — wrapped so a DB hiccup never breaks the whole sitemap.
  try {
    const { docs } = await listProducts({ limit: 1000 })
    for (const p of docs) {
      const m = dbFamilyToMarketing(p.family ?? '')
      if (!m || m.slug === 'accessories') continue
      // Series page (add() dedupes repeats) + the per-SKU detail page that #156
      // re-added for every family — mirrors generateStaticParams on
      // /products/[slug]/[series], which builds both from the same visibility
      // conditions, so every URL here is a real prerendered page.
      // The no-series "other" bucket page is gone (user 2026-07-09) — those
      // products are reachable through their SKU pages only.
      // List pages (family, series, /products) render the products they
      // contain, so their lastModified = newest member's updatedAt.
      add('/products', p.updatedAt)
      add(`/products/${m.slug}`, p.updatedAt)
      if (p.series) add(`/products/${m.slug}/${seriesSlug(p.series)}`, p.updatedAt)
      // Signage detail pages live at the MODEL grain (#173) — the raw
      // CCT-suffixed SKU URLs are 308s and must not be advertised.
      const sku = m.slug === 'led-signage-modules' ? stripCctSuffix(p.sku) : p.sku
      add(`/products/${m.slug}/${encodeURIComponent(sku)}`, p.updatedAt)
    }
  } catch { /* keep static + family URLs */ }

  // Blog restored 2026-07-13 (user sign-off) — index + categories + posts.
  for (const p of BLOG_PATHS) add(p)
  try {
    const counts = await getPostCounts()
    for (const c of BLOG_CATEGORIES) {
      if (counts[c] > 0) add(`/blog/category/${c}`)
    }
    for (const post of await getPostSitemapEntries()) {
      add(`/blog/${post.slug}`, post.lastModified)
      add('/blog', post.lastModified) // index lists the posts
    }
  } catch { /* skip posts */ }

  try {
    for (const sol of await getSolutions()) add(`/solutions/${sol.slug}`, sol.updatedAt)
  } catch { /* skip solutions */ }

  try {
    for (const page of await getAllCmsPageStubs()) add(pageHref(page.slug), page.updatedAt)
  } catch { /* skip cms pages */ }

  // Projects hidden from nav + sitemap until real installs exist (only seeded demos).
  // Restore the /projects entry above and this loop to re-expose.
  // try {
  //   for (const slug of await getAllProjectSlugs()) urls.add(`/projects/${slug}`)
  // } catch { /* skip projects */ }

  // No changeFrequency / priority: Google documents both as ignored, and a
  // blanket "weekly" was noise. lastModified is emitted only where real.
  return Array.from(urls, ([path, iso]) => ({
    url: `${BASE}${path}`,
    ...(iso ? { lastModified: iso } : {}),
  }))
}
