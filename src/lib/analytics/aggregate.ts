// Analytics aggregation for the admin Dashboard. Counting happens in SQL —
// the previous version fetched up to 10k event rows and counted in memory,
// which silently truncated every chart once traffic passed the cap.
import { sql } from '@payloadcms/db-postgres/drizzle'
import type { Payload } from 'payload'

export type AnalyticsSummary = {
  byDay: { date: string; count: number }[]
  uniques: number
  totalPv: number
  paths: { path: string; count: number }[]
  referrers: { referrer: string; count: number }[]
  fym: { total: number; byApplication: { application: string; count: number }[] }
  /** Same-length window immediately before this one — for period-over-period deltas. */
  prev: { totalPv: number; uniques: number; fymTotal: number }
}

type Rows = { rows: Record<string, unknown>[] }
type Drizzle = { execute: (query: unknown) => Promise<Rows> }

/** Zero-fill a day-count map into an oldest→newest window ending at `today` (UTC dates). */
export function fillDays(counts: Map<string, number>, days: number, today: string): { date: string; count: number }[] {
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

/**
 * Period-over-period movement as display text + semantic tone. Percentages
 * need a base — a zero previous window yields "new" (or "—" when the current
 * window is also zero) instead of a fake ∞%.
 */
export function describeDelta(now: number, prev: number): { text: string; tone: 'up' | 'down' | 'flat' } {
  if (prev === 0) return now === 0 ? { text: '—', tone: 'flat' } : { text: 'new', tone: 'up' }
  const pct = Math.round(((now - prev) / prev) * 100)
  if (pct > 0) return { text: `↑ ${pct}%`, tone: 'up' }
  if (pct < 0) return { text: `↓ ${Math.abs(pct)}%`, tone: 'down' }
  return { text: '± 0%', tone: 'flat' }
}

/**
 * Aggregate a zero-filled daily series into trailing buckets of `bucketDays`.
 * The newest bucket always ends on the series' last day; the oldest bucket may
 * be partial. Each bucket is labelled with its first day.
 */
export function bucketSeries(
  series: { date: string; count: number }[],
  bucketDays: number,
): { date: string; count: number }[] {
  const out: { date: string; count: number }[] = []
  for (let end = series.length; end > 0; end -= bucketDays) {
    const slice = series.slice(Math.max(0, end - bucketDays), end)
    out.unshift({ date: slice[0].date, count: slice.reduce((sum, d) => sum + d.count, 0) })
  }
  return out
}

/** All Dashboard analytics numbers for the trailing `days`-day window (UTC day buckets). */
export async function analyticsSummary(payload: Payload, days: number): Promise<AnalyticsSummary> {
  const db = (payload.db as unknown as { drizzle: Drizzle }).drizzle
  const since = new Date()
  since.setUTCDate(since.getUTCDate() - (days - 1))
  since.setUTCHours(0, 0, 0, 0)
  const sinceISO = since.toISOString()
  const prevSince = new Date(since)
  prevSince.setUTCDate(prevSince.getUTCDate() - days)
  const prevSinceISO = prevSince.toISOString()

  // Sequential on purpose: the Dashboard already fans out a large Promise.all
  // and the Supabase session pooler has a tight connection cap.
  const totals = await db.execute(sql`
    select count(*)::int as total, count(distinct session_hash)::int as uniques
    from events where kind = 'pageview' and created_at >= ${sinceISO}`)
  const byDay = await db.execute(sql`
    select to_char(created_at at time zone 'UTC', 'YYYY-MM-DD') as date, count(*)::int as count
    from events where kind = 'pageview' and created_at >= ${sinceISO}
    group by 1`)
  const paths = await db.execute(sql`
    select path, count(*)::int as count
    from events where kind = 'pageview' and created_at >= ${sinceISO} and path is not null
    group by path order by count desc, path asc limit 5`)
  const referrers = await db.execute(sql`
    select coalesce(nullif(trim(referrer), ''), 'direct') as referrer, count(*)::int as count
    from events where kind = 'pageview' and created_at >= ${sinceISO}
    group by 1 order by count desc, referrer asc limit 5`)
  const fym = await db.execute(sql`
    select coalesce(data ->> 'application', 'unknown') as application, count(*)::int as count
    from events where kind = 'find-your-match' and created_at >= ${sinceISO}
    group by 1 order by count desc, application asc`)
  const prevTotals = await db.execute(sql`
    select count(*)::int as total, count(distinct session_hash)::int as uniques
    from events where kind = 'pageview' and created_at >= ${prevSinceISO} and created_at < ${sinceISO}`)
  const prevFym = await db.execute(sql`
    select count(*)::int as total
    from events where kind = 'find-your-match' and created_at >= ${prevSinceISO} and created_at < ${sinceISO}`)

  const dayCounts = new Map(byDay.rows.map((r) => [String(r.date), Number(r.count)]))
  const fymGroups = fym.rows.map((r) => ({ application: String(r.application), count: Number(r.count) }))

  return {
    byDay: fillDays(dayCounts, days, new Date().toISOString().slice(0, 10)),
    uniques: Number(totals.rows[0]?.uniques ?? 0),
    totalPv: Number(totals.rows[0]?.total ?? 0),
    paths: paths.rows.map((r) => ({ path: String(r.path), count: Number(r.count) })),
    referrers: referrers.rows.map((r) => ({ referrer: String(r.referrer), count: Number(r.count) })),
    fym: {
      total: fymGroups.reduce((sum, g) => sum + g.count, 0),
      byApplication: fymGroups.slice(0, 10),
    },
    prev: {
      totalPv: Number(prevTotals.rows[0]?.total ?? 0),
      uniques: Number(prevTotals.rows[0]?.uniques ?? 0),
      fymTotal: Number(prevFym.rows[0]?.total ?? 0),
    },
  }
}
