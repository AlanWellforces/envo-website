import { describe, it, expect } from 'vitest'
import { pageHref, LEGAL_ROOT_SLUGS } from './cms-pages'

describe('pageHref', () => {
  it('maps a policy slug to its root path', () => {
    expect(pageHref('privacy-policy')).toBe('/privacy-policy')
    expect(LEGAL_ROOT_SLUGS['terms-of-service']).toBe('/terms-of-service')
  })
  it('maps any other slug under /pages', () => {
    expect(pageHref('warranty')).toBe('/pages/warranty')
  })
})
