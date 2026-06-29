'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { Project, ProjectIndustry } from '@/lib/projects'

// Client-safe label map — do NOT value-import from '@/lib/projects' (it pulls in
// Payload → server-only code into the client bundle → 500). Types are erased, so
// the `import type` above is fine.
const INDUSTRY_LABELS: Record<ProjectIndustry, string> = {
  retail: 'Retail',
  hotel: 'Hotel & Hospitality',
  storefront: 'Storefront',
  architectural: 'Architectural Facade',
  canopy: 'Canopy',
  other: 'Other',
}

/** Display tabs group the raw industry values into the public-facing buckets. */
const TABS: { key: string; label: string; industries: ProjectIndustry[] | null }[] = [
  { key: 'all', label: 'All projects', industries: null },
  { key: 'facades', label: 'Facades', industries: ['architectural', 'canopy'] },
  { key: 'retail', label: 'Retail signage', industries: ['retail', 'storefront'] },
  { key: 'interior', label: 'Interior', industries: ['hotel', 'other'] },
]

function coverUrl(c: Project['cover']): string | undefined {
  return typeof c === 'string' ? c : c?.url
}

/** Short category label for a card, derived from its primary industry. */
function categoryLabel(p: Project): string {
  const first = p.industry?.[0]
  return first ? INDUSTRY_LABELS[first] : 'Project'
}

function matchesTab(p: Project, tab: (typeof TABS)[number]): boolean {
  if (!tab.industries) return true
  return p.industry?.some((i) => tab.industries!.includes(i)) ?? false
}

export function ProjectsCatalogue({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState('all')
  const activeTab = TABS.find((t) => t.key === active) ?? TABS[0]

  const featured = useMemo(() => projects.find((p) => p.featured), [projects])
  // Only show tabs that actually have matching projects.
  const visibleTabs = useMemo(
    () => TABS.filter((t) => !t.industries || projects.some((p) => matchesTab(p, t))),
    [projects],
  )

  const showFeatured = featured && matchesTab(featured, activeTab)
  const grid = projects.filter(
    (p) => p.id !== featured?.id && matchesTab(p, activeTab),
  )
  const count = (showFeatured ? 1 : 0) + grid.length

  return (
    <>
      <div className="pj-filters">
        {visibleTabs.map((t) => (
          <button
            key={t.key}
            className={`pj-pill${t.key === active ? ' active' : ''}`}
            onClick={() => setActive(t.key)}
          >
            {t.label}
          </button>
        ))}
        <span className="pj-count">
          {count} project{count === 1 ? '' : 's'}
        </span>
      </div>

      {showFeatured && featured && (
        <Link
          href={`/projects/${featured.slug}`}
          className="pj-feat"
          style={{ backgroundImage: `url('${coverUrl(featured.cover) ?? ''}')` }}
        >
          <div className="pj-ov">
            <span className="pj-badge">FEATURED</span>
            <div className="pj-eyebrow">
              {categoryLabel(featured)}
              {featured.location ? ` · ${featured.location}` : ''}
            </div>
            <h2>{featured.title}</h2>
            {featured.excerpt && <p>{featured.excerpt}</p>}
            {featured.specs && featured.specs.length > 0 && (
              <div className="pj-specs">
                {featured.specs.map((s, i) => (
                  <div key={i}>
                    <div className="v">{s.value}</div>
                    <div className="l">{s.label}</div>
                  </div>
                ))}
              </div>
            )}
            <span className="pj-cta">Read case study →</span>
          </div>
        </Link>
      )}

      {count === 0 ? (
        <p className="pj-empty">No projects in this category yet — check back soon.</p>
      ) : (
        <div className="pj-grid">
          {grid.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.slug}`}
              className="pj-card"
              style={{ backgroundImage: `url('${coverUrl(p.cover) ?? ''}')` }}
            >
              <span className="pj-tag">{categoryLabel(p)}</span>
              <div className="pj-card-ov">
                <h3>{p.title}</h3>
                <div className="m">
                  {[p.location, p.tags?.[0]].filter(Boolean).join(' · ')}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
