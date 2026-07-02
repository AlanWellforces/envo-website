'use client'

// Region-true fulfillment chip for the home hero. ENVO stocks and ships
// nothing itself — the claim is attributed to the selected region's
// distributor and follows the sidebar region switcher.

import { PURCHASE_CHANNELS } from '@/data/purchase-channels'
import { useRegion } from './RegionProvider'

export function RegionShippingChip() {
  const { region } = useRegion()
  const channel = PURCHASE_CHANNELS.find((c) => c.id === region) ?? PURCHASE_CHANNELS[0]
  return (
    <span className="v4-chip">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.6 2.8 2.6 15.2 0 18M12 3c-2.6 2.8-2.6 15.2 0 18" />
      </svg>{' '}
      {channel.fulfillmentChip}
    </span>
  )
}
