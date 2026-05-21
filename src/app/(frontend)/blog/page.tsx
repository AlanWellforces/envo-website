import { getPosts } from '@/lib/posts'
import { PostCard } from '@/components/blog/PostCard'
import type { Metadata } from 'next'

export const revalidate = 3600 // ISR fallback — every hour

export const metadata: Metadata = {
  title: 'Blog — ENVO',
  description: 'Guides, tech insights, and company news from ENVO.',
}

export default async function BlogIndexPage() {
  const [featured, recent] = await Promise.all([
    getPosts({ featured: true, limit: 1 }),
    getPosts({ limit: 12 }),
  ])

  const hero = featured.docs[0]
  const heroIds = new Set(hero ? [hero.id] : [])
  const rest = recent.docs.filter((p) => !heroIds.has(p.id))

  return (
    <main className="container mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Blog</h1>

      {hero && (
        <div className="mb-12">
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Featured</div>
          <PostCard post={hero} />
        </div>
      )}

      {rest.length === 0 && !hero ? (
        <p className="text-slate-600">No posts yet — check back soon.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </main>
  )
}
