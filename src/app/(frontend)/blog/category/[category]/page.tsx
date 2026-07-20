import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { PostCategory } from '@/lib/posts'
import { InsightsShell, CATEGORY_LABEL } from '@/components/blog/InsightsShell'
import { metadataForRoute } from '@/lib/page-seo'

export const revalidate = 3600

const VALID_CATEGORIES: PostCategory[] = ['guides', 'tech_insights', 'company_news', 'industry']

// Per-category meta descriptions — without these all four listings shared the
// sitewide default (same as the homepage), a duplicate-content signal.
const CATEGORY_DESCRIPTION: Record<PostCategory, string> = {
  guides:
    'Step-by-step guides to selecting and installing LED modules, drivers and controls for signage and architectural projects.',
  tech_insights:
    'Engineering explainers from the ENVO team — colour quality, driver topologies, IP ratings and control protocols.',
  company_news: 'Product launches, certifications and company updates from ENVO.',
  industry: 'Trends and analysis from the signage and architectural lighting industry.',
}

export function generateStaticParams() {
  return VALID_CATEGORIES.map((category) => ({ category }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ category: string }> },
): Promise<Metadata> {
  const { category } = await params
  if (!VALID_CATEGORIES.includes(category as PostCategory)) return {}
  return metadataForRoute(`/blog/category/${category}`, {
    title: `${CATEGORY_LABEL[category as PostCategory]} — ENVO Blog`,
    description: CATEGORY_DESCRIPTION[category as PostCategory],
  })
}

export default async function CategoryPage(
  { params }: { params: Promise<{ category: string }> },
) {
  const { category } = await params
  if (!VALID_CATEGORIES.includes(category as PostCategory)) notFound()
  return <InsightsShell category={category as PostCategory} />
}
