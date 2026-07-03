'use client'

// Shared frontend region state. Single source of truth is the SAME
// localStorage key the sidebar switcher has always written ('envo-region'),
// so existing visitors keep their saved choice. Consumers read via
// useRegion(); setRegion broadcasts an in-tab event so every consumer
// (sidebar switcher, hero chip, footer contact, purchase cards) updates
// together.

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { PurchaseChannel } from '@/data/purchase-channels'

export type RegionId = PurchaseChannel['id']

export const REGION_STORAGE_KEY = 'envo-region'
export const REGION_CHANGE_EVENT = 'envo-region-change'
const STORAGE_KEY = REGION_STORAGE_KEY
const CHANGE_EVENT = REGION_CHANGE_EVENT
const REGION_DEFAULT: RegionId = 'nz-ap'

const RegionContext = createContext<{ region: RegionId; setRegion: (r: RegionId) => void }>({
  region: REGION_DEFAULT,
  setRegion: () => {},
})

export function RegionProvider({ children }: { children: React.ReactNode }) {
  // SSR renders the default; hydrate from localStorage after mount (same
  // pattern as the sidebar switcher, avoids a server/client mismatch).
  const [region, set] = useState<RegionId>(REGION_DEFAULT)

  useEffect(() => {
    const readSaved = (): RegionId | null => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY)
        return saved === 'nz-ap' || saved === 'us-global' ? saved : null
      } catch {
        return null /* private mode etc. — keep default */
      }
    }
    const read = () => {
      const saved = readSaved()
      if (saved) set(saved)
    }
    read()

    // First visit (nothing saved): ask the server for a geo-derived default.
    // In-memory only — a silent default is not a user choice, so it is never
    // persisted; an explicit choice made before the response lands wins.
    let cancelled = false
    if (!readSaved()) {
      fetch('/api/region-default')
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { region?: string } | null) => {
          if (cancelled || readSaved()) return
          if (data?.region === 'nz-ap' || data?.region === 'us-global') set(data.region)
        })
        .catch(() => {
          /* offline etc. — keep default */
        })
    }

    window.addEventListener(CHANGE_EVENT, read)
    window.addEventListener('storage', read) // cross-tab
    return () => {
      cancelled = true
      window.removeEventListener(CHANGE_EVENT, read)
      window.removeEventListener('storage', read)
    }
  }, [])

  const setRegion = useCallback((r: RegionId) => {
    set(r)
    try {
      window.localStorage.setItem(STORAGE_KEY, r)
    } catch {
      /* non-persistent is fine */
    }
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }, [])

  return <RegionContext.Provider value={{ region, setRegion }}>{children}</RegionContext.Provider>
}

export function useRegion() {
  return useContext(RegionContext)
}
