import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPageBySlug } from '@/lib/cms-pages'
import { CmsPageView } from '@/components/pages/CmsPage'

const SLUG = 'privacy-policy'

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug(SLUG)
  return {
    alternates: { canonical: '/privacy-policy' },
    title: page?.seoTitle ?? 'Privacy Policy — ENVO',
    description:
      page?.metaDescription ??
      'How ENVO collects, uses and protects the information you share through this website.',
  }
}

export default async function PrivacyPolicyPage() {
  const page = await getPageBySlug(SLUG)
  if (!page) notFound()
  return <CmsPageView page={page} />
}
