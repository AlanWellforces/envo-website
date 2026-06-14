import type { Product } from './products'
import { resolveProductImage } from './products'
import { parseLedCount } from './product-selector'
import { SERIES_EDITORIAL } from '@/data/series-editorial.generated'

export type SeriesModel = {
  code: string                 // suffix-less model code, e.g. EV-BLUF02LBY
  leds: string                 // Single | Double | Triple | Quad | —
  powerW: number | null
  lumens: number | null
  dimsMm: string | null
  image: { src: string; isLocal: boolean; alt: string }
  datasheetUrl: string | null
}

const stripCct = (sku: string) => sku.replace(/-(WW|NW|CW)$/i, '')
const num = (n: unknown): number | null =>
  typeof n === 'number' && !Number.isNaN(n) ? n : null

/** Collapse CCT variants into suffix-less models, sorted by ascending power. */
export function groupSeriesModels(products: Product[]): SeriesModel[] {
  const byCode = new Map<string, Product[]>()
  for (const prod of products) {
    const code = stripCct(prod.sku)
    const list = byCode.get(code) ?? []
    list.push(prod)
    byCode.set(code, list)
  }
  const rows: SeriesModel[] = []
  for (const [code, skus] of byCode) {
    const rep = skus[0]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productName: string | null = (rep as any).productName ?? null
    const labelSource: string = productName ?? rep.name
    const lwh = [num(rep.length_mm), num(rep.width_mm), num(rep.height_mm)]
    rows.push({
      code,
      leds: parseLedCount(labelSource) ?? '—',
      powerW: num(rep.power_w),
      lumens: num(rep.brightness_lm),
      dimsMm: lwh.every((x) => x != null) ? lwh.join(' × ') : null,
      image: resolveProductImage(rep, ''),
      datasheetUrl: rep.spec_sheet_url ?? null,
    })
  }
  return rows.sort((a, b) => (a.powerW ?? 0) - (b.powerW ?? 0))
}

// ─── Spec assemblers ────────────────────────────────────────────────────────

export type SeriesSpecs = {
  beamDeg: number | null
  ip: string | null
  voltsDc: number | null
  lifetimeHrs: number | null
  cctOptions: string[]
  certs: string[]
}

export type Feature = { title: string; note: string }

export function buildStats(specs: SeriesSpecs, maxLm: number | null): { value: string; label: string }[] {
  return [
    maxLm ? { value: `${maxLm} lm`, label: 'max / module' } : null,
    specs.beamDeg ? { value: `${specs.beamDeg}°`, label: 'beam angle' } : null,
    specs.ip ? { value: specs.ip, label: 'ingress' } : null,
    specs.cctOptions.length ? { value: `${specs.cctOptions.length} CCT`, label: 'colour temps' } : null,
  ].filter(Boolean) as { value: string; label: string }[]
}

export function buildFeatures(strengths: Feature[], specs: SeriesSpecs, modelCount: number): Feature[] {
  const auto: Feature[] = [
    specs.voltsDc ? { title: `${specs.voltsDc} V DC`, note: `${modelCount} models, one platform.` } : null,
    specs.lifetimeHrs ? { title: `${specs.lifetimeHrs.toLocaleString()} h`, note: 'Rated lifetime.' } : null,
    specs.certs.length ? { title: `${specs.certs.length} marks`, note: specs.certs.slice(0, 6).join(' · ') } : null,
  ].filter(Boolean) as Feature[]
  return [...strengths, ...auto].slice(0, 6)
}

// ─── Series template props assembler ────────────────────────────────────────

const CERT_NAME: Record<string, string> = {
  c_ul: 'UL', c_cul: 'cUL', c_ce: 'CE', c_tuv: 'TÜV', c_rohs: 'RoHS',
  c_cb: 'CB', c_bis: 'BIS', c_ccc: 'CCC', c_fcc: 'FCC', c_fc: 'FCC', c_selv: 'SELV', c_lm80: 'LM-80',
}
const uniq = <T,>(a: T[]) => [...new Set(a)]

export type SeriesTemplateProps = {
  label: string
  headline: string
  lede: string
  stats: { value: string; label: string }[]
  features: Feature[]
  solutions: { title: string; pick: string }[]
  models: SeriesModel[]
  specs: SeriesSpecs
  heroImage: { src: string; isLocal: boolean; alt: string }
  aiDraft: boolean
}

/** Returns null if the series has no editorial — caller falls back to generic. */
export async function getSeriesTemplateProps(
  series: string,
  products: Product[],
): Promise<SeriesTemplateProps | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const copy = (SERIES_EDITORIAL as Record<string, any>)[series]
  if (!copy || !products.length) return null

  const models = groupSeriesModels(products)
  const beam = products.map((d) => num(d.beam_angle_deg)).find(Boolean) ?? null
  const ipField = products.map((d) => d.waterproof).find((w) => w && /^ip\d+$/i.test(w))
  const ipSub = products.map((d) => d.subtitle?.match(/IP\s?(\d{2})/i)?.[1]).find(Boolean)
  const ip = ipField ? ipField.toUpperCase() : ipSub ? `IP${ipSub}` : null
  const volts = products
    .map((d) => num(d.input_voltage_min_v) ?? num(d.output_voltage_v) ?? (Number(d.subtitle?.match(/(\d+)\s*V\b/i)?.[1]) || null))
    .find(Boolean) ?? null
  const cctOptions = uniq(
    products.map((d) => ({ c: d.sku.match(/-(WW|NW|CW)$/i)?.[1], k: num(d.cct_k) }))
      .filter((x) => x.c && x.k).map((x) => `${x.c}=${x.k}K`),
  )
  const certs = uniq(products.flatMap((d) => d.standards_met ?? []))
    .map((c) => CERT_NAME[c] ?? c)
  const lifetimeHrs = products.map((d) => num(d.lifetime_hrs)).find(Boolean) ?? null
  const maxLm = Math.max(0, ...products.map((d) => num(d.brightness_lm) ?? 0)) || null

  const specs: SeriesSpecs = { beamDeg: beam, ip, voltsDc: volts, lifetimeHrs, cctOptions, certs }
  return {
    label: copy.label,
    headline: copy.headline,
    lede: copy.lede,
    stats: buildStats(specs, maxLm),
    features: buildFeatures(copy.strengths, specs, models.length),
    solutions: copy.solutions,
    models,
    specs,
    heroImage: models[0]?.image ?? { src: '', isLocal: true, alt: copy.label },
    aiDraft: !!copy.aiDraft,
  }
}
