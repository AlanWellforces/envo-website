/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import { buildMergedSeriesProps } from './merged-series'
import { PRODUCT_FAMILIES } from '@/data/product-families'
import type { Product } from './products'

const driversFamily = PRODUCT_FAMILIES.find((f) => f.slug === 'led-drivers')!
const modulesFamily = PRODUCT_FAMILIES.find((f) => f.slug === 'led-signage-modules')!

const p = (over: Partial<Product> & Record<string, unknown>): Product => ({
  sku: 'X', name: 'n', productName: null, slug: null, family: 'sc_envo',
  series: 'sc_envo', brand: 'ENVO', subtitle: null, short_description: null,
  description: null, enabled: true, hidden: false, image_url_fallback: null,
  clean_image_url_fallback: null, spec_sheet_url: null, power_w: null,
  output_voltage_v: null, input_voltage_min_v: null, input_voltage_max_v: null,
  brightness_lm: null, efficacy_lm_w: null, cct_k: null, cri: null,
  beam_angle_deg: null, lifetime_hrs: null, waterproof: null, standards_met: [],
  led_chip_colour: null, length_mm: null, width_mm: null, height_mm: null,
  ...over,
} as unknown as Product)

const sharedRow = (props: ReturnType<typeof buildMergedSeriesProps>, label: string) =>
  props.sharedRows?.find((r) => r.label === label)

describe('input voltage row', () => {
  it('shows the full AC range for mains-input drivers, never "V DC"', () => {
    const props = buildMergedSeriesProps(driversFamily, 'sc_envo', [
      p({ sku: 'SC-10-12', input_voltage_min_v: 90, input_voltage_max_v: 132 }),
      p({ sku: 'SC-20-12', input_voltage_min_v: 90, input_voltage_max_v: 132 }),
    ])
    expect(sharedRow(props, 'Input voltage')?.value).toBe('90–132 V AC')
  })

  it('labels a low-voltage input range as DC', () => {
    const props = buildMergedSeriesProps(driversFamily, 'envo_zigbee', [
      p({ sku: 'SR-1', input_voltage_min_v: 12, input_voltage_max_v: 48 }),
    ])
    expect(sharedRow(props, 'Input voltage')?.value).toBe('12–48 V DC')
  })

  it('falls back to output voltage as "N V DC" for signage modules', () => {
    const props = buildMergedSeriesProps(modulesFamily, 'envo_ecoglo', [
      p({ sku: 'EV-BLEG02LBY-NW', series: 'envo_ecoglo', output_voltage_v: 12 }),
    ])
    expect(sharedRow(props, 'Input voltage')?.value).toBe('12 V DC')
  })

  it('moves input voltage to per-variant cells when models have different ranges', () => {
    const props = buildMergedSeriesProps(driversFamily, 'envo_se_us', [
      p({ sku: 'EV-SE-15-12US', input_voltage_min_v: 90, input_voltage_max_v: 132 }),
      p({ sku: 'EV-SE-60-12US', input_voltage_min_v: 100, input_voltage_max_v: 120 }),
    ])
    expect(sharedRow(props, 'Input voltage')).toBeUndefined()
    const byCode = Object.fromEntries(props.variants.map((v) => [v.modelCode, v.inputVoltage]))
    expect(byCode['EV-SE-15-12US']).toBe('90–132 V AC')
    expect(byCode['EV-SE-60-12US']).toBe('100–120 V AC')
  })

  it('emits no voltage row at all when no product carries voltage data', () => {
    const props = buildMergedSeriesProps(driversFamily, 'sc_envo', [p({ sku: 'A' })])
    expect(sharedRow(props, 'Input voltage')).toBeUndefined()
    expect(props.variants[0].inputVoltage).toBeUndefined()
  })
})

describe('certification names', () => {
  it('maps c_saa and c_rcm to SAA / RCM instead of leaking raw codes', () => {
    const props = buildMergedSeriesProps(driversFamily, 'sc_envo', [
      p({ sku: 'SC-20-24-US', standards_met: ['c_ce', 'c_saa', 'c_rcm'] }),
    ])
    const row = sharedRow(props, 'Certifications')
    expect(row).toBeDefined()
    const labels = ((row!.value as any).props.children as any[]).map((c) => c.props.children)
    expect(labels).toEqual(['CE', 'SAA', 'RCM'])
  })
})
