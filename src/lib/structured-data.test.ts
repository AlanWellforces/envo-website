import { describe, expect, it } from 'vitest'
import {
  abs,
  organizationLd,
  breadcrumbLd,
  specProperties,
  productPageLd,
  type Crumb,
} from './structured-data'
import type { Product } from './products'

// Minimal Product factory — only the fields the builders read.
function mk(over: Partial<Product> = {}): Product {
  return {
    sku: 'EV-TEST-1',
    name: 'ENVO Test Module',
    series: 'Test Series',
    short_description: 'A test module.',
    seo_description: null,
    power_w: null,
    brightness_lm: null,
    efficacy_lm_w: null,
    cct_k: null,
    cri: null,
    beam_angle_deg: null,
    waterproof: null,
    output_voltage_v: null,
    input_voltage_min_v: null,
    input_voltage_max_v: null,
    operation_mode: null,
    length_mm: null,
    width_mm: null,
    height_mm: null,
    weight_kg: null,
    lifetime_hrs: null,
    warranty_years: null,
    price_nzd: 42,
    clean_image_url_fallback: 'https://cdn.example.com/clean.png',
    ...over,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any
}

describe('abs', () => {
  it('leaves absolute URLs untouched and prefixes relative paths', () => {
    expect(abs('https://cdn.x/y.png')).toBe('https://cdn.x/y.png')
    expect(abs('/products')).toMatch(/^https?:\/\/[^/]+\/products$/)
  })
})

describe('organizationLd', () => {
  it('brands as ENVO / legal Envo with the contact email, no price anywhere', () => {
    const o = organizationLd() as Record<string, unknown>
    expect(o['@type']).toBe('Organization')
    expect(o.name).toBe('ENVO')
    expect(o.legalName).toBe('Envo')
    expect((o.contactPoint as Record<string, unknown>).email).toBe('contact@envolighting.com')
  })
})

describe('breadcrumbLd', () => {
  it('numbers positions from 1 and resolves items absolute', () => {
    const items: Crumb[] = [
      { name: 'Home', url: '/' },
      { name: 'Products', url: '/products' },
      { name: 'Current' }, // no url = current page
    ]
    const b = breadcrumbLd(items) as { itemListElement: Record<string, unknown>[] }
    expect(b.itemListElement).toHaveLength(3)
    expect(b.itemListElement[0].position).toBe(1)
    expect(b.itemListElement[2].position).toBe(3)
    expect(b.itemListElement[2].item).toBeUndefined()
    expect(b.itemListElement[1].item).toMatch(/\/products$/)
  })
})

describe('specProperties', () => {
  it('drops null fields and carries units', () => {
    const specs = specProperties(mk({ power_w: 15, brightness_lm: 310, waterproof: 'ip65', cri: null }))
    const names = specs.map((s) => s.name)
    expect(names).toContain('Power')
    expect(names).toContain('Luminous flux')
    expect(names).toContain('Ingress protection')
    expect(names).not.toContain('CRI')
    expect(specs.find((s) => s.name === 'Power')?.unitText).toBe('W')
    expect(specs.find((s) => s.name === 'Ingress protection')?.value).toBe('IP65')
  })

  it('emits nothing for a bare product', () => {
    expect(specProperties(mk())).toHaveLength(0)
  })
})

describe('productPageLd', () => {
  const crumbs: Crumb[] = [
    { name: 'Home', url: '/' },
    { name: 'Products', url: '/products' },
    { name: 'LED Drivers', url: '/products/led-drivers' },
    { name: 'EV-TEST-1', url: '/products/led-drivers/EV-TEST-1' },
  ]

  it('never emits offers or price (lead-gen site)', () => {
    const [product] = productPageLd(mk({ power_w: 15 }), crumbs, {
      url: '/products/led-drivers/EV-TEST-1',
      name: 'ENVO Test Module',
      description: 'A test module.',
      imageUrl: 'https://cdn.example.com/clean.png',
    }) as Record<string, unknown>[]
    const json = JSON.stringify(product)
    expect(json).not.toMatch(/offers/i)
    expect(json).not.toMatch(/price/i)
    expect(json).not.toMatch(/42/) // the price_nzd value must never leak
    expect(product['@type']).toBe('Product')
    expect(product.sku).toBe('EV-TEST-1')
    expect(product.mpn).toBe('EV-TEST-1')
    expect((product.brand as Record<string, unknown>).name).toBe('ENVO')
  })

  it('adds a ProductGroup + variant links only when there are siblings', () => {
    const single = productPageLd(mk(), crumbs, {
      url: '/products/led-drivers/EV-TEST-1',
      name: 'ENVO Test Module',
      variants: [{ name: 'EV-TEST-1', sku: 'EV-TEST-1', url: '/products/led-drivers/EV-TEST-1' }],
    })
    expect(single.some((n) => (n as Record<string, unknown>)['@type'] === 'ProductGroup')).toBe(false)

    const multi = productPageLd(mk(), crumbs, {
      url: '/products/led-drivers/EV-TEST-1',
      name: 'ENVO Test Module',
      seriesName: 'Test Series',
      variants: [
        { name: 'ENVO Test Module', sku: 'EV-TEST-1', url: '/products/led-drivers/EV-TEST-1' },
        { name: 'ENVO Test Module 2', sku: 'EV-TEST-2', url: '/products/led-drivers/EV-TEST-2' },
      ],
    }) as Record<string, unknown>[]
    const group = multi.find((n) => n['@type'] === 'ProductGroup') as Record<string, unknown>
    const product = multi.find((n) => n['@type'] === 'Product') as Record<string, unknown>
    expect(group).toBeDefined()
    expect((group.hasVariant as unknown[]).length).toBe(2)
    // variant relationship wired both ways via matching @id
    expect((product.isVariantOf as Record<string, unknown>)['@id']).toBe(group['@id'])
    expect(group.name).toBe('ENVO Test Series')
  })

  it('always ends with a BreadcrumbList', () => {
    const nodes = productPageLd(mk(), crumbs, {
      url: '/products/led-drivers/EV-TEST-1',
      name: 'ENVO Test Module',
    }) as Record<string, unknown>[]
    expect(nodes[nodes.length - 1]['@type']).toBe('BreadcrumbList')
  })
})
