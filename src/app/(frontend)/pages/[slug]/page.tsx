import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getPageBySlug, getAllCmsPageSlugs, cmsPageMetadata, LEGAL_ROOT_SLUGS } from '@/lib/cms-pages'
import { CmsPageView } from '@/components/pages/CmsPage'

export async function generateStaticParams() {
  const slugs = await getAllCmsPageSlugs()
  return slugs.filter((slug) => !LEGAL_ROOT_SLUGS[slug]).map((slug) => ({ slug }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  const page = await getPageBySlug(slug)
  if (!page) return {}
  return cmsPageMetadata(page, `/pages/${slug}`, `${page.title} — ENVO`, page.metaDescription)
}

export default async function CmsDynamicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (LEGAL_ROOT_SLUGS[slug]) redirect(LEGAL_ROOT_SLUGS[slug])
  const page = await getPageBySlug(slug)
  if (!page) notFound()
  return <CmsPageView page={page} />
}
