import { describe, it, expect } from 'vitest'
import {
  buildCards,
  buildGroups,
  buildControlGearProductCards,
  buildDriverProductCards,
  buildAccessoryProductCards,
  buildProductCardsFor,
} from './catalogue-data'
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

  it('control-gear gets protocol/function/control-type/channels — never the driver facets', () => {
    const controlProducts = [
      p({ sku: 'CA-1', name: 'ENVO Casambi Low Voltage Controller, 12-48V 5 Channel', family: 'psu_led_controller', series: 'envo_casambi', dimming_control: ['casambi'], controller_type: ['rgbw'], output_channel: '5_channel' }),
      p({ sku: 'ZB-1', name: 'ENVO ZigBee Single Colour Mini Controller 1 Channel', family: 'psu_led_controller', series: 'envo_zigbee', dimming_control: ['zigbee'], controller_type: ['dimming'], output_channel: '1ch' }),
      p({ sku: 'ZB-2', name: 'ENVO ZigBee Classic Remote Single Colour - 4 Zones', family: 'psu_led_controller', series: 'envo_zigbee', dimming_control: ['zigbee'] }),
    ]
    const groups = buildGroups(buildCards(CONTROL, controlProducts), 'control-gear')
    expect(groups.map((g) => g.key)).toEqual(['protocol', 'function', 'controltype', 'channels'])
  })

  it('per-SKU pages put the series picker first (BounceLED-style)', () => {
    const skuCards = [
      p({ sku: 'A1', name: 'Envo A1 LED Driver 30W 12V', series: 'envo_se_us', operation_mode: 'cv', power_w: 30, output_voltage_v: 12 }),
      p({ sku: 'B1', name: 'Envo B1 LED Driver 300W 24V', series: 'envo_sng', operation_mode: 'cv', power_w: 300, output_voltage_v: 24 }),
    ]
    const groups = buildGroups(buildDriverProductCards(DRIVERS, skuCards), 'led-drivers')
    expect(groups[0].key).toBe('series')
    expect(groups[0].options.length).toBe(2)
    // options are the customer-facing series titles, alphabetically ordered
    const labels = groups[0].options.map((o) => o.label)
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b)))
  })

  it('control-gear never shows size or the driver facets', () => {
    const controlProducts = [
      p({ sku: 'A', family: 'psu_led_controller', series: 'envo_zigbee', dimming_control: ['zigbee'], power_w: 96, length_mm: 20 }),
      p({ sku: 'B', family: 'psu_led_controller', series: 'envo_dali', dimming_control: ['dali'], power_w: 300, length_mm: 200 }),
    ]
    const keys = buildGroups(buildCards(CONTROL, controlProducts), 'control-gear').map((g) => g.key)
    for (const k of ['size', 'power', 'outv', 'environment', 'formfactor', 'voltage']) expect(keys).not.toContain(k)
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

  it('the all-families view puts the Category picker first, in nav order', () => {
    const cards = [
      ...buildCards(DRIVERS, driverProducts),
      ...buildCards(CONTROL, [p({ sku: 'Z1', family: 'psu_led_controller', series: 'envo_zigbee', dimming_control: ['zigbee'] })]),
    ]
    const groups = buildGroups(cards)
    expect(groups[0].key).toBe('family')
    expect(groups[0].options.map((o) => o.label)).toEqual(['LED Drivers', 'Control Gear'])
  })
})

