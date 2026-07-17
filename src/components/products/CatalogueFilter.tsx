'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import type { CatalogueCard, FacetGroup } from './catalogue-data'

export type { CatalogueCard, FacetGroup, FacetOption } from './catalogue-data'

type Props = {
  cards: CatalogueCard[]
  groups: FacetGroup[]
  resultKind?: 'series' | 'products'
  layout?: 'rows' | 'productGrid'
  /** Group the results under their section headings (e.g. CV / CC drivers)
   *  while no filter or search is active; any active filter flattens the list. */
  showSections?: boolean
}

/** Stable key for a selection state (preset-vs-user comparison). */
const serializeSelection = (sel: Record<string, Set<string>>): string =>
  Object.keys(sel)
    .sort()
    .map((k) => `${k}=${[...sel[k]].sort().join(',')}`)
    .join('&')

// Sort options are adaptive: a metric appears only when ≥2 visible cards
// carry it. Never price — this is a lead-gen catalogue.
type SortKey = 'default' | 'name' | 'power-asc' | 'power-desc' | 'brightness-asc' | 'brightness-desc'
const SORT_LABELS: Record<SortKey, string> = {
  default: 'Featured',
  name: 'Name (A–Z)',
  'power-asc': 'Power: low to high',
  'power-desc': 'Power: high to low',
  'brightness-asc': 'Brightness: low to high',
  'brightness-desc': 'Brightness: high to low',
}

/**
 * Unified catalogue body: search + facet rail (left) and the results grid.
 * A card matches when, for every group with a selection, its values for that
 * group intersect the selected set (so a card lacking a value for an active
 * facet is excluded), and the query (if any) appears in its name/family.
 */
