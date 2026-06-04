// Maps the 7 Akeneo DB families to the 4 marketing families used in the URL/IA,
// and converts DB `series` codes to URL slugs (and back). Pure — no I/O.
import { slugify } from '@/lib/slugify'

export type MarketingFamily = { slug: string; label: string; dbFamilies: string[] }

export const MARKETING_FAMILIES: MarketingFamily[] = [
  { slug: 'led-signage-modules', label: 'LED Signage Modules', dbFamilies: ['led_module'] },
  { slug: 'led-drivers',         label: 'LED Drivers',         dbFamilies: ['psu_led_cv', 'psu_led_cc'] },
  { slug: 'control-gear',        label: 'Control Gear',        dbFamilies: ['psu_led_controller', 'switch_switch_module'] },
  { slug: 'accessories',         label: 'Accessories',         dbFamilies: ['sensor', 'accessory_general'] },
]

export function dbFamilyToMarketing(dbFamily: string): MarketingFamily | null {
  return MARKETING_FAMILIES.find((f) => f.dbFamilies.includes(dbFamily)) ?? null
}

export function marketingFamilyToDbFamilies(slug: string): string[] {
  return MARKETING_FAMILIES.find((f) => f.slug === slug)?.dbFamilies ?? []
}

// Series that have a bespoke/curated page keep their existing slug.
const SERIES_SLUG_OVERRIDES: Record<string, string> = { envo_minilux: 'mini-series' }
const SLUG_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(SERIES_SLUG_OVERRIDES).map(([code, slug]) => [slug, code]),
)

// Human-friendly series labels with correct casing (envo-led taxonomy);
// anything not listed falls back to title-case of the de-prefixed code.
const SERIES_LABELS: Record<string, string> = {
  envo_minilux: 'MiniLux', envo_ecoglo: 'EcoGlo', envo_ultraflare: 'UltraFlare',
  envo_proglo: 'ProGlo', envo_optilume: 'OptiLume', envo_edgelume: 'EdgeLume',
  envo_edgeflare: 'EdgeFlare', hydro_lume: 'Hydro Lume', envo_zigbee: 'Zigbee Smart',
  envo_casambi: 'Casambi', envo_dali: 'DALI', sr_triac: 'Triac', sc_envo: 'Standard',
}

export function seriesSlug(code: string | null | undefined): string {
  if (!code) return 'other'
  return SERIES_SLUG_OVERRIDES[code] ?? code.replace(/_/g, '-')
}

export function seriesCodeFromSlug(slug: string): string | null {
  if (slug === 'other') return null
  return SLUG_TO_CODE[slug] ?? slug.replace(/-/g, '_')
}

// Brand line-art tile per series (matches the original BOUNCE family-card look).
// Per-series art where it exists; otherwise the family's category line-art.
const SERIES_LINE_ART: Record<string, string> = {
  envo_minilux: '/assets/images/mod-mini-line.png',
  envo_ecoglo: '/assets/images/mod-eco-line.png',
  envo_ultraflare: '/assets/images/mod-pro-line.png',
  envo_chromaflux: '/assets/images/mod-rgb-line.png',
  envo_optilume: '/assets/images/mod-24v-line.png',
  envo_edgelume: '/assets/images/mod-sidelit-line.png',
}
const FAMILY_LINE_ART: Record<string, string> = {
  'led-signage-modules': '/assets/images/cat-modules.png',
  'led-drivers': '/assets/images/cat-drivers-line.png',
  'control-gear': '/assets/images/cat-controllers-line.png',
  'accessories': '/assets/images/cat-sensors-line.png',
}

export function seriesLineArt(code: string | null | undefined, marketingSlug: string): string {
  if (code && SERIES_LINE_ART[code]) return SERIES_LINE_ART[code]
  return FAMILY_LINE_ART[marketingSlug] ?? '/assets/images/cat-modules.png'
}

export function seriesLabel(code: string | null | undefined): string {
  if (!code) return 'Other'
  if (SERIES_LABELS[code]) return SERIES_LABELS[code]
  const deprefixed = code.replace(/^(envo|sc|sr|hydro)_/, '')
  return slugify(deprefixed)
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
