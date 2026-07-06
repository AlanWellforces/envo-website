import { describe, it, expect } from 'vitest'
import {
  DISTRIBUTORS, REGION_TO_DISTRIBUTOR, seriesPurchaseLinks, distributorForRegion,
} from './distributors'

describe('region → distributor mapping', () => {
  it('maps us-global to PSM and nz-ap to Wellforces', () => {
    expect(REGION_TO_DISTRIBUTOR['us-global']).toBe('psm')
    expect(REGION_TO_DISTRIBUTOR['nz-ap']).toBe('wellforces')
  })
  it('resolves a distributor object for a region', () => {
    expect(distributorForRegion('us-global')?.name).toBe('Power Supply Mall')
    expect(distributorForRegion('nz-ap')?.name).toBe('Wellforces')
  })
})

describe('seriesPurchaseLinks', () => {
  it('mapped series link straight to the PSM series collection', () => {
    const links = seriesPurchaseLinks('envo_sl_us', 'SL Linear Driver')
    expect(links.psm).toBe('https://powersupplymall.com/collections/envo-sl-series')
    expect(links.wellforces).toContain('wellforces.co.nz')
  })
  it('minilux maps to its PSM collection', () => {
    expect(seriesPurchaseLinks('envo_minilux', 'MiniLux').psm)
      .toBe('https://powersupplymall.com/collections/minilux')
  })
  it('an unmapped series falls back to the distributor brand page, never a dead search', () => {
    const links = seriesPurchaseLinks('envo_sng', 'SNG Waterproof High-Power Driver')
    expect(links.psm).toBe(DISTRIBUTORS.psm.brandFallbackUrl)
  })
  it('wellforces falls back to a series search', () => {
    const links = seriesPurchaseLinks('envo_minilux', 'MiniLux')
    expect(links.wellforces).toBe('https://wellforces.co.nz/search?q=MiniLux')
  })
  it('null series still returns safe brand-level links', () => {
    const links = seriesPurchaseLinks(null, 'Other')
    expect(links.psm).toBe(DISTRIBUTORS.psm.brandFallbackUrl)
    expect(links.wellforces).toBe(DISTRIBUTORS.wellforces.brandFallbackUrl)
  })
})
