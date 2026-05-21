// Canonical solution data. Two consumers as of 2026-05-15:
//   - homepage <Solutions>           uses shortDesc on small cards
//   - /solutions catalog page        uses longDesc on full cards
// Once Payload editorial is wired (per the three-source rule in CLAUDE.md),
// this file becomes the seed payload, not the runtime source.

export type Solution = {
  slug: string
  href: string
  name: string
  shortDesc: string
  longDesc: string
  img: string
}

export const SOLUTIONS: Solution[] = [
  {
    slug: 'signage-lighting',
    href: '/solutions/signage-lighting',
    name: 'Signage Lighting',
    shortDesc:
      'High-performance solutions for channel letters, light boxes, and edge-lit signage.',
    longDesc:
      'Channel letters, light boxes, and edge-lit signage — calibrated brightness and uniform colour across multi-phase installs. Engineered for outdoor durability and warranty-grade longevity.',
    img: '/assets/images/ind-retail.jpg',
  },
  {
    slug: 'architectural-lighting',
    href: '/solutions/architectural-lighting',
    name: 'Architectural Lighting',
    shortDesc:
      'Accent, linear, facade, step, and landscape architectural lighting for LED systems.',
    longDesc:
      'Accent, linear, facade, step, and landscape lighting for commercial and hospitality projects. Tuned for colour rendering, beam control, and seamless integration with project specifications.',
    img: '/assets/images/ind-architectural.jpg',
  },
]
