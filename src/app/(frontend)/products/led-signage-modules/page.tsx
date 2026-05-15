import type { Metadata } from 'next'
import { PageStub } from '@/components/ui/page-stub'

export const metadata: Metadata = { title: 'Signage Modules — ENVO' }

export default function SignageModulesPage() {
  return (
    <PageStub
      eyebrow="Products · Signage Modules"
      title="Six families calibrated for every signage install."
      description="Mini, Eco, Pro, RGB, 24V and Sidelit modules — from compact channel letters to deep floodlit Quads. 0.36–1.92 W per LED, IP65/IP68, 5-year warranty."
      breadcrumb={[
        { href: '/products', label: 'Products' },
        { label: 'Signage Modules' },
      ]}
    />
  )
}
