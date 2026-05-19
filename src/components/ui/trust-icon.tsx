// Tiny stroke-icon set shared by trust-badge sections across catalog,
// family and series pages. Designed to read at 28–36px. Add new keys here
// before referencing them from data (`TrustBadge.icon`).

import type { TrustBadge } from '@/data/product-families'

export function TrustIcon({ name }: { name: TrustBadge['icon'] }) {
  const common = {
    width: 28,
    height: 28,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
  switch (name) {
    case 'shield':
      return (
        <svg {...common}>
          <path d="M12 2.5 4 5.5v6c0 4.5 3.4 8.7 8 10 4.6-1.3 8-5.5 8-10v-6l-8-3Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      )
    case 'droplet':
      return (
        <svg {...common}>
          <path d="M12 2.5c3.5 4 6 7 6 10a6 6 0 1 1-12 0c0-3 2.5-6 6-10Z" />
          <path d="M9 14a3 3 0 0 0 3 3" />
        </svg>
      )
    case 'sun':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3.5" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
        </svg>
      )
    case 'bolt':
      return (
        <svg {...common}>
          <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
        </svg>
      )
    case 'check':
      return (
        <svg {...common}>
          <path d="m5 12 5 5L20 7" />
        </svg>
      )
  }
}
