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
})

describe('buildLeadEmail', () => {
  it('summarises the lead', () => {
    const { subject, text } = buildLeadEmail({ type: 'free-layout', name: 'Jane', email: 'jane@acme.com', company: 'Acme', data: { dimensions: '600x1800' } })
    expect(subject).toContain('Jane')
    expect(text).toContain('jane@acme.com')
    expect(text).toContain('dimensions')
  })
})
