'use client'

import { useSyncExternalStore } from 'react'

const KEY = 'envo-analytics-optout'
const EVENT = 'envo-optout-change'

// Read the opt-out flag from localStorage as an external store — avoids the
// setState-in-effect / hydration-mismatch dance. getServerSnapshot returns
// false (the page is client-only content anyway).
function subscribe(cb: () => void) {
  window.addEventListener('storage', cb) // other tabs
  window.addEventListener(EVENT, cb) // this tab (storage event doesn't self-fire)
  return () => {
    window.removeEventListener('storage', cb)
    window.removeEventListener(EVENT, cb)
  }
}
function getSnapshot(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function ExcludeToggle() {
  const excluded = useSyncExternalStore(subscribe, getSnapshot, () => false)

  const toggle = () => {
    try {
      if (excluded) localStorage.removeItem(KEY)
      else localStorage.setItem(KEY, '1')
      window.dispatchEvent(new Event(EVENT))
    } catch {
      /* storage blocked — nothing to toggle */
    }
  }

  return (
    <div>
      <p style={{ fontWeight: 600, marginBottom: 16 }}>
        {excluded
          ? '✓ This browser is excluded from visitor stats.'
          : 'This browser is currently being counted in visitor stats.'}
      </p>
      <button
        type="button"
        onClick={toggle}
        style={{
          padding: '13px 24px',
          borderRadius: 999,
          border: 'none',
          background: excluded ? '#64748b' : '#0071bc',
          color: '#fff',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {excluded ? 'Count me again' : 'Exclude this browser'}
      </button>
    </div>
  )
}