// ── control-gear facet derivations ──────────────────────────────────────────
describe('control-gear derivations', () => {
  const card1 = (over: Record<string, unknown>) =>
    cardFor(CONTROL, [p({ family: 'psu_led_controller', series: 'envo_zigbee', ...over })], 'envo_zigbee')

  it('derives function from names: dimmer beats wall, sensor beats dimming mention', () => {
    expect(card1({ sku: 'A', name: 'ENVO ZigBee US Standard Push Button Smart Dimmer' }).facets.function).toEqual(['dimmer'])
    expect(card1({ sku: 'B', name: 'ENVO ZigBee 2Gang In-wall Switch - On/Off Control' }).facets.function).toEqual(['wall-switch'])
    expect(card1({ sku: 'C', name: 'ENVO ZigBee Ceiling Mounted Microwave Sensor, 0-10V Dimming' }).facets.function).toEqual(['sensor'])
    expect(card1({ sku: 'D', name: 'ENVO DALI2 Relay On/Off Control + DALI2 to 0/1-10V Conveter' }).facets.function).toEqual(['relay-converter'])
    expect(card1({ sku: 'E', name: 'ENVO ZigBee Gateway Smart Hub' }).facets.function).toEqual(['gateway'])
    expect(card1({ sku: 'F', name: 'ENVO ZigBee Self-powered Remote' }).facets.function).toEqual(['remote'])
    expect(card1({ sku: 'G', name: 'ENVO ZigBee Blinds Controller - On/Off and Level Control' }).facets.function).toEqual(['controller'])
  })

  it('derives protocol from the name when dimming_control is empty (DALI2 wall panels, ZigbBee typo)', () => {
    expect(card1({ sku: 'A', name: 'ENVO DALI2 Wall Panel, 8 Buttons, White', dimming_control: [] }).facets.protocol).toEqual(['dali'])
    expect(card1({ sku: 'B', name: 'ENVO ZigbBee Mini In Wall AC Phase Smart Dimmer', dimming_control: [] }).facets.protocol).toEqual(['zigbee'])
  })

  it('derives channels from output_channel codes and name fallback', () => {
    expect(card1({ sku: 'A', output_channel: '1ch' }).facets.channels).toEqual(['1'])
    expect(card1({ sku: 'B', output_channel: '5_channel' }).facets.channels).toEqual(['5'])
    expect(card1({ sku: 'C', output_channel: '4a_5ch' }).facets.channels).toEqual(['5'])
    expect(card1({ sku: 'D', name: 'ENVO PRO DALI2 DT8 LED Controller RGBWW 5 CH 12-36VDC' }).facets.channels).toEqual(['5'])
  })

  it('derives control type from controller_type tags and RGBWW names', () => {
    expect(card1({ sku: 'A', controller_type: ['ct', 'dimming', 'rgb', 'rgb_cct', 'rgbw'] }).facets.controltype)
      .toEqual(expect.arrayContaining(['ct', 'single', 'rgb', 'rgb_cct', 'rgbw']))
    expect(card1({ sku: 'B', name: 'ENVO PRO DALI2 DT8 LED Controller RGBWW 5 CH' }).facets.controltype).toEqual(['rgb_cct'])
  })
})

// ── control-gear SKU cards (post-refactor parity) ───────────────────────────
describe('control-gear SKU cards (post-refactor parity)', () => {
  const products = [
    p({ sku: 'CA-1', name: 'ENVO Casambi Low Voltage Controller, 12-48V 5 Channel',
        family: 'psu_led_controller', series: 'envo_casambi', dimming_control: ['casambi'],
        controller_type: ['rgbw'], output_channel: '5_channel', spec_sheet_url: 'x.pdf' }),
  ]
  const [card] = buildControlGearProductCards(CONTROL, products)

  it('is one card per SKU carrying the SKU and per-unit facts', () => {
    expect(card.sku).toBe('CA-1')
    expect(card.modelCount).toBe(1)
    expect(card.facts?.length).toBeGreaterThan(0)
    expect(card.facets.protocol).toEqual(['casambi'])
    expect(card.facets.channels).toEqual(['5'])
  })
  it('never surfaces a price', () => {
    expect(JSON.stringify(card)).not.toMatch(/nzd|price/i)
  })
})

