'use client'

// Single regional purchase CTA for series pages (user spec 2026-07-06):
// exactly ONE distributor at a time, chosen by the visitor's region; the
// label stays the neutral "Find local distributor" — never "Buy from X".
// Unknown region: no guessing — the CTA goes to /contact and a small manual
// selector is shown instead of both distributor links.

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
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
  const ddRef = useRef<HTMLDivElement>(null)
  // close the region dropdown on outside click / Escape
  useEffect(() => {
    if (!picking) return
    const onDown = (e: MouseEvent) => {
      if (ddRef.current && !ddRef.current.contains(e.target as Node)) setPicking(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPicking(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [picking])
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
        <div className="wtb-block" aria-live="polite">
          <div className="wtb-region">
            <svg className="pin" viewBox="0 0 24 24" aria-hidden>
              <path d="M12 22s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12z" />
              <circle cx="12" cy="10" r="2.6" />
            </svg>
            {/* simple region dropdown */}
            <div className={`wtb-dd${picking ? ' open' : ''}`} ref={ddRef}>
              <button
                type="button"
                className="wtb-dd-trigger"
                aria-haspopup="listbox"
                aria-expanded={picking}
                onClick={() => setPicking(!picking)}
              >
                <b>{channel?.purchaseMetaLabel}</b>
                <svg className="caret" viewBox="0 0 24 24" aria-hidden>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <div className="wtb-dd-menu" role="listbox">
                {PURCHASE_CHANNELS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    role="option"
                    aria-selected={c.id === region}
                    className={`wtb-dd-opt${c.id === region ? ' on' : ''}`}
                    onClick={() => {
                      setRegion(c.id)
                      setPicking(false)
                    }}
                  >
                    {c.purchaseMetaLabel}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="buyfine">Sold through authorised distributors</div>
        </div>
      </>
    )
  }

  // Region unknown (pending/undetected): neutral link, no guessing — an
  // intentional manual selector styled the same as the resolved block.
  return (
    <>
      <div className="cta">
        <Link className="cta-primary" href="/contact">
          Find local distributor<span>→</span>
        </Link>
        {datasheet}
      </div>
      <div className="wtb-block" aria-live="polite">
        {regionStatus === 'undetected' && (
          <div className="wtb-pick-row lead">
            <span className="wtb-lab">Choose your region</span>
            {PURCHASE_CHANNELS.map((c) => (
              <button key={c.id} type="button" className="wtb-pick" onClick={() => setRegion(c.id)}>
                {c.regionLabel}
              </button>
            ))}
          </div>
        )}
        <div className="buyfine">Sold through authorised distributors</div>
      </div>
    </>
  )
}
