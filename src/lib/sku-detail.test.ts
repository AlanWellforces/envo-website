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
    expect(props.title).toBe('EV-SNG-350-24') // H1 = the SKU code, not the spec-soup name
    expect(props.heroSubtitle).toBe('SNG 350W 24V') // descriptive name (brand/SKU stripped)
    expect(props.breadcrumb.seriesLabel).toBe('EV-SNG-350-24') // crumb ends on the SKU
    expect(props.heroStage).toHaveLength(1) // stage = one product image, no sibling collage
    expect(props.thumbs?.[0]?.label).toBe('EV-SNG-350-24') // own tile only — never sibling-model tiles
    expect(props.thumbs?.some((t) => t.label === 'EV-SNG-350-12')).toBe(false)
    // exact key specs from THIS product only — never a series-wide range
    const power = props.keySpecs?.find((s) => s.label === 'Power range')
    expect(power?.value).toBe('350 W')
    expect(props.datasheetUrl).toBeTruthy()
    expect(props.downloads?.[0]?.name).toBe('EV-SNG-350-24 datasheet')
  })

  it('strips the brand and SKU out of the subtitle', () => {
    const p = mk({ sku: 'EV-SNG-350-24', name: 'Envo EV-SNG-350-24 LED Driver 350W 24V Waterproof IP67 14.58A' })
    const props = buildSkuDetailProps(DRIVERS, p, [p])
    expect(props.title).toBe('EV-SNG-350-24')
    expect(props.heroSubtitle).toBe('LED Driver 350W 24V Waterproof IP67 14.58A')
  })

  it('raises the hero key-spec cap to 8 for a fully-specced SKU', () => {
    const p = mk({
      sku: 'EV-FULL-1', name: 'Envo EV-FULL-1 Triac Dimmable LED Driver', power_w: 100, output_voltage_v: 24,
      operation_mode: 'cv', waterproof: 'ip67', dimming_control: ['triac'],
      input_voltage_min_v: 100, input_voltage_max_v: 240, rated_current_a: 4.16,
      length_mm: 200, width_mm: 50, height_mm: 30,
    })
    const props = buildSkuDetailProps(DRIVERS, p, [p])
    expect(props.keySpecs?.length).toBe(8)
    expect(props.keySpecs?.map((s) => s.label)).toEqual(
      expect.arrayContaining(['Power range', 'Output voltage', 'Input voltage', 'Operation mode', 'Dimming', 'IP rating', 'Rated current', 'Dimensions']),
    )
  })

  it('falls back to a single full-spec panel for a singleton series', () => {
    const props = buildSkuDetailProps(DRIVERS, current, [current])
    expect(props.variants).toHaveLength(1)
  })

  it('fills the Overview tab from the Akeneo description, sanitised', () => {
    const p = mk({
      sku: 'EV-D-1',
      description: '<p data-start="1" data-end="9">Robust driver.</p><script>alert(1)</script><ul><li onclick="x()">IP67</li></ul>',
    })
    const props = buildSkuDetailProps(DRIVERS, p, [p])
    expect(props.overview?.heading).toBe('About the EV-D-1.')
    expect(props.overview?.html).toContain('<p>Robust driver.</p>')
    expect(props.overview?.html).toContain('<li>IP67</li>')
    expect(props.overview?.html).not.toMatch(/script|onclick|data-start/)
  })

  it('omits the Overview tab when the PIM has no description', () => {
    const p = mk({ sku: 'EV-D-2', description: null })
    expect(buildSkuDetailProps(DRIVERS, p, [p]).overview).toBeUndefined()
  })

  it("derives 'Where it works' from the product's copy and specs", () => {
    const p = mk({
      sku: 'EV-D-3', name: 'Envo EV-D-3 LED Driver', operation_mode: 'cv', output_voltage_v: 24, waterproof: 'ip67',
      description: '<p>Well-suited for street lighting, floodlights, architectural illumination, and commercial LED systems.</p>',
    })
    const sols = buildSkuDetailProps(DRIVERS, p, [p]).solutions!
    expect(sols.length).toBeLessThanOrEqual(4)
    expect(sols.map((s) => s.title)).toEqual(
      expect.arrayContaining(['Street & area lighting', 'Floodlighting', 'Architectural illumination']),
    )
  })

  it('derives control-gear applications from the unit type and protocol', () => {
    const CONTROL = PRODUCT_FAMILIES.find((f) => f.slug === 'control-gear')!
    const p = mk({ sku: 'ZB-R1', name: 'ENVO ZigBee Self-powered Remote', family: 'psu_led_controller', series: 'envo_zigbee', dimming_control: ['zigbee'] })
    const sols = buildSkuDetailProps(CONTROL, p, [p]).solutions!
    expect(sols.map((s) => s.title)).toEqual(
      expect.arrayContaining(['Handheld scene control', 'Zigbee lighting systems']),
    )
  })

  it('never includes a price field', () => {
    const props = buildSkuDetailProps(DRIVERS, mk({ sku: 'Y', price_nzd: 9 }), [mk({ sku: 'Y' })])
    expect(JSON.stringify(props)).not.toMatch(/nzd|"price"/i)
  })
})
