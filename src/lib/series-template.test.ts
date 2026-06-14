/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import { groupSeriesModels } from './series-template'
import type { Product } from './products'

// `productName` is a live Payload field that the canonical `Product` type
// doesn't declare (groupSeriesModels reads it via `(rep as any).productName`);
// allow extra runtime keys here so fixtures can set it.
const p = (over: Partial<Product> & Record<string, unknown>): Product => ({
  sku: 'X', name: 'n', productName: null, slug: null, family: 'led_module',
  series: 'envo_ultraflare', brand: 'ENVO', subtitle: null, short_description: null,
  description: null, enabled: true, hidden: false, image_url_fallback: null,
  clean_image_url_fallback: null, spec_sheet_url: null, power_w: null,
  output_voltage_v: null, input_voltage_min_v: null, input_voltage_max_v: null,
  rated_current_a: null, number_of_outputs: null, operation_mode: null,
  dimming_control: [], cc_region_min: null, cc_region_max: null,
  controller_type: null, output_channel: null, output_type: null, module_size: null,
  switch_no_module: null, switch_operation_method: null, switch_back_light: false,
  mounting_info: null, finish_colour: null, material: null, brightness_lm: null,
  efficacy_lm_w: null, cct_k: null, cri: null, beam_angle_deg: null, lifetime_hrs: null,
  ...over,
} as unknown as Product)

describe('groupSeriesModels', () => {
  it('collapses -WW/-NW/-CW into one suffix-less model', () => {
    const rows = groupSeriesModels([
      p({ sku: 'EV-BLUF02LBY-WW', productName: 'UltraFlare Double LED', power_w: 1, brightness_lm: 110, cct_k: 3000 }),
      p({ sku: 'EV-BLUF02LBY-NW', power_w: 1, brightness_lm: 110, cct_k: 4000 }),
      p({ sku: 'EV-BLUF02LBY-CW', power_w: 1, brightness_lm: 110, cct_k: 6500 }),
    ])
    expect(rows).toHaveLength(1)
    expect(rows[0].code).toBe('EV-BLUF02LBY')
    expect(rows[0].leds).toBe('Double')
    expect(rows[0].powerW).toBe(1)
    expect(rows[0].lumens).toBe(110)
  })

  it('sorts models by ascending power', () => {
    const rows = groupSeriesModels([
      p({ sku: 'EV-BLUF04LBY-NW', power_w: 2 }),
      p({ sku: 'EV-BLUF01LBY-NW', power_w: 0.5 }),
    ])
    expect(rows.map((r) => r.code)).toEqual(['EV-BLUF01LBY', 'EV-BLUF04LBY'])
  })

  it('builds dimsMm only when all three dimensions exist', () => {
    const rows = groupSeriesModels([
      p({ sku: 'A-NW', length_mm: 27.8, width_mm: 15.4, height_mm: 10.4 } as Partial<Product>),
    ])
    expect(rows[0].dimsMm).toBe('27.8 × 15.4 × 10.4')
  })
})

import { buildStats, buildFeatures, type SeriesSpecs } from './series-template'

const specs: SeriesSpecs = {
  beamDeg: 170, ip: 'IP67', voltsDc: 12, lifetimeHrs: 50000,
  cctOptions: ['WW=3000K', 'NW=4000K', 'CW=6500K'], certs: ['UL', 'CE', 'TÜV'],
}

describe('buildStats', () => {
  it('produces up to 4 hero stats from specs + max lumens', () => {
    const stats = buildStats(specs, 180)
    expect(stats).toEqual([
      { value: '180 lm', label: 'max / module' },
      { value: '170°', label: 'beam angle' },
      { value: 'IP67', label: 'ingress' },
      { value: '3 CCT', label: 'colour temps' },
    ])
  })
})

describe('buildFeatures', () => {
  it('keeps strengths then appends spec-derived bullets, capped at 6', () => {
    const features = buildFeatures(
      [{ title: 'Osram emitters', note: 'Premium binned chips.' }],
      specs,
      4,
    )
    expect(features[0]).toEqual({ title: 'Osram emitters', note: 'Premium binned chips.' })
    expect(features.length).toBeLessThanOrEqual(6)
    expect(features.some((f) => f.title === '12 V DC')).toBe(true)
  })
})
