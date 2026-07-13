// src/data/series-registry.ts
// The single source of truth for series URL identity: DB series code →
// canonical slug → page href, plus retired slugs and their redirects.
// NEVER hand-write a /products/<family>/<series> URL anywhere — derive it
// from seriesHref()/seriesSlug(). Hand-written slugs are how the eco-series /
// linear-series / screw-terminal / zigbee-smart 404s happened.
//
// This file must stay dependency-free (no `@/` imports): next.config.ts
// imports it to generate redirects, and the config loader can't resolve
// tsconfig path aliases. App code should import via family-map.ts, which
// re-exports these helpers alongside labels/categories.

/** Series that keep a bespoke slug instead of the derived code slug. */
export const SERIES_SLUG_OVERRIDES: Record<string, string> = { envo_minilux: 'mini-series' }

/** Canonical URL segment for a DB `series` code, e.g. envo_ecoglo → envo-ecoglo. */
export function seriesSlug(code: string | null | undefined): string {
  if (!code) return 'other'
  return SERIES_SLUG_OVERRIDES[code] ?? code.replace(/_/g, '-')
}

/** Canonical series page path, e.g. /products/led-signage-modules/envo-ecoglo. */
export function seriesHref(marketingFamilySlug: string, code: string): string {
  return `/products/${marketingFamilySlug}/${seriesSlug(code)}`
}

/**
 * Retired series slugs. These shipped as hand-written strings in internal
 * links / data files and were crawlable, so each one permanently redirects
 * to the canonical page. Add here when a series slug is ever renamed.
 */
export const LEGACY_SERIES_SLUGS: ReadonlyArray<{
  marketingFamilySlug: string
  legacySlug: string
  code: string
}> = [
  { marketingFamilySlug: 'led-signage-modules', legacySlug: 'eco-series', code: 'envo_ecoglo' },
  { marketingFamilySlug: 'led-drivers', legacySlug: 'linear-series', code: 'envo_sl_us' },
  { marketingFamilySlug: 'led-drivers', legacySlug: 'screw-terminal', code: 'envo_se_us' },
  { marketingFamilySlug: 'control-gear', legacySlug: 'zigbee-smart', code: 'envo_zigbee' },
]

/** next.config.ts `redirects()` entries for every legacy series slug (308). */
export function seriesRedirects() {
  return LEGACY_SERIES_SLUGS.map((l) => ({
    source: `/products/${l.marketingFamilySlug}/${l.legacySlug}`,
    destination: seriesHref(l.marketingFamilySlug, l.code),
    permanent: true as const,
  }))
}
