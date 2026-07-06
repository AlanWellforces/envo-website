'use client'

// Tab-LOOKING in-page navigation for the series page's lower sections
// (user question 2026-07-06). Deliberately NOT real tabs: the spec table is
// the core selling content and must stay scannable/comparable — these jump
// and highlight instead of hiding. Only sections that exist are offered.

import { useEffect, useState } from 'react'

export type SectionNavItem = { id: string; label: string }

export function SectionNav({ items }: { items: SectionNavItem[] }) {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const targets = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => !!el)
    if (!targets.length) return
    const io = new IntersectionObserver(
      (entries) => {
        // highlight the topmost section currently on screen
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length) {
          const top = visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
          setActive(top.target.id)
        }
      },
      { rootMargin: '-15% 0px -70% 0px' },
    )
    for (const t of targets) io.observe(t)
    return () => io.disconnect()
  }, [items])

  if (items.length < 2) return null

  return (
    <nav className="snav" aria-label="Page sections">
      {items.map((i) => (
        <a
          key={i.id}
          href={`#${i.id}`}
          className={`snav-item${active === i.id ? ' on' : ''}`}
          onClick={(e) => {
            e.preventDefault()
            document.getElementById(i.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }}
        >
          {i.label}
        </a>
      ))}
    </nav>
  )
}
