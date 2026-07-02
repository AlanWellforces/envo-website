import { getPosts, getPostCounts } from '@/lib/posts'
import { PostCard } from '@/components/blog/PostCard'
import { PostHero } from '@/components/blog/PostHero'
import { FilterChips } from '@/components/blog/FilterChips'
import type { Metadata } from 'next'

export const revalidate = 3600 // ISR fallback — every hour

export const metadata: Metadata = {
  alternates: { canonical: '/blog' },
  title: 'Blog — ENVO',
  description: 'Guides, tech insights, and company news from ENVO.',
}

export default async function BlogIndexPage() {
  const [featured, recent, counts] = await Promise.all([
    getPosts({ featured: true, limit: 1 }),
    getPosts({ limit: 12 }),
    getPostCounts(),
  ])

  const hero = featured.docs[0]
  const heroIds = new Set(hero ? [hero.id] : [])
  const rest = recent.docs.filter((p) => !heroIds.has(p.id))

  return (
    <div className="theme-light" style={{ minHeight: '100vh', background: '#f4f5f7', color: '#1a2332' }}>
      {/* Sticky breadcrumb */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '0 56px',
          borderBottom: '1px solid #e2e5ea',
          backdropFilter: 'blur(20px)',
          background: 'rgba(244,245,247,0.92)',
          fontSize: '13px',
        }}
      >
        <span style={{ color: '#6a7a8a', fontWeight: 500 }}>ENVO</span>
        <span style={{ color: '#6a7a8a', opacity: 0.4 }}>/</span>
        <span style={{ color: '#1a2332', fontWeight: 600 }}>Blog</span>
      </div>

      {hero && <PostHero post={hero} />}

      <FilterChips counts={counts} active="all" />

      {rest.length === 0 && !hero ? (
        <p style={{ padding: '0 56px 48px', color: '#4a5568' }}>No posts yet — check back soon.</p>
      ) : (
        <section
          aria-label="Articles"
          style={{
            display: 'grid',
            gap: '20px',
            padding: '0 56px 32px',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          }}
        >
          {rest.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </section>
      )}

      {recent.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 56px 56px' }}>
          <button
            type="button"
            disabled
            aria-disabled="true"
            title="Pagination — wired in a follow-up"
            className="font-semibold"
            style={{
              padding: '13px 28px',
              background: '#ffffff',
              border: '1px solid #d5d9e0',
              borderRadius: '999px',
              fontSize: '13px',
              color: '#1a2332',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Load more
            <span style={{ marginLeft: '8px', opacity: 0.55, fontSize: '11px' }}>
              {rest.length} of {recent.totalDocs}
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
