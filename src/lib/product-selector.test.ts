// src/lib/product-selector.test.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest'
import { parseLedCount, getProductsForSelector } from './product-selector'

describe('parseLedCount', () => {
  it('maps word tokens to a normalised label', () => {
    expect(parseLedCount('ENVO EcoGlo LED Module Backlit - Quad LED')).toBe('Quad')
    expect(parseLedCount('ENVO MiniLux LED Module Backlit - Triple LED')).toBe('Triple')
    expect(parseLedCount('ENVO EdgeLume LED Module Sidelit - Single LED')).toBe('Single')
    expect(parseLedCount('ENVO EcoGlo Backlit - Duo LED')).toBe('Duo')
    expect(parseLedCount('ENVO EdgeBlade2 Sidelit - Double LED')).toBe('Double')
  })
  it('maps a numeric "N LED" to a word label', () => {
    expect(parseLedCount('ENVO Something 2 LED Module')).toBe('Duo')
    expect(parseLedCount('ENVO Something 4 LED')).toBe('Quad')
  })
  it('returns null when no LED count is present', () => {
    expect(parseLedCount('ENVO Mystery Module')).toBeNull()
  })
})

const mockList = vi.fn()
vi.mock('./products', async (orig) => ({
  ...(await orig<typeof import('./products')>()),
  listProducts: (...a: unknown[]) => mockList(...a),
}))

describe('getProductsForSelector', () => {
  it('maps signage products to selector rows', async () => {
    mockList.mockResolvedValue({ docs: [{
      sku: 'EV-BLEG04LBY-NW', name: 'ENVO EcoGlo LED Module Backlit - Quad LED',
      series: 'envo_ecoglo', led_light_power_input: ['power_input_12V'],
      power_w: 1.6, brightness_lm: 160, efficacy_lm_w: 100, cri: 80, beam_angle_deg: 170,
      waterproof: 'ip65', max_in_series: 20, length_mm: 70, width_mm: 22, height_mm: 12,
      cct_k: 4000, clean_image_url_fallback: 'https://x/clean.png', image_url_fallback: null,
    }], totalDocs: 1, totalPages: 1 })

    const rows = await getProductsForSelector('signage')
    expect(mockList).toHaveBeenCalledWith({ family: 'led_module', limit: 500 })
    expect(rows[0]).toMatchObject({
      sku: 'EV-BLEG04LBY-NW', seriesLabel: 'EcoGlo', seriesType: 'backlit',
      voltage: '12V', ledCount: 'Quad', cct: '4K', ip: 'IP65',
      detailHref: '/products/led-signage-modules/eco-series',
      image: 'https://x/clean.png',
    })
    expect(rows[0].dims).toEqual({ mm: '70 × 22 × 12 mm', in: '2.76 × 0.87 × 0.47 in' })
  })

  it('falls back to a humanised label + null detailHref for unconfigured series', async () => {
    mockList.mockResolvedValue({ docs: [{
      sku: 'X', name: 'ENVO Foo Backlit - Single LED', series: 'envo_unknown',
      led_light_power_input: ['power_input_24V'], waterproof: 'ip67', cct_k: 7000,
    }], totalDocs: 1, totalPages: 1 })
    const rows = await getProductsForSelector('signage')
    expect(rows[0]).toMatchObject({ seriesLabel: 'Envo Unknown', detailHref: null, voltage: '24V' })
  })
})
