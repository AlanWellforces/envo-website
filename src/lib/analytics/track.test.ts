import { describe, it, expect } from 'vitest'
import { sessionHash, isBot } from './track'

describe('sessionHash', () => {
  it('is deterministic for identical inputs', () => {
    const a = sessionHash('1.2.3.4', 'UA', '2026-07-01', 'salt')
    const b = sessionHash('1.2.3.4', 'UA', '2026-07-01', 'salt')
    expect(a).toBe(b)
  })
  it('differs when the day differs (rotates daily)', () => {
    const a = sessionHash('1.2.3.4', 'UA', '2026-07-01', 'salt')
    const b = sessionHash('1.2.3.4', 'UA', '2026-07-02', 'salt')
    expect(a).not.toBe(b)
  })
  it('returns a short hex string, never the raw IP', () => {
    const h = sessionHash('1.2.3.4', 'UA', '2026-07-01', 'salt')
    expect(h).toMatch(/^[0-9a-f]{16}$/)
    expect(h).not.toContain('1.2.3.4')
  })
})

describe('isBot', () => {
  it('flags known crawlers', () => {
    expect(isBot('Mozilla/5.0 (compatible; Googlebot/2.1)')).toBe(true)
    expect(isBot('bingbot/2.0')).toBe(true)
  })
  it('treats empty/null UA as a bot', () => {
    expect(isBot('')).toBe(true)
    expect(isBot(null)).toBe(true)
  })
  it('passes a normal browser UA', () => {
    expect(isBot('Mozilla/5.0 (Macintosh) Chrome/120 Safari/537')).toBe(false)
  })
})
