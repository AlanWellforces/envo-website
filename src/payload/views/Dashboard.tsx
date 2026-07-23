// Custom /admin landing — "Editorial Bold" (direction 3), ported 1:1 from the
// agreed mockup (dashboard-3.html): gradient hero with greeting + date pill,
// 5-up stat band (solid-blue and solid-lime feature tiles), icon quick-action
// cards, website-data panels (leads / traffic / Find Your Match) with inline
// SVG charts, then Recently-edited + Akeneo-sync panels. Server component —
// every number aggregates live via the Payload Local API.
import { getPayload } from 'payload'
import Link from 'next/link'
import config from '@payload-config'
import { analyticsSummary } from '@/lib/analytics/aggregate'
import { ADMIN_COLORS, ADMIN_FONT_FAMILY, ICON_GEOMETRY } from '../admin-theme'

const BLUE = ADMIN_COLORS.blue
const LIME = ADMIN_COLORS.lime
// The team works from NZ; the server (Vercel) runs in UTC. Every human-facing
// clock label on this page is pinned to Pacific/Auckland.
const TZ = 'Pacific/Auckland'
const tzDay = (d: Date): string => d.toLocaleDateString('en-CA', { timeZone: TZ })

type RecentDoc = { id: number | string; title: string; kind: 'post' | 'page' | 'project'; href: string; updatedAt: string }

async function loadData() {
  const payload = await getPayload({ config })

  const weekStart = new Date()
  weekStart.setUTCDate(weekStart.getUTCDate() - 7)

  const [
    productsTotal,
    productsLive,
    productsSynced,
    pagesTotal,
    postsPublished,
    postsDraft,
    projectsTotal,
    faqsTotal,
    leadsTotal,
    leadsThisWeek,
    recentLeads,
    analytics,
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
    payload.count({ collection: 'products', where: { akeneo_synced_at: { exists: true } } }),
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
    analyticsSummary(payload, 7),
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

  const recent: RecentDoc[] = [
    ...recentPosts.docs.map((d): RecentDoc => ({
      id: d.id,
      title: (d as { title?: string }).title ?? '(untitled)',
      kind: 'post',
      href: `/admin/collections/posts/${d.id}`,
      updatedAt: d.updatedAt,
    })),
    ...recentPages.docs.map((d): RecentDoc => ({
      id: d.id,
      title: (d as { title?: string }).title ?? '(untitled)',
      kind: 'page',
      href: `/admin/collections/pages/${d.id}`,
      updatedAt: d.updatedAt,
    })),
    ...recentProjects.docs.map((d): RecentDoc => ({
      id: d.id,
      title: (d as { title?: string }).title ?? '(untitled)',
      kind: 'project',
      href: `/admin/collections/projects/${d.id}`,
      updatedAt: d.updatedAt,
    })),
  ]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5)

  return {
    productsTotal: productsTotal.totalDocs,
    productsLive: productsLive.totalDocs,
    productsSynced: productsSynced.totalDocs,
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
    byDay: analytics.byDay,
    uniques: analytics.uniques,
    totalPv: analytics.totalPv,
    paths: analytics.paths,
    referrers: analytics.referrers,
    fym: analytics.fym,
    recent,
    lastSyncedAt: (lastSynced.docs[0] as { akeneo_synced_at?: string | null } | undefined)
      ?.akeneo_synced_at,
    syncLockedCount: syncLocked.totalDocs,
  }
}

