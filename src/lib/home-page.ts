import { getPayload } from 'payload'
import config from '@/payload.config'

// Editable homepage copy from the `home-page` global. Every field is optional:
// empty/unset means "use the built-in copy" — the fallbacks live next to the
// markup in src/components/home/* so the design never depends on DB state.

export type HomeHeroData = {
  eyebrow?: string
  headline?: string
  lead?: string
  primary_label?: string
  primary_url?: string
  ghost_label?: string
  ghost_url?: string
}

export type HomeWhyData = {
  eyebrow?: string
  heading?: string
  pillars: { title: string; desc: string }[]
  stats: { value: string; label: string; lime?: boolean }[]
}

export type HomeFlCtaData = {
  eyebrow?: string
  heading?: string
  body?: string
  primary_label?: string
  primary_url?: string
  ghost_label?: string
  ghost_url?: string
}

export type HomePageData = {
  hero: HomeHeroData
  why: HomeWhyData
  flCta: HomeFlCtaData
}

const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v : undefined)

function mapRaw(raw: Record<string, unknown>): HomePageData {
  return {
    hero: {
      eyebrow:       str(raw.hero_eyebrow),
      headline:      str(raw.hero_headline),
      lead:          str(raw.hero_lead),
      primary_label: str(raw.hero_primary_label),
      primary_url:   str(raw.hero_primary_url),
      ghost_label:   str(raw.hero_ghost_label),
      ghost_url:     str(raw.hero_ghost_url),
    },
    why: {
      eyebrow: str(raw.why_eyebrow),
      heading: str(raw.why_heading),
      pillars: (raw.why_pillars as { title: string; desc: string }[]) || [],
      stats:   (raw.why_stats   as { value: string; label: string; lime?: boolean }[]) || [],
    },
    flCta: {
      eyebrow:       str(raw.fl_eyebrow),
      heading:       str(raw.fl_heading),
      body:          str(raw.fl_body),
      primary_label: str(raw.fl_primary_label),
      primary_url:   str(raw.fl_primary_url),
      ghost_label:   str(raw.fl_ghost_label),
      ghost_url:     str(raw.fl_ghost_url),
    },
  }
}

// No in-memory cache here on purpose: Next.js dev/prod give each route entry
// its own module instance, so a cache cleared from the revalidate route never
// clears the page's copy. Caching is the page cache's job — the global's
// afterChange hook revalidates '/', and a render costs one cheap local query.
export async function getHomePage(): Promise<HomePageData> {
  const p = await getPayload({ config })
  const raw = await p.findGlobal({ slug: 'home-page', depth: 0 }) as unknown as Record<string, unknown>
  return mapRaw(raw)
}
