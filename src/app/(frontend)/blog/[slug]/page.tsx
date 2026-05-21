import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPostBySlug, getAllSlugs, getRelatedPosts } from '@/lib/posts'
import { PostHeader } from '@/components/blog/PostHeader'
import { PostCard } from '@/components/blog/PostCard'
import { RichTextRenderer } from '@/components/blog/RichTextRenderer'

export const revalidate = 3600

export async function generateStaticParams() {
  const slugs = await getAllSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return {}
  const ogImg =
    typeof post.ogImage === 'object' && post.ogImage?.url
      ? post.ogImage.url
      : typeof post.cover === 'object'
        ? post.cover?.url
        : undefined
  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    openGraph: ogImg ? { images: [{ url: ogImg }] } : undefined,
  }
}

export default async function PostDetailPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const related = await getRelatedPosts(post)

  return (
    <main className="container mx-auto max-w-3xl px-4 py-12">
      <PostHeader post={post} />

      <article className="prose prose-slate max-w-none">
        <RichTextRenderer doc={post.body} />
      </article>

      {related.length > 0 && (
        <section className="mt-16 pt-8 border-t border-slate-200">
          <h2 className="text-2xl font-bold mb-6">Related posts</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {related.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
