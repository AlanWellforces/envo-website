import type { Metadata } from 'next'
import { InsightsShell } from '@/components/blog/InsightsShell'

export const revalidate = 3600 // ISR fallback — every hour

export const metadata: Metadata = {
  alternates: { canonical: '/blog' },
  title: 'Insights — ENVO Blog',
  description:
    'Practical guides, technical explainers, and field notes for choosing modules, drivers, controls, and outdoor-rated lighting systems.',
}

export default function BlogIndexPage() {
  return <InsightsShell />
}
