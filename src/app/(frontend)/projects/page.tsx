import type { Metadata } from 'next'
import { PageStub } from '@/components/ui/page-stub'

export const metadata: Metadata = { title: 'Projects — ENVO' }

export default function ProjectsPage() {
  return (
    <PageStub
      eyebrow="Projects · Case Studies"
      title="Proven in real-world projects."
      description="Retail signage, hotel facades, storefronts, canopy lighting — installations powered by ENVO."
      breadcrumb={[{ label: 'Projects' }]}
    />
  )
}
