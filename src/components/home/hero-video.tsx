'use client'

import { useEffect, useRef } from 'react'

// Deferred hero background video. The previous <video autoPlay preload="metadata">
// made every homepage visit download the full ~1.9 MB MP4 immediately, competing
// with the LCP paint, fonts and CSS on the most-visited page. Instead the poster
// paints instantly (it's the visual anyway) and the clip only attaches + plays
// once the browser is idle — off the critical path entirely. Honors
// prefers-reduced-motion by never fetching the clip at all.
export function HeroVideo({ src, poster, className }: { src: string; poster: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const start = () => {
      if (el.src) return
      el.src = src
      // Autoplay can still be blocked by the browser — the poster remains.
      el.play().catch(() => {})
    }
    // requestIdleCallback is missing in older Safari — fall back to a timeout.
    const hasIdle = 'requestIdleCallback' in window
    const idle = hasIdle
      ? window.requestIdleCallback(start, { timeout: 4000 })
      : window.setTimeout(start, 1500)
    return () => {
      if (hasIdle) window.cancelIdleCallback(idle as number)
      else window.clearTimeout(idle)
    }
  }, [src])

  return <video ref={ref} className={className} muted loop playsInline preload="none" poster={poster} />
}
