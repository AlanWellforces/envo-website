import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { metadataForRoute } from '@/lib/page-seo'
import { getSolutions, getSolutionBySlug } from '@/lib/solutions'
import { SolutionDetail } from '@/components/solutions/SolutionDetail'

// ISR — CMS edits/publishes appear without a redeploy (same policy as blog).
export const revalidate = 3600

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
    // Never ship an empty meta description (all three fields are optional).
    description: s.longDesc || s.shortDesc || s.heroDesc || `${s.name} — matched ENVO lighting solution with a recommended module/driver kit.`,
  })
}

export default async function SolutionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const s = await getSolutionBySlug(slug)
  if (!s) notFound()
  return <SolutionDetail solution={s} />
}
