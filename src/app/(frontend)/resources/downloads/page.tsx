import type { Metadata } from 'next'
import { PageStub } from '@/components/ui/page-stub'

export const metadata: Metadata = { title: 'Resources & Downloads — ENVO' }

export default function ResourcesPage() {
  return (
    <PageStub
      eyebrow="Resources · Downloads"
      title="Catalogues, datasheets, IES files."
      description="Full technical library — product catalogue, specification sheets, IES photometric files and installation guides."
      breadcrumb={[
        { href: '/resources', label: 'Resources' },
        { label: 'Downloads' },
      ]}
    />
  )
}
