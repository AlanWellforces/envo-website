import { describe, it, expect } from 'vitest'
import { pickRelatedProducts } from './related-series'
import type { Product } from './products'

const p = (over: Partial<Product> & Record<string, unknown>): Product => ({
  sku: 'X', name: 'n', family: 'led_module', series: null, brand: 'ENVO',
  subtitle: null, short_description: null, description: null, enabled: true,
  hidden: false, image_url_fallback: null, clean_image_url_fallback: null,
  spec_sheet_url: null,
  ...over,
} as unknown as Product)

const modules = [
  p({ sku: 'EV-BLML01LBY-NW', series: 'envo_minilux' }),
  p({ sku: 'EV-BLEG02LBY-NW', series: 'envo_ecoglo', clean_image_url_fallback: 'https://s3/ecoglo2.jpg' }),
  // CCT twins of the models above — must collapse into the NW representative
  p({ sku: 'EV-BLEG02LBY-WW', series: 'envo_ecoglo' }),
  p({ sku: 'EV-BLEG02LBY-CW', series: 'envo_ecoglo' }),
  p({ sku: 'EV-BLEG03LBY-NW', series: 'envo_ecoglo', clean_image_url_fallback: 'https://s3/ecoglo3.jpg' }),
  p({ sku: 'EV-BLEG03LBY-WW', series: 'envo_ecoglo' }),
  p({ sku: 'EV-BLUF02LBY-NW', series: 'envo_ultraflare' }),
  p({ sku: 'EV-BLCF03LBY-RGB', series: 'envo_chromaflux', clean_image_url_fallback: 'https://s3/rgb.jpg' }),
  p({ sku: 'EV-BLOL06LBY-NW', series: 'envo_optilume' }),
]
const drivers = [
  p({ sku: 'EV-SE-15-12US', series: 'envo_se_us', family: 'psu_led_cv', power_w: 15, output_voltage_v: 12 }),
  p({ sku: 'EV-SE-15-24US', series: 'envo_se_us', family: 'psu_led_cv', power_w: 15, output_voltage_v: 24 }),
  p({ sku: 'EV-SE-20-24US', series: 'envo_se_us', family: 'psu_led_cv', power_w: 20, output_voltage_v: 24 }),
  p({ sku: 'EV-SL-100-12US', series: 'envo_sl_us', family: 'psu_led_cv', power_w: 100, output_voltage_v: 12 }),
  p({ sku: 'EV-SP-30-12US', series: 'envo_sp_us', family: 'psu_led_cv', power_w: 30, output_voltage_v: 12, clean_image_url_fallback: 'https://s3/sp.jpg' }),
  // unmapped/gated series must never surface
  p({ sku: 'SC-10-12', series: 'sc_envo', family: 'psu_led_cv', power_w: 10, output_voltage_v: 12 }),
]
const controls = [
  p({ sku: 'SR-2309PRO-5C', name: 'Zigbee Remote 5C', series: 'envo_zigbee', family: 'psu_led_controller' }),
  p({ sku: 'EV-ZBDIM-01', name: 'Zigbee Dimmer', series: 'envo_zigbee', family: 'psu_led_controller' }),
  // zigbee-series SENSOR: must never beat in-chain gear as the control pick
  p({ sku: 'EV-ZB9032A-PIR', name: 'Zigbee PIR Motion Sensor', series: 'envo_zigbee', family: 'sensor' }),
  p({ sku: 'EV-PIR-01', name: 'PIR Motion Sensor', series: null, family: 'sensor' }),
]

const byFamily = {
  'led-signage-modules': modules,
  'led-drivers': drivers,
  'control-gear': controls,
}

const current = (arr: Product[], sku: string) => arr.find((x) => x.sku === sku)!

