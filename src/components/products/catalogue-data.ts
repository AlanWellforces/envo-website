// Shared builders for the unified Product catalogue (/products = All families,
// /products/[slug] = one family). Server-only (pulls live products via Payload).
import type { ProductFamily, SeriesLink } from '@/data/product-families'
import {
  resolveProductImage,
  groupProductsBySeries,
  groupSeriesIntoSections,
  type Product,
} from '@/lib/products'
import { seriesSlug, seriesLabel, seriesLineArt, seriesSectionTitle, signageSeriesCategory, SIGNAGE_CATEGORY_ORDER, controlGearCategories, CONTROL_GEAR_CATEGORY_ORDER, driverProductCategories, DRIVER_CATEGORY_ORDER } from '@/data/family-map'
import { SERIES_BLURBS, LED_CONFIG_OPTIONS } from '@/data/series-applications'
import { catalogueSeriesMeta } from '@/data/series-catalogue-meta'
import { formatDims } from '@/lib/units'

export type FacetOption = { value: string; label: string; count: number }
export type FacetGroup = { key: string; label: string; options: FacetOption[] }

export type CatalogueCard = {
  key: string
  href: string
  /** Single-word family eyebrow, e.g. "Modules". */
  familyLabel: string
  name: string
  desc: string
  imgSrc: string
  imgLocal: boolean
  imgAlt: string
  badge?: string
  chips: string[]
  sku?: string
  facts?: string[]
  ctaLabel?: string
  modelCount: number
  /** Section heading this card belongs to (e.g. "Constant-voltage drivers"). */
  section: string
  /** Max LED bead count in the series (from compareSpec.ledConfig) — drives the
   *  little dot indicator on the row. Undefined when not a bead-count series. */
  beads?: number
  certified: boolean
  /** facet key -> values this card carries */
  facets: Record<string, string[]>
  /** sortable numeric metrics (adaptive sort dropdown; never price) */
  metrics?: { power?: number | null; brightness?: number | null }
}

// Series codes with a unified-tone main image under public/assets/images/series/.
// Preferred over the per-SKU PIM photo so every card shares one art style.
const SERIES_IMAGE_CODES = new Set([
  'envo_minilux', 'envo_ecoglo', 'envo_chromaflux', 'envo_edgeblade', 'envo_edgeflare',
  'envo_edgelume', 'envo_optilume', 'envo_proglo', 'envo_ultraflare',
])

const BEAD: Record<string, number> = { single: 1, duo: 2, triple: 3, quad: 4, penta: 5 }
function beadsFromLedConfig(s?: string): number | undefined {
  if (!s) return undefined
  const found = Object.entries(BEAD)
    .filter(([k]) => s.toLowerCase().includes(k))
    .map(([, n]) => n)
  return found.length ? Math.max(...found) : undefined
}

// ── Facet vocabularies ──────────────────────────────────────────────────────
// Size/brightness/voltage are SKU-level specs that vary within a series, so the
// catalogue buckets them into bands and a series carries a band if ANY of its
// SKUs falls in it. Bands tuned to the live data (2026-06-26 audit). Each facet
// is adaptive: it only renders when the visible cards hold ≥2 of its values, so
// module facets (brightness/CCT) and driver facets (voltage/CC-CV) never clash.
const SIZE_OPTIONS = [
  { value: 'compact', label: 'Compact · under 30 mm' },
  { value: 'standard', label: 'Standard · 30–60 mm' },
  { value: 'large', label: 'Large · 60 mm +' },
] as const
const BRIGHTNESS_OPTIONS = [
  { value: 'lm-std', label: 'Up to 100 lm' },
  { value: 'lm-high', label: '100–200 lm' },
  { value: 'lm-ultra', label: '200 lm +' },
] as const
const VOLTAGE_OPTIONS = [
  { value: '12', label: '12 V' },
  { value: '24', label: '24 V' },
  { value: '48', label: '48 V' },
  { value: 'mains', label: 'Mains · 110–240 V' },
] as const
const OPMODE_OPTIONS = [
  { value: 'cv', label: 'Constant voltage (CV)' },
  { value: 'cc', label: 'Constant current (CC)' },
] as const

