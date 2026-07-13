// src/data/series-registry.test.ts
import { describe, it, expect } from 'vitest'
import { LEGACY_SERIES_SLUGS, seriesHref, seriesRedirects, seriesSlug } from './series-registry'

describe('seriesSlug', () => {
  it('derives the slug from the code, honouring bespoke overrides', () => {
    expect(seriesSlug('envo_ecoglo')).toBe('envo-ecoglo')
    expect(seriesSlug('envo_minilux')).toBe('mini-series')
    expect(seriesSlug(null)).toBe('other')
  })
})

describe('seriesHref', () => {
  it('builds the canonical series page path', () => {
    expect(seriesHref('led-signage-modules', 'envo_ecoglo')).toBe('/products/led-signage-modules/envo-ecoglo')
    expect(seriesHref('led-signage-modules', 'envo_minilux')).toBe('/products/led-signage-modules/mini-series')
  })
})

describe('legacy slug redirects', () => {
  it('never map a legacy slug onto itself (would loop)', () => {
    for (const l of LEGACY_SERIES_SLUGS) {
      expect(l.legacySlug).not.toBe(seriesSlug(l.code))
    }
  })

  it('emit one permanent redirect per legacy slug, targeting the canonical href', () => {
    const redirects = seriesRedirects()
    expect(redirects).toHaveLength(LEGACY_SERIES_SLUGS.length)
    for (const [i, l] of LEGACY_SERIES_SLUGS.entries()) {
      expect(redirects[i]).toEqual({
        source: `/products/${l.marketingFamilySlug}/${l.legacySlug}`,
        destination: seriesHref(l.marketingFamilySlug, l.code),
        permanent: true,
      })
    }
  })

  it('legacy slugs never collide with a canonical override slug', () => {
    const canonical = new Set(LEGACY_SERIES_SLUGS.map((l) => seriesSlug(l.code)))
    canonical.add(seriesSlug('envo_minilux'))
    for (const l of LEGACY_SERIES_SLUGS) {
      expect(canonical.has(l.legacySlug)).toBe(false)
    }
  })
})
