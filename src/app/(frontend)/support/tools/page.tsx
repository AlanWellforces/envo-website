import type { Metadata } from 'next'
import { PageStub } from '@/components/ui/page-stub'

export const metadata: Metadata = { title: 'Tools & Guides — ENVO' }

export default function ToolsPage() {
  return (
    <PageStub
      eyebrow="Support · Tools & Guides"
      title="Sizing tools, wiring guides, install how-tos."
      description="Interactive calculators, layout templates and step-by-step guides to spec the right ENVO setup for your project."
      breadcrumb={[
        { href: '/support', label: 'Support' },
        { label: 'Tools' },
      ]}
    />
  )
}
