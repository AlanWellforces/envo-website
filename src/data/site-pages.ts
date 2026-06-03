// Hand-maintained inventory of site pages for the admin Pages overview.
// Add a row when a new page ships. `source` drives the type badge; `editHref`
// is where the ✎ link points: a Payload collection/global for CMS pages, or the
// page-seo collection (filtered by route) for code pages.

/** Section order for the overview. A row's `section` must be one of these — a
 *  typo is then a compile error rather than a silently-dropped (ungrouped) row. */
export const SITE_PAGE_SECTIONS = ['Home', 'Marketing', 'Solutions', 'Content collections', 'Resources'] as const
export type SitePageSection = (typeof SITE_PAGE_SECTIONS)[number]

export type SitePage = {
  label: string
  route: string
  section: SitePageSection
  source: 'cms' | 'code'
  editHref?: string
}

export const SITE_PAGES: SitePage[] = [
  { label: 'Home', route: '/', section: 'Home', source: 'cms', editHref: '/admin/globals/home-page' },

  { label: 'About', route: '/about', section: 'Marketing', source: 'code', editHref: '/admin/collections/page-seo?where[route][equals]=/about' },
  { label: 'Contact', route: '/contact', section: 'Marketing', source: 'code', editHref: '/admin/collections/page-seo?where[route][equals]=/contact' },
  { label: 'Free Layout Design', route: '/free-layout-design', section: 'Marketing', source: 'code', editHref: '/admin/collections/page-seo?where[route][equals]=/free-layout-design' },
  { label: 'Find Your Match', route: '/find-your-match', section: 'Marketing', source: 'code', editHref: '/admin/collections/page-seo?where[route][equals]=/find-your-match' },

  { label: 'Solutions', route: '/solutions', section: 'Solutions', source: 'code', editHref: '/admin/collections/page-seo?where[route][equals]=/solutions' },
  { label: 'Architectural Lighting', route: '/solutions/architectural-lighting', section: 'Solutions', source: 'code', editHref: '/admin/collections/page-seo?where[route][equals]=/solutions/architectural-lighting' },
  { label: 'Signage Lighting', route: '/solutions/signage-lighting', section: 'Solutions', source: 'code', editHref: '/admin/collections/page-seo?where[route][equals]=/solutions/signage-lighting' },

  { label: 'Blog', route: '/blog', section: 'Content collections', source: 'cms', editHref: '/admin/collections/posts' },
  { label: 'Projects', route: '/projects', section: 'Content collections', source: 'cms', editHref: '/admin/collections/projects' },
  { label: 'Products', route: '/products', section: 'Content collections', source: 'cms', editHref: '/admin/collections/products' },

  { label: 'Resources', route: '/resources', section: 'Resources', source: 'code', editHref: '/admin/collections/page-seo?where[route][equals]=/resources' },
  { label: 'Downloads', route: '/resources/downloads', section: 'Resources', source: 'code', editHref: '/admin/collections/page-seo?where[route][equals]=/resources/downloads' },
  { label: 'Tools', route: '/resources/tools', section: 'Resources', source: 'code', editHref: '/admin/collections/page-seo?where[route][equals]=/resources/tools' },
  { label: 'Signage Selector', route: '/resources/tools/signage-selector', section: 'Resources', source: 'code', editHref: '/admin/collections/page-seo?where[route][equals]=/resources/tools/signage-selector' },
  { label: 'FAQ', route: '/resources/faq', section: 'Resources', source: 'cms', editHref: '/admin/collections/faqs' },
]

export function groupedSitePages(): { section: SitePageSection; pages: SitePage[] }[] {
  return SITE_PAGE_SECTIONS.map((section) => ({
    section,
    pages: SITE_PAGES.filter((p) => p.section === section),
  })).filter((g) => g.pages.length > 0)
}