function relTime(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

function lastSyncLabel(iso: string | null | undefined): string {
  if (!iso) return 'Never'
  const d = new Date(iso)
  const time = d.toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit', timeZone: TZ })
  const now = new Date()
  if (tzDay(d) === tzDay(now)) return `Today, ${time}`
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  if (tzDay(d) === tzDay(yesterday)) return `Yesterday, ${time}`
  return d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', timeZone: TZ }) + `, ${time}`
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
  const H = 92
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
            <rect x={x} y={y} width={barW} height={h} rx={3} fill={d.count > 0 ? BLUE : '#e6e9ee'} />
            {d.count > 0 && (
              <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="10" fontWeight="700" fill="#141d2b">
                {d.count}
              </text>
            )}
            <text x={x + barW / 2} y={H + 12} textAnchor="middle" fontSize="9" fill="#76828f">
              {d.date.slice(5)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// Shared geometry with the admin nav (admin-theme.ts) — "Manage pages" and
// "View products" render the same icons as their nav entries.
const ICONS = {
  plus: ICON_GEOMETRY.plus,
  home: ICON_GEOMETRY.home,
  file: ICON_GEOMETRY.page,
  box: ICON_GEOMETRY.box,
}

const QUICK_ACTIONS: { label: string; desc: string; href: string; lime?: boolean; icon: keyof typeof ICONS }[] = [
  { label: 'New blog post', desc: 'Write & publish', href: '/admin/collections/posts/create', icon: 'plus' },
  { label: 'Edit homepage', desc: 'Hero, sections', href: '/admin/globals/home-page', icon: 'home', lime: true },
  { label: 'Manage pages', desc: 'Legal & info', href: '/admin/collections/pages', icon: 'file' },
  { label: 'View products', desc: 'Catalogue', href: '/admin/collections/products', icon: 'box', lime: true },
]

type DashboardProps = { user?: { name?: string | null; email?: string | null } | null }

export async function Dashboard(props: DashboardProps) {
  const d = await loadData()

  const hour = Number(
    new Intl.DateTimeFormat('en-NZ', { hour: 'numeric', hourCycle: 'h23', timeZone: TZ }).format(new Date()),
  )
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const firstName = props.user?.name?.trim().split(/\s+/)[0] || props.user?.email?.split('@')[0] || 'there'
  const dateStr = new Date()
    .toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ })
    .replace(/,/g, ' ·')

  return (
    <div className="ed-root">
      <style>{`
        .ed-root { --blue: ${BLUE}; --blue-d: ${ADMIN_COLORS.blueDark}; --blue-soft: ${ADMIN_COLORS.blueSoft}; --lime: ${LIME}; --lime-d: ${ADMIN_COLORS.limeDark}; --lime-soft: ${ADMIN_COLORS.limeSoft}; --ink: ${ADMIN_COLORS.ink}; --muted: ${ADMIN_COLORS.muted}; --subtle: ${ADMIN_COLORS.subtle}; --line: ${ADMIN_COLORS.line}; background: ${ADMIN_COLORS.canvas}; padding: 30px 40px 60px; font-family: ${ADMIN_FONT_FAMILY}; color: var(--ink); -webkit-font-smoothing: antialiased; }
        .ed-root a { text-decoration: none; color: inherit; }
        .ed-wrap { max-width: 1200px; margin: 0 auto; }

        .ed-hero { position: relative; border-radius: 20px; padding: 34px 36px; margin-bottom: 26px; overflow: hidden; color: #fff; background: linear-gradient(115deg, #005a98 0%, #0071bc 42%, #3a9e3f 100%); }
        .ed-hero::before { content: ''; position: absolute; inset: 0; background: radial-gradient(60% 120% at 88% 0%, rgba(174,201,11,.55), transparent 60%); }
        .ed-hero > * { position: relative; }
        .ed-hero .ey { font-size: 12px; letter-spacing: .12em; text-transform: uppercase; font-weight: 700; opacity: .85; margin-bottom: 10px; }
        .ed-hero h1 { margin: 0; font-size: 32px; font-weight: 900; letter-spacing: -.025em; line-height: 1.05; }
        .ed-hero p { font-size: 14.5px; opacity: .9; margin: 10px 0 0; max-width: 560px; }
        .ed-hero .date { position: absolute; top: 34px; right: 36px; font-size: 12.5px; background: rgba(255,255,255,.15); padding: 7px 14px; border-radius: 999px; backdrop-filter: blur(4px); }

        .ed-grid5 { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 14px; margin-bottom: 26px; }
        .ed-stat { display: block; border-radius: 16px; padding: 20px; border: 1px solid var(--line); background: #fff; transition: transform .15s ease, box-shadow .15s ease; }
        .ed-stat:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(16,24,40,.1); }
        .ed-stat.b { background: linear-gradient(160deg, #0071bc, #0086df); color: #fff; border: 0; }
        .ed-stat.l { background: linear-gradient(160deg, #aec90b, #c2de1a); color: #21280a; border: 0; }
        .ed-stat .num { font-size: 32px; font-weight: 900; letter-spacing: -.03em; line-height: 1; }
        .ed-stat .lbl { font-size: 13px; margin-top: 8px; font-weight: 600; }
        .ed-stat .sub { font-size: 12px; margin-top: 3px; opacity: .7; }
        .ed-stat.b .lbl, .ed-stat.l .lbl { opacity: .95; }
        .ed-stat:not(.b):not(.l) .num { color: var(--blue); }
        .ed-stat:not(.b):not(.l) .sub { color: var(--subtle); }

        .ed-sectit { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--subtle); margin: 0 2px 12px; }

        .ed-actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-bottom: 28px; }
        .ed-acard { background: #fff; border: 1px solid var(--line); border-radius: 16px; padding: 20px; display: flex; flex-direction: column; gap: 12px; transition: .15s; }
        .ed-acard:hover { border-color: var(--blue); box-shadow: 0 8px 24px rgba(0,113,188,.1); transform: translateY(-2px); }
        .ed-acard .ic { width: 42px; height: 42px; border-radius: 12px; background: var(--blue-soft); color: var(--blue); display: grid; place-items: center; }
        .ed-acard.lime .ic { background: var(--lime-soft); color: var(--lime-d); }
        .ed-acard .ic svg { width: 21px; height: 21px; stroke-width: 1.9; }
        .ed-acard .t { font-size: 15px; font-weight: 700; }
        .ed-acard .d { font-size: 12.5px; color: var(--subtle); margin-top: -6px; }

        .ed-panels { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 28px; }
        .ed-cols { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; }
        @media (max-width: 900px) { .ed-cols { grid-template-columns: 1fr; } }
        .ed-panel { background: #fff; border: 1px solid var(--line); border-radius: 16px; padding: 24px; }
        .ed-panel h2 { margin: 0 0 4px; font-size: 16px; font-weight: 800; }
        .ed-panel .desc { font-size: 12.5px; color: var(--subtle); margin-bottom: 16px; }

        .ed-kpis { display: flex; gap: 26px; margin-bottom: 14px; }
        .ed-kpi-n { font-size: 30px; font-weight: 900; letter-spacing: -.03em; line-height: 1; }
        .ed-kpi-l { font-size: 11.5px; color: var(--subtle); font-weight: 600; text-transform: uppercase; letter-spacing: .06em; margin-top: 5px; }

        .ed-row { display: flex; align-items: center; gap: 13px; padding: 12px 0; border-top: 1px solid var(--line); }
        .ed-row:first-of-type { border-top: 0; }
        .ed-chip { font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 6px; flex: none; }
        .ed-chip.post { background: var(--blue-soft); color: var(--blue); }
        .ed-chip.page { background: var(--lime-soft); color: var(--lime-d); }
        .ed-chip.project { background: #eef1f4; color: var(--muted); }
        .ed-row .t { font-size: 13.5px; font-weight: 500; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ed-row .ago { font-size: 12px; color: var(--subtle); flex: none; }
        .ed-row:hover .t { color: var(--blue); }

        .ed-sync-big { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; }
        .ed-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--lime); box-shadow: 0 0 0 4px var(--lime-soft); }
        .ed-dot.off { background: #c3cad3; box-shadow: 0 0 0 4px #eef1f4; }
        .ed-sync-lab { font-size: 13px; color: var(--subtle); }
        .ed-sync-val { font-size: 16px; font-weight: 800; }
        .ed-kv { display: flex; justify-content: space-between; font-size: 13px; padding: 10px 0; border-top: 1px solid var(--line); }
        .ed-kv span { color: var(--subtle); }
        .ed-kv b { font-weight: 700; }

        .ed-bars { display: grid; gap: 8px; }
        .ed-bar-row { display: grid; grid-template-columns: minmax(80px, 150px) 1fr 28px; gap: 10px; align-items: center; }
        .ed-bar-label { font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ed-bar-track { height: 9px; border-radius: 5px; background: #eef1f4; overflow: hidden; }
        .ed-bar-fill { display: block; height: 100%; border-radius: 5px; }
        .ed-bar-count { font-size: 13px; font-weight: 700; text-align: right; }
        .ed-trend { width: 100%; height: auto; display: block; }
        .ed-empty { margin: 0; font-size: 13px; color: var(--subtle); }
        .ed-more { display: inline-block; margin-top: 12px; font-size: 13px; font-weight: 600; color: var(--blue); }
        .ed-more:hover { text-decoration: underline; }
      `}</style>

      <div className="ed-wrap">
        <div className="ed-hero">
          <div className="ey">ENVO Admin</div>
          <h1>
            {greeting}, {firstName}
          </h1>
          <p>Catalogue synced, content fresh. Here&apos;s your snapshot for today — leads, AI usage and traffic included.</p>
          <div className="date">{dateStr}</div>
        </div>

        <div className="ed-grid5">
          <Link href="/admin/collections/products" className="ed-stat b">
            <div className="num">{d.productsTotal}</div>
            <div className="lbl">Products</div>
            <div className="sub">{d.productsLive} live · synced</div>
          </Link>
          <Link href="/admin/collections/pages" className="ed-stat">
            <div className="num">{d.pagesTotal}</div>
            <div className="lbl">CMS Pages</div>
            <div className="sub">{d.pagesTotal === 0 ? 'none yet' : 'all published'}</div>
          </Link>
          <Link href="/admin/collections/posts" className="ed-stat l">
            <div className="num">{d.postsPublished + d.postsDraft}</div>
            <div className="lbl">Blog Posts</div>
            <div className="sub">
              {d.postsPublished} live · {d.postsDraft} draft{d.postsDraft === 1 ? '' : 's'}
            </div>
          </Link>
          <Link href="/admin/collections/projects" className="ed-stat">
            <div className="num">{d.projectsTotal}</div>
            <div className="lbl">Projects</div>
            {/* /projects is unlinked on the site until real installs exist (#111-era decision) */}
            <div className="sub">case studies · not linked on site yet</div>
          </Link>
          <Link href="/admin/collections/faqs" className="ed-stat">
            <div className="num">{d.faqsTotal}</div>
            <div className="lbl">FAQs</div>
            <div className="sub">help content</div>
          </Link>
        </div>

        <div className="ed-sectit">Quick actions</div>
        <div className="ed-actions">
          {QUICK_ACTIONS.map((a) => (
            <a key={a.href} href={a.href} className={a.lime ? 'ed-acard lime' : 'ed-acard'}>
              <div className="ic">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  dangerouslySetInnerHTML={{ __html: ICONS[a.icon] }}
                />
              </div>
              <div className="t">{a.label}</div>
              <div className="d">{a.desc}</div>
            </a>
          ))}
        </div>

        <div className="ed-sectit">Website data · last 7 days</div>
        <div className="ed-panels">
          <div className="ed-panel">
            <h2>Leads</h2>
            <div className="desc">Enquiries captured from the website.</div>
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
              <div>
                {d.recentLeads.map((l) => (
                  <a key={l.id} href={`/admin/collections/submissions/${l.id}`} className="ed-row">
                    <span className="t">{l.email ?? '—'}</span>
                    <span className="ago">
                      {l.type} · {relTime(l.createdAt)}
                    </span>
                  </a>
                ))}
              </div>
            )}
            <Link href="/admin/collections/submissions" className="ed-more">
              View all leads →
            </Link>
          </div>

          <div className="ed-panel">
            <h2>Traffic</h2>
            <div className="desc">First-party, cookieless — page views per day.</div>
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
          </div>

          <div className="ed-panel">
            <h2>Find Your Match</h2>
            <div className="desc">AI recommendation runs, by application.</div>
            <div className="ed-kpis">
              <div>
                <div className="ed-kpi-n" style={{ color: '#5b6a08' }}>
                  {d.fym.total}
                </div>
                <div className="ed-kpi-l">total runs</div>
              </div>
            </div>
            <Bars data={d.fym.byApplication.map((a) => ({ label: a.application, count: a.count }))} color={LIME} />
          </div>

          <div className="ed-panel">
            <h2>Top pages</h2>
            <div className="desc">Most viewed, last 7 days.</div>
            <Bars data={d.paths.map((p) => ({ label: p.path === '/' ? '/ (Home)' : p.path, count: p.count }))} color={BLUE} />
          </div>

          <div className="ed-panel">
            <h2>Top referrers</h2>
            <div className="desc">Where visitors come from.</div>
            <Bars data={d.referrers.map((r) => ({ label: r.referrer, count: r.count }))} color={LIME} />
          </div>
        </div>

        <div className="ed-cols">
          <div className="ed-panel">
            <h2>Recently edited</h2>
            <div className="desc">Jump back into what you were working on.</div>
            {d.recent.length === 0 ? (
              <p className="ed-empty">Nothing edited yet.</p>
            ) : (
              d.recent.map((r) => (
                <a key={`${r.kind}-${r.id}`} href={r.href} className="ed-row">
                  <span className={`ed-chip ${r.kind}`}>{r.kind.charAt(0).toUpperCase() + r.kind.slice(1)}</span>
                  <span className="t">{r.title}</span>
                  <span className="ago">{relTime(r.updatedAt)}</span>
                </a>
              ))
            )}
          </div>

          <div className="ed-panel">
            <h2>Akeneo sync</h2>
            <div className="desc">Product data source health.</div>
            <div className="ed-sync-big">
              <span className={d.lastSyncedAt ? 'ed-dot' : 'ed-dot off'} />
              <div>
                <div className="ed-sync-lab">Last sync</div>
                <div className="ed-sync-val">{lastSyncLabel(d.lastSyncedAt)}</div>
              </div>
            </div>
            <div className="ed-kv">
              <span>Products synced</span>
              <b>
                {d.productsSynced} / {d.productsTotal}
              </b>
            </div>
            <div className="ed-kv">
              <span>Live on site</span>
              <b>{d.productsLive}</b>
            </div>
            <div className="ed-kv">
              <span>Sync-locked (manual)</span>
              <b>{d.syncLockedCount}</b>
            </div>
            <div className="ed-kv">
              <span>Source</span>
              <b>Akeneo PIM · envo</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
