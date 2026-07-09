import { describe, it, expect } from 'vitest'
import { regionForCountry } from './geo'

describe('regionForCountry', () => {
  it('maps Asia-Pacific countries to nz-ap', () => {
    for (const c of ['NZ', 'AU', 'CN', 'JP', 'KR', 'SG', 'TH', 'VN', 'ID', 'MY', 'PH', 'FJ', 'IN', 'HK', 'TW']) {
      expect(regionForCountry(c)).toBe('nz-ap')
    }
  })

  it('maps everything outside Asia-Pacific to us-global', () => {
    for (const c of ['US', 'CA', 'MX', 'BR', 'DE', 'GB', 'FR', 'ZA', 'AE', 'IL']) {
      expect(regionForCountry(c)).toBe('us-global')
    }
  })

  it('is case-insensitive', () => {
    expect(regionForCountry('nz')).toBe('nz-ap')
    expect(regionForCountry('us')).toBe('us-global')
  })

  it('falls back to nz-ap when the header is missing or unusable', () => {
    expect(regionForCountry(null)).toBe('nz-ap')
    expect(regionForCountry('')).toBe('nz-ap')
    // Vercel uses XX/T1 for unknown/Tor — not a real country, keep the default.
    expect(regionForCountry('XX')).toBe('nz-ap')
    expect(regionForCountry('T1')).toBe('nz-ap')
  })
})
