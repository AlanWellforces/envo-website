// Server shell for /blog and /blog/category/* — breadcrumb, hero, the client
// library (search + tabs + featured + grid) and the bottom engineering CTA.
// One H1 per page; category pages share the same hero with their tab active.
import Link from 'next/link'
import { getPosts, getPostCounts, type Post, type PostCategory } from '@/lib/posts'
import { InsightsIndex, type InsightPost } from '@/components/blog/InsightsIndex'
import '@/components/blog/insights.css'

export const CATEGORY_LABEL: Record<PostCategory, string> = {
  guides: 'Guides',
  tech_insights: 'Tech Insights',
  company_news: 'Company News',
  industry: 'Industry',
}

function toInsight(post: Post): InsightPost {
  const cover = typeof post.cover === 'number' ? null : (post.cover ?? null)
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    coverUrl: cover?.url ?? null,
    coverAlt: cover?.alt ?? '',
    category: post.category,
    categoryLabel: CATEGORY_LABEL[post.category] ?? post.category,
    date: new Date(post.publishedAt).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    tags: (post.tags ?? []).map((t) => t.tag),
  }
}

export async function InsightsShell({ category }: { category?: PostCategory }) {
  const [recent, counts] = await Promise.all([
    getPosts({ limit: 60, category }),
    getPostCounts(),
  ])
  const posts = recent.docs.map(toInsight)
  const active = category ?? 'all'

  return (
    <div className="bi-wrap">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">›</span>
          {category ? (
            <>
              <Link href="/blog">Blog</Link>
              <span className="sep">›</span>
              <span>{CATEGORY_LABEL[category]}</span>
            </>
          ) : (
            <span>Blog</span>
          )}
        </div>

        <header className="bi-head">
          <span className="bi-eyebrow">Insights</span>
          <h1>Insights for better LED signage builds.</h1>
          <p className="bi-sub">
            Practical guides, technical explainers, and field notes for choosing modules, drivers,
            controls, and outdoor-rated lighting systems.
          </p>
        </header>

        <InsightsIndex posts={posts} counts={counts} active={active} />
      </div>
    </div>
  )
}
