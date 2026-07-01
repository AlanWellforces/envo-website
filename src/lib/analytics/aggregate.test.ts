import { describe, it, expect } from 'vitest'
import { pageViewsByDay, uniqueVisitors, topPaths, topReferrers, fymRunStats } from './aggregate'

type Ev = Parameters<typeof uniqueVisitors>[0][number]
const pv = (over: Partial<Ev>): Ev => ({ kind: 'pageview', path: '/', referrer: null, sessionHash: 'a', data: null, createdAt: '2026-07-01T10:00:00.000Z', ...over })

describe('pageViewsByDay', () => {
  it('zero-fills the window oldest→newest', () => {
    const events = [pv({ createdAt: '2026-07-03T01:00:00.000Z' }), pv({ createdAt: '2026-07-03T05:00:00.000Z' })]
    const out = pageViewsByDay(events, 3, '2026-07-03')
    expect(out).toEqual([
      { date: '2026-07-01', count: 0 },
      { date: '2026-07-02', count: 0 },
      { date: '2026-07-03', count: 2 },
    ])
  })
})

describe('uniqueVisitors', () => {
  it('counts distinct non-empty hashes', () => {
    expect(uniqueVisitors([pv({ sessionHash: 'a' }), pv({ sessionHash: 'a' }), pv({ sessionHash: 'b' }), pv({ sessionHash: '' })])).toBe(2)
  })
})

describe('topPaths', () => {
  it('ranks by count, limited to n', () => {
    const out = topPaths([pv({ path: '/x' }), pv({ path: '/x' }), pv({ path: '/y' })], 1)
    expect(out).toEqual([{ path: '/x', count: 2 }])
  })
})

describe('topReferrers', () => {
  it('groups empty referrers as direct', () => {
    const out = topReferrers([pv({ referrer: null }), pv({ referrer: '' }), pv({ referrer: 'https://g.com' })], 5)
    expect(out).toContainEqual({ referrer: 'direct', count: 2 })
    expect(out).toContainEqual({ referrer: 'https://g.com', count: 1 })
  })
})

describe('fymRunStats', () => {
  it('totals find-your-match events and groups by application', () => {
    const fym = (app: string): Ev => ({ kind: 'find-your-match', path: null, referrer: null, sessionHash: null, data: { application: app }, createdAt: '2026-07-01T10:00:00.000Z' })
    const out = fymRunStats([fym('light_box'), fym('light_box'), fym('facade'), pv({})])
    expect(out.total).toBe(3)
    expect(out.byApplication[0]).toEqual({ application: 'light_box', count: 2 })
  })
})
