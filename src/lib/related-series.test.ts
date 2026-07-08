import { describe, it, expect } from 'vitest'
import { pickRelatedCategories } from './related-series'
import type { Product } from './products'

const p = (over: Partial<Product> & Record<string, unknown>): Product => ({
  sku: 'X', name: 'n', family: 'led_module', series: null, brand: 'ENVO',
  subtitle: null, short_description: null, description: null, enabled: true,
  hidden: false, image_url_fallback: null, clean_image_url_fallback: null,
  spec_sheet_url: null,
  ...over,
} as unknown as Product)

const modules = [
  p({ sku: 'EV-BLML01LBY-NW', series: 'envo_minilux', clean_image_url_fallback: 'https://s3/minilux.jpg' }),
  p({ sku: 'EV-BLEG02LBY-NW', series: 'envo_ecoglo', clean_image_url_fallback: 'https://s3/ecoglo.jpg' }),
  p({ sku: 'EV-BLEG03LBY-NW', series: 'envo_ecoglo' }),
  p({ sku: 'EV-BLUF02LBY-NW', series: 'envo_ultraflare' }),
  p({ sku: 'EV-BLCF03LBY-RGB', series: 'envo_chromaflux' }),
  p({ sku: 'EV-BLOL06LBY-NW', series: 'envo_optilume', clean_image_url_fallback: 'https://s3/optilume.jpg' }),
]
const drivers = [
  p({ sku: 'EV-SE-15-12US', series: 'envo_se_us', family: 'psu_led_cv', output_voltage_v: 12, clean_image_url_fallback: 'https://s3/se.jpg' }),
  p({ sku: 'EV-SE-15-24US', series: 'envo_se_us', family: 'psu_led_cv', output_voltage_v: 24 }),
  p({ sku: 'EV-SL-100-12US', series: 'envo_sl_us', family: 'psu_led_cv', output_voltage_v: 12 }),
  p({ sku: 'EV-SP-30-12US', series: 'envo_sp_us', family: 'psu_led_cv', output_voltage_v: 12 }),
  // unmapped/gated series never surface as a category card
  p({ sku: 'SC-10-12', series: 'sc_envo', family: 'psu_led_cv' }),
]
const controls = [
  p({ sku: 'SR-2309PRO-5C', name: 'Zigbee Remote 5C', series: 'envo_zigbee', family: 'psu_led_controller', clean_image_url_fallback: 'https://s3/zb.jpg' }),
  p({ sku: 'EV-PIR-01', name: 'PIR Motion Sensor', series: null, family: 'sensor' }),
]

const byFamily = {
  'led-signage-modules': modules,
  'led-drivers': drivers,
  'control-gear': controls,
}

const current = (arr: Product[], sku: string) => arr.find((x) => x.sku === sku)!

describe('pickRelatedCategories', () => {
  it('module page: driver + control categories as filter deep links, then sibling category', () => {
    const rel = pickRelatedCategories('led-signage-modules', current(modules, 'EV-BLEG02LBY-NW'), byFamily)
    expect(rel).toHaveLength(3)
    expect(rel[0]).toMatchObject({ name: 'Screw Terminal', href: '/products/led-drivers?series=Screw%20Terminal', kicker: 'LED Drivers' })
    expect(rel[1]).toMatchObject({ name: 'Zigbee & Smart', href: '/products/control-gear?series=Zigbee%20%26%20Smart' })
    // sibling = next signage category after Eco Series
    expect(rel[2]).toMatchObject({ name: 'Pro Series', href: '/products/led-signage-modules?series=Pro%20Series', kicker: 'Also in Signage Modules' })
  })

  it('sibling category wraps around the order and skips the current one', () => {
    const rel = pickRelatedCategories('led-signage-modules', current(modules, 'EV-BLOL06LBY-NW'), byFamily)
    // 24V Series → Sidelit has no products → wraps to Mini Series
    expect(rel[2].name).toBe('Mini Series')
  })

  it('24 V driver pairs with the 24V Series modules; 12 V with Eco Series', () => {
    const rel24 = pickRelatedCategories('led-drivers', current(drivers, 'EV-SE-15-24US'), byFamily)
    expect(rel24[0]).toMatchObject({ name: '24V Series', href: '/products/led-signage-modules?series=24V%20Series' })
    const rel12 = pickRelatedCategories('led-drivers', current(drivers, 'EV-SE-15-12US'), byFamily)
    expect(rel12[0].name).toBe('Eco Series')
  })

  it('driver sibling skips every category the product itself belongs to', () => {
    // SP is Screw Terminal AND Triac Dimmable → sibling must be Linear
    const rel = pickRelatedCategories('led-drivers', current(drivers, 'EV-SP-30-12US'), byFamily)
    expect(rel[2]).toMatchObject({ name: 'Linear', kicker: 'Also in LED Drivers' })
  })

  it('zigbee control page pairs with RGB Series modules; sensor with Eco Series', () => {
    const relZb = pickRelatedCategories('control-gear', current(controls, 'SR-2309PRO-5C'), byFamily)
    expect(relZb.map((r) => r.name)).toContain('RGB Series')
    const relSensor = pickRelatedCategories('control-gear', current(controls, 'EV-PIR-01'), byFamily)
    expect(relSensor.map((r) => r.name)).toContain('Eco Series')
  })

  it('uses a category member product image, never emits empty categories or Other', () => {
    const rel = pickRelatedCategories('led-signage-modules', current(modules, 'EV-BLEG02LBY-NW'), byFamily)
    expect(rel[0].image.src).toBe('https://s3/se.jpg')
    expect(rel[0].image.local).toBe(false)
    const all = pickRelatedCategories('control-gear', current(controls, 'SR-2309PRO-5C'), byFamily)
    expect(all.every((r) => r.name !== 'Other')).toBe(true)
  })

  it('skips families with no products', () => {
    const rel = pickRelatedCategories('control-gear', current(controls, 'SR-2309PRO-5C'), {
      'control-gear': controls,
      'led-drivers': drivers,
    })
    expect(rel.every((r) => !r.href.includes('led-signage-modules'))).toBe(true)
  })
})
