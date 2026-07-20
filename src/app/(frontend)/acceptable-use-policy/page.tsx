import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPageBySlug, cmsPageMetadata } from '@/lib/cms-pages'
import { CmsPageView } from '@/components/pages/CmsPage'

const SLUG = 'acceptable-use-policy'

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug(SLUG)
  return cmsPageMetadata(page, '/acceptable-use-policy', 'Acceptable Use Policy — ENVO', "The acceptable use rules for ENVO's website, products and services.")
}

export default async function AcceptableUsePolicyPage() {
  const page = await getPageBySlug(SLUG)
  if (!page) notFound()
  return <CmsPageView page={page} />
}
