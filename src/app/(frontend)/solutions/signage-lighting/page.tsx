import type { Metadata } from 'next'
import { PageStub } from '@/components/ui/page-stub'

export const metadata: Metadata = { title: 'Signage Lighting — ENVO' }

export default function SignageLightingPage() {
  return (
    <PageStub
      eyebrow="Solutions · Signage Lighting"
      title="Channel letters, light boxes, edge-lit signage."
      description="High-performance signage lighting solutions engineered for visibility, uniformity and long life."
      breadcrumb={[
        { href: '/solutions', label: 'Solutions' },
        { label: 'Signage Lighting' },
      ]}
    />
  )
}
