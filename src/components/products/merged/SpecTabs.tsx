'use client'

// Real tabs (user 2026-07-06): Overview / Specifications / Downloads —
// click to switch, one panel visible at a time. "Where it works" and
// "Pairs with" are NOT tabbed; they stay as always-visible sections below.

import { useState, type ReactNode } from 'react'

export type SpecTab = { id: string; label: string; content: ReactNode }

export function SpecTabs({ tabs }: { tabs: SpecTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id)
  if (tabs.length === 0) return null
  const current = tabs.find((t) => t.id === active) ?? tabs[0]

  return (
    <div className="spectabs">
      <div className="snav" role="tablist" aria-label="Product information">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={current.id === t.id}
            aria-controls={`panel-${t.id}`}
            className={`snav-item${current.id === t.id ? ' on' : ''}`}
            onClick={() => setActive(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${current.id}`} aria-labelledby={`tab-${current.id}`}>
        {current.content}
      </div>
    </div>
  )
}
