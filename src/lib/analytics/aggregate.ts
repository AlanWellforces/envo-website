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

/** All Dashboard analytics numbers for the trailing `days`-day window (UTC day buckets). */
export async function analyticsSummary(payload: Payload, days: number): Promise<AnalyticsSummary> {
  const db = (payload.db as unknown as { drizzle: Drizzle }).drizzle
  const since = new Date()
  since.setUTCDate(since.getUTCDate() - (days - 1))
  since.setUTCHours(0, 0, 0, 0)
  const sinceISO = since.toISOString()

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
  }
}
