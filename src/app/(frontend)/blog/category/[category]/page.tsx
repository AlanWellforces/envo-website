import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPostsByCategory, type PostCategory } from '@/lib/posts'
import { PostCard } from '@/components/blog/PostCard'

export const revalidate = 3600

const VALID_CATEGORIES: PostCategory[] = ['guides', 'tech_insights', 'company_news', 'industry']

const CATEGORY_LABEL: Record<PostCategory, string> = {
  guides: 'Guides',
  tech_insights: 'Tech Insights',
  company_news: 'Company News',
  industry: 'Industry',
}

export function generateStaticParams() {
  return VALID_CATEGORIES.map((category) => ({ category }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ category: string }> },
): Promise<Metadata> {
  const { category } = await params
  if (!VALID_CATEGORIES.includes(category as PostCategory)) return {}
  return {
    title: `${CATEGORY_LABEL[category as PostCategory]} — ENVO Blog`,
    alternates: { canonical: `/blog/category/${category}` },
  }
}

export default async function CategoryPage(
  { params }: { params: Promise<{ category: string }> },
) {
  const { category } = await params
  if (!VALID_CATEGORIES.includes(category as PostCategory)) notFound()
  const cat = category as PostCategory

  const posts = await getPostsByCategory(cat, { limit: 50 })

  return (
    <main className="container mx-auto max-w-6xl px-4 py-12">
      <div className="text-sm text-slate-500 mb-2">Category</div>
      <h1 className="text-4xl font-bold mb-8">{CATEGORY_LABEL[cat]}</h1>

      {posts.length === 0 ? (
        <p className="text-slate-600">No posts in this category yet.</p>
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
