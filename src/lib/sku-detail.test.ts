import { describe, it, expect } from 'vitest'
import { buildSkuDetailProps, parseOverview } from './sku-detail'
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
    expect(props.title).toBe('SNG 350W 24V') // H1 = the descriptor (user 2026-07-09), never the SKU
    expect(props.heroSubtitle).toBe('EV-SNG-350-24') // the code moves to the subtitle
    expect(props.breadcrumb.seriesLabel).toBe('EV-SNG-350-24') // crumb ends on the SKU
    expect(props.heroStage).toHaveLength(1) // stage = one product image, no sibling collage
    expect(props.thumbs?.[0]?.label).toBe('EV-SNG-350-24') // own tile only — never sibling-model tiles
    expect(props.thumbs?.some((t) => t.label === 'EV-SNG-350-12')).toBe(false)
    // exact key specs from THIS product only — never a series-wide range
    const power = props.keySpecs?.find((s) => s.label === 'Power')
    expect(power?.value).toBe('350 W')
    expect(props.datasheetUrl).toBeTruthy()
    expect(props.downloads?.[0]?.name).toBe('EV-SNG-350-24 datasheet')
  })

  it('drops the CCT suffix (-NW/-WW/-CW) from the datasheet download name', () => {
    const p = mk({ sku: 'EV-BLPG01LBY-NW', name: 'ENVO ProGlo LED Module Backlit - Single LED', spec_sheet_url: 's.pdf' })
    const props = buildSkuDetailProps(DRIVERS, p, [p])
    expect(props.downloads?.[0]?.name).toBe('EV-BLPG01LBY datasheet')
    expect(props.title).toBe('ProGlo LED Module Backlit - Single LED') // descriptor-led H1 (user 2026-07-09)
  })

  it('keeps functional SKU suffixes in the datasheet download name', () => {
    const p = mk({ sku: 'EV-SE-15-TDM', name: 'Envo Sensor TDM', spec_sheet_url: 's.pdf' })
    const props = buildSkuDetailProps(DRIVERS, p, [p])
    expect(props.downloads?.[0]?.name).toBe('EV-SE-15-TDM datasheet')
  })

  it('strips the brand and SKU out of the title; falls back to the code when the name is only brand+SKU', () => {
    const p = mk({ sku: 'EV-SNG-350-24', name: 'Envo EV-SNG-350-24 LED Driver 350W 24V Waterproof IP67 14.58A' })
    const props = buildSkuDetailProps(DRIVERS, p, [p])
    expect(props.title).toBe('LED Driver 350W 24V Waterproof IP67 14.58A')
    expect(props.heroSubtitle).toBe('EV-SNG-350-24')
    const bare = mk({ sku: 'EV-SNG-350-24', name: 'ENVO EV-SNG-350-24' })
    expect(buildSkuDetailProps(DRIVERS, bare, [bare]).title).toBe('EV-SNG-350-24')
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
      expect.arrayContaining(['Power', 'Output voltage', 'Input voltage', 'Operation mode', 'Dimming', 'IP rating', 'Rated current', 'Dimensions']),
    )
  })

  it('falls back to a single full-spec panel for a singleton series', () => {
    const props = buildSkuDetailProps(DRIVERS, current, [current])
    expect(props.variants).toHaveLength(1)
  })

  it('distils the Overview from the Akeneo description', () => {
    const p = mk({
      sku: 'EV-D-1',
      description:
        '<p data-start="1">The EV-D-1 is a robust driver built for signage. It runs cool and quiet. It also suits street lighting projects everywhere.</p>' +
        '<ul><li>Maximum conversion efficiency of 86%</li><li>Input voltage range is 90-132Vac</li><li>5 years warranty</li><li>DO NOT install with power applied.</li></ul>',
    })
    const ov = buildSkuDetailProps(DRIVERS, p, [p]).overview!
    expect(ov.heading).toBe('About the EV-D-1.')
    // title + short application-led paragraphs (user 2026-07-08) — no check-grid
    expect(ov.paragraphs).toEqual([
      'The EV-D-1 is a robust driver built for signage. It runs cool and quiet.', // lede = first 2 sentences
      'It is built for street and area lighting, signage systems and indoor installations.', // application angle
      'Backing that up: maximum conversion efficiency of 86%.', // spec repeats dropped
      'Installation notes: do not install with power applied.',
    ])
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

  it('control gear never gets a compare table — plain full-spec panel instead', () => {
    const CONTROL = PRODUCT_FAMILIES.find((f) => f.slug === 'control-gear')!
    const a = mk({ sku: 'ZB-A', name: 'ENVO ZigBee Smart Dimmer', family: 'psu_led_controller', series: 'envo_zigbee', dimming_control: ['zigbee'] })
    const b = mk({ sku: 'ZB-B', name: 'ENVO ZigBee Gateway', family: 'psu_led_controller', series: 'envo_zigbee', dimming_control: ['zigbee'] })
    const props = buildSkuDetailProps(CONTROL, a, [a, b])
    expect(props.variants).toHaveLength(1) // single "Full specification" panel
    expect(props.variants[0].modelCode).toBe('ZB-A')
  })

  it('parseOverview handles the ZB shape: spec dump cut, headline lifted', () => {
    const ov = parseOverview(
      '<h2 id="features">Features:</h2><ul><li>Zigbee 3.0 compliant</li><li>Daylight harvesting</li></ul>' +
        '<h2 id="general-specification">General Specification</h2><p><strong>Input Voltage</strong></p><p>100-240V</p>',
    )!
    expect(ov.headline).toBeUndefined() // "Features:" is not a headline
    expect(ov.features?.map((f) => f.text)).toEqual(['Zigbee 3.0 compliant', 'Daylight harvesting'])
    expect(JSON.stringify(ov)).not.toContain('100-240V') // spec dump gone
  })

  it('parseOverview handles the signage shape: nested markup, bold label features, marketing headline', () => {
    const ov = parseOverview(
      '<h2 id="x"><p><span style="font-weight: bold;">Exceptional Materials: 99.99% pure gold thread for durability.</span></p></h2>' +
        '<h2 id="x">Compact and Brilliant Illumination</h2>' +
        '<p>The MiniLux LED Modules by ENVO are designed to deliver efficient and precise lighting for compact signage.</p>',
    )!
    expect(ov.headline).toBe('Compact and Brilliant Illumination')
    expect(ov.features?.[0]).toEqual({ label: 'Exceptional Materials', text: '99.99% pure gold thread for durability' })
    expect(ov.lede).toContain('MiniLux LED Modules')
  })

  it('parseOverview drops signage boilerplate: junk headline, QA fluff, cert lists; digit labels split', () => {
    const ov = parseOverview(
      '<h2 id="x">Key Features:</h2><h2 id="y">Application:</h2>' +
        '<p>Illuminate your signage with precision and vibrant clarity using the ChromaFlux LED Module by ENVO. Designed for versatility and high performance.</p>' +
        '<ul>' +
        '<li>20 Pieces Per String: Each string includes 20 LED modules, offering flexibility.</li>' +
        '<li>Exceptional Materials: 99.99% pure gold thread paired with a pure copper bracket.</li>' +
        '<li>Uncompromising Quality: 100% testing during production ensures reliability.</li>' +
        '<li>Constant Voltage: Enjoy consistent and reliable lighting performance.</li>' +
        '<li>Constant Current System: Offers stable and reliable lighting performance.</li>' +
        '<li>Certified Quality: Rest assured with certifications from CE, RoHS, UL, TUV, BIS, CB, and LM-80.</li>' +
        '</ul>',
    )!
    expect(ov.headline).toBeUndefined() // "Key Features:" / "Application:" are section labels, not headlines
    expect(ov.lede).toContain('ChromaFlux')
    const labels = ov.features?.map((f) => f.label)
    expect(labels).toEqual(['20 Pieces Per String', 'Exceptional Materials'])
  })

  it('signage model-page title is the descriptor; the code moves to the subtitle', () => {
    const SIGNAGE = PRODUCT_FAMILIES.find((f) => f.slug === 'led-signage-modules')!
    const p = mk({ sku: 'EV-BLEG03LBY-NW', name: 'ENVO EcoGlo LED Module Backlit - Triple LED', series: 'envo_ecoglo' })
    const props = buildSkuDetailProps(SIGNAGE, p, [p])
    expect(props.title).toBe('EcoGlo LED Module Backlit - Triple LED')
    expect(props.heroSubtitle).toBe('EV-BLEG03LBY')
    expect(props.breadcrumb.seriesLabel).toBe('EV-BLEG03LBY') // crumb stays short
  })

  it('never includes a price field', () => {
    const props = buildSkuDetailProps(DRIVERS, mk({ sku: 'Y', price_nzd: 9 }), [mk({ sku: 'Y' })])
    expect(JSON.stringify(props)).not.toMatch(/nzd|"price"/i)
  })
})
