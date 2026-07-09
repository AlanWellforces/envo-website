'use client'

// Blog index body — search + category tabs + featured card + article grid.
// Client component: the search box filters the delivered list locally (same
// interaction model as /resources' library). Category tabs stay real links so
// /blog/category/* keeps its crawlable routes.
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { PostCategory } from '@/lib/posts'

export type InsightPost = {
  id: number
  title: string
  slug: string
  excerpt: string
  coverUrl: string | null
  coverAlt: string
  category: PostCategory
  categoryLabel: string
  date: string
  tags: string[]
}

export type InsightCounts = {
  all: number
  guides: number
  tech_insights: number
  company_news: number
  industry: number
}

const TABS: { label: string; value: PostCategory | 'all'; href: string }[] = [
  { label: 'All', value: 'all', href: '/blog' },
  { label: 'Guides', value: 'guides', href: '/blog/category/guides' },
  { label: 'Tech Insights', value: 'tech_insights', href: '/blog/category/tech_insights' },
  { label: 'Industry', value: 'industry', href: '/blog/category/industry' },
  { label: 'Company News', value: 'company_news', href: '/blog/category/company_news' },
]

function Card({ post, eager }: { post: InsightPost; eager?: boolean }) {
  return (
    <Link href={`/blog/${post.slug}`} className="bi-card">
      <div className="bi-card-img">
        {post.coverUrl && (
          <Image
            src={post.coverUrl}
            alt={post.coverAlt || post.title}
            fill
            sizes="(min-width: 1080px) 33vw, (min-width: 720px) 50vw, 100vw"
            style={{ objectFit: 'cover' }}
            loading={eager ? 'eager' : undefined}
          />
        )}
        <span className="bi-badge">{post.categoryLabel}</span>
      </div>
      <div className="bi-card-bd">
        <h3>{post.title}</h3>
        <p>{post.excerpt}</p>
        <div className="bi-meta">
          <span>{post.date}</span>
        </div>
      </div>
    </Link>
  )
}

const PER_PAGE = 6 // 3 columns × 2 rows

export function InsightsIndex({
  posts,
  counts,
  active,
}: {
  posts: InsightPost[]
  counts: InsightCounts
  active: PostCategory | 'all'
}) {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const query = q.trim().toLowerCase()

  const matches = query
    ? posts.filter((p) =>
        [p.title, p.excerpt, p.categoryLabel, ...p.tags].join(' ').toLowerCase().includes(query),
      )
    : posts

  const totalPages = Math.max(1, Math.ceil(matches.length / PER_PAGE))
  const current = Math.min(page, totalPages)
  const gridPosts = matches.slice((current - 1) * PER_PAGE, current * PER_PAGE)

  return (
    <div className="bi-lib">
      <div className="bi-search">
        <svg viewBox="0 0 24 24" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setPage(1)
          }}
          placeholder="Search guides, drivers, modules, controls..."
          aria-label="Search articles"
        />
      </div>

      <nav className="bi-tabs" aria-label="Filter by category">
        {TABS.map((tab) => {
          const count = tab.value === 'all' ? counts.all : counts[tab.value]
          // an empty category earns no visual weight (spec 2026-07-09) —
          // hidden entirely unless it's the tab you're standing on
          if (count === 0 && tab.value !== active) return null
          return (
            <Link
              key={tab.value}
              href={tab.href}
              className={`bi-tab${tab.value === active ? ' is-active' : ''}`}
            >
              {tab.label}
              <span className="bi-tab-count">{count}</span>
            </Link>
          )
        })}
      </nav>

      {gridPosts.length === 0 ? (
        <p className="bi-empty">No articles found. Try another category or search term.</p>
      ) : (
        <div className="bi-grid">
          {gridPosts.map((post, i) => (
            // first grid row reaches into the fold — eager-load its covers (LCP)
            <Card key={post.id} post={post} eager={i < 3} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="bi-pager" aria-label="Pagination">
          <button
            type="button"
            className="bi-page-btn"
            disabled={current === 1}
            onClick={() => setPage(current - 1)}
          >
            ← Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              className={`bi-page-num${n === current ? ' is-active' : ''}`}
              aria-current={n === current ? 'page' : undefined}
              onClick={() => setPage(n)}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            className="bi-page-btn"
            disabled={current === totalPages}
            onClick={() => setPage(current + 1)}
          >
            Next →
          </button>
        </nav>
      )}
    </div>
  )
}
