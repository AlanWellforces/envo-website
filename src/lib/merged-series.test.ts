/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import { buildMergedSeriesProps } from './merged-series'
import { PRODUCT_FAMILIES } from '@/data/product-families'
import type { Product } from './products'

const driversFamily = PRODUCT_FAMILIES.find((f) => f.slug === 'led-drivers')!
const modulesFamily = PRODUCT_FAMILIES.find((f) => f.slug === 'led-signage-modules')!
const controlFamily = PRODUCT_FAMILIES.find((f) => f.slug === 'control-gear')!

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
  it('drivers always carry input voltage per model — the full AC range, never "V DC"', () => {
    const props = buildMergedSeriesProps(driversFamily, 'sc_envo', [
      p({ sku: 'SC-10-12', input_voltage_min_v: 90, input_voltage_max_v: 132 }),
      p({ sku: 'SC-20-12', input_voltage_min_v: 90, input_voltage_max_v: 132 }),
    ])
    expect(sharedRow(props, 'Input voltage')).toBeUndefined()
    for (const v of props.variants) expect(v.inputVoltage).toBe('90–132 V AC')
  })

  it('labels a low-voltage input range as DC (shared row on non-driver families)', () => {
    const props = buildMergedSeriesProps(controlFamily, 'envo_zigbee', [
      p({ sku: 'SR-1', family: 'psu_led_controller', series: 'envo_zigbee', input_voltage_min_v: 12, input_voltage_max_v: 48 }),
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

// ── driver spec table (user-locked columns 2026-07-06):
//    Model / Power / Output voltage / Rated current / Input voltage / Dimming / IP rating / Dimensions
describe('driver series spec table', () => {
  const slModel = (over: Record<string, unknown> = {}) =>
    p({
      sku: 'EV-SL-100-12', name: 'ENVO EV-SL-100-12 Linear Type LED Driver 100W 12V 8.33A',
      series: 'envo_sl_us', family: 'psu_led_cv', power_w: 100, output_voltage_v: 12,
      rated_current_a: 8.33, input_voltage_min_v: 100, input_voltage_max_v: 240,
      waterproof: 'ip20', length_mm: 280, width_mm: 30, height_mm: 21,
      description: 'Open circuit, short circuit, overload and over voltage protection.',
      operation_mode: 'cv',
      ...over,
    })

  it('each driver variant carries the full selection columns', () => {
    const props = buildMergedSeriesProps(driversFamily, 'envo_sl_us', [slModel()])
    const v = props.variants[0]
    expect(v.power).toBe('100 W')
    expect(v.outputVoltage).toBe('12 V DC')
    expect(v.ratedCurrent).toBe('8.33 A')
    expect(v.inputVoltage).toBe('100–240 V AC')
    expect(v.ip).toBe('IP20')
    expect(v.dimensions).toBe('280 × 30 × 21 mm')
    // "Module size" must never render on a driver page
    expect(v.size).toBeUndefined()
  })

  it('signage variants keep Module size and gain none of the driver columns', () => {
    const props = buildMergedSeriesProps(modulesFamily, 'envo_ecoglo', [
      p({ sku: 'EV-BLEG02LBY-NW', series: 'envo_ecoglo', family: 'led_module', power_w: 1, length_mm: 30, width_mm: 12, height_mm: 6 }),
    ])
    const v = props.variants[0]
    expect(v.size).toBe('30 × 12 × 6 mm')
    expect(v.dimensions).toBeUndefined()
    expect(v.ratedCurrent).toBeUndefined()
    expect(v.ip).toBeUndefined()
  })

  it('derives per-model dimming: field, triac-name, non-dimmable-name', () => {
    const props = buildMergedSeriesProps(driversFamily, 'sc_envo', [
      p({ sku: 'A', name: 'Driver', dimming_control: ['dali'] }),
      p({ sku: 'B', name: 'Triac Dimmable LED Driver' }),
      p({ sku: 'C', name: 'Non-Dimmable LED Driver' }),
      p({ sku: 'D', name: 'Driver' }),
    ])
    const byCode = Object.fromEntries(props.variants.map((v) => [v.modelCode, v.dimming]))
    expect(byCode['A']).toBe('DALI')
    expect(byCode['B']).toBe('Triac')
    expect(byCode['C']).toBe('Non-dimmable')
    expect(byCode['D']).toBeUndefined()
  })

  it('non-IP-rated models show no IP value', () => {
    const props = buildMergedSeriesProps(driversFamily, 'sc_envo', [
      p({ sku: 'A', waterproof: 'non_waterproof' }),
      p({ sku: 'B', waterproof: 'ip67' }),
    ])
    const byCode = Object.fromEntries(props.variants.map((v) => [v.modelCode, v.ip]))
    expect(byCode['A']).toBeUndefined()
    expect(byCode['B']).toBe('IP67')
  })

  it('drivers get no shared Ingress row — IP lives in the per-model column', () => {
    const props = buildMergedSeriesProps(driversFamily, 'envo_sng', [
      p({ sku: 'A', series: 'envo_sng', waterproof: 'ip67' }),
    ])
    expect(sharedRow(props, 'Ingress protection')).toBeUndefined()
  })
})

describe('driver shared rows: operation mode, protections, warranty', () => {
  it('uniform operation mode shows as one shared row', () => {
    const props = buildMergedSeriesProps(driversFamily, 'envo_sl_us', [
      p({ sku: 'A', operation_mode: 'cv' }), p({ sku: 'B', operation_mode: 'cv' }),
    ])
    expect(sharedRow(props, 'Operation mode')?.value).toBe('Constant voltage (CV)')
  })

  it('mixed CV/CC series says it varies by model', () => {
    const props = buildMergedSeriesProps(driversFamily, 'sc_envo', [
      p({ sku: 'A', operation_mode: 'cv' }), p({ sku: 'B', operation_mode: 'cc' }),
    ])
    expect(sharedRow(props, 'Operation mode')?.value).toBe('CV & CC — varies by model')
  })

  it('protections come from the models\' own Akeneo copy, intersected across the series', () => {
    const desc = 'Open circuit, short circuit, overload and over voltage protection.'
    const props = buildMergedSeriesProps(driversFamily, 'envo_sl_us', [
      p({ sku: 'A', description: desc }),
      p({ sku: 'B', description: 'short circuit and overload protection' }),
    ])
    expect(sharedRow(props, 'Protections')?.value).toBe('Short-circuit · Overload')
  })

  it('no protection copy → no Protections row (sr_triac)', () => {
    const props = buildMergedSeriesProps(driversFamily, 'sr_triac', [
      p({ sku: 'A', series: 'sr_triac', description: 'NFC programmable DALI DT6 driver.' }),
    ])
    expect(sharedRow(props, 'Protections')).toBeUndefined()
  })

  it('warranty renders only when the PIM carries warranty_years', () => {
    const withWarranty = buildMergedSeriesProps(driversFamily, 'envo_sl_us', [
      p({ sku: 'A', warranty_years: 5 }), p({ sku: 'B', warranty_years: 5 }),
    ])
    expect(sharedRow(withWarranty, 'Warranty')?.value).toBe('5 years')
    const without = buildMergedSeriesProps(driversFamily, 'envo_sl_us', [p({ sku: 'A' })])
    expect(sharedRow(without, 'Warranty')).toBeUndefined()
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

// ── hero key specs (reference layout 2026-07-06: icon grid, max 6) ──────────
describe('hero key specs', () => {
  it('driver series: power range, output voltage, input, mode, dimming, IP', () => {
    const props = buildMergedSeriesProps(driversFamily, 'envo_se_us', [
      p({ sku: 'A', name: 'Driver', series: 'envo_se_us', power_w: 15, output_voltage_v: 12, input_voltage_min_v: 90, input_voltage_max_v: 132, operation_mode: 'cv', waterproof: 'ip20' }),
      p({ sku: 'B', name: 'Driver', series: 'envo_se_us', power_w: 75, output_voltage_v: 24, input_voltage_min_v: 90, input_voltage_max_v: 132, operation_mode: 'cv', waterproof: 'ip20' }),
    ])
    const byLabel = Object.fromEntries((props.keySpecs ?? []).map((s) => [s.label, s.value]))
    expect(byLabel['Power range']).toBe('15–75 W')
    expect(byLabel['Output voltage']).toBe('12 / 24 V DC')
    expect(byLabel['Input voltage']).toBe('90–132 V AC')
    expect(byLabel['Operation mode']).toBe('Constant voltage')
    expect(byLabel['IP rating']).toBe('IP20')
    expect((props.keySpecs ?? []).length).toBeLessThanOrEqual(6)
  })

  it('signage series: old-envo key-spec set — power, input V, max series, waterproof, dims, warranty', () => {
    const props = buildMergedSeriesProps(modulesFamily, 'envo_minilux', [
      p({ sku: 'EV-BLML01LBY-NW', series: 'envo_minilux', family: 'led_module', name: 'MiniLux Single', subtitle: '12V 0.24W IP66', power_w: 0.24, max_in_series: 40, length_mm: 14, width_mm: 9, height_mm: 9 }),
      p({ sku: 'EV-BLML03LBY-NW', series: 'envo_minilux', family: 'led_module', name: 'MiniLux Triple', subtitle: '12V 0.72W IP66', power_w: 0.72, max_in_series: 40, length_mm: 38.1, width_mm: 9, height_mm: 9 }),
    ])
    const byLabel = Object.fromEntries((props.keySpecs ?? []).map((s) => [s.label, s.value]))
    expect(byLabel['Power rating']).toBe('0.24–0.72 W')
    // voltage + IP come from the Akeneo subtitle when the columns are null (sync gap)
    expect(byLabel['Input voltage']).toBe('12 V DC')
    expect(byLabel['Max series']).toBe('40')
    expect(byLabel['Waterproof']).toBe('IP66')
    expect(byLabel['Dimensions']).toBe('14–38.1 × 9 × 9 mm')
    expect(byLabel['Warranty']).toBe('5 years')
    expect((props.keySpecs ?? []).length).toBeLessThanOrEqual(6)
  })

  it('signage max-series and dimensions honesty: ranges when models differ, omitted when w×h mixed', () => {
    const props = buildMergedSeriesProps(modulesFamily, 'hydro_lume', [
      p({ sku: 'A', series: 'hydro_lume', family: 'led_module', subtitle: '24V 1W IP67', power_w: 1, max_in_series: 40, length_mm: 42, width_mm: 20, height_mm: 7 }),
      p({ sku: 'B', series: 'hydro_lume', family: 'led_module', subtitle: '24V 2W IP67', power_w: 2, max_in_series: 80, length_mm: 84, width_mm: 21, height_mm: 7 }),
    ])
    const byLabel = Object.fromEntries((props.keySpecs ?? []).map((s) => [s.label, s.value]))
    expect(byLabel['Max series']).toBe('40–80')
    expect(byLabel['Dimensions']).toBeUndefined()
  })

  it('omits key specs with no data instead of fabricating', () => {
    const props = buildMergedSeriesProps(driversFamily, 'sc_envo', [p({ sku: 'A' })])
    expect(props.keySpecs ?? []).toEqual([])
  })

  it('mixed dimming shows the union of real dimming values', () => {
    const props = buildMergedSeriesProps(driversFamily, 'sc_envo', [
      p({ sku: 'A', name: 'Triac Dimmable Driver', power_w: 10 }),
      p({ sku: 'B', name: 'Driver', dimming_control: ['pwm'], power_w: 20 }),
    ])
    const dim = (props.keySpecs ?? []).find((s) => s.label === 'Dimming')
    expect(dim?.value).toBe('Triac / PWM')
  })
})

// ── series-page title: series + type of power supply (user 2026-07-06) ──────
describe('driver page titles', () => {
  it('uses the customer-facing name — series AND driver type, never a bare code', () => {
    const props = buildMergedSeriesProps(driversFamily, 'envo_sl_us', [
      p({ sku: 'EV-SL-100-12', series: 'envo_sl_us', operation_mode: 'cv' }),
    ])
    expect(props.title).toBe('SL Linear Driver')
    expect(props.heroSubtitle).toMatch(/constant-voltage drivers/i)
  })

  it('sr_triac page is titled SR DALI CC Driver, never Triac', () => {
    const props = buildMergedSeriesProps(driversFamily, 'sr_triac', [
      p({ sku: 'SRP-1', series: 'sr_triac', operation_mode: 'cc' }),
    ])
    expect(props.title).toBe('SR DALI CC Driver')
    expect(props.title.toLowerCase()).not.toContain('triac')
  })

  it('a driver series without authored meta still gets a type-bearing title', () => {
    const props = buildMergedSeriesProps(driversFamily, 'zz_new', [
      p({ sku: 'A', series: 'zz_new', operation_mode: 'cv' }),
    ])
    expect(props.title).toBe('Zz New Constant-Voltage LED Drivers')
  })

  it('signage titles and hero subtitle are untouched', () => {
    const props = buildMergedSeriesProps(modulesFamily, 'envo_ecoglo', [
      p({ sku: 'EV-BLEG02LBY-NW', series: 'envo_ecoglo', family: 'led_module' }),
    ])
    expect(props.title.toLowerCase()).not.toContain('driver')
    expect(props.heroSubtitle).toBeUndefined()
  })
})

// ── per-model gallery thumbs (user markup 2026-07-06): square tiles under the
//    combined stage, one per model, labelled by name/model code ──────────────
describe('per-model gallery thumbs', () => {
  it('column-layout series get one labelled thumb per model', () => {
    const props = buildMergedSeriesProps(modulesFamily, 'envo_chromaflux', [
      p({ sku: 'EV-BLCF03LBY-RGB', series: 'envo_chromaflux', family: 'led_module', name: 'ChromaFlux RGB', led_chip_colour: 'rgb', clean_image_url_fallback: 'https://s3/rgb.jpg', power_w: 1 }),
      p({ sku: 'EV-BLCF03LBY-RGBW', series: 'envo_chromaflux', family: 'led_module', name: 'ChromaFlux RGBW', led_chip_colour: 'rgbw', clean_image_url_fallback: 'https://s3/rgbw.jpg', power_w: 2 }),
    ])
    expect(props.thumbs).toHaveLength(2)
    expect(props.thumbs![0].label).toBe('EV-BLCF03LBY-RGB')
    expect(props.thumbs![0].src).toBe('https://s3/rgb.jpg')
    expect(props.thumbs![1].label).toBe('EV-BLCF03LBY-RGBW')
  })

  it('rows-layout (many-model) series get no thumb strip', () => {
    const many = Array.from({ length: 8 }, (_, i) =>
      p({ sku: `SC-${i}`, series: 'sc_envo', power_w: i + 1 }),
    )
    const props = buildMergedSeriesProps(driversFamily, 'sc_envo', many)
    expect(props.variantLayout).toBe('rows')
    expect(props.thumbs).toBeUndefined()
  })

  it('a single-model series needs no duplicate thumb of the stage image', () => {
    const props = buildMergedSeriesProps(driversFamily, 'envo_sng', [
      p({ sku: 'EV-SNG-350-12', series: 'envo_sng' }),
    ])
    expect(props.thumbs).toBeUndefined()
  })
})

// ── regional purchase links reach the page props ─────────────────────────────
describe('purchase links', () => {
  it('every series carries per-distributor links (PSM collection when mapped)', () => {
    const props = buildMergedSeriesProps(driversFamily, 'envo_sl_us', [p({ sku: 'A', series: 'envo_sl_us' })])
    expect(props.purchaseLinks?.psm).toBe('https://powersupplymall.com/collections/envo-sl-series')
    expect(props.purchaseLinks?.wellforces).toContain('wellforces.co.nz')
  })
})
