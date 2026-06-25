'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { CatalogueCard, FacetGroup } from './catalogue-data'

export type { CatalogueCard, FacetGroup, FacetOption } from './catalogue-data'

type Props = {
  cards: CatalogueCard[]
  groups: FacetGroup[]
  unit: string
}

/**
 * Unified catalogue body: search + facet rail (left) and the results grid.
 * A card matches when, for every group with a selection, its values for that
 * group intersect the selected set (so a card lacking a value for an active
 * facet is excluded), and the query (if any) appears in its name/family.
 */
export function CatalogueFilter({ cards, groups, unit }: Props) {
  const [selected, setSelected] = useState<Record<string, Set<string>>>({})
  const [query, setQuery] = useState('')

  const toggle = (groupKey: string, value: string) =>
    setSelected((prev) => {
      const next = { ...prev }
      const set = new Set(next[groupKey] ?? [])
      if (set.has(value)) set.delete(value)
      else set.add(value)
      if (set.size) next[groupKey] = set
      else delete next[groupKey]
      return next
    })

  const reset = () => {
    setSelected({})
    setQuery('')
  }
  const activeCount = Object.values(selected).reduce((n, s) => n + s.size, 0) + (query ? 1 : 0)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return cards.filter((card) => {
      if (q && !(`${card.name} ${card.familyLabel}`.toLowerCase().includes(q))) return false
      return Object.entries(selected).every(([gk, set]) => (card.facets[gk] ?? []).some((v) => set.has(v)))
    })
  }, [cards, selected, query])

  return (
    <div className="pcat-body">
      <aside className="pcat-filters">
        <div className="pcat-search">
          <svg viewBox="0 0 24 24" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            type="search"
            placeholder="Search series or model…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search the catalogue"
          />
        </div>

        <div className="pcat-ftitle">
          Filters
          {activeCount > 0 && (
            <button type="button" className="reset" onClick={reset}>
              Reset all
            </button>
          )}
        </div>

        {groups.map((g) => (
          <div key={g.key} className="pcat-fgroup">
            <h4>{g.label}</h4>
            <div className="pcat-fopts">
              {g.options.map((o) => {
                const on = selected[g.key]?.has(o.value) ?? false
                return (
                  <button
                    key={o.value}
                    type="button"
                    className={`pcat-fopt${on ? ' on' : ''}`}
                    aria-pressed={on}
                    onClick={() => toggle(g.key, o.value)}
                  >
                    {o.label} <span className="ct">{o.count}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </aside>

      <section className="pcat-results">
        <p className="pcat-count">
          {visible.length} <em>series · {visible.reduce((n, c) => n + c.modelCount, 0)} {unit}</em>
        </p>

        {visible.length === 0 ? (
          <p className="pcat-empty">
            No series match those filters.{' '}
            <button type="button" className="pcat-empty-reset" onClick={reset}>
              Reset all
            </button>
          </p>
        ) : (
          <div className="pcat-list">
            {visible.map((c) => (
              <Link key={c.key} href={c.href} className="pcat-row">
                <div className="pcat-row-media">
                  {c.beads ? (
                    <span className="pcat-beads" aria-hidden>
                      {Array.from({ length: c.beads }).map((_, i) => (
                        <i key={i} />
                      ))}
                    </span>
                  ) : null}
                  <div className="pcat-row-img">
                    {c.imgLocal ? (
                      <Image
                        src={c.imgSrc}
                        alt={c.imgAlt}
                        width={300}
                        height={200}
                        sizes="160px"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.imgSrc} alt={c.imgAlt} loading="lazy" />
                    )}
                  </div>
                </div>

                <div className="pcat-row-body">
                  <div className="pcat-row-fam">{c.familyLabel}</div>
                  <h3 className="pcat-row-nm">{c.name}</h3>
                  <p className="pcat-row-desc">{c.desc}</p>
                  {c.chips.length > 0 && (
                    <div className="pcat-card-chips">
                      {c.chips.map((chip) => (
                        <span key={chip} className="pcat-card-chip">
                          {chip}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pcat-row-side">
                  {c.certified && <span className="pcat-row-badge">Certified</span>}
                  <span className="pcat-row-models">
                    {c.modelCount} {c.modelCount === 1 ? 'model' : 'models'}
                  </span>
                  <span className="pcat-card-go">
                    View range <span>→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