// ── Driver-selection facets (led-drivers page only) ─────────────────────────
const OUTV_OPTIONS = [
  { value: '12', label: '12 V' },
  { value: '24', label: '24 V' },
  { value: '48', label: '48 V' },
] as const
const INPUTV_OPTIONS = [
  { value: '110', label: '110–120 V' },
  { value: '240', label: '220–240 V' },
] as const
const POWER_OPTIONS = [
  { value: 'p30', label: 'Up to 30 W' },
  { value: 'p75', label: '31–75 W' },
  { value: 'p150', label: '76–150 W' },
  { value: 'p151', label: '151 W +' },
] as const
const DIMMING_OPTIONS = [
  { value: 'none', label: 'Non-dimmable' },
  { value: 'triac', label: 'Triac' },
  { value: 'dali', label: 'DALI' },
  { value: '0_10v', label: '0–10 V' },
  { value: 'pwm', label: 'PWM' },
] as const
const FORMFACTOR_OPTIONS = [
  { value: 'linear', label: 'Linear' },
  { value: 'slim', label: 'Slim' },
  { value: 'compact', label: 'Compact' },
  { value: 'screw-terminal', label: 'Screw terminal' },
] as const
const ENVIRONMENT_OPTIONS = [
  { value: 'indoor', label: 'Indoor' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'ip67', label: 'IP67' },
] as const
// ── Control-gear facets ─────────────────────────────────────────────────────
const PROTOCOL_OPTIONS = [
  { value: 'casambi', label: 'Casambi' },
  { value: 'dali', label: 'DALI' },
  { value: 'zigbee', label: 'Zigbee' },
] as const
const FUNCTION_OPTIONS = [
  { value: 'controller', label: 'Controller' },
  { value: 'dimmer', label: 'Dimmer' },
  { value: 'remote', label: 'Remote' },
  { value: 'wall-switch', label: 'Wall switch / panel' },
  { value: 'relay-converter', label: 'Relay / converter' },
  { value: 'gateway', label: 'Gateway' },
  { value: 'sensor', label: 'Sensor' },
] as const
const CONTROLTYPE_OPTIONS = [
  { value: 'single', label: 'Single colour' },
  { value: 'ct', label: 'Tunable white (CCT)' },
  { value: 'rgb', label: 'RGB' },
  { value: 'rgbw', label: 'RGBW' },
  { value: 'rgb_cct', label: 'RGB+CCT' },
] as const
const CHANNELS_OPTIONS = [
  { value: '1', label: '1 channel' },
  { value: '2', label: '2 channels' },
  { value: '4', label: '4 channels' },
  { value: '5', label: '5 channels' },
] as const

function sizeBand(mm: number | null): string | undefined {
  if (mm == null) return undefined
  if (mm < 30) return 'compact'
  if (mm < 60) return 'standard'
  return 'large'
}
function brightnessBand(lm: number | null): string | undefined {
  if (lm == null) return undefined
  if (lm < 100) return 'lm-std'
  if (lm < 200) return 'lm-high'
  return 'lm-ultra'
}
function voltageBand(v: number | null): string | undefined {
  if (v == null) return undefined
  if (v === 12 || v === 24 || v === 48) return String(v)
  if (v >= 100) return 'mains'
  return undefined // odd DC values (3/5/16/40 V…) don't earn their own option
}
function opmodeValues(m: Product['operation_mode']): string[] {
  if (m === 'cv') return ['cv']
  if (m === 'cc') return ['cc']
  if (m === 'cv_cc') return ['cv', 'cc']
  return []
}
function outvBand(v: number | null): string | undefined {
  return v === 12 || v === 24 || v === 48 ? String(v) : undefined
}
// Input-voltage (mains) bands for the driver Input filter. Full-range
// supplies (e.g. 90–264 V) genuinely run on both mains standards, so they
// match BOTH bands; "All" is simply the facet's unselected state, like
// every other group. DC-input units (12–48 V in) match neither.
function inputvValues(p: Product): string[] {
  const out: string[] = []
  if (p.input_voltage_min_v != null && p.input_voltage_min_v >= 90 && p.input_voltage_min_v <= 120) out.push('110')
  if (p.input_voltage_max_v != null && p.input_voltage_max_v >= 200) out.push('240')
  return out
}
function powerBand(w: number | null): string | undefined {
  if (w == null) return undefined
  if (w <= 30) return 'p30'
  if (w <= 75) return 'p75'
  if (w <= 150) return 'p150'
  return 'p151'
}
/**
 * Dimming values come from `dimming_control` plus the product NAME — the PIM
 * leaves the field empty on some genuinely dimmable models (SP says "Triac
 * Dimmable" only in its name). Never derived from series labels: the sr_triac
 * series is DALI, and its legacy "Triac" label must not classify anything.
 */
const DIMMING_VALUES = new Set<string>(DIMMING_OPTIONS.map((o) => o.value))
function dimmingValues(p: Product): string[] {
  const vals = new Set((p.dimming_control ?? []).filter((d) => DIMMING_VALUES.has(d)))
  if (/triac[- ]?dim/i.test(p.name)) vals.add('triac')
  if (/non[- ]?dimmable/i.test(p.name)) vals.add('none')
  return [...vals]
}
function environmentValues(w: string | null): string[] {
  if (w === 'ip67') return ['outdoor', 'ip67']
  if (w === 'ip65' || w === 'ip66') return ['outdoor']
  return ['indoor']
}
function formfactorValues(p: Product, seriesTags: string[]): string[] {
  const vals = new Set(seriesTags)
  if (/linear/i.test(p.name)) vals.add('linear')
  if (/ultra[- ]?thin|slim/i.test(p.name)) vals.add('slim')
  if (/screw[- ]?terminal/i.test(p.name)) vals.add('screw-terminal')
  return [...vals]
}
const PROTOCOL_VALUES = new Set<string>(PROTOCOL_OPTIONS.map((o) => o.value))
/** Protocol from dimming_control plus the name — the PIM leaves the field
    empty on some units (DALI2 wall panels; "ZigbBee" typo models). */
