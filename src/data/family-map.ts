// Maps the 7 Akeneo DB families to the 4 marketing families used in the URL/IA,
// and converts DB `series` codes to URL slugs (and back). Pure — no I/O.
import { slugify } from '@/lib/slugify'

export type MarketingFamily = { slug: string; label: string; dbFamilies: string[] }

export const MARKETING_FAMILIES: MarketingFamily[] = [
  { slug: 'led-signage-modules', label: 'LED Signage Modules', dbFamilies: ['led_module'] },
  { slug: 'led-drivers',         label: 'LED Drivers',         dbFamilies: ['psu_led_cv', 'psu_led_cc'] },
  // `sensor` moved from accessories → control-gear 2026-07-06 (user decision):
  // every live "accessory" was a sensor, and sensors belong with the controls
  // they feed. Old /products/accessories/* sensor URLs 404 by design.
  { slug: 'control-gear',        label: 'Control Gear',        dbFamilies: ['psu_led_controller', 'switch_switch_module', 'sensor'] },
  { slug: 'accessories',         label: 'Accessories',         dbFamilies: ['accessory_general'] },
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
  envo_edgeflare: 'EdgeFlare', envo_edgeblade: 'EdgeBlade', edge_blade_2: 'EdgeBlade 2',
  envo_chromaflux: 'ChromaFlux', hydro_lume: 'Hydro Lume', envo_zigbee: 'Zigbee Smart',
  // sr_triac is DALI DT6 — its legacy "Triac" label must never surface
  // (naming rule, user-locked 2026-07-06; see series-catalogue-meta.ts).
  envo_casambi: 'Casambi', envo_dali: 'DALI', sr_triac: 'SR DALI', sc_envo: 'Standard',
  // Driver model lines carry no curated name in Akeneo (product `title` is null);
  // surface the real SKU-prefix model code cleanly rather than the garbled
  // title-cased fallback ("Se Us" → "SE"). `_us` is a US-variant region tag.
  envo_se_us: 'SE', envo_sl_us: 'SL', envo_sng: 'SNG', envo_snpv_us: 'SNPV', envo_sp_us: 'SP',
  // Drop the off-brand "Archilight" prefix — site is envo-only; keep the line name.
  archilight_pure_lume: 'Pure Lume',
}

// Old-envo customer-facing signage CATEGORIES (the menu sign-makers know:
// Mini / Eco / Pro / RGB / 24V / Sidelit). A category can span several
// internal series — verified against envo-led.com collections 2026-07-08:
// Pro = ProGlo + UltraFlare; Sidelit = EdgeBlade + EdgeFlare + EdgeLume.
// Used by the catalogue Series filter so customers pick by category, not by
// internal range codenames.
const SIGNAGE_SERIES_CATEGORY: Record<string, string> = {
  envo_minilux: 'Mini Series',
  envo_ecoglo: 'Eco Series',
  envo_proglo: 'Pro Series',
  envo_ultraflare: 'Pro Series',
  envo_chromaflux: 'RGB Series',
  envo_optilume: '24V Series',
  envo_edgeblade: 'Sidelit',
  envo_edgeflare: 'Sidelit',
  envo_edgelume: 'Sidelit',
  edge_blade_2: 'Sidelit',
}
export const SIGNAGE_CATEGORY_ORDER = [
  'Mini Series', 'Eco Series', 'Pro Series', 'RGB Series', '24V Series', 'Sidelit',
]
export function signageSeriesCategory(code: string | null | undefined): string | null {
  return code ? SIGNAGE_SERIES_CATEGORY[code] ?? null : null
}

// Old-envo LED DRIVER categories (Screw Terminal / Linear / Triac Dimmable)
// — the old menu splits by connection/dimming TYPE, not by model line, and a
// series can belong to TWO types: SP is screw-terminal AND triac-dimmable
// (multi-value facet: ticking either shows it). Verified SKU-for-SKU against
// envo-led.com collections 2026-07-08 (SE 10 + SNPV 4 + SP 6 = Screw
// Terminal 20; SL 8 = Linear; SP 6 = Triac Dimmable). Unmapped series (e.g.
// gated ranges when they return) fall back to their authored series title.
export const DRIVER_CATEGORY_ORDER = [
  'Screw Terminal', 'Linear', 'Triac Dimmable',
  // Standard Driver Range types (user mapping 2026-07-10)
  'Standard', 'Waterproof', 'Constant Current',
]
const DRIVER_SERIES_CATEGORIES: Record<string, string[]> = {
  envo_se_us: ['Screw Terminal'],
  envo_snpv_us: ['Screw Terminal'],
  envo_sp_us: ['Screw Terminal', 'Triac Dimmable'],
  envo_sl_us: ['Linear'],
}
// The Standard Driver Range (sc_envo) is one Akeneo series spanning six model
// LINES, so its type classification is by SKU prefix (user mapping 2026-07-10,
// SNR corrected same day: SC=Standard, SNL=Linear, SNP=Waterproof (IP67 —
// fixed in the PIM too), SNR+SNT=Screw Terminal, ENC=CC).
const SC_ENVO_LINE_CATEGORIES: [RegExp, string[]][] = [
  [/^S?-?EV-SNL-/, ['Linear']],
  [/^S?-?EV-SNP-/, ['Waterproof']],
  [/^S?-?EV-SNR-/, ['Screw Terminal']],
  [/^S?-?EV-SNT-/, ['Screw Terminal']],
  [/^ENC-/, ['Constant Current']],
  [/^SC-/, ['Standard']],
]
export function driverCategories(code: string | null | undefined): string[] | null {
  return code ? DRIVER_SERIES_CATEGORIES[code] ?? null : null
}
/** Type categories for a driver PRODUCT: sc_envo classifies by model line
 *  (SKU prefix); every other series by its series-level mapping. */
