// Shared builders for the unified Product catalogue (/products = All families,
// /products/[slug] = one family). Server-only (pulls live products via Payload).
import type { ProductFamily, SeriesLink } from '@/data/product-families'
import {
  resolveProductImage,
  groupProductsBySeries,
  groupSeriesIntoSections,
  type Product,
} from '@/lib/products'
import { seriesSlug, seriesLabel, seriesLineArt } from '@/data/family-map'
import { SERIES_BLURBS, LED_CONFIG_OPTIONS } from '@/data/series-applications'

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
  modelCount: number
  /** Max LED bead count in the series (from compareSpec.ledConfig) — drives the
   *  little dot indicator on the row. Undefined when not a bead-count series. */
  beads?: number
  certified: boolean
  /** facet key -> values this card carries */
  facets: Record<string, string[]>
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
      cards.push({
        key: `${family.slug}:${g.code ?? 'other'}`,
        href: `/products/${family.slug}/${seriesSlug(g.code)}`,
        familyLabel,
        name: meta?.productName ?? seriesLabel(g.code),
        desc:
          (g.code ? SERIES_BLURBS[g.code] : undefined) ??
          meta?.shortDesc ??
          `${g.products.length} models in the ${seriesLabel(g.code)} range.`,
        imgSrc: img.src,
        imgLocal: img.isLocal,
        imgAlt: img.alt,
        badge: spec ? `${spec.ipRating} · ${spec.voltage}` : undefined,
        chips: spec ? [spec.ipRating, spec.voltage, spec.beam].filter(Boolean) : [],
        modelCount: g.products.length,
        beads: beadsFromLedConfig(spec?.ledConfig),
        certified: certs.length > 0,
        facets: {
          size: uniq(g.products.map((p) => sizeBand(p.length_mm))),
          ledconfig: ledConfigFromSkus(g.products.map((p) => p.sku)),
          brightness: uniq(g.products.map((p) => brightnessBand(p.brightness_lm))),
          cct: ccts,
          voltage: uniq(g.products.map((p) => voltageBand(p.output_voltage_v))),
          opmode: uniq(g.products.flatMap((p) => opmodeValues(p.operation_mode))),
        },
      })
    }
  }
  return cards
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

/** Facet groups computed from the visible cards (only facets with ≥2 values). */
export function buildGroups(cards: CatalogueCard[]): FacetGroup[] {
  return [
    group('size', 'Size', cards, SIZE.label, SIZE.order),
    group('ledconfig', 'LED configuration', cards, LED.label, LED.order),
    group('brightness', 'Brightness', cards, BRIGHTNESS.label, BRIGHTNESS.order),
    group('cct', 'Colour temp (CCT)', cards, (v) => `${v} K`, (v) => Number(v)),
    group('voltage', 'Voltage', cards, VOLTAGE.label, VOLTAGE.order),
    group('opmode', 'Driver type', cards, OPMODE.label, OPMODE.order),
  ].filter((g): g is FacetGroup => g !== null)
}
