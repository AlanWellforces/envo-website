// Generic assembler: any series' live products -> MergedSeriesProps.
// Reuses groupSeriesModels (CCT variants -> suffix-less model columns) and the
// same spec derivation as the editorial template. Strategy A (data-driven):
// every row/section is emitted only when real data exists — nothing fabricated.
import type { Product } from './products'
import { groupSeriesModels } from './series-template'
import { SERIES_EDITORIAL } from '@/data/series-editorial.generated'
import { SERIES_BLURBS } from '@/data/series-applications'
import { seriesLabel, seriesLineArt } from '@/data/family-map'
import type { ProductFamily } from '@/data/product-families'
import type { MergedSeriesProps, MergedVariant, MergedSharedRow } from '@/components/products/merged/MergedSeriesPage'

// >6 variant columns is unreadable as a compare table (e.g. the 33-model
// sc_envo driver catalogue) — those render variants as rows instead.
const COLUMN_CAP = 6

const CERT_NAME: Record<string, string> = {
  c_ul: 'UL', c_cul: 'cUL', c_ce: 'CE', c_tuv: 'TÜV', c_rohs: 'RoHS',
  c_cb: 'CB', c_bis: 'BIS', c_ccc: 'CCC', c_fcc: 'FCC', c_fc: 'FCC', c_selv: 'SELV', c_lm80: 'LM-80',
}
const LED_BEADS: Record<string, number> = { Single: 1, Double: 2, Triple: 3, Quad: 4, Penta: 5 }

const num = (n: unknown): number | null => (typeof n === 'number' && !Number.isNaN(n) ? n : null)
const uniq = <T,>(a: T[]) => [...new Set(a)]

export function buildMergedSeriesProps(
  family: ProductFamily,
  series: string,
  products: Product[],
): MergedSeriesProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const copy = (SERIES_EDITORIAL as Record<string, any>)[series]
  const models = groupSeriesModels(products)
  const label = copy?.label ?? seriesLabel(series)
  const lineArt = seriesLineArt(series, family.slug)

  const variants: MergedVariant[] = models.map((m) => {
    const beads = LED_BEADS[m.leds]
    return {
      name: m.leds !== '—' ? m.leds : m.code,
      beads,
      image: {
        src: m.image.src || lineArt,
        local: m.image.src ? m.image.isLocal : true,
        alt: m.image.alt || m.code,
      },
      modelCode: m.code,
      ledBeads: beads ? String(beads) : undefined,
      output: m.lumens ? `~ ${m.lumens} lm` : undefined,
      power: m.powerW != null ? `${m.powerW} W` : undefined,
      size: m.dimsMm ? `${m.dimsMm} mm` : undefined,
    }
  })

  // ── shared rows (only those with real data) ──
  const sharedRows: MergedSharedRow[] = []
  const ccts = uniq(products.map((p) => num(p.cct_k)).filter((k): k is number => k != null)).sort((a, b) => a - b)
  if (ccts.length) sharedRows.push({ label: 'Colour temperature', value: ccts.map((k) => `${k} K`).join(' · ') })

  const volts = products.map((p) => num(p.input_voltage_min_v) ?? num(p.output_voltage_v)).find(Boolean) ?? null
  if (volts) sharedRows.push({ label: 'Input voltage', value: `${volts} V DC` })

  const beam = products.map((p) => num(p.beam_angle_deg)).find(Boolean) ?? null
  if (beam) sharedRows.push({ label: 'Beam angle', value: `${beam}°` })

  const efficacy = products.map((p) => num(p.efficacy_lm_w)).find(Boolean) ?? null
  if (efficacy) sharedRows.push({ label: 'Efficacy', value: `~ ${efficacy} lm / W` })

  const ipField = products.map((p) => p.waterproof).find((w) => w && /^ip\d+$/i.test(w))
  if (ipField) sharedRows.push({ label: 'Ingress protection', value: ipField.toUpperCase() })

  const lifetime = products.map((p) => num(p.lifetime_hrs)).find(Boolean) ?? null
  if (lifetime) sharedRows.push({ label: 'Lifetime', value: `${lifetime.toLocaleString()} h` })

  const certs = uniq(products.flatMap((p) => p.standards_met ?? [])).map((c) => CERT_NAME[c] ?? c)
  if (certs.length)
    sharedRows.push({
      label: 'Certifications',
      value: (
        <span className="certs">
          {certs.map((c) => (
            <span key={c} className="c">
              {c}
            </span>
          ))}
        </span>
      ),
    })

  const datasheetUrl = models.find((m) => m.datasheetUrl)?.datasheetUrl ?? undefined
  const checklist: string[] | undefined = copy?.strengths
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ?.map((s: any) => (s.note ? `${s.title} — ${s.note}` : s.title))
    .slice(0, 5)

  // Intro falls back to the product's own Akeneo copy (short_description /
  // subtitle) before the generic count — fills driver/accessory series that
  // have no editorial. Richer per-series copy still needs authoring in admin.
  const rep = products[0]
  const intro =
    copy?.lede ??
    SERIES_BLURBS[series] ??
    rep?.short_description?.trim() ??
    rep?.subtitle?.trim() ??
    `${models.length} model${models.length === 1 ? '' : 's'} in the ${label} range.`

  return {
    breadcrumb: { familyName: family.name, familyHref: family.href, seriesLabel: label },
    eyebrow: family.tag,
    title: label,
    intro,
    checklist: checklist?.length ? checklist : undefined,
    datasheetUrl,
    variants,
    variantLayout: variants.length > COLUMN_CAP ? 'rows' : 'columns',
    sharedRows,
    solutions: copy?.solutions,
    downloads: datasheetUrl ? [{ name: `${label} datasheet`, meta: 'PDF', href: datasheetUrl }] : [],
  }
}
