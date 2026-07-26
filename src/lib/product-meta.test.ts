import { describe, expect, test } from 'vitest'
import { cleanMetaDescription, productMetaDescription } from './product-meta'

describe('cleanMetaDescription', () => {
  test('tidies Akeneo punctuation and control chars without touching numbers', () => {
    expect(cleanMetaDescription('High cost performance ,design 8.33A output\x7fnice')).toBe(
      'High cost performance, design 8.33A output nice',
    )
  })

  test('empty and null → undefined', () => {
    expect(cleanMetaDescription('')).toBeUndefined()
    expect(cleanMetaDescription(null)).toBeUndefined()
  })
})

describe('productMetaDescription', () => {
  const SHARED = 'EV-SE-20-12US/EV-SE-20-24US is a US standard indoor ultra-thin constant voltage LED driver.'

  test('two variants sharing one short_description get distinct descriptions', () => {
    const a = productMetaDescription(SHARED, 'EV-SE-20-12US', 'LED Driver 20W 12V')
    const b = productMetaDescription(SHARED, 'EV-SE-20-24US', 'LED Driver 20W 24V')
    expect(a).not.toBe(b)
    expect(a).toContain('EV-SE-20-12US specifications')
    expect(b).toContain('EV-SE-20-24US specifications')
  })

  test('keeps the cleaned copy first and appends the sku anchor', () => {
    const d = productMetaDescription('Flat and slim design.', 'EV-SNPV-40-12', 'LED Driver 40W 12V')
    expect(d).toBe('Flat and slim design. EV-SNPV-40-12 specifications, datasheet and where to buy.')
  })

  test('no short_description → descriptor-led fallback (already unique per page)', () => {
    expect(productMetaDescription(null, 'EV-X-1', 'Some Driver 10W')).toBe(
      'Some Driver 10W — specifications, datasheet and where to buy.',
    )
  })

  test('long copy is trimmed so the sku anchor always fits within 160 chars', () => {
    const long = 'A'.repeat(50) + ' ' + 'B'.repeat(50) + ' ' + 'C'.repeat(80)
    const d = productMetaDescription(long, 'EV-SL-150-24', 'Linear Driver')
    expect(d.length).toBeLessThanOrEqual(160)
    expect(d).toContain('EV-SL-150-24 specifications, datasheet and where to buy.')
  })
})
