'use client'

// First-visit region strip (approved 2026-07-03 design). Visible only while
// no region choice is saved in localStorage — read via useSyncExternalStore
// so SSR renders nothing and any saved choice (here, sidebar switcher, other
// tab) hides it reactively. The dropdown tracks the (possibly geo-derived)
// in-memory default until the visitor touches it. Continue and × both
// persist the shown value — dismissing counts as accepting the default —
// so the banner never comes back.

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { PURCHASE_CHANNELS } from '@/data/purchase-channels'
import {
  useRegion,
  REGION_STORAGE_KEY,
  REGION_CHANGE_EVENT,
  type RegionId,
} from './RegionProvider'

// Only explicit choices dispatch the change event (setRegion), so a saved
// key appearing means the banner's job is done.
function subscribe(onChange: () => void) {
  window.addEventListener(REGION_CHANGE_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(REGION_CHANGE_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

function hasSavedChoice(): boolean {
  try {
    return window.localStorage.getItem(REGION_STORAGE_KEY) !== null
  } catch {
    return true /* private mode — nothing persists, keep the banner away */
  }
}

export function RegionBanner() {
  const { region, setRegion } = useRegion()
  const [choice, setChoice] = useState<RegionId | null>(null)
  const selected = choice ?? region
  // Server snapshot `true` = hidden during SSR; hydration flips it on
  // first visits only.
  const saved = useSyncExternalStore(subscribe, hasSavedChoice, () => true)

  // The banner is a fixed overlay (it appears post-hydration, so it can't
  // participate in layout without a shift). Publish its measured height as
  // --region-banner-h so other fixed top elements (mobile menu toggle,
  // drawer, top subnav) can move out from under it; height varies because
  // the strip wraps to two rows on narrow viewports.
  const bannerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = bannerRef.current
    if (saved || !el) return
    const root = document.documentElement
    const update = () => root.style.setProperty('--region-banner-h', `${el.offsetHeight}px`)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      ro.disconnect()
      root.style.removeProperty('--region-banner-h')
    }
  }, [saved])

  if (saved) return null

  const confirm = () => setRegion(selected)

  return (
    <div ref={bannerRef} className="region-banner" role="region" aria-label="Choose your region">
      <p className="region-banner-text">
        ENVO works with regional partners — set your region for local availability and support
        info.
      </p>
      <div className="region-banner-controls">
        <select
          className="region-banner-select"
          aria-label="Region"
          value={selected}
          onChange={(e) => setChoice(e.target.value as RegionId)}
        >
          {PURCHASE_CHANNELS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.regionLabel}
            </option>
          ))}
        </select>
        <button type="button" className="region-banner-cta" onClick={confirm}>
          Continue
        </button>
        <button
          type="button"
          className="region-banner-close"
          aria-label="Dismiss and keep current region"
          onClick={confirm}
        >
          ×
        </button>
      </div>
    </div>
  )
}