function protocolValues(p: Product): string[] {
  const vals = new Set((p.dimming_control ?? []).filter((d) => PROTOCOL_VALUES.has(d)))
  if (/casambi/i.test(p.name)) vals.add('casambi')
  if (/dali/i.test(p.name)) vals.add('dali')
  if (/zig.?bee/i.test(p.name)) vals.add('zigbee')
  return [...vals]
}
/** What the unit IS, from its name. Order matters: gateway/sensor/remote win
    over the dimming or switching words that also appear in their names. */
function functionValue(p: Product): string | undefined {
  const n = p.name
  if (/gateway|smart hub/i.test(n)) return 'gateway'
  if (/sensor/i.test(n)) return 'sensor'
  if (/remote/i.test(n)) return 'remote'
  if (/dimmer/i.test(n)) return 'dimmer'
  if (/relay|conve[rn]?ter/i.test(n)) return 'relay-converter'
  if (/wall panel|in-?wall|push button|rotary|switch/i.test(n)) return 'wall-switch'
  if (/controller/i.test(n)) return 'controller'
  return undefined
}
/** Colour capability, from the controller_type tags plus RGBWW/RGB+CCT names. */
const CONTROLTYPE_FROM_FIELD: Record<string, string> = {
  dimming: 'single', ct: 'ct', rgb: 'rgb', rgbw: 'rgbw', rgb_cct: 'rgb_cct',
}
function controlTypeValues(p: Product): string[] {
  const vals = new Set<string>()
  for (const t of p.controller_type ?? []) {
    const mapped = CONTROLTYPE_FROM_FIELD[t]
    if (mapped) vals.add(mapped)
  }
  if (/rgb\+?cct|rgbww/i.test(p.name)) vals.add('rgb_cct')
  else if (/rgbw\b/i.test(p.name)) vals.add('rgbw')
  if (/single colou?r/i.test(p.name)) vals.add('single')
  return [...vals]
}
/** Output channels from the output_channel code ('1ch', '5_channel',
    '4a_5ch' = 4 A per channel × 5ch) with a "5 CH" name fallback. */
function channelsValue(p: Product): string | undefined {
  const fromField = (p.output_channel ?? '').match(/(\d+)_?ch(annel)?$/i)?.[1]
  if (fromField) return fromField
  return p.name.match(/(\d+)\s*ch(annel)?s?\b/i)?.[1]
}

function controlGearDesc(
  protocol: string[],
  fn: string | undefined,
  controlTypes: string[],
): string {
  const protocolText = protocol.length ? protocol.map(PROTOCOL.label).join(' / ') : 'Lighting'
  const typeText = fn ? FUNCTION.label(fn).toLowerCase() : 'control gear'
  const colourText = controlTypes[0] ? ` for ${CONTROLTYPE.label(controlTypes[0]).toLowerCase()} loads` : ''
  return `${protocolText} ${typeText}${colourText}.`
}

function voltageRange(label: string, min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null
  if (min != null && max != null) return min === max ? `${label} ${min} V` : `${label} ${min}-${max} V`
  return `${label} ${min ?? max} V`
}

function waterproofLabel(value: string | null): string | undefined {
  if (!value || value === 'non_waterproof') return undefined
  return value.toUpperCase()
}

function controlGearFacts(
  p: Product,
  fn: string | undefined,
  controlTypes: string[],
  channel: string | undefined,
): string[] {
  const facts = [
    fn ? FUNCTION.label(fn) : undefined,
    controlTypes[0] ? CONTROLTYPE.label(controlTypes[0]) : undefined,
    channel ? `${channel} channel${channel === '1' ? '' : 's'}` : undefined,
    voltageRange('Input', p.input_voltage_min_v, p.input_voltage_max_v),
    p.output_voltage_v != null ? `Output ${p.output_voltage_v} V` : undefined,
    p.power_w != null ? `Load ${p.power_w} W` : undefined,
    p.maximum_detection_range ? `Range ${p.maximum_detection_range}` : undefined,
    waterproofLabel(p.waterproof),
  ].filter((x): x is string => !!x)

  return [...new Set(facts)].slice(0, 5)
}

/** value → label / sort-order accessors for an options list. */
function maps(opts: readonly { value: string; label: string }[]) {
  return {
    label: (v: string) => opts.find((o) => o.value === v)?.label ?? v,
    order: (v: string) => {
      const i = opts.findIndex((o) => o.value === v)
      return i < 0 ? 99 : i
    },
  }
}
const LED = maps(LED_CONFIG_OPTIONS)
const SIZE = maps(SIZE_OPTIONS)
const BRIGHTNESS = maps(BRIGHTNESS_OPTIONS)
const VOLTAGE = maps(VOLTAGE_OPTIONS)
const OPMODE = maps(OPMODE_OPTIONS)
const OUTV = maps(OUTV_OPTIONS)
const INPUTV = maps(INPUTV_OPTIONS)
const POWER = maps(POWER_OPTIONS)
const DIMMING = maps(DIMMING_OPTIONS)
const FORMFACTOR = maps(FORMFACTOR_OPTIONS)
const ENVIRONMENT = maps(ENVIRONMENT_OPTIONS)
const PROTOCOL = maps(PROTOCOL_OPTIONS)
const FUNCTION = maps(FUNCTION_OPTIONS)
const CONTROLTYPE = maps(CONTROLTYPE_OPTIONS)
const CHANNELS = maps(CHANNELS_OPTIONS)

