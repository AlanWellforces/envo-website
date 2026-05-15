import type { Metadata } from 'next'
import { PageStub } from '@/components/ui/page-stub'

export const metadata: Metadata = { title: 'Accessories — ENVO' }

export default function AccessoriesPage() {
  return (
    <PageStub
      eyebrow="Products · Accessories"
      title="Connectors, cables, boxes — the small parts that finish every install."
      description="Waterproof connectors, pre-tinned cables, junction boxes and mounting brackets. IP65/IP68, UL listed."
      breadcrumb={[
        { href: '/products', label: 'Products' },
        { label: 'Accessories' },
      ]}
    />
  )
}
