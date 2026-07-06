'use client'

// Single regional purchase CTA for series pages (user spec 2026-07-06):
// exactly ONE distributor at a time, chosen by the visitor's region; the
// label stays the neutral "Find local distributor" — never "Buy from X".
// Unknown region: no guessing — the CTA goes to /contact and a small manual
// selector is shown instead of both distributor links.

import Link from 'next/link'
import { useState } from 'react'
import { PURCHASE_CHANNELS } from '@/data/purchase-channels'
import { useRegion } from '@/components/region/RegionProvider'
import {
  REGION_TO_DISTRIBUTOR,
  DISTRIBUTORS,
  type SeriesPurchaseLinks,
} from '@/data/distributors'

export function FindDistributorCta({
  links,
  datasheetUrl,
}: {
  links?: SeriesPurchaseLinks
  datasheetUrl?: string
}) {
  const { region, regionStatus, setRegion } = useRegion()
  const [picking, setPicking] = useState(false)
  const resolved = regionStatus === 'detected' || regionStatus === 'selected'
  const distributor = resolved ? DISTRIBUTORS[REGION_TO_DISTRIBUTOR[region]] : null
  const channel = PURCHASE_CHANNELS.find((c) => c.id === region)

  const datasheet = datasheetUrl && (
    <a className="cta-ghost" href={datasheetUrl} target="_blank" rel="noopener noreferrer">
      ↓ Datasheet (PDF)
    </a>
  )

  if (distributor) {
    const href = links?.[distributor.id] ?? distributor.brandFallbackUrl
    return (
      <>
        {/* Option C, buttons-first (user 2026-07-06): equal-width button row
            on top, region badge underneath with its change entry point. */}
        <div className="cta cta-eq">
          <a className="cta-primary" href={href} target="_blank" rel="noopener noreferrer">
            Find local distributor<span>→</span>
          </a>
          {datasheet}
        </div>
        <div className="region-chip" aria-live="polite">
          <span aria-hidden>{channel?.flag}</span>
          <b>{channel?.purchaseMetaLabel}</b>
          <button type="button" className="region-chip-change" onClick={() => setPicking(!picking)}>
            change
          </button>
        </div>
        {picking && (
          <div className="wtb">
            {PURCHASE_CHANNELS.filter((c) => c.id !== region).map((c) => (
              <button
                key={c.id}
                type="button"
                className="wtb-pick"
                onClick={() => {
                  setRegion(c.id)
                  setPicking(false)
                }}
              >
                {c.flag} {c.regionLabel}
              </button>
            ))}
          </div>
        )}
        <div className="buyfine">Sold through authorised distributors</div>
      </>
    )
  }

  // Region unknown (pending/undetected): neutral link, no guessing — and an
  // intentional manual selector instead of listing both distributors.
  return (
    <>
      <div className="cta">
        <Link className="cta-primary" href="/contact">
          Find local distributor<span>→</span>
        </Link>
        {datasheet}
      </div>
      {regionStatus === 'undetected' && (
        <div className="wtb" aria-live="polite">
          <span className="wtb-lab">Your region</span>
          {PURCHASE_CHANNELS.map((c) => (
            <button key={c.id} type="button" className="wtb-pick" onClick={() => setRegion(c.id)}>
              {c.regionLabel}
            </button>
          ))}
        </div>
      )}
      <div className="buyfine">Sold through authorised distributors</div>
    </>
  )
}
