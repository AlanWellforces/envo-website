import { getPayload } from 'payload'
import config from '@/payload.config'

export type HomeHeroData = {
  eyebrow: string
  headline: string
  subheading: string
  video_url: string
  features: { label: string; desc: string }[]
}

export type HomeStatsData = {
  heading: string
  description: string
  cta_label: string
  cta_url: string
  items: { label: string; desc: string }[]
}

export type HomeQuoteData = {
  text: string
  author_role: string
  author_location: string
}

export type HomeProcessData = {
  heading: string
  cta_label: string
  cta_url: string
  steps: { name: string; desc: string }[]
}

export type HomeCtaData = {
  heading: string
  body: string
  primary_label: string
  primary_url: string
  secondary_label: string
  secondary_url: string
}

export type HomePageData = {
  hero: HomeHeroData
  stats: HomeStatsData
  quote: HomeQuoteData
  process: HomeProcessData
  cta: HomeCtaData
}

let cache: { data: HomePageData; ts: number } | null = null
const TTL = 300_000 // 5 min — homepage changes less often than nav

function mapRaw(raw: Record<string, unknown>): HomePageData {
  return {
    hero: {
      eyebrow:    (raw.hero_eyebrow    as string) || '',
      headline:   (raw.hero_headline   as string) || '',
      subheading: (raw.hero_subheading as string) || '',
      video_url:  (raw.hero_video_url  as string) || '',
      features:   (raw.hero_features   as { label: string; desc: string }[]) || [],
    },
    stats: {
      heading:     (raw.stats_heading     as string) || '',
      description: (raw.stats_description as string) || '',
      cta_label:   (raw.stats_cta_label   as string) || '',
      cta_url:     (raw.stats_cta_url     as string) || '',
      items:       (raw.stats_items       as { label: string; desc: string }[]) || [],
    },
    quote: {
      text:             (raw.quote_text            as string) || '',
      author_role:      (raw.quote_author_role     as string) || '',
      author_location:  (raw.quote_author_location as string) || '',
    },
    process: {
      heading:   (raw.process_heading   as string) || '',
      cta_label: (raw.process_cta_label as string) || '',
      cta_url:   (raw.process_cta_url   as string) || '',
      steps:     (raw.process_steps     as { name: string; desc: string }[]) || [],
    },
    cta: {
      heading:         (raw.cta_heading         as string) || '',
      body:            (raw.cta_body            as string) || '',
      primary_label:   (raw.cta_primary_label   as string) || '',
      primary_url:     (raw.cta_primary_url     as string) || '',
      secondary_label: (raw.cta_secondary_label as string) || '',
      secondary_url:   (raw.cta_secondary_url   as string) || '',
    },
  }
}

export async function getHomePage(): Promise<HomePageData> {
  if (cache && Date.now() - cache.ts < TTL) return cache.data

  const p = await getPayload({ config })
  const raw = await p.findGlobal({ slug: 'home-page', depth: 0 }) as unknown as Record<string, unknown>
  const data = mapRaw(raw)
  cache = { data, ts: Date.now() }
  return data
}

export function clearHomePageCache() {
  cache = null
}