/**
 * Feature chips for non-signage cards. Priority (user-locked 2026-07-06):
 * dimming/protocol → CV/CC → voltage → environment/IP → form factor, max 5.
 * "None" (non-dimmable) earns no chip; indoor is the default and earns none.
 */
const CHIP_DIMMING: Record<string, string> = {
  triac: 'Triac dimmable', dali: 'DALI', casambi: 'Casambi', zigbee: 'Zigbee',
  '0_10v': '0–10 V dim', pwm: 'PWM',
}
export const MAX_CHIPS = 5
function buildChips(
  facets: Record<string, string[]>,
  // "High power" is a driver spec — a controller's power_w is its switched
  // LOAD rating, so the chip would mislead outside led-drivers.
  maxPowerW: number | null,
): string[] {
  const chips: string[] = []
  const dims = uniq([...(facets.dimming ?? []), ...(facets.protocol ?? [])])
  for (const d of dims) if (CHIP_DIMMING[d]) chips.push(CHIP_DIMMING[d])
  for (const m of facets.opmode ?? []) chips.push(m === 'cv' ? 'Constant voltage' : 'Constant current')
  const volts = (facets.outv ?? []).slice().sort((a, b) => Number(a) - Number(b))
  if (volts.length) chips.push(`${volts.join(' / ')} V`)
  if (facets.environment?.includes('ip67')) chips.push('IP67')
  else if (facets.environment?.includes('outdoor')) chips.push('Outdoor')
  if (maxPowerW != null && maxPowerW > 150) chips.push('High power')
  for (const f of facets.formfactor ?? []) chips.push(FORMFACTOR.label(f))
  return chips.slice(0, MAX_CHIPS)
}

/** Distinct, defined facet values from a list of maybe-undefined band results. */
const uniq = (xs: (string | undefined)[]): string[] => [...new Set(xs.filter((x): x is string => !!x))]

const BEAD_LABEL: Record<string, string> = { '01': 'single', '02': 'duo', '03': 'triple', '04': 'quad' }
/** LED config values for a series, from its SKUs' variant codes (EV-BLML0**3**…). */
function ledConfigFromSkus(skus: string[]): string[] {
  const out = new Set<string>()
  for (const sku of skus) {
    if (/RGB/i.test(sku)) { out.add('rgbw'); continue }
    const m = sku.match(/^EV-[A-Z]{2}[A-Z]{2}(\d{2})/)
    if (m && BEAD_LABEL[m[1]]) out.add(BEAD_LABEL[m[1]])
  }
  return [...out]
}

