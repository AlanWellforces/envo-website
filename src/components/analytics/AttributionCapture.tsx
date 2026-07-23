'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { captureAttribution } from '@/lib/attribution'

/**
 * Runs first-party lead-attribution capture on load and on each route change
 * (capture no-ops after the first page of the session / first-ever visit).
 * Renders nothing. Mounted alongside the pageview beacon in the frontend layout.
 */
export function AttributionCapture() {
  const pathname = usePathname()
  useEffect(() => {
    captureAttribution()
  }, [pathname])
  return null
}
