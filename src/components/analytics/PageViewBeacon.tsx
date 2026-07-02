'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Fires one cookieless pageview to /api/track on initial load and on every
 * App Router path change. No third-party script, no cookie.
 */
export function PageViewBeacon() {
  const pathname = usePathname()
  useEffect(() => {
    const body = JSON.stringify({ path: pathname, referrer: document.referrer || null })
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {})
  }, [pathname])
  return null
}
