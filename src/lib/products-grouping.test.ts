import { describe, it, expect } from 'vitest'
import { groupProductsBySeries } from './products'
import type { Product } from './products'

const p = (sku: string, series: string | null): Product =>
  ({ sku, series, name: sku } as unknown as Product)

describe('groupProductsBySeries', () => {
  it('groups by series code, null → "other" bucket, preserves order of first appearance', () => {
    const groups = groupProductsBySeries([
      p('A', 'envo_minilux'), p('B', 'hydro_lume'), p('C', 'envo_minilux'), p('D', null),
    ])
    expect(groups.map((g) => g.code)).toEqual(['envo_minilux', 'hydro_lume', null])
    expect(groups[0].products.map((x) => x.sku)).toEqual(['A', 'C'])
    expect(groups[2].code).toBeNull()
    expect(groups[2].products[0].sku).toBe('D')
  })
})