describe('pickRelatedProducts', () => {
  it('module page: concrete driver + control SKUs linking to their detail pages, then a series sibling', () => {
    const rel = pickRelatedProducts('led-signage-modules', current(modules, 'EV-BLEG02LBY-NW'), byFamily)
    expect(rel).toHaveLength(3)
    // 12 V modules → median of the 12 V CV drivers (15/30/100 W → 30 W)
    expect(rel[0]).toMatchObject({ name: 'EV-SP-30-12US', href: '/products/led-drivers/EV-SP-30-12US' })
    expect(rel[0].kicker).toBe('LED Drivers · Screw Terminal')
    expect(rel[1].href).toMatch(/^\/products\/control-gear\//)
    // sibling = next model in the same series
    expect(rel[2]).toMatchObject({ name: 'EV-BLEG03LBY-NW', href: '/products/led-signage-modules/EV-BLEG03LBY-NW', kicker: 'Also in Signage Modules' })
  })

  it('24 V driver pairs with a 24 V-rail module (OptiLume); 12 V driver with an Eco module', () => {
    const rel24 = pickRelatedProducts('led-drivers', current(drivers, 'EV-SE-15-24US'), byFamily)
    expect(rel24[0].name).toBe('EV-BLOL06LBY-NW')
    const rel12 = pickRelatedProducts('led-drivers', current(drivers, 'EV-SE-15-12US'), byFamily)
    expect(rel12[0].name).toMatch(/^EV-BLEG/)
  })

  it('driver sibling = adjacent model on the SAME voltage rail, wrapping', () => {
    // 15-24 → 20-24 (stays 24 V), never the 12 V twin
    const rel = pickRelatedProducts('led-drivers', current(drivers, 'EV-SE-15-24US'), byFamily)
    expect(rel[2]).toMatchObject({ name: 'EV-SE-20-24US', kicker: 'Also in LED Drivers' })
    // last 24 V model wraps back to the head of the series list
    const relLast = pickRelatedProducts('led-drivers', current(drivers, 'EV-SE-20-24US'), byFamily)
    expect(relLast[2].name).toBe('EV-SE-15-12US')
  })

  it('control pick prefers in-chain gear (receiver/dimmer) over sensors', () => {
    const rel = pickRelatedProducts('led-signage-modules', current(modules, 'EV-BLEG02LBY-NW'), byFamily)
    expect(rel[1].name).toMatch(/^(SR-2309PRO-5C|EV-ZBDIM-01)$/)
  })

  it('never recommends a CCT variant: module picks are the NW model face, siblings skip CCT twins', () => {
    // 12 V driver → Eco module: the -WW/-CW twins collapse into the NW face
    const rel12 = pickRelatedProducts('led-drivers', current(drivers, 'EV-SE-15-12US'), byFamily)
    expect(rel12[0].name).toMatch(/-NW$/)
    // module sibling = the next MODEL, never the same model's -WW twin
    const rel = pickRelatedProducts('led-signage-modules', current(modules, 'EV-BLEG02LBY-NW'), byFamily)
    expect(rel[2].name).toBe('EV-BLEG03LBY-NW')
    // …even when the page itself is a -WW variant
    const relWw = pickRelatedProducts('led-signage-modules', current(modules, 'EV-BLEG02LBY-WW'), byFamily)
    expect(relWw[2].name).toBe('EV-BLEG03LBY-NW')
  })

  it('RGB context prefers the 5C zigbee receiver; zigbee control pairs with an RGB module', () => {
    const relRgb = pickRelatedProducts('led-signage-modules', current(modules, 'EV-BLCF03LBY-RGB'), byFamily)
    expect(relRgb[1].name).toBe('SR-2309PRO-5C')
    const relZb = pickRelatedProducts('control-gear', current(controls, 'SR-2309PRO-5C'), byFamily)
    expect(relZb.map((r) => r.name)).toContain('EV-BLCF03LBY-RGB')
  })

  it('single-product series falls back to the next category for the sibling card', () => {
    // SR-2309PRO-5C shares envo_zigbee with the dimmer → sibling is the dimmer;
    // the PIR sensor (its own category, single product) falls back across categories
    const relSensor = pickRelatedProducts('control-gear', current(controls, 'EV-PIR-01'), byFamily)
    expect(relSensor[2].name).toMatch(/^(SR-2309PRO-5C|EV-ZBDIM-01)$/)
  })

  it('never surfaces gated/unmapped series and encodes special characters in hrefs', () => {
    const rel12 = pickRelatedProducts('led-drivers', current(drivers, 'EV-SE-15-12US'), byFamily)
    expect(rel12.map((r) => r.name)).not.toContain('SC-10-12')
    const rel = pickRelatedProducts('led-signage-modules', current(modules, 'EV-BLEG02LBY-NW'), {
      ...byFamily,
      'control-gear': [p({ sku: 'EV-ZB2835PAC(US)', name: 'Zigbee Receiver', series: 'envo_zigbee', family: 'psu_led_controller' })],
    })
    // encodeURIComponent leaves () raw — same shape the catalogue grid links use
    expect(rel[1].href).toBe('/products/control-gear/EV-ZB2835PAC(US)')
  })

  it('uses the paired product own image and skips families with no products', () => {
    const rel = pickRelatedProducts('led-signage-modules', current(modules, 'EV-BLEG02LBY-NW'), byFamily)
    expect(rel[0].image.src).toBe('https://s3/sp.jpg')
    const noModules = pickRelatedProducts('control-gear', current(controls, 'SR-2309PRO-5C'), {
      'control-gear': controls,
      'led-drivers': drivers,
    })
    expect(noModules.every((r) => !r.href.includes('led-signage-modules'))).toBe(true)
  })
})
