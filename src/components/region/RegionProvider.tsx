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

const STORAGE_KEY = 'envo-region'
const CHANGE_EVENT = 'envo-region-change'
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
    const read = () => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY)
        if (saved === 'nz-ap' || saved === 'us-global') set(saved)
      } catch {
        /* private mode etc. — keep default */
      }
    }
    read()
    window.addEventListener(CHANGE_EVENT, read)
    window.addEventListener('storage', read) // cross-tab
    return () => {
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
