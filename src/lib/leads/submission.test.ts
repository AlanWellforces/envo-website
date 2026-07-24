import { describe, it, expect } from 'vitest'
import { normalizeSubmission, buildLeadEmail } from './submission'

describe('normalizeSubmission', () => {
  it('accepts a valid free-layout lead and trims', () => {
    const r = normalizeSubmission({ type: 'free-layout', name: '  Jane  ', email: 'jane@acme.com', company: 'Acme', dimensions: '600x1800' })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.name).toBe('Jane')
      expect(r.value.email).toBe('jane@acme.com')
      expect(r.value.data).toMatchObject({ dimensions: '600x1800' })
      expect('type' in r.value.data).toBe(false) // known fields not duplicated into data
    }
  })
  it('rejects a missing name', () => {
    const r = normalizeSubmission({ type: 'free-layout', email: 'a@b.com' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors).toContain('name is required')
  })
  it('rejects a bad email', () => {
    const r = normalizeSubmission({ type: 'contact', name: 'X', email: 'not-an-email' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors).toContain('a valid email is required')
  })
  it('rejects an unknown type', () => {
    const r = normalizeSubmission({ type: 'spam', name: 'X', email: 'a@b.com' })
    expect(r.ok).toBe(false)
  })
  it('captures attribution as typed fields, not free-form data', () => {
    const r = normalizeSubmission({
      type: 'contact', name: 'X', email: 'a@b.com',
      landingPage: '/products?utm_source=google', referrer: 'https://google.com/',
      utmSource: 'google', utmMedium: 'cpc', utmCampaign: 'spring', firstTouchSource: 'google',
    })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.attribution).toEqual({
        landingPage: '/products?utm_source=google', referrer: 'https://google.com/',
        utmSource: 'google', utmMedium: 'cpc', utmCampaign: 'spring', firstTouchSource: 'google',
      })
      // attribution must not leak into the free-form data catch-all
      expect('utmSource' in r.value.data).toBe(false)
      expect('landingPage' in r.value.data).toBe(false)
    }
  })
  it('omits empty attribution fields', () => {
    const r = normalizeSubmission({ type: 'contact', name: 'X', email: 'a@b.com', utmSource: '' })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.attribution).toEqual({})
  })
})

describe('buildLeadEmail', () => {
  it('summarises the lead with the message and prettified details', () => {
    const { subject, text } = buildLeadEmail({
      type: 'free-layout',
      name: 'Jane',
      email: 'jane@acme.com',
      company: 'Acme',
      message: 'Need a layout for our new store.',
      attribution: {},
      data: { signType: 'channel letters', dimensions: '600x1800' },
    })
    expect(subject).toContain('Jane')
    expect(text).toContain('jane@acme.com')
    expect(text).toContain('Message:\nNeed a layout for our new store.')
    expect(text).toContain('Sign Type: channel letters')
    expect(text).toContain('Dimensions: 600x1800')
  })
})
