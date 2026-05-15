import type { Metadata } from 'next'
import { PageStub } from '@/components/ui/page-stub'

export const metadata: Metadata = { title: 'Support — ENVO' }

export default function SupportPage() {
  return (
    <PageStub
      eyebrow="Support · Resources & Tools"
      title="Everything you need to specify ENVO."
      description="Datasheets, photometric files, installation guides, sizing tools and direct contact with our engineering team."
      breadcrumb={[{ label: 'Support' }]}
    />
  )
}
