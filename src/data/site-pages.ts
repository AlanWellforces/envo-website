// Hand-maintained inventory of site pages for the admin Pages overview.
// Add a row when a new page ships. `source` drives the type badge; `editHref`
// is where the ✎ link points: a Payload collection/global for CMS pages, or the
// page-seo collection (filtered by route) for code pages.

/** Section order for the overview. A row's `section` must be one of these — a
 *  typo is then a compile error rather than a silently-dropped (ungrouped) row. */
export const SITE_PAGE_SECTIONS = ['Home', 'Marketing', 'Solutions', 'Content collections', 'Resources', 'Legal'] as const
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

  // Solutions content lives in the Solutions collection (one doc per page);
  // per-route SEO overrides still come from page-seo like everywhere else.
  { label: 'Solutions', route: '/solutions', section: 'Solutions', source: 'cms', editHref: '/admin/collections/solutions' },
  { label: 'Architectural Lighting', route: '/solutions/architectural-lighting', section: 'Solutions', source: 'cms', editHref: '/admin/collections/solutions?where[slug][equals]=architectural-lighting' },
  { label: 'Signage Lighting', route: '/solutions/signage-lighting', section: 'Solutions', source: 'cms', editHref: '/admin/collections/solutions?where[slug][equals]=signage-lighting' },

  { label: 'Blog', route: '/blog', section: 'Content collections', source: 'cms', editHref: '/admin/collections/posts' },
  { label: 'Projects', route: '/projects', section: 'Content collections', source: 'cms', editHref: '/admin/collections/projects' },
  { label: 'Products', route: '/products', section: 'Content collections', source: 'cms', editHref: '/admin/collections/products' },

  { label: 'Resources', route: '/resources', section: 'Resources', source: 'code', editHref: '/admin/collections/page-seo?where[route][equals]=/resources' },
  { label: 'Tools', route: '/resources/tools', section: 'Resources', source: 'code', editHref: '/admin/collections/page-seo?where[route][equals]=/resources/tools' },
  // Downloads + Signage Selector hidden 2026-07-24 (pages 404) — omitted here.
  { label: 'FAQ', route: '/resources/faq', section: 'Resources', source: 'cms', editHref: '/admin/collections/faqs' },

  { label: 'Terms of Service', route: '/terms-of-service', section: 'Legal', source: 'cms', editHref: '/admin/collections/pages' },
  { label: 'Privacy Policy', route: '/privacy-policy', section: 'Legal', source: 'cms', editHref: '/admin/collections/pages' },
  { label: 'Cookie Policy', route: '/cookie-policy', section: 'Legal', source: 'cms', editHref: '/admin/collections/pages' },
  { label: 'Acceptable Use Policy', route: '/acceptable-use-policy', section: 'Legal', source: 'cms', editHref: '/admin/collections/pages' },
]

export function groupedSitePages(): { section: SitePageSection; pages: SitePage[] }[] {
  return SITE_PAGE_SECTIONS.map((section) => ({
    section,
    pages: SITE_PAGES.filter((p) => p.section === section),
  })).filter((g) => g.pages.length > 0)
}
