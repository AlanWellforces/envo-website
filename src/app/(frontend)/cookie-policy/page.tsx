import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPageBySlug } from '@/lib/cms-pages'
import { CmsPageView } from '@/components/pages/CmsPage'

const SLUG = 'cookie-policy'

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug(SLUG)
  return {
    title: page?.seoTitle ?? 'Cookie Policy — ENVO',
    description: page?.metaDescription ?? 'How and why ENVO uses cookies on this website.',
  }
}

export default async function CookiePolicyPage() {
  const page = await getPageBySlug(SLUG)
  if (!page) notFound()
  return <CmsPageView page={page} />
}
