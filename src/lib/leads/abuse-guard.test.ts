import { describe, it, expect, beforeEach } from 'vitest'
import { clientIp, rateLimited, isDuplicate, clearSeen, resetAbuseGuards } from './abuse-guard'

const T0 = 1_700_000_000_000
const MIN = 60 * 1000

beforeEach(() => resetAbuseGuards())

describe('clientIp', () => {
  it('prefers cf-connecting-ip, then x-real-ip, then first x-forwarded-for hop', () => {
    expect(clientIp(new Headers({ 'cf-connecting-ip': '1.1.1.1', 'x-real-ip': '2.2.2.2' }))).toBe('1.1.1.1')
    expect(clientIp(new Headers({ 'x-real-ip': '2.2.2.2' }))).toBe('2.2.2.2')
    expect(clientIp(new Headers({ 'x-forwarded-for': '3.3.3.3, 10.0.0.1' }))).toBe('3.3.3.3')
    expect(clientIp(new Headers())).toBe('unknown')
  })
})

describe('rateLimited', () => {
  it('allows 5 submissions per window, blocks the 6th, frees after the window', () => {
    for (let i = 0; i < 5; i++) expect(rateLimited('ip-a', T0 + i * 1000)).toBe(false)
    expect(rateLimited('ip-a', T0 + 6000)).toBe(true)
    // a blocked attempt must not extend the window
    expect(rateLimited('ip-a', T0 + 10 * MIN + 1000)).toBe(false)
  })

  it('tracks IPs independently', () => {
    for (let i = 0; i < 5; i++) rateLimited('ip-b', T0)
    expect(rateLimited('ip-b', T0)).toBe(true)
    expect(rateLimited('ip-c', T0)).toBe(false)
  })
})

describe('isDuplicate', () => {
  const lead = { type: 'contact', email: 'a@b.co', message: 'hello' }

  it('flags the same content resent within the window', () => {
    expect(isDuplicate(lead, T0)).toBe(false)
    expect(isDuplicate(lead, T0 + MIN)).toBe(true)
  })

  it('lets a legitimate resend through after the window (no refresh on dupes)', () => {
    isDuplicate(lead, T0)
    isDuplicate(lead, T0 + 9 * MIN) // duplicate — must NOT extend the window
    expect(isDuplicate(lead, T0 + 10 * MIN + 1000)).toBe(false)
  })

  it('different message or email is not a duplicate', () => {
    isDuplicate(lead, T0)
    expect(isDuplicate({ ...lead, message: 'other' }, T0)).toBe(false)
    expect(isDuplicate({ ...lead, email: 'c@d.co' }, T0)).toBe(false)
  })

  it('clearSeen undoes the provisional mark so a retry is treated as fresh', () => {
    // First attempt marks the content; its write then fails → clearSeen.
    expect(isDuplicate(lead, T0)).toBe(false)
    clearSeen(lead)
    // Retry within the window must NOT be a (false) duplicate.
    expect(isDuplicate(lead, T0 + MIN)).toBe(false)
  })

  it('without clearSeen, a concurrent double-click is still deduped', () => {
    expect(isDuplicate(lead, T0)).toBe(false)
    expect(isDuplicate(lead, T0 + 100)).toBe(true)
  })
})
