import { getPayload } from 'payload'
import config from '@/payload.config'

export type SiteSettings = {
  banner: {
    enabled: boolean
    message?: string
    link_label?: string
    link_url?: string
    style: 'info' | 'success' | 'warning' | 'promo'
  }
  footer: {
    tagline?: string
    legal_text?: string
    social_links?: { platform: string; url: string }[]
    link_columns?: { heading: string; links: { label: string; url: string }[] }[]
  }
  contact: {
    email?: string
    phones?: { label: string; number: string }[]
    address?: string
  }
  seo: {
    site_name: string
    title_separator: string
    default_description?: string
    default_og_image?: { url?: string } | null
    google_analytics_id?: string
    google_tag_manager_id?: string
  }
}

// No in-memory cache here on purpose: Next.js gives each route entry its own
// module instance, so a cache cleared from the revalidate route never clears
// the page's copy (stale-footer bug). The layout revalidation in
// /api/revalidate is the cache layer; a render costs one cheap local query.
export async function getSiteSettings(): Promise<SiteSettings> {
  const p = await getPayload({ config })
  const raw = await p.findGlobal({ slug: 'site-settings', depth: 1 })
  return raw as unknown as SiteSettings
}
