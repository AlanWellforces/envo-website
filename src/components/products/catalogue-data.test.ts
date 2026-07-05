import { describe, it, expect } from 'vitest'
import { buildCards, buildGroups } from './catalogue-data'
import { PRODUCT_FAMILIES } from '@/data/product-families'
import type { Product } from '@/lib/products'

const DRIVERS = PRODUCT_FAMILIES.find((f) => f.slug === 'led-drivers')!
const CONTROL = PRODUCT_FAMILIES.find((f) => f.slug === 'control-gear')!
const ACCESSORIES = PRODUCT_FAMILIES.find((f) => f.slug === 'accessories')!

const p = (over: Partial<Product> & Record<string, unknown>): Product => ({
  sku: 'X', name: 'n', family: 'psu_led_cv', series: 'sc_envo', brand: 'ENVO',
  subtitle: null, short_description: null, description: null, enabled: true,
  hidden: false, image_url_fallback: null, clean_image_url_fallback: null,
  spec_sheet_url: null, power_w: null, output_voltage_v: null,
  input_voltage_min_v: null, input_voltage_max_v: null, operation_mode: null,
  dimming_control: [], waterproof: null, standards_met: [], brightness_lm: null,
  cct_k: null, length_mm: null,
  ...over,
} as unknown as Product)

const cardFor = (family: typeof DRIVERS, products: Product[], series: string) =>
  buildCards(family, products).find((c) => c.key.endsWith(`:${series}`))!

// ── sr_triac correction (regression case) ───────────────────────────────────
describe('sr_triac series correction', () => {
  const products = [
    p({ sku: 'SR-DT6-10', name: 'ENVO DALI2 DT6 CC Driver, 10W, 100-500mA, NFC Contol', family: 'psu_led_cc', series: 'sr_triac', operation_mode: 'cc', dimming_control: ['dali'], power_w: 10, output_voltage_v: 42 }),
    p({ sku: 'SR-DT6-65', name: 'ENVO DALI2 DT6 CC Driver, 65W, NFC Contol', family: 'psu_led_cc', series: 'sr_triac', operation_mode: 'cc', dimming_control: ['dali'], power_w: 65, output_voltage_v: 58 }),
  ]
  const card = cardFor(DRIVERS, products, 'sr_triac')

  it('is titled SR DALI CC Driver, never Triac', () => {
    expect(card.name).toBe('SR DALI CC Driver')
    expect(card.name.toLowerCase()).not.toContain('triac')
  })
  it('filters into DALI + Constant current, not Triac', () => {
    expect(card.facets.dimming).toEqual(['dali'])
    expect(card.facets.opmode).toEqual(['cc'])
  })
  it('chips say DALI and Constant current, never Triac', () => {
    expect(card.chips).toContain('DALI')
    expect(card.chips).toContain('Constant current')
    expect(card.chips.join(' ').toLowerCase()).not.toContain('triac')
  })
})

// ── customer-facing titles + real blurbs ────────────────────────────────────
describe('driver card titles and descriptions', () => {
  it('SNG gets its customer-facing name and a real blurb, no model-count fallback', () => {
    const products = [
      p({ sku: 'EV-SNG-350-12', name: 'Envo EV-SNG-350-12 LED Driver 300W 12V Waterproof IP67 25A', series: 'envo_sng', operation_mode: 'cv', power_w: 300, output_voltage_v: 12, waterproof: 'ip67' }),
      p({ sku: 'EV-SNG-350-24', name: 'Envo EV-SNG-350-24 LED Driver 350W 24V Waterproof IP67', series: 'envo_sng', operation_mode: 'cv', power_w: 350, output_voltage_v: 24, waterproof: 'ip67' }),
    ]
    const card = cardFor(DRIVERS, products, 'envo_sng')
    expect(card.name).toBe('SNG Waterproof High-Power Driver')
    expect(card.desc).not.toMatch(/models in the .* range/i)
    expect(card.desc.length).toBeGreaterThan(20)
  })

  it('a series with no authored meta gets an empty desc, not the count fallback', () => {
    const products = [p({ sku: 'ZZ-1', series: 'zz_unknown', family: 'psu_led_cv' })]
    const card = cardFor(DRIVERS, products, 'zz_unknown')
    expect(card.desc).toBe('')
  })
})

