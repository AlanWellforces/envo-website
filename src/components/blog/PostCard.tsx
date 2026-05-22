import Link from 'next/link'
import type { Post } from '@/lib/posts'

const CATEGORY_LABEL: Record<string, string> = {
  guides: 'Guides',
  tech_insights: 'Tech Insights',
  company_news: 'Company News',
  industry: 'Industry',
}

const CATEGORY_BORDER: Record<string, string> = {
  guides: '#0071bc',
  tech_insights: '#1a3a66',
  company_news: '#aec90b',
  industry: '#6a7a8a',
}

function coverUrl(cover: Post['cover']): string | null {
  if (typeof cover === 'number') return null
  return cover?.url ?? null
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function PostCard({ post }: { post: Post }) {
  const img = coverUrl(post.cover)
  const categoryLabel = CATEGORY_LABEL[post.category] ?? post.category
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group blog-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: '14px',
        background: '#ffffff',
        border: '1px solid #e2e5ea',
        borderTop: `3px solid ${CATEGORY_BORDER[post.category] ?? '#6a7a8a'}`,
        transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
        textDecoration: 'none',
      }}
    >
      <div
        style={{
          position: 'relative',
          background: '#eaecf0',
          aspectRatio: '16 / 10',
          overflow: 'hidden',
        }}
      >
        {img && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={img}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: 'linear-gradient(180deg, rgba(3,8,19,0.18) 0%, transparent 35%)',
          }}
        />
        <span
          style={{
            position: 'absolute',
            top: '14px',
            left: '14px',
            zIndex: 1,
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            background: 'rgba(255,255,255,0.94)',
            color: '#1a2332',
            backdropFilter: 'blur(6px)',
          }}
        >
          {categoryLabel}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '20px 22px 22px' }}>
        <h3
          className="font-semibold"
          style={{ fontSize: '19px', lineHeight: 1.3, letterSpacing: '-0.015em', color: '#1a2332', margin: '0 0 8px' }}
        >
          {post.title}
        </h3>
        <p
          style={{
            fontSize: '13px',
            lineHeight: 1.5,
            color: '#4a5568',
            margin: '0 0 16px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {post.excerpt}
        </p>
        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '12.5px',
            color: '#6a7a8a',
          }}
        >
          <span>{formatDate(post.publishedAt)}</span>
        </div>
      </div>
    </Link>
  )
}
