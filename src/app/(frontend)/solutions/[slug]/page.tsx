import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { metadataForRoute } from '@/lib/page-seo'
import { getSolutions, getSolutionBySlug } from '@/lib/solutions'
import { SolutionDetail } from '@/components/solutions/SolutionDetail'

export async function generateStaticParams() {
  try {
    return (await getSolutions()).map((s) => ({ slug: s.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const s = await getSolutionBySlug(slug)
  if (!s) return { title: 'Solution — ENVO' }
  return metadataForRoute(`/solutions/${slug}`, {
    title: `${s.name} — ENVO`,
    description: s.longDesc || s.shortDesc || s.heroDesc,
  })
}

export default async function SolutionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const s = await getSolutionBySlug(slug)
  if (!s) notFound()
  return <SolutionDetail solution={s} />
}
