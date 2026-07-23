import { describe, it, expect } from 'vitest'
import { bucketSeries, fillDays } from './aggregate'

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

describe('bucketSeries', () => {
  const day = (date: string, count: number) => ({ date, count })

  it('sums full buckets, labelled by the bucket start date', () => {
    const series = fillDays(new Map([['2026-07-10', 3], ['2026-07-14', 5]]), 14, '2026-07-14')
    const out = bucketSeries(series, 7)
    expect(out).toEqual([day('2026-07-01', 0), day('2026-07-08', 8)])
  })

  it('keeps the newest bucket anchored to today; the oldest may be partial', () => {
    // 10 days into 7-day buckets → oldest bucket covers only 3 days.
    const series = fillDays(new Map([['2026-07-05', 2], ['2026-07-14', 1]]), 10, '2026-07-14')
    const out = bucketSeries(series, 7)
    expect(out).toEqual([day('2026-07-05', 2), day('2026-07-08', 1)])
  })

  it('returns the series unchanged when bucketDays is 1', () => {
    const series = fillDays(new Map([['2026-07-14', 4]]), 3, '2026-07-14')
    expect(bucketSeries(series, 1)).toEqual(series)
  })

  it('handles an empty series', () => {
    expect(bucketSeries([], 7)).toEqual([])
  })
})
