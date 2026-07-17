/**
 * Customer-facing series titles, real-usage blurbs and form-factor tags for the
 * non-signage catalogue cards (drivers / control gear / accessories).
 *
 * SOURCE: authored 2026-07-06 from each series' live Akeneo products (names,
 * specs, descriptions) — the PIM has no structured attributes for any of this,
 * and the per-SKU prose is unusable as card copy. Same deliberate,
 * user-authorised exception to the three-source rule as SERIES_BLURBS in
 * series-applications.ts: when Akeneo grows real series-level attributes,
 * delete this file and map them in the sync instead.
 *
 * Keyed by `<marketingFamily>:<seriesCode>` because a series code can mean
 * different products in different families — `sr_triac` is DALI DT6
 * constant-current DRIVERS under led-drivers but DALI relay/converter CONTROL
 * MODULES under control-gear.
 *
 * NAMING RULE (user-locked 2026-07-06): "Triac" may only appear in the title
 * of genuinely triac-dimmable drivers (SP). sr_triac is DALI — its legacy
 * "Triac" label must never surface.
 */
import { seriesSlug } from './series-registry'
export type CatalogueSeriesMeta = {
  /** Customer-facing card title, e.g. "SNG Waterproof High-Power Driver". */
  title: string
  /** One-line real-usage description (replaces the model-count fallback). */
  blurb: string
  /** Series-level form-factor facet values (name-derived values are added on top). */
  formFactor?: string[]
}

const META: Record<string, CatalogueSeriesMeta> = {
  // ── LED drivers ──────────────────────────────────────────────────────────
  'led-drivers:envo_se_us': {
    title: 'SE Slim Indoor Driver',
    blurb: 'Ultra-thin indoor constant-voltage drivers for tight sign cabinets — 15–75 W at 12 or 24 V.',
    formFactor: ['slim'],
  },
  'led-drivers:envo_sl_us': {
    title: 'SL Linear Driver',
    blurb: 'Linear constant-voltage drivers with open-circuit, short-circuit and overload protection — 60–150 W at 12, 24 or 48 V.',
    formFactor: ['linear'],
  },
  'led-drivers:envo_sng': {
    title: 'SNG Waterproof High-Power Driver',
    blurb: 'IP67-sealed high-power drivers for outdoor signage — 300–350 W at 12 or 24 V.',
  },
  'led-drivers:sc_envo': {
    title: 'Standard Driver Range',
    blurb: 'The everyday CV and CC driver catalogue — regular, ultra-thin, waterproof and linear supplies from 12 to 200 W at 12 or 24 V.',
    formFactor: ['linear'],
  },
  'led-drivers:envo_snpv_us': {
    title: 'SNPV Class 2 Driver',
    blurb: 'Class 2 compliant constant-voltage drivers for North-American installs — 40–60 W at 12 or 24 V.',
  },
  'led-drivers:envo_sp_us': {
    title: 'SP Triac Dimmable Driver',
    blurb: 'Indoor triac-dimmable constant-voltage drivers for smooth phase dimming — 30–80 W at 12 or 24 V.',
  },
  'led-drivers:sr_triac': {
    title: 'SR DALI CC Driver',
    blurb: 'NFC-programmable DALI DT6 constant-current drivers — 10–65 W with 100–500 mA output.',
  },

  // ── Control gear ─────────────────────────────────────────────────────────
  'control-gear:envo_casambi': {
    title: 'Casambi Wireless Controls',
    blurb: 'Battery-powered Casambi rotary and push-button wall controls — single-colour to RGB+CCT, ~50 m line of sight.',
  },
  'control-gear:envo_zigbee': {
    title: 'Zigbee Smart Controllers',
    blurb: 'Zigbee and DALI DT8 controllers for tunable-white and RGBW systems — wall panels to multi-channel units.',
  },
  'control-gear:envo_dali': {
    title: 'DALI Push-Dim Controller',
    blurb: 'Single-channel DALI + push-dim LED controller for 12–24 V DC systems.',
  },
  'control-gear:sr_triac': {
    title: 'SR DALI Control Modules',
    blurb: 'DALI relay and DALI-to-0/1-10 V conversion modules for mixed-protocol installs.',
  },

  // ── Sensors (under control-gear since 2026-07-06) ────────────────────────
  'control-gear:envo_sensor': {
    title: 'PIR Motion Sensor',
    blurb: 'PIR movement sensors with probe for automatic on/off switching in indoor DC systems.',
  },
}

export function catalogueSeriesMeta(
  familySlug: string,
  code: string | null | undefined,
): CatalogueSeriesMeta | undefined {
  return code ? META[`${familySlug}:${code}`] : undefined
}

/** Same lookup by the series' URL-slug form (route segment) instead of the
 *  raw code — for generateMetadata, where only the slug is available. */
export function catalogueSeriesMetaBySlug(
  familySlug: string,
  slug: string,
): CatalogueSeriesMeta | undefined {
  const key = Object.keys(META).find(
    (k) => k.startsWith(`${familySlug}:`) && seriesSlug(k.slice(familySlug.length + 1)) === slug,
  )
  return key ? META[key] : undefined
}
