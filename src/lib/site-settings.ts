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
  nav: {
    primary_links: { label: string; url: string; icon?: string; open_in_new_tab: boolean }[]
    cta_label: string
    cta_url: string
  }
  footer: {
    tagline?: string
    link_columns: { heading: string; links: { label: string; url: string }[] }[]
    legal_text?: string
    social_links: { platform: string; url: string }[]
  }
  contact: {
    email?: string
    phone?: string
    address?: string
    hours?: string
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

let cache: { data: SiteSettings; ts: number } | null = null
const TTL = 60_000 // 1 min in-memory cache — revalidate clears this

export async function getSiteSettings(): Promise<SiteSettings> {
  if (cache && Date.now() - cache.ts < TTL) return cache.data

  const p = await getPayload({ config })
  const raw = await p.findGlobal({ slug: 'site-settings' as any, depth: 1 })
  const data = raw as unknown as SiteSettings
  cache = { data, ts: Date.now() }
  return data
}

export function clearSiteSettingsCache() {
  cache = null
}
