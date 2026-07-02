'use client'

// Footer contact line that follows the region switcher. Shows the regional
// distributor's hotline when one exists (clearly attributed — it is not an
// ENVO number), otherwise links the distributor site for that region.

import { PURCHASE_CHANNELS } from '@/data/purchase-channels'
import { useRegion } from './RegionProvider'

export function RegionContact() {
  const { region } = useRegion()
  const channel = PURCHASE_CHANNELS.find((c) => c.id === region) ?? PURCHASE_CHANNELS[0]
  return (
    <address className="footer-brand-contact">
      {channel.phone ? (
        <>
          <a href={`tel:${channel.phone.tel}`}>{channel.phone.display}</a>
          <span style={{ display: 'block', fontSize: '12px', opacity: 0.65, fontStyle: 'normal' }}>
            {channel.phone.note}
          </span>
        </>
      ) : (
        <>
          <a href={channel.url} target="_blank" rel="noopener noreferrer">
            {channel.urlLabel}
          </a>
          <span style={{ display: 'block', fontSize: '12px', opacity: 0.65, fontStyle: 'normal' }}>
            Orders &amp; stock · {channel.regionLabel}
          </span>
        </>
      )}
    </address>
  )
}
