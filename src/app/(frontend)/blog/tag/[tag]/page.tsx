import type { Metadata } from 'next'
import { getPostsByTag } from '@/lib/posts'
import { PostCard } from '@/components/blog/PostCard'

export const revalidate = 3600
// Tag values aren't pre-known — render on-demand, fall back to ISR.
export const dynamicParams = true

export async function generateMetadata(
  { params }: { params: Promise<{ tag: string }> },
): Promise<Metadata> {
  const { tag } = await params
  return { title: `#${tag} — ENVO Blog` }
}

export default async function TagPage(
  { params }: { params: Promise<{ tag: string }> },
) {
  const { tag } = await params
  const posts = await getPostsByTag(tag, { limit: 50 })

  return (
    <main className="container mx-auto max-w-6xl px-4 py-12">
      <div className="text-sm text-slate-500 mb-2">Tag</div>
      <h1 className="text-4xl font-bold mb-8">#{tag}</h1>

      {posts.length === 0 ? (
        <p className="text-slate-600">No posts tagged &quot;{tag}&quot;.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </main>
  )
}
