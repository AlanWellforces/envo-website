import { describe, it, expect } from 'vitest'
import { recommend } from './match'
import type { FymAnswers } from './types'
import type { Product } from '@/lib/products'

const mod = (over: Partial<Product>): Product => ({
  sku: 'M', family: 'led_module', name: 'Module', series: 'envo_ecoglo',
  power_w: 1.3, waterproof: 'ip65', led_chip_colour: 'warm_white', cct_k: 3000,
  brightness_lm: 120, enabled: true, hidden: false, ...over,
} as unknown as Product)
const drv = (over: Partial<Product>): Product => ({
  sku: 'D', family: 'psu_led_cv', name: 'Driver', series: 'sc_envo',
  power_w: 60, output_voltage_v: 12, waterproof: 'ip67', dimming_control: [],
  enabled: true, hidden: false, ...over,
} as unknown as Product)
const ctrl = (over: Partial<Product>): Product => ({
  sku: 'C', family: 'psu_led_controller', name: 'Zigbee Controller', series: 'envo_zigbee',
  controller_type: ['zigbee'], enabled: true, hidden: false, ...over,
} as unknown as Product)

const base: FymAnswers = {
  application: 'channel_letters', environment: 'indoor',
  colour: 'white_warm', size: 'small', control: 'onoff',
}

describe('recommend — module', () => {
  it('picks an IP-rated module for outdoor', () => {
    const catalog = [mod({ sku: 'IN', waterproof: 'ip20' }), mod({ sku: 'OUT', waterproof: 'ip67' })]
    expect(recommend({ ...base, environment: 'outdoor' }, catalog).module?.product.sku).toBe('OUT')
  })
  it('picks an RGB module when colour is rgb', () => {
    const catalog = [mod({ sku: 'W', led_chip_colour: 'warm_white' }), mod({ sku: 'RGB', led_chip_colour: 'rgb' })]
    expect(recommend({ ...base, colour: 'rgb' }, catalog).module?.product.sku).toBe('RGB')
  })
  it('never returns a null module when any module exists (graceful degrade)', () => {
    const catalog = [mod({ sku: 'ONLY', waterproof: 'ip20', led_chip_colour: 'cool_white' })]
    expect(recommend({ ...base, environment: 'outdoor', colour: 'rgb' }, catalog).module?.product.sku).toBe('ONLY')
  })
})

describe('recommend — driver', () => {
  it('sizes the driver above estimated load and picks the smallest sufficient', () => {
    const catalog = [mod({}), drv({ sku: 'D40', power_w: 40, output_voltage_v: 12 }), drv({ sku: 'D100', power_w: 100, output_voltage_v: 12 })]
    const r = recommend(base, catalog)
    expect(r.estimatedLoadW).toBeCloseTo(31.2, 1)
    expect(r.driver.kind).toBe('product')
    if (r.driver.kind === 'product') expect(r.driver.product.sku).toBe('D40')
  })
  it('returns a driver SPEC (not a fabricated product) when no ENVO driver fits', () => {
    const catalog = [mod({}), drv({ sku: 'TINY', power_w: 10, output_voltage_v: 12 })]
    const r = recommend(base, catalog)
    expect(r.driver.kind).toBe('spec')
    if (r.driver.kind === 'spec') {
      expect(r.driver.spec.powerW).toBeGreaterThanOrEqual(32)
      expect(r.driver.spec.voltageV).toBe(12)
    }
  })
})

describe('recommend — control', () => {
  it('is null for on/off', () => {
    expect(recommend({ ...base, control: 'onoff' }, [mod({}), drv({})]).control).toBeNull()
  })
  it('picks a Zigbee controller for smart', () => {
    const r = recommend({ ...base, control: 'smart' }, [mod({}), drv({}), ctrl({ sku: 'ZB' })])
    expect(r.control?.kind === 'product' && r.control.product.sku).toBe('ZB')
  })
  it('returns a note when smart control requested but none available', () => {
    expect(recommend({ ...base, control: 'smart' }, [mod({}), drv({})]).control?.kind).toBe('note')
  })
})
