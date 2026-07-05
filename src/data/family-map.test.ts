import { describe, it, expect } from 'vitest'
import {
  dbFamilyToMarketing, marketingFamilyToDbFamilies,
  seriesSlug, seriesCodeFromSlug, seriesLabel, seriesLineArt, seriesSectionTitle, MARKETING_FAMILIES,
} from './family-map'

describe('family mapping (7 DB → 4 marketing)', () => {
  it('maps every DB family to a marketing family', () => {
    expect(dbFamilyToMarketing('led_module')?.slug).toBe('led-signage-modules')
    expect(dbFamilyToMarketing('psu_led_cv')?.slug).toBe('led-drivers')
    expect(dbFamilyToMarketing('psu_led_cc')?.slug).toBe('led-drivers')
    expect(dbFamilyToMarketing('psu_led_controller')?.slug).toBe('control-gear')
    expect(dbFamilyToMarketing('switch_switch_module')?.slug).toBe('control-gear')
    // sensor moved to control-gear 2026-07-06 (user decision — every live
    // "accessory" was a sensor, and sensors belong with the controls they feed)
    expect(dbFamilyToMarketing('sensor')?.slug).toBe('control-gear')
    expect(dbFamilyToMarketing('accessory_general')?.slug).toBe('accessories')
  })
  it('returns null for an unknown DB family', () => {
    expect(dbFamilyToMarketing('nope')).toBeNull()
  })
  it('reverse-maps a marketing slug to its DB families', () => {
    expect(marketingFamilyToDbFamilies('led-drivers').sort())
      .toEqual(['psu_led_cc', 'psu_led_cv'])
    expect(marketingFamilyToDbFamilies('control-gear').sort())
      .toEqual(['psu_led_controller', 'sensor', 'switch_switch_module'])
  })
  it('exposes exactly 4 marketing families', () => {
    expect(MARKETING_FAMILIES.map((f) => f.slug).sort())
      .toEqual(['accessories', 'control-gear', 'led-drivers', 'led-signage-modules'])
  })
})

describe('series slug ↔ code', () => {
  it('overrides envo_minilux to the bespoke slug', () => {
    expect(seriesSlug('envo_minilux')).toBe('mini-series')
    expect(seriesCodeFromSlug('mini-series')).toBe('envo_minilux')
  })
  it('derives slug from code for non-curated series', () => {
    expect(seriesSlug('hydro_lume')).toBe('hydro-lume')
    expect(seriesSlug('sc_envo')).toBe('sc-envo')
    expect(seriesCodeFromSlug('hydro-lume')).toBe('hydro_lume')
  })
  it('round-trips a null/empty series to the "other" bucket', () => {
    expect(seriesSlug(null)).toBe('other')
    expect(seriesCodeFromSlug('other')).toBeNull()
  })
  it('gives a human label, preferring the known map', () => {
    expect(seriesLabel('envo_ultraflare')).toBe('UltraFlare')
    expect(seriesLabel('hydro_lume')).toBe('Hydro Lume')
    expect(seriesLabel(null)).toBe('Other')
  })
})

describe('seriesSectionTitle', () => {
  it('splits signage modules into backlit/sidelit by SKU prefix', () => {
    expect(seriesSectionTitle('led-signage-modules', [{ sku: 'EV-BLML01' }, { sku: 'EV-BLML02' }])).toBe('Backlit modules')
    expect(seriesSectionTitle('led-signage-modules', [{ sku: 'EV-SLEL01' }])).toBe('Sidelit modules')
  })
  it('splits other families by dominant DB family', () => {
    expect(seriesSectionTitle('led-drivers', [{ family: 'psu_led_cv' }, { family: 'psu_led_cv' }, { family: 'psu_led_cc' }])).toBe('Constant-voltage drivers')
    expect(seriesSectionTitle('led-drivers', [{ family: 'psu_led_cc' }])).toBe('Constant-current drivers')
    expect(seriesSectionTitle('control-gear', [{ family: 'psu_led_controller' }])).toBe('Controllers')
  })
})

describe('seriesLineArt', () => {
  it('uses per-series line-art when known', () => {
    expect(seriesLineArt('envo_minilux', 'led-signage-modules')).toBe('/assets/images/mod-mini-line.png')
  })
  it('falls back to the family category line-art', () => {
    expect(seriesLineArt('hydro_lume', 'led-signage-modules')).toBe('/assets/images/cat-modules.png')
    expect(seriesLineArt(null, 'led-drivers')).toBe('/assets/images/cat-drivers-line.png')
    expect(seriesLineArt('sr_triac', 'control-gear')).toBe('/assets/images/cat-controllers-line.png')
  })
})
