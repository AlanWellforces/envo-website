// Custom /admin landing — "Editorial Bold" (direction 3): light base,
// blue→lime gradient hero, two-colour editorial stat tiles, quick actions,
// website-data cards (leads / Find Your Match / traffic) with inline-SVG
// charts, recently-edited list and Akeneo sync status. Server component —
// all numbers aggregate live via the Payload Local API.
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
const INK = '#141a22'
const MUTE = '#6b7482'

type RecentDoc = { id: number | string; title: string; collection: string; href: string; updatedAt: string }

async function loadData() {
  const payload = await getPayload({ config })

  const since = new Date()
  since.setUTCDate(since.getUTCDate() - 6)
  since.setUTCHours(0, 0, 0, 0)
  const weekStart = new Date()
  weekStart.setUTCDate(weekStart.getUTCDate() - 7)

  const [
    productsTotal,
    productsLive,
    pagesTotal,
    postsPublished,
    postsDraft,
    projectsTotal,
    faqsTotal,
    leadsTotal,
    leadsThisWeek,
    recentLeads,
    eventsRes,
    recentPosts,
    recentPages,
    recentProjects,
    lastSynced,
    syncLocked,
  ] = await Promise.all([
    payload.count({ collection: 'products' }),
    payload.count({
      collection: 'products',
      where: { and: [{ enabled: { equals: true } }, { hidden: { not_equals: true } }] },
    }),
    payload.count({ collection: 'pages' }),
    payload.count({ collection: 'posts', where: { _status: { equals: 'published' } } }),
    payload.count({ collection: 'posts', where: { _status: { equals: 'draft' } } }),
    payload.count({ collection: 'projects' }),
    payload.count({ collection: 'faqs' }),
    payload.count({ collection: 'submissions' }),
    payload.count({
      collection: 'submissions',
      where: { createdAt: { greater_than: weekStart.toISOString() } },
    }),
    payload.find({ collection: 'submissions', limit: 5, sort: '-createdAt', depth: 0 }),
    payload.find({
      collection: 'events',
      limit: 10000,
      sort: '-createdAt',
      depth: 0,
      where: { createdAt: { greater_than: since.toISOString() } },
    }),
    payload.find({ collection: 'posts', limit: 3, sort: '-updatedAt', depth: 0 }),
    payload.find({ collection: 'pages', limit: 3, sort: '-updatedAt', depth: 0 }),
    payload.find({ collection: 'projects', limit: 3, sort: '-updatedAt', depth: 0 }),
    payload.find({
      collection: 'products',
      limit: 1,
      sort: '-akeneo_synced_at',
      depth: 0,
      where: { akeneo_synced_at: { exists: true } },
    }),
    payload.count({ collection: 'products', where: { sync_locked: { equals: true } } }),
  ])

  const events = eventsRes.docs as unknown as AnalyticsEvent[]
  const today = new Date().toISOString().slice(0, 10)

  const recent: RecentDoc[] = [
    ...recentPosts.docs.map((d) => ({
      id: d.id,
      title: (d as { title?: string }).title ?? '(untitled)',
      collection: 'Post',
      href: `/admin/collections/posts/${d.id}`,
      updatedAt: d.updatedAt,
    })),
    ...recentPages.docs.map((d) => ({
      id: d.id,
      title: (d as { title?: string }).title ?? '(untitled)',
      collection: 'Page',
      href: `/admin/collections/pages/${d.id}`,
      updatedAt: d.updatedAt,
    })),
    ...recentProjects.docs.map((d) => ({
      id: d.id,
      title: (d as { title?: string }).title ?? '(untitled)',
      collection: 'Project',
      href: `/admin/collections/projects/${d.id}`,
      updatedAt: d.updatedAt,
    })),
  ]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 6)

  return {
    productsTotal: productsTotal.totalDocs,
    productsLive: productsLive.totalDocs,
    pagesTotal: pagesTotal.totalDocs,
    postsPublished: postsPublished.totalDocs,
    postsDraft: postsDraft.totalDocs,
    projectsTotal: projectsTotal.totalDocs,
    faqsTotal: faqsTotal.totalDocs,
    leadsTotal: leadsTotal.totalDocs,
    leadsThisWeek: leadsThisWeek.totalDocs,
    recentLeads: recentLeads.docs as Array<{
      id: number | string
      email?: string | null
      type?: string | null
      createdAt: string
    }>,
    byDay: pageViewsByDay(events, 7, today),
    uniques: uniqueVisitors(events),
    totalPv: events.filter((e) => e.kind === 'pageview').length,
    paths: topPaths(events, 5),
    referrers: topReferrers(events, 5),
    fym: fymRunStats(events),
    recent,
    lastSyncedAt: (lastSynced.docs[0] as { akeneo_synced_at?: string | null } | undefined)
      ?.akeneo_synced_at,
    syncLockedCount: syncLocked.totalDocs,
  }
}

