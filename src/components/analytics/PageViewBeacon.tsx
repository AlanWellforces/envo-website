'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

function externalReferrer(): string | null {
  const ref = document.referrer
  if (!ref) return null
  try {
    return new URL(ref).origin === window.location.origin ? null : ref
  } catch {
    return null
  }
}

/**
 * Fires one cookieless pageview to /api/track on initial load and on every
 * App Router path change. No third-party script, no cookie.
 * Production only. The referrer is reported once per visit (document.referrer
 * never changes across client-side navigations) and only when external.
 */
export function PageViewBeacon() {
  const pathname = usePathname()
  const referrerSent = useRef(false)
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    // Self-excluded browser (team member flagged via /exclude-me) — never report.
    try {
      if (localStorage.getItem('envo-analytics-optout') === '1') return
    } catch {
      /* storage blocked — count normally */
    }
    const referrer = referrerSent.current ? null : externalReferrer()
    referrerSent.current = true
    const body = JSON.stringify({ path: pathname, referrer })
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {})
  }, [pathname])
  return null
}
