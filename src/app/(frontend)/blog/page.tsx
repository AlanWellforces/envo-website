import type { Metadata } from 'next'
import { InsightsShell } from '@/components/blog/InsightsShell'
import { metadataForRoute } from '@/lib/page-seo'

export const revalidate = 3600 // ISR fallback — every hour

export function generateMetadata(): Promise<Metadata> {
  return metadataForRoute('/blog', {
    title: 'Insights — ENVO Blog',
    description:
      'Practical guides, technical explainers, and field notes for choosing modules, drivers, controls, and outdoor-rated lighting systems.',
  })
}

export default function BlogIndexPage() {
  return <InsightsShell />
}
