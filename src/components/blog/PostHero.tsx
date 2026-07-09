import Image from 'next/image'
import Link from 'next/link'
import type { Post } from '@/lib/posts'

const CATEGORY_LABEL: Record<string, string> = {
  guides: 'Guides',
  tech_insights: 'Tech Insights',
  company_news: 'Company News',
  industry: 'Industry',
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

export function PostHero({ post }: { post: Post }) {
  const img = coverUrl(post.cover)
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="relative block rounded-2xl overflow-hidden flex items-end isolate blog-hero-card"
      style={{
        minHeight: '460px',
        background: 'linear-gradient(135deg, #1a3a66 0%, #0f2347 50%, #06122a 100%)',
        color: '#ffffff',
      }}
    >
      {img && (
        <Image
          src={img}
          alt=""
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'cover' }}
          aria-hidden="true"
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(3,8,19,0.15) 0%, rgba(3,8,19,0.85) 80%, rgba(3,8,19,0.92) 100%), linear-gradient(95deg, rgba(3,8,19,0.55) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-[760px] blog-hero-body">
        <div
          className="font-semibold uppercase"
          style={{ fontSize: '12px', letterSpacing: '0.08em', color: '#aec90b' }}
        >
          Featured
          <span style={{ margin: '0 10px', color: 'rgba(255,255,255,0.35)' }}>·</span>
          {CATEGORY_LABEL[post.category] ?? post.category}
        </div>

        <h1
          className="font-bold"
          style={{ fontSize: 'clamp(30px, 6vw, 52px)', lineHeight: 1.05, letterSpacing: '-0.025em', maxWidth: '18ch', margin: '16px 0 14px', color: '#ffffff' }}
        >
          {post.title}
        </h1>

        <p
          style={{ fontSize: '17px', lineHeight: 1.55, color: 'rgba(255,255,255,0.85)', margin: '0 0 20px', maxWidth: '56ch' }}
        >
          {post.excerpt}
        </p>

        <div
          style={{ display: 'flex', alignItems: 'center', gap: '14px', color: 'rgba(255,255,255,0.65)', fontSize: '13px' }}
        >
          <span>{formatDate(post.publishedAt)}</span>
        </div>

        <span
          className="font-semibold"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '20px',
            padding: '10px 20px',
            background: 'rgba(255,255,255,0.96)',
            color: '#1a2332',
            borderRadius: '999px',
            fontSize: '13px',
          }}
        >
          Read article
          <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  )
}
