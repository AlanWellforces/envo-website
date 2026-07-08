'use client'

// Site-wide fix for the "stuck lime focus ring": the global a11y rule
// (*:focus-visible → 2px lime outline) sometimes keeps ringing links/buttons
// AFTER a mouse click (browser heuristics vary — seen on the sidebar logo,
// tab buttons, collapse control…). Individual blur-on-click handlers kept
// reappearing per component, so this drops focus globally instead:
//
// - `e.detail > 0` = a REAL pointer click; keyboard "clicks" (Enter/Space)
//   fire click with detail 0 and keep their focus ring — a11y intact.
// - Only anchors/buttons are blurred; form fields are never touched.
export function PointerBlur() {
  if (typeof window !== 'undefined') {
    // Module-scope guard: layout may re-render; attach exactly once.
    const w = window as Window & { __envoPointerBlur?: boolean }
    if (!w.__envoPointerBlur) {
      w.__envoPointerBlur = true
      document.addEventListener('click', (e) => {
        if (e.detail === 0) return // keyboard-activated — keep the ring
        const el = (e.target as Element | null)?.closest?.('a, button')
        if (el instanceof HTMLElement) el.blur()
      })
    }
  }
  return null
}
