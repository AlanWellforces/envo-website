import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { PostCategory } from '@/lib/posts'
import { InsightsShell, CATEGORY_LABEL } from '@/components/blog/InsightsShell'

export const revalidate = 3600

const VALID_CATEGORIES: PostCategory[] = ['guides', 'tech_insights', 'company_news', 'industry']

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
  return <InsightsShell category={category as PostCategory} />
}
