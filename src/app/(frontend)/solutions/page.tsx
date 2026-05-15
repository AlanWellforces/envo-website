import type { Metadata } from 'next'
import { PageStub } from '@/components/ui/page-stub'

export const metadata: Metadata = { title: 'Solutions — ENVO' }

export default function SolutionsPage() {
  return (
    <PageStub
      eyebrow="Solutions · Overview"
      title="Solutions for every application"
      description="Signage, architectural, hospitality and commercial — ENVO solutions tailored to the demands of each environment."
      breadcrumb={[{ label: 'Solutions' }]}
    />
  )
}
