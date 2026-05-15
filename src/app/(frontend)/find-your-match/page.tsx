import type { Metadata } from 'next'
import { PageStub } from '@/components/ui/page-stub'

export const metadata: Metadata = { title: 'Find your match — ENVO' }

export default function FindYourMatchPage() {
  return (
    <PageStub
      eyebrow="Find your match · 60-sec wizard"
      title="Spec your full ENVO setup in 60 seconds."
      description="Answer a few quick questions about your sign type, dimensions and install environment — we spec the modules, driver, controller and accessories as a complete bundle."
      breadcrumb={[{ label: 'Find your match' }]}
    />
  )
}
