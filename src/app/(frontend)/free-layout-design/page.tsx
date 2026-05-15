import type { Metadata } from 'next'
import { PageStub } from '@/components/ui/page-stub'

export const metadata: Metadata = { title: 'Free Layout Design — ENVO' }

export default function FreeLayoutDesignPage() {
  return (
    <PageStub
      eyebrow="Free Layout Design"
      title="Send a sketch — we spec the LEDs and drivers."
      description="Free layout design service. Send us your sign sketch and sizes; our engineers return a full module and driver specification, with a quotation."
      breadcrumb={[{ label: 'Free Layout Design' }]}
    />
  )
}
