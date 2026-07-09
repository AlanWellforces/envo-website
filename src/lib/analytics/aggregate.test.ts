import { describe, it, expect } from 'vitest'
import { fillDays } from './aggregate'

describe('fillDays', () => {
  it('zero-fills the window oldest→newest', () => {
    const out = fillDays(new Map([['2026-07-03', 2]]), 3, '2026-07-03')
    expect(out).toEqual([
      { date: '2026-07-01', count: 0 },
      { date: '2026-07-02', count: 0 },
      { date: '2026-07-03', count: 2 },
    ])
  })

  it('spans month boundaries', () => {
    const out = fillDays(new Map(), 2, '2026-07-01')
    expect(out.map((d) => d.date)).toEqual(['2026-06-30', '2026-07-01'])
  })
})
