import type { Metadata } from 'next'
import { PageStub } from '@/components/ui/page-stub'

export const metadata: Metadata = { title: 'Architectural Lighting — ENVO' }

export default function ArchitecturalLightingPage() {
  return (
    <PageStub
      eyebrow="Solutions · Architectural Lighting"
      title="Accent, linear, facade, step, landscape."
      description="Architectural lighting solutions for LED systems — designed to complement modern facade and interior design."
      breadcrumb={[
        { href: '/solutions', label: 'Solutions' },
        { label: 'Architectural Lighting' },
      ]}
    />
  )
}