function relTime(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

/** Horizontal ranked bars (top pages / referrers / FYM applications). */
function Bars({ data, color }: { data: { label: string; count: number }[]; color: string }) {
  const max = Math.max(1, ...data.map((d) => d.count))
  if (data.length === 0) return <p className="ed-empty">No data yet — fills in after launch.</p>
  return (
    <div className="ed-bars">
      {data.map((d) => (
        <div key={d.label} className="ed-bar-row">
          <span className="ed-bar-label" title={d.label}>
            {d.label}
          </span>
          <span className="ed-bar-track">
            <span className="ed-bar-fill" style={{ width: `${(d.count / max) * 100}%`, background: color }} />
          </span>
          <span className="ed-bar-count">{d.count}</span>
        </div>
      ))}
    </div>
  )
}

/** 7-day page-view column chart (inline SVG). */
function TrendChart({ data }: { data: { date: string; count: number }[] }) {
  const W = 320
  const H = 96
  const PAD = 4
  const LABEL_H = 16
  const max = Math.max(1, ...data.map((d) => d.count))
  const slot = (W - PAD * 2) / data.length
  const barW = Math.min(30, slot * 0.55)
  return (
    <svg viewBox={`0 0 ${W} ${H + LABEL_H}`} className="ed-trend" role="img" aria-label="Page views per day, last 7 days">
      {data.map((d, i) => {
        const h = Math.max(d.count > 0 ? 4 : 2, (d.count / max) * (H - 18))
        const x = PAD + slot * i + (slot - barW) / 2
        const y = H - h
        return (
          <g key={d.date}>
            <rect x={x} y={y} width={barW} height={h} rx={3} fill={d.count > 0 ? BLUE : '#dde3ea'} />
            {d.count > 0 && (
              <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="10" fontWeight="700" fill={INK}>
                {d.count}
              </text>
            )}
            <text x={x + barW / 2} y={H + 12} textAnchor="middle" fontSize="9" fill={MUTE}>
              {d.date.slice(5)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function StatTile({
  value,
  label,
  sub,
  href,
  accent,
}: {
  value: React.ReactNode
  label: string
  sub?: string
  href: string
  accent: string
}) {
  return (
    <a href={href} className="ed-tile" style={{ borderTopColor: accent }}>
      <span className="ed-tile-value" style={{ color: accent === LIME ? INK : accent }}>
        {value}
      </span>
      <span className="ed-tile-label">{label}</span>
      {sub && <span className="ed-tile-sub">{sub}</span>}
    </a>
  )
}

function Card({
  title,
  accent,
  action,
  children,
}: {
  title: string
  accent: string
  action?: { label: string; href: string }
  children: React.ReactNode
}) {
  return (
    <section className="ed-card" style={{ borderTopColor: accent }}>
      <div className="ed-card-head">
        <h3 className="ed-card-title">{title}</h3>
        {action && (
          <a className="ed-card-action" href={action.href}>
            {action.label} →
          </a>
        )}
      </div>
      {children}
    </section>
  )
}

const QUICK_ACTIONS = [
  { label: 'New blog post', href: '/admin/collections/posts/create', accent: BLUE },
  { label: 'Edit homepage', href: '/admin/globals/home-page', accent: LIME },
  { label: 'Manage pages', href: '/admin/collections/pages', accent: BLUE },
  { label: 'View products', href: '/admin/collections/products', accent: BLUE },
]

export async function Dashboard() {
  const d = await loadData()
  const dateStr = new Date().toLocaleDateString('en-NZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="ed-root">
      <style>{`
        .ed-root { --ed-blue: ${BLUE}; --ed-lime: ${LIME}; padding: 28px 32px 48px; max-width: 1240px; margin: 0 auto; font-family: 'Inter Tight', Inter, system-ui, sans-serif; color: ${INK}; }
        .ed-hero { position: relative; overflow: hidden; border-radius: 18px; padding: 34px 36px 30px; color: #fff; background: linear-gradient(104deg, #005a96 0%, ${BLUE} 38%, #6aa63c 82%, ${LIME} 100%); margin-bottom: 26px; }
        .ed-hero::after { content: ''; position: absolute; right: -60px; top: -80px; width: 320px; height: 320px; border-radius: 50%; background: rgba(255,255,255,.08); }
        .ed-hero-logo { height: 30px; width: auto; display: block; margin-bottom: 16px; }
        .ed-hero h1 { margin: 0; font-size: 30px; font-weight: 800; letter-spacing: -0.02em; }
        .ed-hero p { margin: 8px 0 0; font-size: 14.5px; opacity: .92; max-width: 640px; }
        .ed-hero-date { position: absolute; top: 34px; right: 36px; font-size: 13px; font-weight: 600; opacity: .85; }
        .ed-section { display: flex; align-items: baseline; gap: 10px; margin: 30px 0 14px; }
        .ed-section h2 { margin: 0; font-size: 13px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: ${MUTE}; }
        .ed-section::after { content: ''; flex: 1; height: 1px; background: #e3e7ec; }
        .ed-tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 14px; }
        .ed-tile { display: flex; flex-direction: column; gap: 2px; background: #fff; border-radius: 12px; border-top: 4px solid ${BLUE}; padding: 18px 18px 16px; box-shadow: 0 1px 3px rgba(16,24,40,.07); text-decoration: none; color: ${INK}; transition: transform .12s ease, box-shadow .12s ease; }
        .ed-tile:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(16,24,40,.12); }
        .ed-tile-value { font-size: 34px; font-weight: 800; line-height: 1.05; letter-spacing: -0.02em; }
        .ed-tile-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: ${MUTE}; margin-top: 6px; }
        .ed-tile-sub { font-size: 12px; color: ${MUTE}; }
        .ed-actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; }
        .ed-action { display: flex; align-items: center; justify-content: space-between; gap: 10px; background: #fff; border: 1.5px solid #e3e7ec; border-radius: 12px; padding: 15px 18px; font-size: 14px; font-weight: 700; color: ${INK}; text-decoration: none; transition: border-color .12s ease, transform .12s ease; }
        .ed-action:hover { border-color: var(--ac); transform: translateY(-1px); }
        .ed-action .ed-arrow { color: var(--ac); font-weight: 800; }
        .ed-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; }
        .ed-card { background: #fff; border-radius: 14px; border-top: 4px solid ${BLUE}; padding: 20px 22px; box-shadow: 0 1px 3px rgba(16,24,40,.07); }
        .ed-card-head { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin-bottom: 14px; }
        .ed-card-title { margin: 0; font-size: 12.5px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; color: ${MUTE}; }
        .ed-card-action { font-size: 13px; font-weight: 600; color: ${BLUE}; text-decoration: none; white-space: nowrap; }
        .ed-card-action:hover { text-decoration: underline; }
        .ed-big { font-size: 38px; font-weight: 800; letter-spacing: -0.02em; line-height: 1; margin-bottom: 12px; }
        .ed-kpis { display: flex; gap: 26px; margin-bottom: 12px; }
        .ed-kpi-n { font-size: 30px; font-weight: 800; letter-spacing: -0.02em; }
        .ed-kpi-l { font-size: 11.5px; color: ${MUTE}; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; }
        .ed-bars { display: grid; gap: 8px; }
        .ed-bar-row { display: grid; grid-template-columns: minmax(90px, 160px) 1fr 28px; gap: 10px; align-items: center; }
        .ed-bar-label { font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ed-bar-track { height: 9px; border-radius: 5px; background: #eef1f5; overflow: hidden; }
        .ed-bar-fill { display: block; height: 100%; border-radius: 5px; }
        .ed-bar-count { font-size: 13px; font-weight: 700; text-align: right; }
        .ed-trend { width: 100%; height: auto; display: block; }
        .ed-empty { margin: 0; font-size: 13px; color: ${MUTE}; }
        .ed-list { display: grid; gap: 9px; }
        .ed-list-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 13.5px; text-decoration: none; color: ${INK}; }
        .ed-list-row:hover .ed-list-title { color: ${BLUE}; }
        .ed-list-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }
        .ed-list-meta { color: ${MUTE}; font-size: 12px; white-space: nowrap; }
        .ed-pill { display: inline-block; font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; padding: 2px 8px; border-radius: 20px; background: #eef4fa; color: ${BLUE}; margin-right: 8px; }
        .ed-sync-row { display: flex; justify-content: space-between; gap: 10px; font-size: 13.5px; padding: 7px 0; border-bottom: 1px solid #f0f2f5; }
        .ed-sync-row:last-child { border-bottom: 0; }
        .ed-sync-k { color: ${MUTE}; }
        .ed-sync-v { font-weight: 700; }
      `}</style>

      <header className="ed-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/images/logo-envo-light.svg" alt="ENVO" className="ed-hero-logo" />
        <span className="ed-hero-date">{dateStr}</span>
        <h1>Welcome back</h1>
        <p>Everything the website captures — leads, AI tool usage and first-party traffic — plus your content at a glance.</p>
      </header>

      <div className="ed-section">
        <h2>Content</h2>
      </div>
      <div className="ed-tiles">
        <StatTile
          value={d.productsLive}
          label="Products live"
          sub={`${d.productsTotal} total in catalogue`}
          href="/admin/collections/products"
          accent={BLUE}
        />
        <StatTile
          value={d.postsPublished}
          label="Blog posts"
          sub={`${d.postsDraft} draft${d.postsDraft === 1 ? '' : 's'}`}
          href="/admin/collections/posts"
          accent={LIME}
        />
        <StatTile value={d.pagesTotal} label="CMS pages" href="/admin/collections/pages" accent={BLUE} />
        <StatTile value={d.projectsTotal} label="Projects" href="/admin/collections/projects" accent={LIME} />
        <StatTile value={d.faqsTotal} label="FAQs" href="/admin/collections/faqs" accent={BLUE} />
      </div>

      <div className="ed-section">
        <h2>Quick actions</h2>
      </div>
      <div className="ed-actions">
        {QUICK_ACTIONS.map((a) => (
          <a key={a.href} href={a.href} className="ed-action" style={{ ['--ac' as string]: a.accent }}>
            {a.label}
            <span className="ed-arrow">→</span>
          </a>
        ))}
      </div>

      <div className="ed-section">
        <h2>Website data · last 7 days</h2>
      </div>
      <div className="ed-grid">
        <Card title="Leads" accent={BLUE} action={{ label: 'View all', href: '/admin/collections/submissions' }}>
          <div className="ed-kpis">
            <div>
              <div className="ed-kpi-n" style={{ color: BLUE }}>
                {d.leadsThisWeek}
              </div>
              <div className="ed-kpi-l">this week</div>
            </div>
            <div>
              <div className="ed-kpi-n">{d.leadsTotal}</div>
              <div className="ed-kpi-l">all time</div>
            </div>
          </div>
          {d.recentLeads.length === 0 ? (
            <p className="ed-empty">No leads yet — fills in after launch.</p>
          ) : (
            <div className="ed-list">
              {d.recentLeads.map((l) => (
                <a key={l.id} href={`/admin/collections/submissions/${l.id}`} className="ed-list-row">
                  <span className="ed-list-title">{l.email ?? '—'}</span>
                  <span className="ed-list-meta">
                    {l.type} · {relTime(l.createdAt)}
                  </span>
                </a>
              ))}
            </div>
          )}
        </Card>

        <Card title="Traffic" accent={BLUE}>
          <div className="ed-kpis">
            <div>
              <div className="ed-kpi-n" style={{ color: BLUE }}>
                {d.totalPv}
              </div>
              <div className="ed-kpi-l">page views</div>
            </div>
            <div>
              <div className="ed-kpi-n">{d.uniques}</div>
              <div className="ed-kpi-l">visitors (est.)</div>
            </div>
          </div>
          <TrendChart data={d.byDay} />
        </Card>

        <Card title="Find Your Match · AI" accent={LIME}>
          <div className="ed-big">{d.fym.total}</div>
          <Bars data={d.fym.byApplication.map((a) => ({ label: a.application, count: a.count }))} color={LIME} />
        </Card>

        <Card title="Top pages" accent={BLUE}>
          <Bars data={d.paths.map((p) => ({ label: p.path, count: p.count }))} color={BLUE} />
        </Card>

        <Card title="Top referrers" accent={LIME}>
          <Bars data={d.referrers.map((r) => ({ label: r.referrer, count: r.count }))} color={LIME} />
        </Card>

        <Card title="Recently edited" accent={BLUE}>
          {d.recent.length === 0 ? (
            <p className="ed-empty">Nothing edited yet.</p>
          ) : (
            <div className="ed-list">
              {d.recent.map((r) => (
                <a key={`${r.collection}-${r.id}`} href={r.href} className="ed-list-row">
                  <span className="ed-list-title">
                    <span className="ed-pill">{r.collection}</span>
                    {r.title}
                  </span>
                  <span className="ed-list-meta">{relTime(r.updatedAt)}</span>
                </a>
              ))}
            </div>
          )}
        </Card>

        <Card title="Akeneo sync" accent={LIME} action={{ label: 'Products', href: '/admin/collections/products' }}>
          <div className="ed-sync-row">
            <span className="ed-sync-k">Last sync</span>
            <span className="ed-sync-v">{d.lastSyncedAt ? relTime(d.lastSyncedAt) : 'never'}</span>
          </div>
          <div className="ed-sync-row">
            <span className="ed-sync-k">Products in catalogue</span>
            <span className="ed-sync-v">{d.productsTotal}</span>
          </div>
          <div className="ed-sync-row">
            <span className="ed-sync-k">Live on site</span>
            <span className="ed-sync-v">{d.productsLive}</span>
          </div>
          <div className="ed-sync-row">
            <span className="ed-sync-k">Sync-locked (manual)</span>
            <span className="ed-sync-v">{d.syncLockedCount}</span>
          </div>
        </Card>
      </div>
    </div>
  )
}
