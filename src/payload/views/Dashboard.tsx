import { getPayload } from 'payload'
import config from '@payload-config'
import {
  pageViewsByDay,
  uniqueVisitors,
  topPaths,
  topReferrers,
  fymRunStats,
  type AnalyticsEvent,
} from '@/lib/analytics/aggregate'

const BLUE = '#0071bc'
const LIME = '#aec90b'

async function loadData() {
  const payload = await getPayload({ config })
  const since = new Date()
  since.setUTCDate(since.getUTCDate() - 6)
  const sinceIso = since.toISOString()
  const weekStart = new Date()
  weekStart.setUTCDate(weekStart.getUTCDate() - 7)

  const [recentLeads, leadsThisWeek, eventsRes] = await Promise.all([
    payload.find({ collection: 'submissions', limit: 5, sort: '-createdAt', depth: 0 }),
    payload.count({ collection: 'submissions', where: { createdAt: { greater_than: weekStart.toISOString() } } }),
    payload.find({ collection: 'events', limit: 10000, sort: '-createdAt', depth: 0, where: { createdAt: { greater_than: sinceIso } } }),
  ])

  const events = eventsRes.docs as unknown as AnalyticsEvent[]
  const today = new Date().toISOString().slice(0, 10)
  return {
    recentLeads: recentLeads.docs as Array<{ id: number | string; email?: string; type?: string; createdAt: string }>,
    leadsThisWeek: leadsThisWeek.totalDocs,
    byDay: pageViewsByDay(events, 7, today),
    uniques: uniqueVisitors(events),
    totalPv: events.filter((e) => e.kind === 'pageview').length,
    paths: topPaths(events, 5),
    referrers: topReferrers(events, 5),
    fym: fymRunStats(events),
  }
}

function Bars({ data, color }: { data: { label: string; count: number }[]; color: string }) {
  const max = Math.max(1, ...data.map((d) => d.count))
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      {data.length === 0 && <span style={{ color: '#8b94a3', fontSize: 13 }}>No data yet.</span>}
      {data.map((d) => (
        <div key={d.label} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span style={{ fontSize: 13, color: '#1c2733', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.label}</span>
            <span style={{ flex: 1, height: 8, borderRadius: 4, background: '#eef1f5', overflow: 'hidden' }}>
              <span style={{ display: 'block', height: '100%', width: `${(d.count / max) * 100}%`, background: color }} />
            </span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1c2733' }}>{d.count}</span>
        </div>
      ))}
    </div>
  )
}

function Card({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <section style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(16,24,40,.08)', borderTop: `3px solid ${accent}` }}>
      <h3 style={{ margin: '0 0 14px', fontSize: 14, textTransform: 'uppercase', letterSpacing: '.04em', color: '#5b6573' }}>{title}</h3>
      {children}
    </section>
  )
}

export async function Dashboard() {
  const d = await loadData()
  return (
    <div style={{ padding: 24, fontFamily: 'var(--font-inter-tight, Inter, system-ui, sans-serif)', maxWidth: 1180, margin: '0 auto' }}>
      <header style={{ borderRadius: 16, padding: '28px 28px', color: '#fff', background: `linear-gradient(100deg, ${BLUE}, ${LIME})`, marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>ENVO Admin</h1>
        <p style={{ margin: '6px 0 0', opacity: 0.92 }}>Website data — leads, AI tool usage, and traffic (last 7 days).</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        <Card title="Leads · this week" accent={BLUE}>
          <div style={{ fontSize: 34, fontWeight: 700, color: BLUE, marginBottom: 10 }}>{d.leadsThisWeek}</div>
          <div style={{ display: 'grid', gap: 6 }}>
            {d.recentLeads.length === 0 && <span style={{ color: '#8b94a3', fontSize: 13 }}>No leads yet.</span>}
            {d.recentLeads.map((l) => (
              <div key={l.id} style={{ fontSize: 13, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.email ?? '—'}</span>
                <span style={{ color: '#8b94a3' }}>{l.type}</span>
              </div>
            ))}
          </div>
          <a href="/admin/collections/submissions" style={{ display: 'inline-block', marginTop: 12, fontSize: 13, color: BLUE }}>View all leads →</a>
        </Card>

        <Card title="Find Your Match · runs" accent={LIME}>
          <div style={{ fontSize: 34, fontWeight: 700, color: '#1c2733', marginBottom: 10 }}>{d.fym.total}</div>
          <Bars data={d.fym.byApplication.map((a) => ({ label: a.application, count: a.count }))} color={LIME} />
        </Card>

        <Card title="Traffic · page views (7d)" accent={BLUE}>
          <div style={{ display: 'flex', gap: 18, marginBottom: 12 }}>
            <div><div style={{ fontSize: 28, fontWeight: 700, color: BLUE }}>{d.totalPv}</div><div style={{ fontSize: 12, color: '#8b94a3' }}>page views</div></div>
            <div><div style={{ fontSize: 28, fontWeight: 700, color: '#1c2733' }}>{d.uniques}</div><div style={{ fontSize: 12, color: '#8b94a3' }}>visitors (est.)</div></div>
          </div>
          <Bars data={d.byDay.map((x) => ({ label: x.date.slice(5), count: x.count }))} color={BLUE} />
        </Card>

        <Card title="Top pages (7d)" accent={LIME}>
          <Bars data={d.paths.map((p) => ({ label: p.path, count: p.count }))} color={LIME} />
        </Card>

        <Card title="Top referrers (7d)" accent={BLUE}>
          <Bars data={d.referrers.map((r) => ({ label: r.referrer, count: r.count }))} color={BLUE} />
        </Card>
      </div>
    </div>
  )
}
