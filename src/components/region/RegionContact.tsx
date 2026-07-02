'use client'

// Footer contact line that follows the region switcher. Deliberately NO
// phone numbers anywhere (decided 2026-07-02): ENVO is a lead-gen brand and
// fulfilment lives with the distributors — the footer links the selected
// region's distributor site directly.

import { PURCHASE_CHANNELS } from '@/data/purchase-channels'
import { useRegion } from './RegionProvider'

export function RegionContact() {
  const { region } = useRegion()
  const channel = PURCHASE_CHANNELS.find((c) => c.id === region) ?? PURCHASE_CHANNELS[0]
  return (
    <address className="footer-brand-contact">
      <a href={channel.url} target="_blank" rel="noopener noreferrer">
        {channel.urlLabel}
      </a>
      <span style={{ display: 'block', fontSize: '12px', opacity: 0.65, fontStyle: 'normal' }}>
        Orders &amp; stock · {channel.regionLabel}
      </span>
    </address>
  )
}
