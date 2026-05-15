import type { Metadata } from 'next'
import { PageStub } from '@/components/ui/page-stub'

export const metadata: Metadata = { title: 'Control Gear — ENVO' }

export default function ControlGearPage() {
  return (
    <PageStub
      eyebrow="Products · Control Gear"
      title="Intelligent control. Seamless integration."
      description="Remote dimmers, signal converters, sensors and Zigbee gateways — bridge ENVO drivers to IR, RF, DMX and smart-home ecosystems."
      breadcrumb={[
        { href: '/products', label: 'Products' },
        { label: 'Control Gear' },
      ]}
    />
  )
}
