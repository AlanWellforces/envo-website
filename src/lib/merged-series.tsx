// Generic assembler: any series' live products -> MergedSeriesProps.
// Reuses groupSeriesModels (CCT variants -> suffix-less model columns) and the
// same spec derivation as the editorial template. Strategy A (data-driven):
// every row/section is emitted only when real data exists — nothing fabricated.
import type { Product } from './products'
import { groupSeriesModels } from './series-template'
import { SERIES_EDITORIAL } from '@/data/series-editorial.generated'
import { SERIES_BLURBS } from '@/data/series-applications'
import { catalogueSeriesMeta } from '@/data/series-catalogue-meta'
import { seriesLabel, seriesLineArt } from '@/data/family-map'
import type { ProductFamily } from '@/data/product-families'
import type { MergedSeriesProps, MergedVariant, MergedSharedRow, MergedKeySpec } from '@/components/products/merged/MergedSeriesPage'

// >6 variant columns is unreadable as a compare table (e.g. the 33-model
// sc_envo driver catalogue) — those render variants as rows instead.
const COLUMN_CAP = 6

const CERT_NAME: Record<string, string> = {
  c_ul: 'UL', c_cul: 'cUL', c_ce: 'CE', c_tuv: 'TÜV', c_rohs: 'RoHS',
  c_cb: 'CB', c_bis: 'BIS', c_ccc: 'CCC', c_fcc: 'FCC', c_fc: 'FCC', c_selv: 'SELV', c_lm80: 'LM-80',
  c_saa: 'SAA', c_rcm: 'RCM',
}

// Akeneo carries a mains input range in input_voltage_min/max_v (drivers,
// dimmers) and the SELV supply rail in output_voltage_v (modules). In this
// catalogue a ≥90 V minimum is always a mains AC input; below that it's a DC
// rail — there is no AC/DC flag in the PIM to read instead.
function inputVoltageDisplay(p: Product): string | null {
  const min = num(p.input_voltage_min_v)
  const max = num(p.input_voltage_max_v)
  if (min != null) {
    const unit = min >= 90 ? 'V AC' : 'V DC'
    return max != null && max !== min ? `${min}–${max} ${unit}` : `${min} ${unit}`
  }
  const out = num(p.output_voltage_v)
  return out != null ? `${out} V DC` : null
}
const LED_BEADS: Record<string, number> = { Single: 1, Double: 2, Triple: 3, Quad: 4, Penta: 5 }

const num = (n: unknown): number | null => (typeof n === 'number' && !Number.isNaN(n) ? n : null)
const uniq = <T,>(a: T[]) => [...new Set(a)]

// Per-model dimming for the driver spec table. From dimming_control plus the
// product NAME (the PIM leaves the field empty on SP's triac models and KVS's
// non-dimmable one). Never derived from series labels — sr_triac is DALI.
const DIMMING_LABEL: Record<string, string> = {
  triac: 'Triac', dali: 'DALI', pwm: 'PWM', '0_10v': '0–10 V', none: 'Non-dimmable',
}
const DIMMING_ORDER = ['triac', 'dali', 'pwm', '0_10v', 'none']
function dimmingValuesOf(p: Product): string[] {
  const vals = new Set((p.dimming_control ?? []).filter((d) => DIMMING_LABEL[d]))
  if (/triac[- ]?dim/i.test(p.name)) vals.add('triac')
  if (/non[- ]?dimmable/i.test(p.name)) vals.add('none')
  if (vals.size > 1) vals.delete('none')
  return [...vals].sort((a, b) => DIMMING_ORDER.indexOf(a) - DIMMING_ORDER.indexOf(b))
}
function dimmingDisplay(p: Product): string | undefined {
  const vals = dimmingValuesOf(p)
  return vals.length ? vals.map((v) => DIMMING_LABEL[v]).join(' · ') : undefined
}

function ipDisplay(p: Product): string | undefined {
  return p.waterproof && /^ip\d+$/i.test(p.waterproof) ? p.waterproof.toUpperCase() : undefined
}

