// Canonical resource / download data. Consumers as of 2026-05-15:
//   - homepage <Resources>        small cards on dark
//   - /support catalog page       full cards on light
// Icon is stored as inline-SVG JSX (hence the .tsx extension) so both consumers
// render the same exact glyph. Once Payload editorial is wired this becomes
// the seed payload (icon will likely be replaced by a Payload Media reference
// or a slug → component map at the call site).

import type { ReactNode } from 'react'

export type Resource = {
  slug: string
  name: string
  desc: string
  cta: string
  href: string
  icon: ReactNode
}

export const RESOURCES: Resource[] = [
  {
    slug: 'catalog',
    name: 'Product Catalog',
    desc: 'Explore our complete product portfolio.',
    cta: 'Download PDF',
    href: '/support/resources',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <path d="M14 3v6h6" />
        <path d="M9 13h6M9 17h4" />
      </svg>
    ),
  },
  {
    slug: 'spec-sheets',
    name: 'Specification Sheets',
    desc: 'Detailed specs for every product series.',
    cta: 'Download PDF',
    href: '/support/resources',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <path d="M14 3v6h6" />
        <path d="M8 12h8M8 16h8M8 8h2" />
      </svg>
    ),
  },
  {
    slug: 'install-guides',
    name: 'Installation Guides',
    desc: 'Step-by-step guides for quick & easy installation.',
    cta: 'Download PDF',
    href: '/support/resources',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14.7 6.3a4 4 0 0 1-5.66 5.66L4 17v3h3l5.04-5.04a4 4 0 0 1 5.66-5.66l-2.83 2.83-2.83-2.83 2.83-2.83z" />
      </svg>
    ),
  },
  {
    slug: 'ies-files',
    name: 'IES Files',
    desc: 'Photometric data for lighting calculations.',
    cta: 'Download ZIP',
    href: '/support/resources',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 8v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8" />
        <path d="M1 3h22v5H1z" />
        <path d="M10 12h4" />
      </svg>
    ),
  },
]
