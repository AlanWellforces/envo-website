/**
 * Signage series → application tags, for the /products/[slug] catalogue filter.
 *
 * SOURCE: derived from each series' Akeneo `description` (2026-06-25). The PIM
 * has no structured `application` attribute — the use-case only lives in prose
 * (e.g. MiniLux: "illuminated letters and light boxes"). Rather than parse that
 * HTML live in the frontend (fragile, and would bake product taxonomy into Git),
 * the descriptions were read once and distilled into this static, reviewable map.
 *
 * NOTE: this is a deliberate, user-authorised exception to the three-source rule
 * (normally Akeneo owns product data). When Akeneo adds a real `application`
 * multiselect, delete this file and map it in the sync instead.
 *
 * Vocabulary kept to what the copy actually supports — "facade" was dropped (0
 * descriptions mention building facades; these are channel-letter / light-box
 * backlight modules). The three sidelit series are double-sided light boxes
 * only, so they intentionally lack the channel-letters tag.
 */
export const APPLICATION_OPTIONS = [
  { value: 'channel-letters', label: 'Channel letters' },
  { value: 'light-boxes', label: 'Light boxes' },
] as const

export type ApplicationValue = (typeof APPLICATION_OPTIONS)[number]['value']

/**
 * One-line series intros, distilled from each series' real Akeneo `description`
 * (the PIM copy is per-SKU boilerplate; this is the human one-liner for cards).
 * Same user-authorised Git exception as the application map above.
 */
export const SERIES_BLURBS: Record<string, string> = {
  envo_minilux: 'Ultra-compact backlit modules for small letters and shallow, intricate depths.',
  envo_ecoglo: 'Cost-effective backlit modules — the everyday workhorse for general signage.',
  envo_proglo: 'High-output professional backlit modules for large, high-traffic signage.',
  envo_ultraflare: 'OSRAM-powered high-output modules for large letters and long viewing distances.',
  envo_optilume: 'Efficient backlit modules for illuminated letters and light boxes.',
  envo_chromaflux: 'RGBW colour-changing modules for dynamic, programmable signage.',
  hydro_lume: 'Compact constant-current backlighting for small, intricate channel letters and cabinets.',
  envo_edgeblade: 'Edge-lit modules engineered for double-sided light boxes.',
  envo_edgeflare: 'Edge-lit modules for double-sided light boxes in high-traffic spaces.',
  envo_edgelume: 'Edge-lit modules for slim, double-sided light boxes.',
  edge_blade_2: '24V edge-lit module with focused 10°×40° optics for crisp, low-spill edge lighting.',
}

/** LED-configuration facet vocabulary. Bead count is the series' variant axis,
 *  encoded in the SKU (EV-BLML0**3**…) — there's no structured Akeneo attribute,
 *  so the catalogue derives it from the SKU. */
export const LED_CONFIG_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'duo', label: 'Duo' },
  { value: 'triple', label: 'Triple' },
  { value: 'quad', label: 'Quad' },
  { value: 'rgbw', label: 'RGB / RGBW' },
] as const

/** Keyed by Akeneo `series` code (matches products.series in the DB). */
export const SERIES_APPLICATIONS: Record<string, ApplicationValue[]> = {
  // Backlit — serve both channel letters and light boxes
  envo_minilux: ['channel-letters', 'light-boxes'],
  envo_ecoglo: ['channel-letters', 'light-boxes'],
  envo_optilume: ['channel-letters', 'light-boxes'],
  envo_proglo: ['channel-letters', 'light-boxes'],
  envo_ultraflare: ['channel-letters', 'light-boxes'],
  envo_chromaflux: ['channel-letters', 'light-boxes'],
  hydro_lume: ['channel-letters', 'light-boxes'],
  edge_blade_2: ['channel-letters', 'light-boxes'],
  // Sidelit — double-sided light boxes only (copy never mentions channel letters)
  envo_edgeblade: ['light-boxes'],
  envo_edgeflare: ['light-boxes'],
  envo_edgelume: ['light-boxes'],
}
