import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPageBySlug, cmsPageMetadata } from '@/lib/cms-pages'
import { CmsPageView } from '@/components/pages/CmsPage'

const SLUG = 'terms-of-service'

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug(SLUG)
  return cmsPageMetadata(page, '/terms-of-service', 'Terms of Service — ENVO', 'The terms that govern your use of the ENVO website.')
}

export default async function TermsOfServicePage() {
  const page = await getPageBySlug(SLUG)
  if (!page) notFound()
  return <CmsPageView page={page} />
}