/** Build the series cards for one family from its live products. */
export function buildCards(family: ProductFamily, products: Product[]): CatalogueCard[] {
  const metaByCode = new Map<string, SeriesLink>()
  for (const s of family.series) if ('seriesCode' in s) metaByCode.set(s.seriesCode, s)

  const familyLabel = family.tag.split('·')[0].trim()
  const sections = groupSeriesIntoSections(family.slug, groupProductsBySeries(products))

  const cards: CatalogueCard[] = []
  for (const sec of sections) {
    for (const g of sec.series) {
      const meta = g.code ? metaByCode.get(g.code) : undefined
      const spec = meta?.compareSpec
      // Prefer the unified-tone series main image; else the representative
      // product's PIM photo; else the line-art fallback.
      const rep = g.products[0]
      const seriesImg = g.code && SERIES_IMAGE_CODES.has(g.code)
        ? { src: `/assets/images/series/${g.code}.jpg`, isLocal: true, alt: seriesLabel(g.code) }
        : null
      const img =
        seriesImg ??
        (rep
          ? resolveProductImage(rep, seriesLineArt(g.code, family.slug))
          : { src: seriesLineArt(g.code, family.slug), isLocal: true, alt: seriesLabel(g.code) })
      const ccts = [...new Set(g.products.map((p) => p.cct_k).filter((v): v is number => v != null))].map(String)
      const certs = [...new Set(g.products.flatMap((p) => p.standards_met ?? []))]
      const authored = catalogueSeriesMeta(family.slug, g.code)
      const facets: Record<string, string[]> = {
        size: uniq(g.products.map((p) => sizeBand(p.length_mm))),
        ledconfig: ledConfigFromSkus(g.products.map((p) => p.sku)),
        brightness: uniq(g.products.map((p) => brightnessBand(p.brightness_lm))),
        cct: ccts,
        voltage: uniq(g.products.map((p) => voltageBand(p.output_voltage_v))),
        opmode: uniq(g.products.flatMap((p) => opmodeValues(p.operation_mode))),
        outv: uniq(g.products.map((p) => outvBand(p.output_voltage_v))),
        inputv: uniq(g.products.flatMap(inputvValues)),
        power: uniq(g.products.map((p) => powerBand(p.power_w))),
        dimming: uniq(g.products.flatMap(dimmingValues)),
        formfactor: uniq(g.products.flatMap((p) => formfactorValues(p, authored?.formFactor ?? []))),
        environment: uniq(g.products.flatMap((p) => environmentValues(p.waterproof))),
        protocol: uniq(g.products.flatMap(protocolValues)),
        function: uniq(g.products.map(functionValue)),
        controltype: uniq(g.products.flatMap(controlTypeValues)),
        channels: uniq(g.products.map(channelsValue)),
      }
      const maxPowerW = g.products.reduce<number | null>(
        (mx, p) => (p.power_w != null && (mx == null || p.power_w > mx) ? p.power_w : mx),
        null,
      )
      facets.family = [family.name] // Category picker on the all-families index
      // Series picker (first filter group). Signage groups
      // by customer category (Mini/Eco/Pro/RGB/24V/Sidelit); other families
      // use the same display name the card itself carries. No-series buckets
      // earn no option.
      if (g.code)
        facets.series = [
          (family.slug === 'led-signage-modules' ? signageSeriesCategory(g.code) : null) ??
            authored?.title ?? meta?.productName ?? seriesLabel(g.code),
        ]
      const signage = family.slug === 'led-signage-modules'
      cards.push({
        key: `${family.slug}:${g.code ?? 'other'}`,
        href: `/products/${family.slug}/${seriesSlug(g.code)}`,
        familyLabel,
        name: authored?.title ?? meta?.productName ?? seriesLabel(g.code),
        // Authored blurb → signage blurb → family-meta shortDesc → nothing.
        // (The "N models in the X range." fallback is gone on purpose.)
        desc: authored?.blurb ?? (g.code ? SERIES_BLURBS[g.code] : undefined) ?? meta?.shortDesc ?? '',
        imgSrc: img.src,
        imgLocal: img.isLocal,
        imgAlt: img.alt,
        badge: spec ? `${spec.ipRating} · ${spec.voltage}` : undefined,
        chips: signage
          ? spec ? [spec.ipRating, spec.voltage, spec.beam].filter(Boolean) : []
          : buildChips(facets, family.slug === 'led-drivers' ? maxPowerW : null),
        modelCount: g.products.length,
        section: sec.title,
        beads: beadsFromLedConfig(spec?.ledConfig),
        certified: certs.length > 0,
        facets,
      })
    }
  }
  return cards
}

/** Series display name for the series filter. Signage groups by the old-menu
 *  CUSTOMER category (Mini / Eco / Pro / RGB / 24V / Sidelit — one category
 *  can span several internal series); other families use the authored
 *  catalogue title when one exists, else the code label. */
function seriesFilterName(familySlug: string, code: string | null): string {
  if (familySlug === 'led-signage-modules') {
    const cat = signageSeriesCategory(code)
    if (cat) return cat
  }
  return catalogueSeriesMeta(familySlug, code)?.title ?? seriesLabel(code)
}

/** Common per-SKU catalogue-card shell. Family builders supply the derived
 *  desc/facts/facets/section; image, chips, CTA and identity are shared.
 *  Every SKU card also carries a `series` facet (range
 *  filter — first group in the sidebar). */
function skuCard(
  family: ProductFamily,
  p: Product,
  parts: { desc: string; facts: string[]; facets: Record<string, string[]>; section: string; maxPowerForChips?: number | null },
): CatalogueCard {
  const familyLabel = family.tag.split('·')[0].trim()
  const img = resolveProductImage(p, seriesLineArt(p.series, family.slug))
  // Control gear groups by the old-menu categories: a FUNCTION category
  // (Remote & Receiver / Signal Converter / Sensor) PLUS the range-wide
  // "Zigbee & Smart" on every zigbee product — every product classifies,
  // even the null-series sensors. Elsewhere: no series → no series facet
  // (an "Other" option makes no sense in the picker).
  if (family.slug === 'control-gear') parts.facets.series = controlGearCategories(p)
  else if (family.slug === 'led-drivers' && driverProductCategories(p.sku, p.series))
    parts.facets.series = driverProductCategories(p.sku, p.series)!
  else if (p.series) parts.facets.series = [seriesFilterName(family.slug, p.series)]
  parts.facets.family = [family.name] // Category picker on the all-families index
  return {
    key: `${family.slug}:${p.sku}`,
    // SKU detail page (series-first-then-SKU route). Datasheet stays a
    // detail-page CTA, never the card destination.
    href: `/products/${family.slug}/${encodeURIComponent(p.sku)}`,
    familyLabel,
    name: p.name,
    desc: parts.desc,
    imgSrc: img.src,
    imgLocal: img.isLocal,
    imgAlt: img.alt,
    chips: buildChips(parts.facets, parts.maxPowerForChips ?? null),
    sku: p.sku,
    facts: parts.facts,
    ctaLabel: 'View product',
    modelCount: 1,
    section: parts.section,
    certified: (p.standards_met ?? []).length > 0,
    facets: parts.facets,
    metrics: { power: p.power_w, brightness: p.brightness_lm },
  }
}

