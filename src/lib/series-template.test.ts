/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import { groupSeriesModels } from './series-template'
import type { Product } from './products'

const p = (over: Partial<Product>): Product => ({
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
