import type { Metadata } from 'next'
import { PageStub } from '@/components/ui/page-stub'

export const metadata: Metadata = { title: 'About ENVO' }

export default function AboutPage() {
  return (
    <PageStub
      eyebrow="About"
      title="Engineered illumination since 2014."
      description="ENVO designs and manufactures professional-grade LED lighting systems for signage and architectural illumination worldwide."
      breadcrumb={[{ label: 'About' }]}
    />
  )
}
