import type { Post } from '@/lib/posts'

const CATEGORY_LABEL: Record<string, string> = {
  guides: 'Guides',
  tech_insights: 'Tech Insights',
  company_news: 'Company News',
  industry: 'Industry',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function PostHeader({ post }: { post: Post }) {
  const categoryLabel = CATEGORY_LABEL[post.category] ?? post.category
  return (
    <header style={{ margin: '28px 0 32px', padding: '0 56px' }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#7a8c08',
          marginBottom: '22px',
        }}
      >
        {categoryLabel}
        <span style={{ display: 'inline-block', width: '32px', height: '2px', background: '#aec90b' }} />
      </div>
      <h1
        className="font-semibold"
        style={{
          fontSize: '46px',
          lineHeight: 1.1,
          letterSpacing: '-0.015em',
          color: '#1a2332',
          margin: '0 0 18px',
          maxWidth: '22ch',
        }}
      >
        {post.title}
      </h1>
      <p
        style={{
          fontSize: '18px',
          lineHeight: 1.55,
          color: '#4a5568',
          margin: '0 0 28px',
          maxWidth: '60ch',
        }}
      >
        {post.excerpt}
      </p>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '13.5px',
          color: '#6a7a8a',
          paddingBottom: '32px',
          borderBottom: '1px solid #e2e5ea',
        }}
      >
        <span style={{ color: '#1a2332', fontWeight: 500 }}>ENVO Team</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span>{formatDate(post.publishedAt)}</span>
      </div>
    </header>
  )
}