/** Build one visible catalogue card per control-gear SKU. Controllers, remotes,
 * gateways, switches and sensors are bought as individual units, so the family
 * landing should expose products directly instead of hiding them behind broad
 * "range" rows. */
export function buildControlGearProductCards(family: ProductFamily, products: Product[]): CatalogueCard[] {
  return products
    .map((p) => {
      const protocol = protocolValues(p)
      const fn = functionValue(p)
      const controlTypes = controlTypeValues(p)
      const channel = channelsValue(p)
      const facets = { protocol, function: uniq([fn]), controltype: controlTypes, channels: uniq([channel]) }
      return skuCard(family, p, {
        desc: controlGearDesc(protocol, fn, controlTypes),
        facts: controlGearFacts(p, fn, controlTypes, channel),
        facets,
        section: seriesSectionTitle(family.slug, [p]),
      })
    })
    .sort((a, b) => (sectionOrder(a.section) - sectionOrder(b.section)) || a.name.localeCompare(b.name))
}

function sectionOrder(section: string): number {
  const order = ['Controllers', 'Switches', 'Sensors']
  const i = order.indexOf(section)
  if (i >= 0) return i
  // driver sections (Constant-voltage / Constant-current) — keep CV before CC
  return section.toLowerCase().includes('current') ? 101 : 100
}

/** Card facts for a driver SKU: power → output voltage → dimming → CV/CC → IP. */
function driverFacts(p: Product, facets: Record<string, string[]>): string[] {
  const facts: (string | undefined)[] = [
    p.power_w != null ? `${p.power_w} W` : undefined,
    p.output_voltage_v != null ? `${p.output_voltage_v} V` : undefined,
    facets.dimming?.includes('triac') ? 'Triac dimmable'
      : facets.dimming?.includes('dali') ? 'DALI'
      : facets.dimming?.includes('none') ? 'Non-dimmable' : undefined,
    facets.opmode?.includes('cv') ? 'Constant voltage' : facets.opmode?.includes('cc') ? 'Constant current' : undefined,
    waterproofLabel(p.waterproof),
  ]
  return [...new Set(facts.filter((x): x is string => !!x))].slice(0, 5)
}

/** One short line describing the driver from its op-mode + IP. */
function driverDesc(facets: Record<string, string[]>, p: Product): string {
  const mode = facets.opmode?.includes('cc') ? 'Constant-current' : 'Constant-voltage'
  const env = p.waterproof && p.waterproof !== 'non_waterproof' && p.waterproof !== 'ip20' ? ` · ${p.waterproof.toUpperCase()}` : ''
  return `${mode} LED driver${env}.`
}

/** Build one visible catalogue card per LED-driver SKU. Drivers are selected by
 * spec (wattage, voltage, dimming, IP), so the family landing exposes SKUs
 * directly; the series page stays for range education. */
export function buildDriverProductCards(family: ProductFamily, products: Product[]): CatalogueCard[] {
  const authored = (code: string | null) => catalogueSeriesMeta(family.slug, code)
  return products
    .map((p) => {
      const facets: Record<string, string[]> = {
        outv: uniq([outvBand(p.output_voltage_v)]),
        inputv: inputvValues(p),
        power: uniq([powerBand(p.power_w)]),
        dimming: dimmingValues(p),
        opmode: opmodeValues(p.operation_mode),
        environment: environmentValues(p.waterproof),
        formfactor: formfactorValues(p, authored(p.series)?.formFactor ?? []),
      }
      return skuCard(family, p, {
        desc: driverDesc(facets, p),
        facts: driverFacts(p, facets),
        facets,
        section: seriesSectionTitle(family.slug, [p]),
        maxPowerForChips: p.power_w,
      })
    })
    .sort((a, b) => (sectionOrder(a.section) - sectionOrder(b.section)) || a.name.localeCompare(b.name))
}

/** Card facts for a signage model: output → power → CCT options → IP → size. */
function signageFacts(rep: Product, ccts: number[]): string[] {
  const ip = rep.waterproof && /^ip\d+$/i.test(rep.waterproof)
    ? rep.waterproof.toUpperCase()
    : rep.subtitle?.match(/IP\s?\d{2}/i)?.[0].toUpperCase().replace(/\s/, '')
  const facts: (string | undefined)[] = [
    rep.brightness_lm != null ? `~ ${rep.brightness_lm} lm` : undefined,
    rep.power_w != null ? `${rep.power_w} W` : undefined,
    ccts.length ? `${ccts.join(' / ')} K` : undefined,
    ip,
    rep.length_mm != null ? `${rep.length_mm} mm` : undefined,
  ]
  return [...new Set(facts.filter((x): x is string => !!x))].slice(0, 5)
}

/** CCT suffix variants (-WW/-NW/-CW) are ONE product (user 2026-07-08). */
export const stripCctSuffix = (sku: string) => sku.replace(/-(WW|NW|CW)$/i, '')

/** Signage collection order = the old envo-led.com menu (user 2026-07-08):
 *  Mini → Eco → Pro (ProGlo then UltraFlare) → RGB → 24V → Sidelit. */
