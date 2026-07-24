import { describe, it, expect } from 'vitest'
import { toRecommendationDto } from './dto'
import type { Recommendation } from './types'
import type { Product } from '@/lib/products'

// A product carrying the forbidden internal fields — the DTO must drop them.
const product = (over: Partial<Product> = {}): Product =>
  ({
    name: 'ENVO EV-BLML Module',
    sku: 'EV-BLML-01',
    family: 'led_module',
    series: 'minilux',
    price_nzd: 42.5,
    inventory_type: 'stock',
    shipping_lead_days: 7,
    manufacturing_lead_days: 21,
    ...over,
  }) as Product

describe('toRecommendationDto', () => {
  it('projects each pick to name/sku/family/series only — no price/stock/lead-time', () => {
    const rec: Recommendation = {
      module: { product: product(), reason: 'r1' },
      driver: { kind: 'product', product: product({ sku: 'EV-SNP-35-12', family: 'psu_led_cv', series: 'snp' }), reason: 'r2' },
      control: { kind: 'product', product: product({ sku: 'EV-CTRL', family: 'psu_led_controller', series: 'ctrl' }), reason: 'r3' },
      estimatedLoadW: 30,
    }
    const dto = toRecommendationDto(rec)
    const json = JSON.stringify(dto)
    expect(json).not.toMatch(/price|inventory|lead_days|lead-time/i)
    expect(dto.module).toEqual({ product: { name: 'ENVO EV-BLML Module', sku: 'EV-BLML-01', family: 'led_module', series: 'minilux' }, reason: 'r1' })
    expect(dto.driver).toMatchObject({ kind: 'product', product: { sku: 'EV-SNP-35-12', family: 'psu_led_cv' } })
    expect(dto.estimatedLoadW).toBe(30)
  })

  it('passes through a spec-only driver (no product) untouched', () => {
    const rec: Recommendation = {
      module: null,
      driver: { kind: 'spec', spec: { powerW: 60, voltageV: 24, ip: 'IP67', mode: 'cv' }, reason: 'sized' },
      control: { kind: 'note', reason: 'on/off only' },
      estimatedLoadW: 45,
    }
    const dto = toRecommendationDto(rec)
    expect(dto.module).toBeNull()
    expect(dto.driver).toEqual({ kind: 'spec', spec: { powerW: 60, voltageV: 24, ip: 'IP67', mode: 'cv' }, reason: 'sized' })
    expect(dto.control).toEqual({ kind: 'note', reason: 'on/off only' })
  })

  it('handles null module and null control', () => {
    const rec: Recommendation = {
      module: null,
      driver: { kind: 'product', product: product(), reason: 'r' },
      control: null,
      estimatedLoadW: 10,
    }
    const dto = toRecommendationDto(rec)
    expect(dto.module).toBeNull()
    expect(dto.control).toBeNull()
  })
})
