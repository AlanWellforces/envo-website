'use client'

import { useEffect, useState } from 'react'

const KEY = 'envo-analytics-optout'

export function ExcludeToggle() {
  // null until mounted — localStorage doesn't exist during SSR.
  const [excluded, setExcluded] = useState<boolean | null>(null)

  useEffect(() => {
    try {
      setExcluded(localStorage.getItem(KEY) === '1')
    } catch {
      setExcluded(false)
    }
  }, [])

  const toggle = () => {
    try {
      if (excluded) localStorage.removeItem(KEY)
      else localStorage.setItem(KEY, '1')
      setExcluded(!excluded)
    } catch {
      /* storage blocked — nothing to toggle */
    }
  }

  if (excluded === null) return null
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