// Protection features, from each model's own Akeneo copy (there is no
// structured attribute). The shared row shows the INTERSECTION across models
// that mention any protection — never a union, so nothing is over-claimed.
const PROTECTION_TERMS: [RegExp, string][] = [
  [/short[- ]?circuit/i, 'Short-circuit'],
  [/open[- ]?circuit/i, 'Open-circuit'],
  [/over[- ]?load/i, 'Overload'],
  [/over[- ]?voltage/i, 'Over-voltage'],
  [/over[- ]?temp|over[- ]?heat/i, 'Over-temperature'],
]
function protectionsOf(p: Product): string[] {
  const text = `${p.description ?? ''} ${p.short_description ?? ''}`
  return PROTECTION_TERMS.filter(([re]) => re.test(text)).map(([, label]) => label)
}
function sharedProtections(products: Product[]): string | null {
  const sets = products.map(protectionsOf).filter((s) => s.length > 0)
  if (!sets.length) return null
  const common = sets.reduce((a, b) => a.filter((x) => b.includes(x)))
  return common.length ? common.join(' · ') : null
}

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
  const isDriversFamily = family.slug === 'led-drivers'
  const modes = uniq(products.map((p) => p.operation_mode).filter(Boolean))
  const authored = catalogueSeriesMeta(family.slug, series)

  // Driver page titles must say WHAT the power supply is, not just the series
  // code ("SL Linear Driver", never a bare "SL"). Authored customer-facing
  // name first; unauthored series get a type-bearing fallback from their
  // operation mode. The authored blurb doubles as the hero subtitle.
  const modeWord =
    modes.length === 1 && modes[0] === 'cv' ? 'Constant-Voltage'
    : modes.length === 1 && modes[0] === 'cc' ? 'Constant-Current'
    : null
  const title = isDriversFamily
    ? authored?.title ?? `${label}${modeWord ? ` ${modeWord}` : ''} LED Drivers`
    : label
  const heroSubtitle = isDriversFamily
    ? authored?.blurb ?? (modeWord ? `${modeWord.replace('-', ' ').toLowerCase()} LED drivers` : undefined)
    : undefined

  // Column name = the LED count when it actually distinguishes the variants
  // (Single/Double/Triple). When counts collide — e.g. ChromaFlux's two "Triple
  // LED" models that really differ by RGB vs RGBW — label by chip colour instead
  // of repeating "Triple". Falls back to the model code (drivers, etc.).
  const stripCct = (sku: string) => sku.replace(/-(WW|NW|CW)$/i, '')
  const repByCode = new Map<string, Product>()
  for (const p of products) if (!repByCode.has(stripCct(p.sku))) repByCode.set(stripCct(p.sku), p)
  const ledsList = models.map((m) => m.leds)
  const ledsDistinguish = !ledsList.includes('—') && new Set(ledsList).size === ledsList.length

  // One shared "Input voltage" row when every model agrees; per-variant cells
  // when ranges differ across the series (e.g. 90–132 V vs 100–240 V drivers).
  const voltageByCode = new Map(
    models.map((m) => {
      const rep = repByCode.get(m.code)
      return [m.code, rep ? inputVoltageDisplay(rep) : null] as const
    }),
  )
  const voltageValues = uniq([...voltageByCode.values()].filter((v): v is string => v != null))
  // Drivers ALWAYS show input voltage per model (user-locked table columns);
  // other families keep the shared-row-when-uniform behaviour.
  const isDrivers = family.slug === 'led-drivers'
  const sharedVoltage = !isDrivers && voltageValues.length === 1 ? voltageValues[0] : null

  const variants: MergedVariant[] = models.map((m) => {
    const beads = LED_BEADS[m.leds]
    const rep = repByCode.get(m.code)
    const colour = rep?.led_chip_colour
    const name = ledsDistinguish && m.leds !== '—' ? m.leds : colour ? colour.toUpperCase() : m.code
    return {
      name,
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
      inputVoltage: sharedVoltage ? undefined : (voltageByCode.get(m.code) ?? undefined),
      // Driver selection columns: Output V / Rated A / Dimming / IP / Dimensions.
      // The same physical size renders as "Module size" on signage pages and
      // "Dimensions" on driver pages — hence two keys for one value.
      ...(isDrivers
        ? {
            outputVoltage: rep?.output_voltage_v != null ? `${rep.output_voltage_v} V DC` : undefined,
            ratedCurrent: rep?.rated_current_a != null ? `${rep.rated_current_a} A` : undefined,
            dimming: rep ? dimmingDisplay(rep) : undefined,
            ip: rep ? ipDisplay(rep) : undefined,
            dimensions: m.dimsMm ? `${m.dimsMm} mm` : undefined,
          }
        : { size: m.dimsMm ? `${m.dimsMm} mm` : undefined }),
    }
  })

  // Square per-model thumbs under the stage, labelled by model code, so
  // variants are tellable apart (user markup 2026-07-06). Only for compare-
  // column series: single models would duplicate the stage image, and
  // many-model (rows) catalogues would produce an absurd strip.
  const thumbs =
    variants.length > 1 && variants.length <= COLUMN_CAP
      ? variants.map((v) => ({
          src: v.image.src,
          local: v.image.local,
          alt: v.image.alt,
          label: v.modelCode,
        }))
      : undefined

  // ── shared rows (only those with real data) ──
  const sharedRows: MergedSharedRow[] = []
  const ccts = uniq(products.map((p) => num(p.cct_k)).filter((k): k is number => k != null)).sort((a, b) => a - b)
  if (ccts.length) sharedRows.push({ label: 'Colour temperature', value: ccts.map((k) => `${k} K`).join(' · ') })

  if (sharedVoltage) sharedRows.push({ label: 'Input voltage', value: sharedVoltage })

  const beam = products.map((p) => num(p.beam_angle_deg)).find(Boolean) ?? null
  if (beam) sharedRows.push({ label: 'Beam angle', value: `${beam}°` })

  const efficacy = products.map((p) => num(p.efficacy_lm_w)).find(Boolean) ?? null
  if (efficacy) sharedRows.push({ label: 'Efficacy', value: `~ ${efficacy} lm / W` })

  // Drivers carry IP in the per-model column instead of a shared row.
  const ipField = products.map((p) => p.waterproof).find((w) => w && /^ip\d+$/i.test(w))
  if (ipField && !isDrivers) sharedRows.push({ label: 'Ingress protection', value: ipField.toUpperCase() })

  const lifetime = products.map((p) => num(p.lifetime_hrs)).find(Boolean) ?? null
  if (lifetime) sharedRows.push({ label: 'Lifetime', value: `${lifetime.toLocaleString()} h` })

  if (modes.length === 1 && modes[0] !== 'cv_cc') {
    sharedRows.push({
      label: 'Operation mode',
      value: modes[0] === 'cv' ? 'Constant voltage (CV)' : 'Constant current (CC)',
    })
  } else if (modes.length > 1 || modes[0] === 'cv_cc') {
    sharedRows.push({ label: 'Operation mode', value: 'CV & CC — varies by model' })
  }

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

  const protections = sharedProtections(products)
  if (protections) sharedRows.push({ label: 'Protections', value: protections })

  const warranties = uniq(products.map((p) => num(p.warranty_years)).filter((w): w is number => w != null))
  if (warranties.length === 1)
    sharedRows.push({ label: 'Warranty', value: `${warranties[0]} year${warranties[0] === 1 ? '' : 's'}` })

  // ── hero key specs (reference layout 2026-07-06): the ≤6 identity facts of
  // the series, icon-gridded next to the product image. Derived from the same
  // primitives as the table — a spec with no data is omitted, never invented.
  const keySpecs: MergedKeySpec[] = []
  const key = (icon: MergedKeySpec['icon'], specLabel: string, value: string | null | undefined) => {
    if (value) keySpecs.push({ icon, label: specLabel, value })
  }
  const powers = products.map((p) => num(p.power_w)).filter((w): w is number => w != null)
  const powerRange = powers.length
    ? Math.min(...powers) === Math.max(...powers)
      ? `${powers[0]} W`
      : `${Math.min(...powers)}–${Math.max(...powers)} W`
    : null
  if (isDrivers) {
    key('power', 'Power range', powerRange)
    const outs = uniq(products.map((p) => num(p.output_voltage_v)).filter((v): v is number => v != null)).sort((a, b) => a - b)
    key('voltage', 'Output voltage', outs.length ? `${outs.join(' / ')} V DC` : null)
    const inMins = products.map((p) => num(p.input_voltage_min_v)).filter((v): v is number => v != null)
    const inMaxes = products.map((p) => num(p.input_voltage_max_v)).filter((v): v is number => v != null)
    if (inMins.length) {
      const lo = Math.min(...inMins)
      const hi = inMaxes.length ? Math.max(...inMaxes) : null
      const unit = lo >= 90 ? 'V AC' : 'V DC'
      key('input', 'Input voltage', hi && hi !== lo ? `${lo}–${hi} ${unit}` : `${lo} ${unit}`)
    }
    key(
      'mode', 'Operation mode',
      modes.length === 1 && modes[0] !== 'cv_cc'
        ? modes[0] === 'cv' ? 'Constant voltage' : 'Constant current'
        : modes.length ? 'CV / CC' : null,
    )
    const dims = uniq(products.flatMap(dimmingValuesOf))
    const realDims = dims.filter((d) => d !== 'none')
    key(
      'dimming', 'Dimming',
      realDims.length
        ? realDims.sort((a, b) => DIMMING_ORDER.indexOf(a) - DIMMING_ORDER.indexOf(b)).map((d) => DIMMING_LABEL[d]).join(' / ')
        : dims.includes('none') ? 'Non-dimmable' : null,
    )
    const ips = uniq(products.map(ipDisplay).filter((v): v is string => !!v)).sort()
    key('ip', 'IP rating', ips.length ? ips.join(' / ') : null)
  } else if (family.slug === 'led-signage-modules') {
    key('voltage', 'Voltage', sharedVoltage)
    key('cct', 'Colour temp', ccts.length ? `${ccts.join(' / ')} K` : null)
    key('beam', 'Beam angle', beam ? `${beam}°` : null)
    key('ip', 'IP rating', ipField ? ipField.toUpperCase() : null)
    key('efficacy', 'Efficacy', efficacy ? `~ ${efficacy} lm/W` : null)
    key('lifetime', 'Lifetime', lifetime ? `${lifetime.toLocaleString()} h` : null)
  } else {
    // control gear / accessories — whatever identity facts the data carries
    key('input', 'Input voltage', sharedVoltage)
    const protoDims = uniq(products.flatMap(dimmingValuesOf)).filter((d) => d !== 'none')
    key('dimming', 'Protocol', protoDims.length ? protoDims.map((d) => DIMMING_LABEL[d]).join(' / ') : null)
    key('power', 'Power range', powerRange)
    key('ip', 'IP rating', ipField ? ipField.toUpperCase() : null)
    key('lifetime', 'Lifetime', lifetime ? `${lifetime.toLocaleString()} h` : null)
  }

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
    authored?.blurb ??
    SERIES_BLURBS[series] ??
    rep?.short_description?.trim() ??
    rep?.subtitle?.trim() ??
    `${models.length} model${models.length === 1 ? '' : 's'} in the ${label} range.`

  return {
    breadcrumb: { familyName: family.name, familyHref: family.href, seriesLabel: label },
    eyebrow: family.tag,
    title,
    heroSubtitle,
    intro,
    checklist: checklist?.length ? checklist : undefined,
    keySpecs: keySpecs.slice(0, 6),
    datasheetUrl,
    thumbs,
    variants,
    variantLayout: variants.length > COLUMN_CAP ? 'rows' : 'columns',
    sharedRows,
    solutions: copy?.solutions,
    downloads: datasheetUrl ? [{ name: `${label} datasheet`, meta: 'PDF', href: datasheetUrl }] : [],
  }
}
