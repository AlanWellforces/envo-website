// Article card — the same .bi-card used across /blog, category, tag and the
// detail page's related grid (insights.css carries the styles).
import Image from 'next/image'
import Link from 'next/link'
import type { Post } from '@/lib/posts'
import '@/components/blog/insights.css'

const CATEGORY_LABEL: Record<string, string> = {
  guides: 'Guides',
  tech_insights: 'Tech Insights',
  company_news: 'Company News',
  industry: 'Industry',
}

function coverData(cover: Post['cover']): { url: string; alt?: string } | null {
  if (typeof cover === 'number' || !cover?.url) return null
  return { url: cover.url, alt: cover.alt }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function PostCard({ post }: { post: Post }) {
  const img = coverData(post.cover)
  return (
    <Link href={`/blog/${post.slug}`} className="bi-card">
      <div className="bi-card-img">
        {img && (
          <Image
            src={img.url}
            alt={img.alt || post.title}
            fill
            sizes="(min-width: 1080px) 33vw, (min-width: 720px) 50vw, 100vw"
            style={{ objectFit: 'cover' }}
          />
        )}
        <span className="bi-badge">{CATEGORY_LABEL[post.category] ?? post.category}</span>
      </div>
      <div className="bi-card-bd">
        <h3>{post.title}</h3>
        <p>{post.excerpt}</p>
        <div className="bi-meta">
          <span>{formatDate(post.publishedAt)}</span>
        </div>
      </div>
    </Link>
  )
}
