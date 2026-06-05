import type { Metadata } from 'next'
import { metadataForRoute } from '@/lib/page-seo'
import { SolutionDetail } from '@/components/solutions/SolutionDetail'

export async function generateMetadata(): Promise<Metadata> {
  return metadataForRoute('/solutions/signage-lighting', {
    title: 'Signage Lighting — ENVO',
    description:
      'High-performance signage lighting — channel letters, light boxes and edge-lit signage, engineered for visibility, uniformity and long life.',
  })
}

export default function SignageLightingPage() {
  return <SolutionDetail slug="signage-lighting" headline="Channel letters, light boxes, edge-lit signage." />
}
