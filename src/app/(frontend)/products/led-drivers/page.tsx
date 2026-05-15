import type { Metadata } from 'next'
import { PageStub } from '@/components/ui/page-stub'

export const metadata: Metadata = { title: 'LED Drivers — ENVO' }

export default function LedDriversPage() {
  return (
    <PageStub
      eyebrow="Products · LED Drivers"
      title="Constant-voltage power for signage and architectural."
      description="Linear, screw-terminal and triac-dimmable drivers, 30–320 W. Wide input range, low ripple, full protections, IP20 to IP67."
      breadcrumb={[
        { href: '/products', label: 'Products' },
        { label: 'LED Drivers' },
      ]}
    />
  )
}
