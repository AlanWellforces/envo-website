// Canonical project / case-study data. Consumers as of 2026-05-15:
//   - homepage <Projects>     small cards on dark background
//   - /projects catalog page  full cards on light background
// No detail pages yet — `href` stays "#" until per-project case studies are
// authored. Once Payload editorial lands, this becomes the seed payload.

export type Project = {
  slug: string
  href: string
  name: string
  desc: string
  img: string
}

export const PROJECTS: Project[] = [
  {
    slug: 'retail-signage',
    href: '#',
    name: 'Retail Signage',
    desc: 'Global sign solutions with ENVO.',
    img: '/assets/images/ind-retail.jpg',
  },
  {
    slug: 'hotel-facade',
    href: '#',
    name: 'Hotel Facade',
    desc: 'Elegant architectural lighting that stands out.',
    img: '/assets/images/ind-hospitality.jpg',
  },
  {
    slug: 'storefront',
    href: '#',
    name: 'Storefront',
    desc: 'Impactful lighting for premium storefronts.',
    img: '/assets/images/ind-commercial.jpg',
  },
  {
    slug: 'canopy-signage',
    href: '#',
    name: 'Canopy Signage',
    desc: 'High-performance solutions for outdoor excellence.',
    img: '/assets/images/ind-architectural.jpg',
  },
]
