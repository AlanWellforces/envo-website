import { describe, it, expect } from 'vitest'
import { pickRelatedSeries } from './related-series'
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
]
const drivers = [
  p({ sku: 'SC-10-12', series: 'sc_envo', family: 'psu_led_cv', clean_image_url_fallback: 'https://s3/sc.jpg' }),
  p({ sku: 'SC-20-12', series: 'sc_envo', family: 'psu_led_cv' }),
  p({ sku: 'EV-SE-15-12US', series: 'envo_se_us', family: 'psu_led_cv' }),
]
const controls = [
  p({ sku: 'SR-2309PRO-5C', series: 'envo_zigbee', family: 'psu_led_controller', clean_image_url_fallback: 'https://s3/zb.jpg' }),
]

const byFamily = {
  'led-signage-modules': modules,
  'led-drivers': drivers,
  'control-gear': controls,
}

describe('pickRelatedSeries', () => {
  it('module page: pairs a driver series, control gear, and a sibling module series', () => {
    const rel = pickRelatedSeries('led-signage-modules', 'envo-ecoglo', byFamily)
    expect(rel).toHaveLength(3)
    // largest driver series (sc_envo has 2 products vs 1)
    expect(rel[0].href).toBe('/products/led-drivers/sc-envo')
    expect(rel[1].href).toBe('/products/control-gear/envo-zigbee')
    // sibling = next series after current in first-seen order (ecoglo → ultraflare)
    expect(rel[2].href).toBe('/products/led-signage-modules/envo-ultraflare')
    expect(rel[2].href).not.toContain('envo-ecoglo')
  })

  it('sibling pick wraps around from the last series to the first', () => {
    const rel = pickRelatedSeries('led-signage-modules', 'envo-ultraflare', byFamily)
    expect(rel[2].href).toBe('/products/led-signage-modules/mini-series')
  })

  it('driver page: pairs the largest module series and control gear', () => {
    const rel = pickRelatedSeries('led-drivers', 'envo-se-us', byFamily)
    expect(rel[0].href).toBe('/products/led-signage-modules/envo-ecoglo')
    expect(rel[1].href).toBe('/products/control-gear/envo-zigbee')
    expect(rel[2].href).toBe('/products/led-drivers/sc-envo')
  })

  it('uses the series representative product image, line-art when none', () => {
    const rel = pickRelatedSeries('led-signage-modules', 'envo-ecoglo', byFamily)
    expect(rel[0].image.src).toBe('https://s3/sc.jpg')
    expect(rel[0].image.local).toBe(false)
    // MiniLux's live slug is the 'mini-series' override, not envo-minilux
    const relUltra = pickRelatedSeries('led-signage-modules', 'mini-series', byFamily)
    const sibling = relUltra[2]
    expect(sibling.href).toBe('/products/led-signage-modules/envo-ecoglo')
    expect(sibling.image.src).toBe('https://s3/ecoglo.jpg')
  })

  it('skips families with no products and a family with a single series yields no sibling', () => {
    const rel = pickRelatedSeries('control-gear', 'envo-zigbee', {
      'control-gear': controls,
      'led-drivers': drivers,
    })
    const hrefs = rel.map((r) => r.href)
    expect(hrefs).toContain('/products/led-drivers/sc-envo')
    expect(hrefs.every((h) => !h.includes('led-signage-modules'))).toBe(true)
    expect(hrefs.every((h) => !h.endsWith('/envo-zigbee'))).toBe(true)
  })
})
