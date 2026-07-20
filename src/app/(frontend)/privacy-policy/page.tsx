import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPageBySlug, cmsPageMetadata } from '@/lib/cms-pages'
import { CmsPageView } from '@/components/pages/CmsPage'

const SLUG = 'privacy-policy'

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug(SLUG)
  return cmsPageMetadata(page, '/privacy-policy', 'Privacy Policy — ENVO', 'How ENVO collects, uses and protects the information you share through this website.')
}

export default async function PrivacyPolicyPage() {
  const page = await getPageBySlug(SLUG)
  if (!page) notFound()
  return <CmsPageView page={page} />
}