export function driverProductCategories(
  sku: string,
  code: string | null | undefined,
): string[] | null {
  if (code === 'sc_envo') {
    for (const [re, cats] of SC_ENVO_LINE_CATEGORIES) if (re.test(sku)) return cats
    return ['Standard'] // unrecognised line — keep it findable
  }
  return driverCategories(code)
}

// Old-envo CONTROL GEAR categories (Remote & Receiver / Signal Converter /
// Sensor / Zigbee & Smart). On the old site the first three split the range
// by FUNCTION (name-based — the PIM has no structured attribute), while
// "Zigbee & Smart" (collection handle `zigbee-controller`) is the WHOLE
// zigbee range — a superset view, so a product carries it IN ADDITION to
// its function category. Rule order matters: "Blinds Controller" is a
// converter, not a remote. "conveter" covers a live PIM typo (EV-ZBDA-2421).
export const CONTROL_GEAR_CATEGORY_ORDER = [
  'Remote & Receiver', 'Signal Converter', 'Sensor', 'Zigbee & Smart',
]
export function controlGearCategories(p: {
  name?: string | null
  family?: string | null
  series?: string | null
}): string[] {
  const n = p.name ?? ''
  const fn =
    p.family === 'sensor' || /sensor/i.test(n) ? 'Sensor'
    : /switch|dimmer|convert|conveter|blinds/i.test(n) ? 'Signal Converter'
    : /remote|controller|gateway|hub|receiver/i.test(n) ? 'Remote & Receiver'
    : null
  const zigbee = p.series === 'envo_zigbee' || /zigbee/i.test(n)
  const cats = fn ? [fn] : []
  if (zigbee) cats.push('Zigbee & Smart')
  return cats.length ? cats : ['Zigbee & Smart']
}

export function seriesSlug(code: string | null | undefined): string {
  if (!code) return 'other'
  return SERIES_SLUG_OVERRIDES[code] ?? code.replace(/_/g, '-')
}

export function seriesCodeFromSlug(slug: string): string | null {
  if (slug === 'other') return null
  return SLUG_TO_CODE[slug] ?? slug.replace(/-/g, '_')
}

// Brand line-art tile per series (uniform brand tile per series).
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

// ── Family-page sections ─────────────────────────────────────────────────
// A family's series are grouped into sections for clearer structure.
type SeriesProductLite = { family?: string | null; sku?: string | null }

const DB_FAMILY_SECTION: Record<string, string> = {
  psu_led_cv: 'Constant-voltage drivers',
  psu_led_cc: 'Constant-current drivers',
  psu_led_controller: 'Controllers',
  switch_switch_module: 'Switches',
  sensor: 'Sensors',
  accessory_general: 'Accessories',
}

// Preferred section order per marketing family; unlisted titles sort after.
const SECTION_ORDER: Record<string, string[]> = {
  'led-signage-modules': ['Backlit modules', 'Sidelit modules'],
  'led-drivers': ['Constant-voltage drivers', 'Constant-current drivers'],
  'control-gear': ['Controllers', 'Switches', 'Sensors'],
  'accessories': ['Accessories'],
}

/** Section a series belongs to, by its products' dominant attribute. Signage
    modules split backlit/sidelit (SKU prefix EV-BL/EV-SL); other families by
    dominant DB family. Pure. */
export function seriesSectionTitle(marketingSlug: string, products: SeriesProductLite[]): string {
  if (marketingSlug === 'led-signage-modules') {
    let bl = 0
    let sl = 0
    for (const p of products) {
      const s = p.sku ?? ''
      if (s.startsWith('EV-SL')) sl++
      else if (s.startsWith('EV-BL')) bl++
    }
    return sl > bl ? 'Sidelit modules' : 'Backlit modules'
  }
  const count: Record<string, number> = {}
  for (const p of products) { const f = p.family ?? ''; count[f] = (count[f] ?? 0) + 1 }
  const dom = Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''
  return DB_FAMILY_SECTION[dom] ?? 'Other'
}

export function sectionOrderIndex(marketingSlug: string, title: string): number {
  const order = SECTION_ORDER[marketingSlug] ?? []
  const i = order.indexOf(title)
  return i === -1 ? 999 : i
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
