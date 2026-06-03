// src/app/(frontend)/resources/tools/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { PageStub } from '@/components/ui/page-stub'

export const metadata: Metadata = { title: 'Tools & Guides — ENVO' }

export default function ToolsPage() {
  return (
    <div>
      <PageStub
        eyebrow="Resources · Tools & Guides"
        title="Sizing tools, wiring guides, install how-tos."
        description="Interactive calculators, layout templates and step-by-step guides to spec the right ENVO setup for your project."
        breadcrumb={[
          { href: '/resources', label: 'Resources' },
          { label: 'Tools' },
        ]}
      />
      <div className="container" style={{ paddingBottom: 48 }}>
        <Link href="/resources/tools/signage-selector">→ Signage module selector</Link>
      </div>
    </div>
  )
}
