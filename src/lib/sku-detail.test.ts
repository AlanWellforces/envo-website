import { describe, it, expect } from 'vitest'
import { buildSkuDetailProps } from './sku-detail'
import { PRODUCT_FAMILIES } from '@/data/product-families'
import type { Product } from '@/lib/products'

const DRIVERS = PRODUCT_FAMILIES.find((f) => f.slug === 'led-drivers')!
const mk = (over: Partial<Product> & Record<string, unknown>): Product => ({
  id: 1, sku: 'X', name: 'n', family: 'psu_led_cv', series: 'envo_sng', brand: 'ENVO',
  spec_sheet_url: null, power_w: null, output_voltage_v: null, operation_mode: null,
  dimming_control: [], waterproof: null, standards_met: [], length_mm: null, width_mm: null, height_mm: null,
  ...over,
} as unknown as Product)

describe('buildSkuDetailProps', () => {
  const current = mk({ sku: 'EV-SNG-350-24', name: 'SNG 350W 24V', power_w: 350, output_voltage_v: 24, operation_mode: 'cv', waterproof: 'ip67', spec_sheet_url: 's.pdf' })
  const sibling = mk({ sku: 'EV-SNG-350-12', name: 'SNG 300W 12V', power_w: 300, output_voltage_v: 12, operation_mode: 'cv', waterproof: 'ip67' })

  it('keeps every sibling in the compare table and tags only the viewed SKU as current', () => {
    const props = buildSkuDetailProps(DRIVERS, current, [current, sibling])
    expect(props.variants).toHaveLength(2) // the classic series compare table
    const cur = props.variants.find((v) => v.modelCode === 'EV-SNG-350-24')!
    const sib = props.variants.find((v) => v.modelCode === 'EV-SNG-350-12')!
    expect(cur.current).toBe(true)
    expect(sib.current).toBeUndefined()
  })

  it('scopes the hero to the single product', () => {
    const props = buildSkuDetailProps(DRIVERS, current, [current, sibling])
    expect(props.title).toBe('SNG 350W 24V') // product name, never a series title
    expect(props.breadcrumb.seriesLabel).toBe('EV-SNG-350-24') // crumb ends on the SKU
    expect(props.heroStage).toHaveLength(1) // one product image, no sibling collage
    // exact key specs from THIS product only — never a series-wide range
    const power = props.keySpecs?.find((s) => s.label === 'Power range')
    expect(power?.value).toBe('350 W')
    expect(props.datasheetUrl).toBeTruthy()
    expect(props.downloads?.[0]?.name).toBe('EV-SNG-350-24 datasheet')
  })

  it('falls back to a single full-spec panel for a singleton series', () => {
    const props = buildSkuDetailProps(DRIVERS, current, [current])
    expect(props.variants).toHaveLength(1)
  })

  it('never includes a price field', () => {
    const props = buildSkuDetailProps(DRIVERS, mk({ sku: 'Y', price_nzd: 9 }), [mk({ sku: 'Y' })])
    expect(JSON.stringify(props)).not.toMatch(/nzd|"price"/i)
  })
})
