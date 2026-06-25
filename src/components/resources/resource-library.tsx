'use client'

import { useMemo, useState } from 'react'
import { type DatasheetDoc, RANGE_ORDER } from '@/lib/resource-library-types'

const ALL = 'All ranges'
const PAGE_SIZE = 20

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 3v12" />
    <path d="M7 11l5 5 5-5" />
    <path d="M4 21h16" />
  </svg>
)

export function ResourceLibrary({ docs }: { docs: DatasheetDoc[] }) {
  const [query, setQuery] = useState('')
  const [range, setRange] = useState<string>(ALL)
  const [page, setPage] = useState(1)

  const ranges = useMemo(() => {
    const present = new Set(docs.map((d) => d.range))
    return RANGE_ORDER.filter((r) => present.has(r))
  }, [docs])

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase()
    return docs.filter((d) => {
      if (range !== ALL && d.range !== range) return false
      if (term && !`${d.title} ${d.range}`.toLowerCase().includes(term)) return false
      return true
    })
  }, [docs, query, range])

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * PAGE_SIZE
  const pageItems = visible.slice(start, start + PAGE_SIZE)

  return (
    <div className="rd-lib">
      <div className="rd-search">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setPage(1)
          }}
          placeholder="Search by product, model or document…"
          aria-label="Search datasheets"
          autoComplete="off"
        />
      </div>

      <div className="rd-filters">
        <button
          className={`rd-tab${range === ALL ? ' is-active' : ''}`}
          onClick={() => {
            setRange(ALL)
            setPage(1)
          }}
          aria-pressed={range === ALL}
        >
          All
        </button>
        {ranges.map((r) => (
          <button
            key={r}
            className={`rd-tab${range === r ? ' is-active' : ''}`}
            onClick={() => {
              setRange(r)
              setPage(1)
            }}
            aria-pressed={range === r}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="rd-list-head">
        <span className="rd-count">
          {visible.length === 0
            ? '0 datasheets'
            : `${start + 1}–${start + pageItems.length} of ${visible.length} datasheets`}
        </span>
        {/* Planning note (NOT shown to customers): guides, CAD/IES, certificate
            PDFs and warranty docs have no backend source yet — add them when a
            Documents collection / file library lands. */}
      </div>

      {visible.length > 0 ? (
        <div>
          {pageItems.map((d) => (
            <a
              key={d.id}
              className="rd-row"
              data-cat="datasheet"
              href={d.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="rd-ic">PDF</span>
              <span className="rd-doc">
                <span className="rd-name">{d.title}</span>
                <span className="rd-chips">
                  <span className="rd-chip">{d.range}</span>
                  <span className="rd-chip">Datasheet</span>
                  <span className="rd-chip">PDF</span>
                </span>
              </span>
              <span className="rd-dl">
                <DownloadIcon />
              </span>
            </a>
          ))}
        </div>
      ) : (
        <p className="rd-empty">
          No datasheets match — try a different term, or request the file below.
        </p>
      )}

      {totalPages > 1 && (
        <nav className="rd-pager" aria-label="Pagination">
          <button
            className="rd-page-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
          >
            ← Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              className={`rd-page-num${n === safePage ? ' is-active' : ''}`}
              onClick={() => setPage(n)}
              aria-current={n === safePage ? 'page' : undefined}
            >
              {n}
            </button>
          ))}
          <button
            className="rd-page-btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
          >
            Next →
          </button>
        </nav>
      )}
    </div>
  )
}
