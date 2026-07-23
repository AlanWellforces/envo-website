// Generic assembler: any series' live products -> MergedSeriesProps.
// Reuses groupSeriesModels (CCT variants -> suffix-less model columns) and the
// same spec derivation as the editorial template. Strategy A (data-driven):
// every row/section is emitted only when real data exists — nothing fabricated.
import type { Product } from './products'
import { groupSeriesModels } from './series-template'
import { SERIES_EDITORIAL } from '@/data/series-editorial.generated'
import { SERIES_BLURBS } from '@/data/series-applications'
import { catalogueSeriesMeta } from '@/data/series-catalogue-meta'
import { seriesPurchaseLinks } from '@/data/distributors'
import { seriesLabel, seriesLineArt } from '@/data/family-map'
import { formatDims, mmToIn } from './units'
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
// Keys are parseLedCount outputs — it emits "Duo" (MiniLux/ProGlo names), not
// just "Double" (EcoGlo/OptiLume/UltraFlare); missing either blanks the
// LED-beads cell for that half of the catalogue.
const LED_BEADS: Record<string, number> = { Single: 1, Duo: 2, Double: 2, Triple: 3, Quad: 4, Penta: 5 }

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

// Dual-unit dimensions — metric primary, US imperial in parens (brand rule),
// so both 国标 (mm) and 美标 (in) always show. Null-safe.
function dualDims(p: Product | undefined): string | undefined {
  const d = formatDims(p?.length_mm, p?.width_mm, p?.height_mm)
  return d ? `${d.mm} (${d.in})` : undefined
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
  opts?: { maxKeySpecs?: number },
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
  // Every family gets a one-line subtitle carrying the series' character
  // (user 2026-07-06) — authored blurb first, signage one-liners next,
  // drivers fall back to their operation-mode wording.
  const heroSubtitle =
    authored?.blurb ??
    SERIES_BLURBS[series] ??
    (isDriversFamily && modeWord ? `${modeWord.replace('-', ' ').toLowerCase()} LED drivers` : undefined)

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
  // Rows-layout driver tables follow the sales guide's column set: Type
  // (operation mode) and Warranty repeat per model row instead of living in
  // the shared strip below.
  const isRowsLayout = models.length > COLUMN_CAP
  const columnisedShared = isDrivers && isRowsLayout

  const variants: MergedVariant[] = models.map((m) => {
    // LED beads are a signage-module fact. The word also matches control-gear
    // names ("Single Colour Remote" → 1), which put a meaningless LED-beads
    // column on remote/relay tables — hence the family guard.
    const beads = family.slug === 'led-signage-modules' ? LED_BEADS[m.leds] : undefined
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
      datasheetUrl: m.datasheetUrl ?? undefined,
      // Link the code to its own detail page in BOTH layouts; until 2026-07-17
      // only rows tables linked, which left the single-SKU sidelit series pages
      // (EdgeBlade/-Flare/-Lume) with zero crawlable links to their model pages.
      // 404 guard: exact SKU for spec-driven families; signage codes are
      // CCT-stripped, and the signage route resolves that same grain
      // (stripCctSuffix(sku) === code), so any code with a rep is a live page.
      href:
        rep && (rep.sku === m.code || family.slug === 'led-signage-modules')
          ? `/products/${family.slug}/${m.code}`
          : undefined,
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
            dimensions: dualDims(rep),
            ...(columnisedShared
              ? {
                  type:
                    rep?.operation_mode === 'cv' ? 'CV'
                    : rep?.operation_mode === 'cc' ? 'CC'
                    : rep?.operation_mode === 'cv_cc' ? 'CV & CC'
                    : undefined,
                  certifications: rep?.standards_met?.length
                    ? uniq(rep.standards_met.map((c) => CERT_NAME[c] ?? c)).join(' · ')
                    : undefined,
                  protections: rep ? protectionsOf(rep).join(' · ') || undefined : undefined,
                  warranty:
                    num(rep?.warranty_years) != null
                      ? `${rep!.warranty_years} year${rep!.warranty_years === 1 ? '' : 's'}`
                      : undefined,
                }
              : {}),
          }
        : { size: dualDims(rep) }),
    }
  })

  // Square per-model thumbs under the stage, labelled by model code, so
  // variants are tellable apart (user markup 2026-07-06). Only for compare-
  // column series: single models would duplicate the stage image, and
  // many-model (rows) catalogues would produce an absurd strip.
  // Gallery order (user 2026-07-06): the combined "All models" tile is
  // auto-prepended by SeriesGallery; here we add each product on its own,
  // then any scene/application photos the editorial carries, last.
  const sceneThumbs = (copy?.solutions ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((s: any) => s.image?.src)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((s: any) => ({ src: s.image.src, local: !!s.image.local, alt: s.image.alt ?? s.title, cover: true }))
  const thumbs =
    variants.length > 1 && variants.length <= COLUMN_CAP
      ? [
          ...variants.map((v) => ({
            src: v.image.src,
            local: v.image.local,
            alt: v.image.alt,
            label: v.modelCode,
          })),
          ...sceneThumbs,
        ]
      : undefined

  // ── shared rows (only those with real data) ──
  const sharedRows: MergedSharedRow[] = []
  const ccts = uniq(products.map((p) => num(p.cct_k)).filter((k): k is number => k != null)).sort((a, b) => a - b)
  if (ccts.length) sharedRows.push({ label: 'Colour temperature', value: ccts.map((k) => `${k} K`).join(' · ') })

  if (sharedVoltage) sharedRows.push({ label: 'Input voltage', value: sharedVoltage })

  const beam = products.map((p) => num(p.beam_angle_deg)).find(Boolean) ?? null
  if (beam) sharedRows.push({ label: 'Beam angle', value: `${beam}°` })

  // Efficacy genuinely differs per model AND per CCT (MiniLux: Single-NW
  // 120.83, Duo 114.58) — taking "whichever row the DB returned first" showed
  // a value that contradicted the same page's variant JSON-LD (external audit
  // 2026-07-21). Show the honest rounded span instead; whole numbers only —
  // the field is computed (lm ÷ W) and decimals read as false precision.
  const efficacies = products.map((p) => num(p.efficacy_lm_w)).filter((e): e is number => e != null)
  if (efficacies.length) {
    const lo = Math.round(Math.min(...efficacies))
    const hi = Math.round(Math.max(...efficacies))
    sharedRows.push({ label: 'Efficacy', value: lo === hi ? `~ ${lo} lm / W` : `~ ${lo}–${hi} lm / W` })
  }

  // Drivers carry IP in the per-model column instead of a shared row.
  const ipField = products.map((p) => p.waterproof).find((w) => w && /^ip\d+$/i.test(w))
  if (ipField && !isDrivers) sharedRows.push({ label: 'IP rating', value: ipField.toUpperCase() })

  const lifetime = products.map((p) => num(p.lifetime_hrs)).find(Boolean) ?? null
  if (lifetime) sharedRows.push({ label: 'Lifetime', value: `${lifetime.toLocaleString()} h` })

  // Skipped when the rows-layout driver table carries mode per row ("Type"),
  // and for control gear entirely — gateways/remotes/sensors carry a stray
  // operation_mode in the PIM data, and "Operation mode: Constant voltage"
  // on a gateway page is nonsense.
  if (!columnisedShared && family.slug !== 'control-gear') {
    if (modes.length === 1 && modes[0] !== 'cv_cc') {
      sharedRows.push({
        label: 'Operation mode',
        value: modes[0] === 'cv' ? 'Constant voltage (CV)' : 'Constant current (CC)',
      })
    } else if (modes.length > 1 || modes[0] === 'cv_cc') {
      sharedRows.push({ label: 'Operation mode', value: 'CV & CC — varies by model' })
    }
  }

  const certs = uniq(products.flatMap((p) => p.standards_met ?? [])).map((c) => CERT_NAME[c] ?? c)
  if (certs.length && !columnisedShared)
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
  if (protections && !columnisedShared) sharedRows.push({ label: 'Protections', value: protections })

  const warranties = uniq(products.map((p) => num(p.warranty_years)).filter((w): w is number => w != null))
  if (warranties.length === 1 && !columnisedShared)
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
    key('power', 'Power', powerRange)
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
    // Specs 7–8 (SKU detail pages raise maxKeySpecs to 8; series pages keep
    // the first 6): exact rated current + shared dimensions only.
    const currents = uniq(products.map((p) => num(p.rated_current_a)).filter((v): v is number => v != null))
    key('efficacy', 'Rated current', currents.length === 1 ? `${currents[0]} A` : null)
    const sized = products.filter((p) => p.length_mm != null && p.width_mm != null && p.height_mm != null)
    if (uniq(sized.map((p) => `${p.length_mm}×${p.width_mm}×${p.height_mm}`)).length === 1) {
      const d = formatDims(sized[0].length_mm, sized[0].width_mm, sized[0].height_mm)
      if (d) key('dims', 'Dimensions', `${d.mm}\n(${d.in})`)
    }
  } else if (family.slug === 'led-signage-modules') {
    // Old-envo "Key Specifications" set (user screenshot 2026-07-06):
    // Power rating / Input voltage / Max series / Waterproof / Dimensions
    // + Warranty. Voltage and IP fall back to the Akeneo SUBTITLE
    // ("12V 0.48W IP66") — the sync drops those columns for modules.
    key('power', 'Power', powerRange)
    const volts = uniq(
      products
        .map((p) => num(p.output_voltage_v) ?? (Number(p.subtitle?.match(/(\d+)\s*V\b/i)?.[1]) || null))
        .filter((v): v is number => v != null),
    ).sort((a, b) => a - b)
    key('vsource', 'Input voltage', volts.length ? `${volts.join(' / ')} V DC` : null)
    const maxSeries = uniq(products.map((p) => num(p.max_in_series)).filter((v): v is number => v != null))
      .sort((a, b) => a - b)
    key(
      'maxseries', 'Max series',
      maxSeries.length
        ? maxSeries.length === 1 ? String(maxSeries[0]) : `${maxSeries[0]}–${maxSeries[maxSeries.length - 1]}`
        : null,
    )
    const ip = ipField ?? products.map((p) => p.subtitle?.match(/IP\s?(\d{2})/i)?.[1]).find(Boolean)
    key('waterproof', 'IP rating', ip ? (ipField ? ipField.toUpperCase() : `IP${ip}`) : null)
    // Dimensions: a single size shows exact — anything more collapses to a
    // count + length span (a merged L×W×H list reads like number soup; the
    // compare table below carries exact per-model dims). "Lengths" when the
    // cross-section is shared, "sizes" when profiles differ too.
    const sized = products.filter((p) => p.length_mm != null && p.width_mm != null && p.height_mm != null)
    const dimTuples = uniq(sized.map((p) => `${p.length_mm}×${p.width_mm}×${p.height_mm}`))
    const lens = uniq(sized.map((p) => num(p.length_mm)).filter((v): v is number => v != null))
      .sort((a, b) => a - b)
    // mm line + imperial twin line, equal size (W/H/L labels say which
    // number is which axis). Varying lengths render as a slash list
    // (W × H × L-list); mixed cross-sections list lengths only.
    if (dimTuples.length === 1 && sized[0].width_mm != null && sized[0].height_mm != null) {
      const { length_mm: l, width_mm: w, height_mm: h } = sized[0]
      key('dims', 'Dimensions', `L${l} × W${w} × H${h} mm\n(${mmToIn(l)} × ${mmToIn(w)} × ${mmToIn(h)} in)`)
    } else if (lens.length) {
      const shared = uniq(sized.map((p) => `${p.width_mm}×${p.height_mm}`)).length === 1
      const lensMm = lens.join('/')
      const lensIn = lens.map(mmToIn).join('/')
      const value = shared && sized[0].width_mm != null && sized[0].height_mm != null
        ? `W${sized[0].width_mm} × H${sized[0].height_mm} × L${lensMm} mm\n(${mmToIn(sized[0].width_mm)} × ${mmToIn(sized[0].height_mm)} × ${lensIn} in)`
        : `L${lensMm} mm\n(${lensIn} in)`
      key('dims', 'Dimensions', value)
    }
    // Every module line carries the same warranty on the distributor sites
    // (envo-led.com, verified 2026-07-06). Prefer the PIM column the moment
    // the sync fills it.
    const warrantyYears = uniq(products.map((p) => num(p.warranty_years)).filter((w): w is number => w != null))
    key('warranty', 'Warranty', warrantyYears.length === 1 ? `${warrantyYears[0]} years` : '5 years')
  } else {
    // control gear / accessories — whatever identity facts the data carries
    key('input', 'Input voltage', sharedVoltage)
    // Protocol needs the NAME as well as dimming_control: the PIM's dimming
    // vocabulary can never say Zigbee/Casambi, so the Zigbee series hero used
    // to read "Protocol DALI" from its DT8 units alone (audit 2026-07-17).
    // Same inference as catalogue-data's protocolValues.
    const PROTOCOL_ORDER = ['zigbee', 'casambi', 'dali', 'triac', 'pwm', '0_10v'] as const
    const PROTOCOL_LABEL: Record<string, string> = {
      zigbee: 'Zigbee', casambi: 'Casambi', ...DIMMING_LABEL,
    }
    const protoDims = uniq(
      products.flatMap((p) => {
        const vals = new Set(dimmingValuesOf(p).filter((d) => d !== 'none'))
        if (/zig.?bee/i.test(p.name)) vals.add('zigbee')
        if (/dali/i.test(p.name)) vals.add('dali')
        if (/casambi/i.test(p.name)) vals.add('casambi')
        return [...vals]
      }),
    ).sort((a, b) => PROTOCOL_ORDER.indexOf(a as (typeof PROTOCOL_ORDER)[number]) - PROTOCOL_ORDER.indexOf(b as (typeof PROTOCOL_ORDER)[number]))
    key('dimming', 'Protocol', protoDims.length ? protoDims.map((d) => PROTOCOL_LABEL[d]).join(' / ') : null)
    key('power', 'Power', powerRange)
    key('ip', 'IP rating', ipField ? ipField.toUpperCase() : null)
    key('lifetime', 'Lifetime', lifetime ? `${lifetime.toLocaleString()} h` : null)
    // Specs 6–8 (raised cap on SKU detail pages): shared dims + warranty.
    const sized = products.filter((p) => p.length_mm != null && p.width_mm != null && p.height_mm != null)
    if (uniq(sized.map((p) => `${p.length_mm}×${p.width_mm}×${p.height_mm}`)).length === 1) {
      const d = formatDims(sized[0].length_mm, sized[0].width_mm, sized[0].height_mm)
      if (d) key('dims', 'Dimensions', `${d.mm}\n(${d.in})`)
    }
    const cgWarranty = uniq(products.map((p) => num(p.warranty_years)).filter((w): w is number => w != null))
    key('warranty', 'Warranty', cgWarranty.length === 1 ? `${cgWarranty[0]} year${cgWarranty[0] === 1 ? '' : 's'}` : null)
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
    keySpecs: keySpecs.slice(0, opts?.maxKeySpecs ?? 6),
    datasheetUrl,
    purchaseLinks: seriesPurchaseLinks(series, label),
    thumbs,
    variants,
    variantLayout: variants.length > COLUMN_CAP ? 'rows' : 'columns',
    sharedRows,
    solutions: copy?.solutions,
    downloads: datasheetUrl
      ? [{ kind: 'Datasheet', name: `${label} datasheet`, meta: 'PDF · specifications & dimensions', href: datasheetUrl }]
      : [],
  }
}
