import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPageBySlug } from '@/lib/cms-pages'
import { CmsPageView } from '@/components/pages/CmsPage'

const SLUG = 'terms-of-service'

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug(SLUG)
  return {
    title: page?.seoTitle ?? 'Terms of Service — ENVO',
    description: page?.metaDescription ?? 'The terms that govern your use of the ENVO website.',
  }
}

export default async function TermsOfServicePage() {
  const page = await getPageBySlug(SLUG)
  if (!page) notFound()
  return <CmsPageView page={page} />
}