export function CatalogueFilter({
  cards,
  groups,
  resultKind = 'series',
  layout = 'rows',
  showSections = false,
}: Props) {
  const [query, setQuery] = useState('')
  // Deep-linkable filters: any facet group can be pre-selected via a URL
  // param named after its key (e.g. /products/led-signage-modules?series=
  // Mini+Series, comma-separated for multiple) — what the sidebar submenu
  // "collections" link to. useSearchParams is reactive, so clicking another
  // collection link while already on the page re-applies the filter (the
  // consumer pages wrap this component in <Suspense> as Next requires).
  // Unknown keys/values are ignored; hand-toggling filters afterwards works
  // as normal.
  const searchParams = useSearchParams()
  const urlSelection = useMemo(() => {
    const fromUrl: Record<string, Set<string>> = {}
    for (const g of groups) {
      const raw = searchParams.get(g.key)
      if (!raw) continue
      const valid = new Set(g.options.map((o) => o.value))
      const picks = raw.split(',').filter((v) => valid.has(v))
      if (picks.length) fromUrl[g.key] = new Set(picks)
    }
    return fromUrl
    // groups are stable per page; re-parse whenever the URL params change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const [selected, setSelected] = useState<Record<string, Set<string>>>(urlSelection)
  // Serialized snapshot of the URL-preset selection: while the user hasn't
  // deviated from it, the page is in "collection browse" mode and keeps its
  // section headings (user 2026-07-08).
  const [preset, setPreset] = useState(() => serializeSelection(urlSelection))
  // A fresh navigation (new searchParams instance) re-applies the URL preset;
  // between navigations the user's manual toggles own the state. Same
  // dependency the old effect used, moved to an adjust-state-during-render
  // pass so no setState runs inside an effect.
  const [appliedParams, setAppliedParams] = useState(searchParams)
  if (appliedParams !== searchParams) {
    setAppliedParams(searchParams)
    if (Object.keys(urlSelection).length) {
      setSelected(urlSelection)
      setPreset(serializeSelection(urlSelection))
    }
  }
  // ?search=1 (mobile-header search button): the search box sits below the
  // results on phones, so scroll it into view and focus it on arrival.
  const searchInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (searchParams.get('search') == null) return
    searchInputRef.current?.scrollIntoView({ block: 'center' })
    searchInputRef.current?.focus({ preventScroll: true })
  }, [searchParams])
  // All groups open by default (user 2026-07-10; reverses the 2026-07-08
  // lead-group-only accordion) — selectors scan every facet at a glance.
  // Groups remain individually collapsible.
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((g) => [g.key, true])),
  )
  const toggleOpen = (key: string) => setOpen((prev) => ({ ...prev, [key]: !prev[key] }))
  const noun = resultKind === 'products' ? 'products' : 'series'

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

  // `${groupKey}:${value}` -> human label, for the active-filter chips.
  const labelOf = useMemo(() => {
    const m = new Map<string, string>()
    for (const g of groups) for (const o of g.options) m.set(`${g.key}:${o.value}`, o.label)
    return m
  }, [groups])

  const activeChips = Object.entries(selected).flatMap(([gk, set]) =>
    [...set].map((v) => ({ gk, v, label: labelOf.get(`${gk}:${v}`) ?? v })),
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return cards.filter((card) => {
      const haystack = `${card.name} ${card.familyLabel} ${card.sku ?? ''} ${(card.facts ?? []).join(' ')}`
      if (q && !haystack.toLowerCase().includes(q)) return false
      return Object.entries(selected).every(([gk, set]) => (card.facets[gk] ?? []).some((v) => set.has(v)))
    })
  }, [cards, selected, query])

  // ── sort (user 2026-07-08): Featured keeps the curated order ──
  const [sortBy, setSortBy] = useState<SortKey>('default')
  const sortOptions = useMemo(() => {
    const opts: SortKey[] = ['default', 'name']
    if (cards.filter((c) => c.metrics?.power != null).length >= 2) opts.push('power-asc', 'power-desc')
    if (cards.filter((c) => c.metrics?.brightness != null).length >= 2) opts.push('brightness-asc', 'brightness-desc')
    return opts
  }, [cards])
  const sorted = useMemo(() => {
    if (sortBy === 'default') return visible
    const arr = [...visible]
    const by = (get: (c: CatalogueCard) => number | null | undefined, dir: 1 | -1) =>
      arr.sort((a, b) => {
        const av = get(a)
        const bv = get(b)
        if (av == null && bv == null) return a.name.localeCompare(b.name)
        if (av == null) return 1 // metric-less cards sink to the end either way
        if (bv == null) return -1
        return (av - bv) * dir || a.name.localeCompare(b.name)
      })
    if (sortBy === 'name') return arr.sort((a, b) => a.name.localeCompare(b.name))
    if (sortBy === 'power-asc') return by((c) => c.metrics?.power, 1)
    if (sortBy === 'power-desc') return by((c) => c.metrics?.power, -1)
    if (sortBy === 'brightness-asc') return by((c) => c.metrics?.brightness, 1)
    return by((c) => c.metrics?.brightness, -1)
  }, [visible, sortBy])

  // Section headings stay while browsing the untouched page OR a sidebar
  // "collection" deep link (preset filter) — they drop once the user narrows
  // further or re-sorts.
  const atPreset = !query && serializeSelection(selected) === preset
  const sectioned = showSections && sortBy === 'default' && (activeCount === 0 || atPreset)

  return (
    <div className="pcat-body">
      <aside className="pcat-filters">
        <div className="pcat-search">
          <svg viewBox="0 0 24 24" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            ref={searchInputRef}
            type="search"
            placeholder={resultKind === 'products' ? 'Search product or SKU…' : 'Search series or model…'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search the catalogue"
          />
        </div>

        <div className="pcat-ftitle">Filters</div>
        {groups.length > 0 && <p className="pcat-fnote">Counts show matching {noun}.</p>}

        {groups.map((g) => {
          const picked = selected[g.key]?.size ?? 0
          const isOpen = open[g.key] ?? false
          return (
            <div key={g.key} className={`pcat-fgroup${isOpen ? '' : ' closed'}`}>
              <h4>
                <button
                  type="button"
                  className="pcat-fgroup-toggle"
                  aria-expanded={isOpen}
                  onClick={() => toggleOpen(g.key)}
                >
                  {g.label}
                  {picked > 0 && <span className="picked">{picked}</span>}
                  <svg className="caret" viewBox="0 0 24 24" aria-hidden>
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </h4>
              {isOpen && (
                <div className="pcat-fopts">
                  {g.options.map((o) => {
                    const on = selected[g.key]?.has(o.value) ?? false
                    return (
                      <label key={o.value} className={`pcat-check${on ? ' on' : ''}`}>
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => toggle(g.key, o.value)}
                        />
                        <span className="box" aria-hidden />
                        <span className="lab">{o.label}</span>
                        <span className="ct" title={`${o.count} matching series`}>{o.count}</span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </aside>

      <section className="pcat-results">
        {(activeCount > 0 || cards.length > 0) && (
          <div className="pcat-toolbar">
            <div className="pcat-active">
              {query && (
                <button type="button" className="pcat-chip" onClick={() => setQuery('')}>
                  “{query.trim()}” <span aria-hidden>×</span>
                </button>
              )}
              {activeChips.map(({ gk, v, label }) => (
                <button
                  key={`${gk}:${v}`}
                  type="button"
                  className="pcat-chip"
                  onClick={() => toggle(gk, v)}
                >
                  {label} <span aria-hidden>×</span>
                </button>
              ))}
              {activeCount > 0 && (
                <button type="button" className="pcat-clear" onClick={reset}>
                  Clear all
                </button>
              )}
            </div>
            {/* sort — adaptive options, never price */}
            <select
              className="pcat-sort"
              aria-label="Sort results"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
            >
              {sortOptions.map((k) => (
                <option key={k} value={k}>
                  {SORT_LABELS[k]}
                </option>
              ))}
            </select>
          </div>
        )}

        {cards.length === 0 ? (
          <p className="pcat-empty">Nothing in this category yet — check back soon.</p>
        ) : visible.length === 0 ? (
          <p className="pcat-empty">
            No {noun} match those filters.{' '}
            <button type="button" className="pcat-empty-reset" onClick={reset}>
              Reset all
            </button>
          </p>
        ) : (
          (() => {
            // Sectioned while the page is untouched OR still at a sidebar
            // collection preset; user narrowing/sorting flattens the list.
            const sections = sectioned ? [...new Set(sorted.map((c) => c.section))] : []
            const buckets = sections.length > 1
              ? sections.map((s) => ({ title: s, cards: sorted.filter((c) => c.section === s) }))
              : [{ title: null as string | null, cards: sorted }]
            // First grid row is above the fold — eager-load those images (LCP).
            const eager = new Set(sorted.slice(0, 4).map((c) => c.key))
            return buckets.map((b) => (
              <div key={b.title ?? 'all'}>
                {b.title && <h2 className="pcat-section">{b.title}</h2>}
                <div className={layout === 'productGrid' ? 'pcat-product-grid' : 'pcat-list'}>
                  {b.cards.map((c) => (
                    layout === 'productGrid' ? (
                      <Link key={c.key} href={c.href} className="pcat-product-card">
                        <div className="pcat-product-media">
                          <Image
                            src={c.imgSrc}
                            alt={c.imgAlt}
                            width={320}
                            height={240}
                            sizes="(max-width: 680px) 100vw, (max-width: 1100px) 50vw, 280px"
                            loading={eager.has(c.key) ? 'eager' : undefined}
                          />
                        </div>
                        <div className="pcat-product-body">
                          <div className="pcat-product-topline">
                            <span>{c.familyLabel}</span>
                            {c.sku && <span>{c.sku}</span>}
                          </div>
                          <h3 className="pcat-product-name">{c.name}</h3>
                          {c.desc && <p className="pcat-product-desc">{c.desc}</p>}
                          {c.facts && c.facts.length > 0 && (
                            <div className="pcat-product-facts">
                              {c.facts.map((fact) => (
                                <span key={fact}>{fact}</span>
                              ))}
                            </div>
                          )}
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
                        <div className="pcat-product-foot">
                          <span className="pcat-card-go">
                            {c.ctaLabel ?? 'View product'} <span>→</span>
                          </span>
                        </div>
                      </Link>
                    ) : (
                      <Link key={c.key} href={c.href} className="pcat-row">
                        <div className="pcat-row-media">
                          <div className="pcat-row-img">
                            <Image
                              src={c.imgSrc}
                              alt={c.imgAlt}
                              width={300}
                              height={200}
                              sizes="160px"
                              loading={eager.has(c.key) ? 'eager' : undefined}
                            />
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
                          <span className="pcat-card-go">
                            {c.ctaLabel ?? 'View range'} <span>→</span>
                          </span>
                        </div>
                      </Link>
                    )
                  ))}
                </div>
              </div>
            ))
          })()
        )}
      </section>
    </div>
  )
}
