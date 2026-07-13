import { describe, it, expect } from 'vitest'
import { buildDigestEmail } from './digest'

describe('buildDigestEmail', () => {
  const lead = {
    id: 1,
    name: 'Jane',
    email: 'jane@acme.co',
    type: 'contact',
    sourcePath: '/contact',
    createdAt: '2026-07-12T01:30:00.000Z',
  }

  it('counts, lists and links back to the admin', () => {
    const { subject, text } = buildDigestEmail([lead], 'https://envolighting.com')
    expect(subject).toContain('1 lead still marked New')
    expect(text).toContain('Jane <jane@acme.co> · contact · from /contact')
    expect(text).toContain('2026-07-12 01:30')
    expect(text).toContain('https://envolighting.com/admin/collections/submissions')
  })

  it('pluralises and flags leads whose sales notification failed', () => {
    const { subject, text } = buildDigestEmail(
      [lead, { ...lead, id: 2, name: 'Bob', notify: 'failed' }],
      'https://x.co',
    )
    expect(subject).toContain('2 leads')
    expect(text).toContain('Bob')
    expect(text).toContain('FAILED')
  })

  it('never renders undefined for sparse rows', () => {
    const { text } = buildDigestEmail([{ id: 3 }], 'https://x.co')
    expect(text).not.toContain('undefined')
  })
})
