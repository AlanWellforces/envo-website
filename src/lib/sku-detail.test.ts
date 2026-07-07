import { describe, it, expect } from 'vitest'
import { pickCompareLayout, buildSkuDetailProps, compareColumnsFor } from './sku-detail'
import { PRODUCT_FAMILIES } from '@/data/product-families'
import type { Product } from '@/lib/products'

const DRIVERS = PRODUCT_FAMILIES.find((f) => f.slug === 'led-drivers')!
const mk = (over: Partial<Product> & Record<string, unknown>): Product => ({
  id: 1, sku: 'X', name: 'n', family: 'psu_led_cv', series: 'envo_sng', brand: 'ENVO',
  spec_sheet_url: null, power_w: null, output_voltage_v: null, operation_mode: null,
  dimming_control: [], waterproof: null, standards_met: [], length_mm: null, width_mm: null, height_mm: null,
  ...over,
} as unknown as Product)

describe('pickCompareLayout', () => {
  it('renders nothing for a singleton series', () => {
    expect(pickCompareLayout(1)).toBe('none')
    expect(pickCompareLayout(0)).toBe('none')
  })
  it('uses a horizontal table for 2–6', () => {
    for (const n of [2, 3, 6]) expect(pickCompareLayout(n)).toBe('horizontal')
  })
  it('uses a row-based table for >6', () => {
    for (const n of [7, 12, 40]) expect(pickCompareLayout(n)).toBe('rows')
  })
})

describe('buildSkuDetailProps', () => {
  const current = mk({ sku: 'EV-SNG-350-24', name: 'SNG 350W 24V', power_w: 350, output_voltage_v: 24, operation_mode: 'cv', waterproof: 'ip67', spec_sheet_url: 's.pdf' })
  const sibling = mk({ sku: 'EV-SNG-350-12', name: 'SNG 300W 12V', power_w: 300, output_voltage_v: 12, operation_mode: 'cv', waterproof: 'ip67' })

  it('marks the current SKU and links siblings to their SKU pages', () => {
    const props = buildSkuDetailProps(DRIVERS, current, [current, sibling])
    expect(props.compare.currentSku).toBe('EV-SNG-350-24')
    expect(props.compare.layout).toBe('horizontal') // 2 products
    const cur = props.compare.rows.find((r) => r.sku === 'EV-SNG-350-24')!
    const sib = props.compare.rows.find((r) => r.sku === 'EV-SNG-350-12')!
    expect(cur.isCurrent).toBe(true)
    expect(sib.isCurrent).toBe(false)
    expect(sib.href).toBe('/products/led-drivers/EV-SNG-350-12')
  })

  it('reuses the merged series-page layout scoped to the single product', () => {
    const props = buildSkuDetailProps(DRIVERS, current, [current, sibling])
    expect(props.merged.title).toBe('SNG 350W 24V') // product name, never a series title
    expect(props.merged.breadcrumb.seriesLabel).toBe('EV-SNG-350-24') // crumb ends on the SKU
    expect(props.merged.variants).toHaveLength(1) // single full-spec panel, not a range compare
    expect(props.merged.variants[0].modelCode).toBe('EV-SNG-350-24')
    // exact key specs from THIS product only
    const power = props.merged.keySpecs?.find((s) => s.label === 'Power range')
    expect(power?.value).toBe('350 W')
    expect(props.merged.datasheetUrl).toBeTruthy()
    expect(props.merged.downloads?.[0]?.name).toBe('EV-SNG-350-24 datasheet')
  })

  it('drops the compare block for a singleton series', () => {
    const props = buildSkuDetailProps(DRIVERS, current, [current])
    expect(props.compare.layout).toBe('none')
  })

  it('never includes a price field', () => {
    const props = buildSkuDetailProps(DRIVERS, mk({ sku: 'Y', price_nzd: 9 }), [mk({ sku: 'Y' })])
    expect(JSON.stringify(props)).not.toMatch(/nzd|"price"/i)
  })
})

describe('compareColumnsFor', () => {
  it('gives drivers power/voltage/dimming/mode/IP columns', () => {
    const keys = compareColumnsFor('led-drivers').map((c) => c.key)
    expect(keys).toEqual(expect.arrayContaining(['power', 'outv', 'dimming', 'opmode', 'ip']))
  })
})
