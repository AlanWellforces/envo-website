export type AnalyticsEvent = {
  kind: 'pageview' | 'find-your-match'
  path?: string | null
  referrer?: string | null
  sessionHash?: string | null
  data?: Record<string, unknown> | null
  createdAt: string
}

const dayOf = (iso: string): string => iso.slice(0, 10) // YYYY-MM-DD (UTC)

function rankCounts(map: Map<string, number>, n: number): { key: string; count: number }[] {
  return [...map.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
    .slice(0, n)
}

export function pageViewsByDay(events: AnalyticsEvent[], days: number, today: string): { date: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const e of events) {
    if (e.kind !== 'pageview') continue
    counts.set(dayOf(e.createdAt), (counts.get(dayOf(e.createdAt)) ?? 0) + 1)
  }
  const out: { date: string; count: number }[] = []
  const end = new Date(`${today}T00:00:00.000Z`)
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end)
    d.setUTCDate(end.getUTCDate() - i)
    const date = d.toISOString().slice(0, 10)
    out.push({ date, count: counts.get(date) ?? 0 })
  }
  return out
}

export function uniqueVisitors(events: AnalyticsEvent[]): number {
  const set = new Set<string>()
  for (const e of events) if (e.kind === 'pageview' && e.sessionHash) set.add(e.sessionHash)
  return set.size
}

export function topPaths(events: AnalyticsEvent[], n: number): { path: string; count: number }[] {
  const map = new Map<string, number>()
  for (const e of events) {
    if (e.kind !== 'pageview' || !e.path) continue
    map.set(e.path, (map.get(e.path) ?? 0) + 1)
  }
  return rankCounts(map, n).map(({ key, count }) => ({ path: key, count }))
}

export function topReferrers(events: AnalyticsEvent[], n: number): { referrer: string; count: number }[] {
  const map = new Map<string, number>()
  for (const e of events) {
    if (e.kind !== 'pageview') continue
    const ref = e.referrer && e.referrer.trim() ? e.referrer : 'direct'
    map.set(ref, (map.get(ref) ?? 0) + 1)
  }
  return rankCounts(map, n).map(({ key, count }) => ({ referrer: key, count }))
}

export function fymRunStats(events: AnalyticsEvent[]): { total: number; byApplication: { application: string; count: number }[] } {
  const map = new Map<string, number>()
  let total = 0
  for (const e of events) {
    if (e.kind !== 'find-your-match') continue
    total++
    const app = typeof e.data?.application === 'string' ? e.data.application : 'unknown'
    map.set(app, (map.get(app) ?? 0) + 1)
  }
  return { total, byApplication: rankCounts(map, 10).map(({ key, count }) => ({ application: key, count })) }
}
