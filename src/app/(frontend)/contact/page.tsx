import type { Metadata } from 'next'
import { PageStub } from '@/components/ui/page-stub'

export const metadata: Metadata = { title: 'Contact — ENVO' }

export default function ContactPage() {
  return (
    <PageStub
      eyebrow="Contact"
      title="Talk to an engineer."
      description="Sales, technical questions, custom requests — we usually reply within one business day."
      breadcrumb={[{ label: 'Contact' }]}
    />
  )
}
