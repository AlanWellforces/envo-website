import { describe, it, expect } from 'vitest'
import { templateExplanation } from './explain'
import { recommend } from './match'
import type { FymAnswers } from './types'
import type { Product } from '@/lib/products'

const a: FymAnswers = { application: 'channel_letters', environment: 'outdoor', colour: 'white_warm', size: 'small', control: 'onoff' }
const catalog = [
  { sku: 'M', family: 'led_module', name: 'EcoGlo Module', series: 'envo_ecoglo', power_w: 1.3, waterproof: 'ip67', led_chip_colour: 'warm_white', enabled: true, hidden: false } as unknown as Product,
  { sku: 'D40', family: 'psu_led_cv', name: '40W Driver', power_w: 40, output_voltage_v: 12, waterproof: 'ip67', enabled: true, hidden: false } as unknown as Product,
]

describe('templateExplanation', () => {
  it('mentions the module and driver and is non-empty', () => {
    const text = templateExplanation(a, recommend(a, catalog))
    expect(text).toContain('EcoGlo Module')
    expect(text).toContain('40W Driver')
    expect(text.length).toBeGreaterThan(40)
  })
  it('describes the driver spec when no driver product fits', () => {
    const text = templateExplanation(a, recommend(a, [catalog[0]]))
    expect(text.toLowerCase()).toContain('authorised supply channel')
  })
})
