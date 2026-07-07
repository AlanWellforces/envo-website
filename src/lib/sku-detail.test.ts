import { describe, it, expect } from 'vitest'
import { pickCompareLayout } from './sku-detail'

describe('pickCompareLayout', () => {
  it('renders nothing for a singleton series', () => {
    expect(pickCompareLayout(1)).toBe('none')
    expect(pickCompareLayout(0)).toBe('none')
  })
  it('uses a horizontal table for 2–6', () => {
    for (const n of [2, 3, 6]) expect(pickCompareLayout(n)).toBe('horizontal')
  })
  it('uses a row-based table for >6', () => {
    for (const n of [7, 12, 40]) expect(pickCompareLayout(n)).toBe('rows')
  })
})
