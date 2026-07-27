import { describe, expect, test } from 'vitest'
import { productLiveUrl, productPaths } from './product-paths'

describe('productLiveUrl', () => {
  test('driver SKU → its model detail page', () => {
    expect(productLiveUrl({ sku: 'EV-SL-100-24', family: 'psu_led_cv', series: null })).toBe(
      '/products/led-drivers/EV-SL-100-24',
    )
  })

  test('module SKU with CCT suffix → model-grain page (stripped code)', () => {
    expect(productLiveUrl({ sku: 'EV-BLML01LBY-NW', family: 'led_module', series: 'envo_minilux' })).toBe(
      '/products/led-signage-modules/EV-BLML01LBY',
    )
  })

  test('no family (Akeneo shell) → null, no page exists', () => {
    expect(productLiveUrl({ sku: 'EV-X-1', family: null, series: null })).toBeNull()
  })

  test('no sku → null', () => {
    expect(productLiveUrl({ sku: null, family: 'psu_led_cv', series: null })).toBeNull()
  })
})

describe('productPaths (existing behaviour untouched)', () => {
  test('driver product still lists catalogue + family + model paths', () => {
    const paths = productPaths({ sku: 'EV-SL-100-24', family: 'psu_led_cv', series: null })
    expect(paths).toContain('/products')
    expect(paths).toContain('/products/led-drivers')
    expect(paths).toContain('/products/led-drivers/EV-SL-100-24')
  })
})