// ── facet derivations ───────────────────────────────────────────────────────
describe('driver facet derivation', () => {
  it('derives triac from the product name when dimming_control is empty (SP)', () => {
    const products = [p({ sku: 'EV-SP-30-12US-TDM', name: 'ENVO EV-SP-30-12US-TDM Triac Dimmable LED Driver 30W 12V 2.5A', series: 'envo_sp_us', operation_mode: 'cv', power_w: 30, output_voltage_v: 12, waterproof: 'ip20' })]
    const card = cardFor(DRIVERS, products, 'envo_sp_us')
    expect(card.facets.dimming).toContain('triac')
    expect(card.chips[0]).toBe('Triac dimmable')
  })

  it('derives non-dimmable from the product name (KVS)', () => {
    const products = [p({ sku: 'KVS-24096-A', name: 'ENVO KVS-24096-A 96W 24V Non-Dimmable LED Driver 4A', series: null, operation_mode: 'cv', power_w: 96, output_voltage_v: 24 })]
    const card = cardFor(DRIVERS, products, 'other')
    expect(card.facets.dimming).toContain('none')
  })

  it('buckets power into the four selector bands', () => {
    const products = [
      p({ sku: 'A', power_w: 15 }), p({ sku: 'B', power_w: 60 }),
      p({ sku: 'C', power_w: 100 }), p({ sku: 'D', power_w: 300 }),
    ]
    const card = cardFor(DRIVERS, products, 'sc_envo')
    expect(card.facets.power).toEqual(['p30', 'p75', 'p150', 'p151'])
  })

  it('maps waterproof to environment; IP67 is also outdoor', () => {
    const outdoor = cardFor(DRIVERS, [p({ sku: 'A', series: 'envo_sng', waterproof: 'ip67' })], 'envo_sng')
    expect(outdoor.facets.environment).toEqual(expect.arrayContaining(['outdoor', 'ip67']))
    const indoor = cardFor(DRIVERS, [p({ sku: 'B', series: 'envo_se_us', waterproof: 'ip20' })], 'envo_se_us')
    expect(indoor.facets.environment).toEqual(['indoor'])
  })

  it('output-voltage facet keeps only the 12/24/48 selector values', () => {
    const products = [
      p({ sku: 'A', output_voltage_v: 12 }), p({ sku: 'B', output_voltage_v: 24 }),
      p({ sku: 'C', output_voltage_v: 40 }),
    ]
    const card = cardFor(DRIVERS, products, 'sc_envo')
    expect(card.facets.outv).toEqual(['12', '24'])
  })

  it('derives linear form factor from product names', () => {
    const products = [p({ sku: 'EV-SNL-100-12', name: 'Envo EV-SNL-100-12 Linear Type LED Driver 100W 12V', power_w: 100 })]
    const card = cardFor(DRIVERS, products, 'sc_envo')
    expect(card.facets.formfactor).toContain('linear')
  })
})

// ── chips: priority order + cap ─────────────────────────────────────────────
describe('card chips', () => {
  it('orders dimming → CV/CC → voltage → environment → form factor and caps at 5', () => {
    const products = [
      p({ sku: 'A', name: 'Triac Dimmable Linear Type LED Driver', series: 'envo_sp_us', operation_mode: 'cv', dimming_control: ['triac'], power_w: 200, output_voltage_v: 12, waterproof: 'ip67' }),
      p({ sku: 'B', name: 'Triac Dimmable Linear Type LED Driver', series: 'envo_sp_us', operation_mode: 'cv', dimming_control: ['triac'], power_w: 30, output_voltage_v: 24, waterproof: 'ip67' }),
    ]
    const card = cardFor(DRIVERS, products, 'envo_sp_us')
    expect(card.chips.length).toBeLessThanOrEqual(5)
    const order = ['Triac dimmable', 'Constant voltage', '12 / 24 V', 'IP67']
    expect(card.chips.slice(0, 4)).toEqual(order)
  })
})

// ── per-family facet groups ─────────────────────────────────────────────────
describe('per-family filter groups', () => {
  const driverProducts = [
    p({ sku: 'A', series: 'envo_se_us', operation_mode: 'cv', power_w: 15, output_voltage_v: 12, waterproof: 'ip20' }),
    p({ sku: 'B', series: 'envo_sng', operation_mode: 'cv', power_w: 300, output_voltage_v: 24, waterproof: 'ip67' }),
    p({ sku: 'C', name: 'Triac Dimmable Driver', series: 'envo_sp_us', operation_mode: 'cc', power_w: 60, output_voltage_v: 48, waterproof: 'ip20' }),
  ]

  it('led-drivers gets the driver-selection facets', () => {
    const groups = buildGroups(buildCards(DRIVERS, driverProducts), 'led-drivers')
    const keys = groups.map((g) => g.key)
    expect(keys).toEqual(expect.arrayContaining(['outv', 'power', 'environment', 'opmode']))
    expect(keys).not.toContain('cct')
    expect(keys).not.toContain('brightness')
  })

  it('control-gear gets protocol only — never the driver facets', () => {
    const controlProducts = [
      p({ sku: 'CA-1', family: 'psu_led_controller', series: 'envo_casambi', dimming_control: ['casambi'], power_w: 192 }),
      p({ sku: 'ZB-1', family: 'psu_led_controller', series: 'envo_zigbee', dimming_control: ['zigbee', 'dali'], power_w: 96 }),
    ]
    const groups = buildGroups(buildCards(CONTROL, controlProducts), 'control-gear')
    expect(groups.map((g) => g.key)).toEqual(['protocol'])
  })

  it('accessories get no facet groups', () => {
    const acc = [
      p({ sku: 'S-1', family: 'sensor', series: 'envo_sensor', power_w: 150 }),
      p({ sku: 'S-2', family: 'accessory_general', series: null }),
    ]
    expect(buildGroups(buildCards(ACCESSORIES, acc), 'accessories')).toEqual([])
  })

  it('the all-families view keeps the generic groups', () => {
    const groups = buildGroups(buildCards(DRIVERS, driverProducts))
    const keys = groups.map((g) => g.key)
    expect(keys).not.toContain('power')
    expect(keys).not.toContain('environment')
  })
})

// ── sections ────────────────────────────────────────────────────────────────
describe('card sections', () => {
  it('driver cards carry their CV/CC section title', () => {
    const products = [
      p({ sku: 'A', series: 'envo_se_us', family: 'psu_led_cv' }),
      p({ sku: 'B', series: 'sr_triac', family: 'psu_led_cc' }),
    ]
    const cards = buildCards(DRIVERS, products)
    expect(cards.map((c) => c.section)).toEqual(['Constant-voltage drivers', 'Constant-current drivers'])
  })
})
