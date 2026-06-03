import { describe, it, expect } from 'vitest'
import {
  dbFamilyToMarketing, marketingFamilyToDbFamilies,
  seriesSlug, seriesCodeFromSlug, seriesLabel, MARKETING_FAMILIES,
} from './family-map'

describe('family mapping (7 DB → 4 marketing)', () => {
  it('maps every DB family to a marketing family', () => {
    expect(dbFamilyToMarketing('led_module')?.slug).toBe('led-signage-modules')
    expect(dbFamilyToMarketing('psu_led_cv')?.slug).toBe('led-drivers')
    expect(dbFamilyToMarketing('psu_led_cc')?.slug).toBe('led-drivers')
    expect(dbFamilyToMarketing('psu_led_controller')?.slug).toBe('control-gear')
    expect(dbFamilyToMarketing('switch_switch_module')?.slug).toBe('control-gear')
    expect(dbFamilyToMarketing('sensor')?.slug).toBe('accessories')
    expect(dbFamilyToMarketing('accessory_general')?.slug).toBe('accessories')
  })
  it('returns null for an unknown DB family', () => {
    expect(dbFamilyToMarketing('nope')).toBeNull()
  })
  it('reverse-maps a marketing slug to its DB families', () => {
    expect(marketingFamilyToDbFamilies('led-drivers').sort())
      .toEqual(['psu_led_cc', 'psu_led_cv'])
    expect(marketingFamilyToDbFamilies('control-gear').sort())
      .toEqual(['psu_led_controller', 'switch_switch_module'])
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