// ── driver SKU cards ────────────────────────────────────────────────────────
describe('driver SKU cards', () => {
  it('emits one card per SKU with driver facets and human-readable facts', () => {
    const products = [
      p({ sku: 'EV-SNG-350-24', name: 'Envo EV-SNG-350-24 LED Driver 350W 24V Waterproof IP67',
          series: 'envo_sng', operation_mode: 'cv', power_w: 350, output_voltage_v: 24, waterproof: 'ip67' }),
    ]
    const [card] = buildDriverProductCards(DRIVERS, products)
    expect(card.sku).toBe('EV-SNG-350-24')
    expect(card.modelCount).toBe(1)
    expect(card.facets.outv).toEqual(['24'])
    expect(card.facets.power).toEqual(['p151'])
    expect(card.facets.opmode).toEqual(['cv'])
    expect(card.facets.environment).toEqual(expect.arrayContaining(['outdoor', 'ip67']))
    expect(card.facts).toEqual(expect.arrayContaining(['350 W', '24 V', 'Constant voltage', 'IP67']))
  })

  it('derives triac dimming from the name when dimming_control is empty', () => {
    const products = [
      p({ sku: 'EV-SP-30-12US-TDM', name: 'ENVO EV-SP-30-12US-TDM Triac Dimmable LED Driver 30W 12V',
          series: 'envo_sp_us', operation_mode: 'cv', power_w: 30, output_voltage_v: 12, waterproof: 'ip20' }),
    ]
    const [card] = buildDriverProductCards(DRIVERS, products)
    expect(card.facets.dimming).toContain('triac')
    expect(card.chips[0]).toBe('Triac dimmable')
  })

  it('sorts CV before CC then by name', () => {
    const products = [
      p({ sku: 'B-CC', name: 'B CC', series: 'sr_triac', family: 'psu_led_cc', operation_mode: 'cc' }),
      p({ sku: 'A-CV', name: 'A CV', series: 'envo_se_us', family: 'psu_led_cv', operation_mode: 'cv' }),
    ]
    const cards = buildDriverProductCards(DRIVERS, products)
    expect(cards.map((c) => c.sku)).toEqual(['A-CV', 'B-CC'])
  })

  it('never surfaces a price', () => {
    const products = [p({ sku: 'X', series: 'envo_sng', power_w: 100, output_voltage_v: 24, price_nzd: 99 })]
    expect(JSON.stringify(buildDriverProductCards(DRIVERS, products))).not.toMatch(/nzd|"price"/i)
  })
})

// ── accessory SKU cards ─────────────────────────────────────────────────────
describe('accessory SKU cards', () => {
  it('emits one card per SKU with material/IP facts and no forced facets', () => {
    const products = [
      p({ sku: 'ACC-1', name: 'ENVO Aluminium Mounting Clip', family: 'accessory_general',
          series: null, material: 'Aluminium', waterproof: 'ip65' }),
    ]
    const [card] = buildAccessoryProductCards(ACCESSORIES, products)
    expect(card.sku).toBe('ACC-1')
    expect(card.modelCount).toBe(1)
    expect(card.facts).toEqual(expect.arrayContaining(['Aluminium', 'IP65']))
    expect(card.facets).toEqual({ family: ['Accessories'] }) // no spec facets; null series ≠ an "Other" option
  })

  it('never surfaces a price', () => {
    const products = [p({ sku: 'ACC-2', family: 'accessory_general', price_nzd: 5 })]
    expect(JSON.stringify(buildAccessoryProductCards(ACCESSORIES, products))).not.toMatch(/nzd|"price"/i)
  })
})

// ── per-family card dispatcher ──────────────────────────────────────────────
describe('per-family card dispatcher', () => {
  const one = (over: Record<string, unknown>) => [p(over)]

  it('drivers/control-gear/accessories → per-SKU productGrid', () => {
    for (const [slug, fam] of [['led-drivers', DRIVERS], ['control-gear', CONTROL], ['accessories', ACCESSORIES]] as const) {
      const r = buildProductCardsFor(slug, fam, one({ sku: `${slug}-1`, series: 'sc_envo', family: 'psu_led_cv' }))
      expect(r.layout).toBe('productGrid')
      expect(r.resultKind).toBe('products')
      expect(r.cards[0].sku).toBe(`${slug}-1`)
    }
  })

  it('signage → series cards in productGrid layout (no per-SKU explosion)', () => {
    const SIGNAGE = PRODUCT_FAMILIES.find((f) => f.slug === 'led-signage-modules')!
    const r = buildProductCardsFor('led-signage-modules', SIGNAGE, [
      p({ sku: 'EV-A', series: 'envo_ecoglo', cct_k: 4000 }),
      p({ sku: 'EV-B', series: 'envo_ecoglo', cct_k: 6500 }),
    ])
    expect(r.layout).toBe('productGrid')
    expect(r.resultKind).toBe('series')
    expect(r.cards).toHaveLength(1) // one series card, not two SKU cards
    expect(r.cards[0].sku).toBeUndefined()
    expect(r.cards[0].ctaLabel).toBe('View series') // never the grid's "View product" default
  })
})

// ── sensor family lives under control-gear ──────────────────────────────────
describe('sensor family placement', () => {
  it('maps the sensor DB family to control-gear, leaving accessories to accessory_general', async () => {
    const { dbFamilyToMarketing, marketingFamilyToDbFamilies } = await import('@/data/family-map')
    expect(dbFamilyToMarketing('sensor')?.slug).toBe('control-gear')
    expect(marketingFamilyToDbFamilies('accessories')).toEqual(['accessory_general'])
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
