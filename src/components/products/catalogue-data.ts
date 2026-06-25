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
import { SERIES_APPLICATIONS, APPLICATION_OPTIONS, SERIES_BLURBS, LED_CONFIG_OPTIONS } from '@/data/series-applications'
import { CERT_OPTIONS } from '@/lib/cert-codes'

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

const CERT_LABEL = new Map<string, string>(CERT_OPTIONS.map((o) => [o.value, o.label]))
const APP_LABEL = new Map<string, string>(APPLICATION_OPTIONS.map((o) => [o.value, o.label]))
const APP_ORDER = new Map<string, number>(APPLICATION_OPTIONS.map((o, i) => [o.value, i]))
const CERT_ORDER = new Map<string, number>(CERT_OPTIONS.map((o, i) => [o.value, i]))
const LED_LABEL = new Map<string, string>(LED_CONFIG_OPTIONS.map((o) => [o.value, o.label]))
const LED_ORDER = new Map<string, number>(LED_CONFIG_OPTIONS.map((o, i) => [o.value, i]))

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
          application: g.code ? SERIES_APPLICATIONS[g.code] ?? [] : [],
          ledconfig: ledConfigFromSkus(g.products.map((p) => p.sku)),
          cct: ccts,
          cert: certs,
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
    group('application', 'Application', cards, (v) => APP_LABEL.get(v) ?? v, (v) => APP_ORDER.get(v) ?? 99),
    group('ledconfig', 'LED configuration', cards, (v) => LED_LABEL.get(v) ?? v, (v) => LED_ORDER.get(v) ?? 99),
    group('cct', 'Colour temp (CCT)', cards, (v) => `${v} K`, (v) => Number(v)),
    group('cert', 'Certification', cards, (v) => CERT_LABEL.get(v) ?? v, (v) => CERT_ORDER.get(v) ?? 99),
  ].filter((g): g is FacetGroup => g !== null)
}