const SIGNAGE_SERIES_ORDER = [
  'envo_minilux', 'envo_ecoglo', 'envo_proglo', 'envo_ultraflare',
  'envo_chromaflux', 'envo_optilume', 'envo_edgeblade', 'envo_edgeflare', 'envo_edgelume',
]
const signageSeriesOrder = (code: string | null): number => {
  const i = code ? SIGNAGE_SERIES_ORDER.indexOf(code) : -1
  return i < 0 ? 99 : i
}
/** Bead count from the model code (EV-BLML0**3**LBY → 3) — 单颗到多颗. */
const beadsFromModelCode = (code: string): number => Number(code.match(/^EV-[A-Z]{4}(\d{2})/)?.[1] ?? 99)

/** Build one catalogue card per signage MODEL (user 2026-07-08 — signage
 * joins the product-first grid; CCT variants collapse into one card whose
 * CCT options become a fact + facet). */
export function buildSignageProductCards(family: ProductFamily, products: Product[]): CatalogueCard[] {
  const byModel = new Map<string, Product[]>()
  for (const p of products) {
    const code = stripCctSuffix(p.sku)
    if (!byModel.has(code)) byModel.set(code, [])
    byModel.get(code)!.push(p)
  }
  return [...byModel.entries()]
    .map(([code, variants]) => {
      // neutral-white variant is the canonical face of a model
      const rep = variants.find((v) => /-NW$/i.test(v.sku)) ?? variants[0]
      const ccts = uniq(variants.map((v) => (v.cct_k != null ? String(v.cct_k) : undefined)))
        .map(Number)
        .sort((a, b) => a - b)
      const facets: Record<string, string[]> = {
        size: uniq(variants.map((v) => sizeBand(v.length_mm))),
        ledconfig: ledConfigFromSkus(variants.map((v) => v.sku)),
        brightness: uniq(variants.map((v) => brightnessBand(v.brightness_lm))),
        cct: ccts.map(String),
      }
      const card = skuCard(family, rep, {
        desc: catalogueSeriesMeta(family.slug, rep.series)?.blurb ?? (rep.series ? SERIES_BLURBS[rep.series] : undefined) ?? '',
        facts: signageFacts(rep, ccts),
        facets,
        section: seriesSectionTitle(family.slug, [rep]),
      })
      return {
        card: {
          ...card,
          key: `${family.slug}:${code}`,
          sku: code, // model code, never a CCT-suffixed variant
          // detail pages live at the model grain too (user 2026-07-09)
          href: `/products/${family.slug}/${encodeURIComponent(code)}`,
          name: rep.name.replace(/\s*[,·]?\s*\d{4}\s*K\b/i, '').trim(), // CCT is an option, not identity
          modelCount: variants.length,
        },
        seriesOrder: signageSeriesOrder(rep.series),
        beads: beadsFromModelCode(code),
      }
    })
    // old-menu series order, then 单颗到多颗 within a series (SKU breaks ties:
    // RGB before RGBW)
    .sort(
      (a, b) =>
        (a.seriesOrder - b.seriesOrder) ||
        (a.beads - b.beads) ||
        a.card.name.localeCompare(b.card.name) ||
        (a.card.sku ?? '').localeCompare(b.card.sku ?? ''),
    )
    .map((e) => e.card)
}

/** Pick the card set + layout for a family's category page.
 *  Every family → per-SKU product cards (signage joined 2026-07-08). */
export function buildProductCardsFor(
  slug: string,
  family: ProductFamily,
  products: Product[],
): { cards: CatalogueCard[]; layout: 'rows' | 'productGrid'; resultKind: 'series' | 'products' } {
  switch (slug) {
    case 'control-gear':
      return { cards: buildControlGearProductCards(family, products), layout: 'productGrid', resultKind: 'products' }
    case 'led-drivers':
      return { cards: buildDriverProductCards(family, products), layout: 'productGrid', resultKind: 'products' }
    case 'accessories':
      return { cards: buildAccessoryProductCards(family, products), layout: 'productGrid', resultKind: 'products' }
    default: // led-signage-modules
      return { cards: buildSignageProductCards(family, products), layout: 'productGrid', resultKind: 'products' }
  }
}

function accessoryFacts(p: Product): string[] {
  const d = formatDims(p.length_mm, p.width_mm, p.height_mm)
  const facts: (string | undefined)[] = [
    p.material ?? undefined,
    d ? d.mm : undefined,
    waterproofLabel(p.waterproof),
  ]
  return [...new Set(facts.filter((x): x is string => !!x))].slice(0, 3)
}

/** Build one visible catalogue card per accessory SKU — individually purchasable
 * items with no filter facets (buildGroups returns [] for this family). */
export function buildAccessoryProductCards(family: ProductFamily, products: Product[]): CatalogueCard[] {
  return products
    .map((p) =>
      skuCard(family, p, {
        desc: p.short_description ?? '',
        facts: accessoryFacts(p),
        facets: {}, // accessories: no filter facets (buildGroups returns [] for this family)
        section: seriesSectionTitle(family.slug, [p]),
      }),
    )
    .sort((a, b) => a.name.localeCompare(b.name))
}

