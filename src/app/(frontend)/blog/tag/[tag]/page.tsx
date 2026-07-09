import type { Metadata } from 'next'
import Link from 'next/link'
import { getPostsByTag } from '@/lib/posts'
import { PostCard } from '@/components/blog/PostCard'
import '@/components/blog/insights.css'

export const revalidate = 3600
// Tag values aren't pre-known — render on-demand, fall back to ISR.
export const dynamicParams = true

export async function generateMetadata(
  { params }: { params: Promise<{ tag: string }> },
): Promise<Metadata> {
  const { tag } = await params
  return { title: `#${tag} — ENVO Blog`, alternates: { canonical: `/blog/tag/${tag}` } }
}

export default async function TagPage(
  { params }: { params: Promise<{ tag: string }> },
) {
  const { tag } = await params
  const posts = await getPostsByTag(tag, { limit: 50 })

  return (
    <div className="bi-wrap">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">›</span>
          <Link href="/blog">Blog</Link>
          <span className="sep">›</span>
          <span>#{tag}</span>
        </div>

        <header className="bi-head">
          <span className="bi-eyebrow">Tag</span>
          <h1>#{tag}</h1>
        </header>

        <div className="bi-lib">
          {posts.length === 0 ? (
            <p className="bi-empty">No articles found. Try another category or search term.</p>
          ) : (
            <div className="bi-grid">
              {posts.map((post, i) => (
                // first grid row is above the fold — eager-load its covers (LCP)
                <PostCard key={post.id} post={post} eager={i < 3} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
