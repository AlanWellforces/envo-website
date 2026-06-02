// src/lib/product-selector.test.ts
import { describe, it, expect } from 'vitest'
import { parseLedCount } from './product-selector'

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
