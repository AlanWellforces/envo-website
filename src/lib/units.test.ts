// src/lib/units.test.ts
import { describe, it, expect } from 'vitest'
import { mmToIn, formatDims } from './units'

describe('mmToIn', () => {
  it('converts mm to inches rounded to 2 dp', () => {
    expect(mmToIn(25.4)).toBe(1)
    expect(mmToIn(43)).toBe(1.69)
  })
  it('returns null for null input', () => {
    expect(mmToIn(null)).toBeNull()
  })
})

describe('formatDims', () => {
  it('formats L×W×H in mm and inches', () => {
    expect(formatDims(43, 23, 11.6)).toEqual({
      mm: '43 × 23 × 11.6 mm',
      in: '1.69 × 0.91 × 0.46 in',
    })
  })
  it('returns null when any dimension is missing', () => {
    expect(formatDims(43, null, 11.6)).toBeNull()
  })
})