function group(
  key: string,
  label: string,
  cards: CatalogueCard[],
  labelFor: (v: string) => string,
  orderOf: (v: string) => number,
): FacetGroup | null {
  const counts = new Map<string, number>()
  for (const c of cards) for (const v of new Set(c.facets[key] ?? [])) counts.set(v, (counts.get(v) ?? 0) + 1)
  if (counts.size < 2) return null
  const options = [...counts.entries()]
    .map(([value, count]) => ({ value, label: labelFor(value), count }))
    .sort((a, b) => orderOf(a.value) - orderOf(b.value))
  return { key, label, options }
}

/**
 * Facet groups computed from the visible cards (only facets with ≥2 values).
 * Each family gets the facet set that matches how its products are picked
 * (user-locked 2026-07-06): drivers by selection logic, control gear by
 * protocol, accessories by nothing, signage and the all-families view as
 * before. Driver facets must never leak onto other families.
 */
export function buildGroups(cards: CatalogueCard[], familySlug?: string): FacetGroup[] {
  // Series first (range-first picker) on the per-SKU family pages.
  // Values are display titles (labelFor = identity). Signage orders by the
  // old-menu category order (Mini→Eco→Pro→RGB→24V→Sidelit); other families
  // keep the cards' own order so the picker mirrors the grid.
  const CATEGORY_ORDERS: Record<string, string[]> = {
    'led-signage-modules': SIGNAGE_CATEGORY_ORDER,
    'control-gear': CONTROL_GEAR_CATEGORY_ORDER,
    'led-drivers': DRIVER_CATEGORY_ORDER,
  }
  // Drivers pick by connection/dimming TYPE and control gear by FUNCTION
  // type, so those group headings say "Type"; signage keeps "Series"
  // (Mini/Eco/Pro… genuinely are series).
  const seriesGroup = () => {
    const label = familySlug === 'led-drivers' || familySlug === 'control-gear' ? 'Type' : 'Series'
    const order = familySlug ? CATEGORY_ORDERS[familySlug] : undefined
    return order
      ? group('series', label, cards, (v) => v, (v) => {
          const i = order.indexOf(v)
          return i === -1 ? 999 : i
        })
      : group('series', label, cards, (v) => v, () => 0)
  }
  const candidates = (() => {
    switch (familySlug) {
      case 'led-drivers':
        return [
          seriesGroup(),
          group('inputv', 'Input voltage', cards, INPUTV.label, INPUTV.order),
          group('outv', 'Output voltage', cards, OUTV.label, OUTV.order),
          group('power', 'Power range', cards, POWER.label, POWER.order),
          group('dimming', 'Dimming', cards, DIMMING.label, DIMMING.order),
          group('formfactor', 'Form factor', cards, FORMFACTOR.label, FORMFACTOR.order),
          group('environment', 'Environment', cards, ENVIRONMENT.label, ENVIRONMENT.order),
          group('opmode', 'Operation mode', cards, OPMODE.label, OPMODE.order),
        ]
      case 'control-gear':
        return [
          seriesGroup(),
          group('protocol', 'Protocol', cards, PROTOCOL.label, PROTOCOL.order),
          group('function', 'Function', cards, FUNCTION.label, FUNCTION.order),
          group('controltype', 'Control type', cards, CONTROLTYPE.label, CONTROLTYPE.order),
          group('channels', 'Channels', cards, CHANNELS.label, CHANNELS.order),
        ]
      case 'accessories':
        return [seriesGroup()]
      case 'led-signage-modules':
        return [
          seriesGroup(),
          group('size', 'Size', cards, SIZE.label, SIZE.order),
          group('ledconfig', 'LED configuration', cards, LED.label, LED.order),
          group('brightness', 'Brightness', cards, BRIGHTNESS.label, BRIGHTNESS.order),
          group('cct', 'Colour temp (CCT)', cards, (v) => `${v} K`, (v) => Number(v)),
        ]
      default: {
        // /products (all families) — category picker first,
        // then the generic adaptive set. Family order follows the site nav.
        const FAMILY_ORDER = ['Signage Modules', 'LED Drivers', 'Control Gear', 'Accessories']
        return [
          group('family', 'Category', cards, (v) => v, (v) => {
            const i = FAMILY_ORDER.indexOf(v)
            return i < 0 ? 99 : i
          }),
          group('size', 'Size', cards, SIZE.label, SIZE.order),
          group('ledconfig', 'LED configuration', cards, LED.label, LED.order),
          group('brightness', 'Brightness', cards, BRIGHTNESS.label, BRIGHTNESS.order),
          group('cct', 'Colour temp (CCT)', cards, (v) => `${v} K`, (v) => Number(v)),
          group('voltage', 'Voltage', cards, VOLTAGE.label, VOLTAGE.order),
          group('opmode', 'Driver type', cards, OPMODE.label, OPMODE.order),
        ]
      }
    }
  })()
  return candidates.filter((g): g is FacetGroup => g !== null)
}
