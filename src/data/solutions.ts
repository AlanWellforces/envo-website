// Canonical solution data. Consumers:
//   - /solutions catalog page        card per solution (dark redesign 2026-06-24)
//   - /solutions/[slug] detail        hero + recommended kit (dark redesign)
//   - sitemap.ts                      slug → /solutions/<slug>
// Once Payload editorial is wired (per the three-source rule in CLAUDE.md),
// the editorial fields below (eyebrow/heroDesc/checklist/kit copy) become the
// seed payload, not the runtime source. Kit product links + specs are seeded
// here pending real Akeneo/Payload wiring.

export type GalleryImage = { src: string; alt: string }

export type KitItem = {
  /** true = ENVO-branded product (links to a product page); false = compatible
   *  part we spec but don't brand — sourced via the distributor, no SKU link. */
  envo: boolean
  /** Role label shown on the badge (LED module / Driver / Also needed …). */
  role: string
  name: string
  desc: string
  img: string
  spec: [string, string][]
  /** Product page link — ENVO items only. */
  href?: string
}

export type Solution = {
  slug: string
  href: string
  name: string
  shortDesc: string
  longDesc: string
  img: string
  // ---- dark redesign (2026-06-24) editorial fields ----
  eyebrow: string
  heroTitle: string
  heroDesc: string
  checklist: string[]
  gallery: GalleryImage[]
  kitHeading: string
  kitLede: string
  kit: KitItem[]
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
    img: '/assets/images/app-mini-channel-letters.jpg',
    eyebrow: 'Signage · channel letters & light boxes',
    heroTitle: 'Storefront & channel letters',
    heroDesc:
      'Crisp, even-lit signage that reads at distance, day or night — matched modules and drivers for any face depth, engineered to stay even letter to letter.',
    checklist: [
      'Uniform brightness across faces',
      'IP66 modules for outdoor faces',
      'Driver sizing done for you',
    ],
    gallery: [
      { src: '/assets/images/app-mini-channel-letters.jpg', alt: 'Illuminated channel letters on a storefront' },
      { src: '/assets/images/app-mini-halo-letters.jpg', alt: 'Halo-lit channel letters' },
      { src: '/assets/images/app-mini-outline-trim.jpg', alt: 'Outline-trim storefront lighting' },
      { src: '/assets/images/app-mini-thin-lightbox.jpg', alt: 'Backlit light box' },
    ],
    kitHeading: 'Everything for this build, matched and ready.',
    kitLede:
      "For a typical storefront channel-letter job, our engineers pair these three. Swap any part — or send us your dimensions and we'll re-spec the whole bundle.",
    kit: [
      {
        envo: true,
        role: 'LED module',
        name: 'MiniLux Backlit Module',
        desc: 'Compact backlit module for channel letters and shallow cabinets, with a wide beam for even fill at close depth.',
        img: '/assets/images/mod-mini.png',
        spec: [['Beam angle', '180° × 140°'], ['Ingress', 'IP66'], ['CCT options', '3 (warm–cool)']],
        href: '/products/led-signage-modules',
      },
      {
        envo: true,
        role: 'Driver',
        name: 'EV-SL Linear Driver',
        desc: 'Constant-voltage linear driver sized for long letter runs, with headroom for the module count on a typical frontage.',
        img: '/assets/images/cat-drivers.png',
        spec: [['Type', 'Constant voltage'], ['Form', 'Slim linear'], ['Mains input', '100–277 V']],
        href: '/products/led-drivers',
      },
      {
        envo: false,
        role: 'Also needed',
        name: 'Solderless Connector Kit',
        desc: 'Tool-free module-to-module and module-to-driver connectors. Not ENVO-branded — we spec it and your distributor supplies it in the same order.',
        img: '/assets/images/cat-drivers-line.png',
        spec: [['Connection', 'Solderless'], ['Use', 'Module ↔ driver'], ['Install', 'Tool-free']],
      },
    ],
  },
  {
    slug: 'architectural-lighting',
    href: '/solutions/architectural-lighting',
    name: 'Architectural Lighting',
    shortDesc:
      'Accent, linear, facade, step, and landscape architectural lighting for LED systems.',
    longDesc:
      'Accent, linear, facade, step, and landscape lighting for commercial and hospitality projects. Tuned for colour rendering, beam control, and seamless integration with project specifications.',
    img: '/assets/images/app-mini-hospitality-facade.jpg',
    eyebrow: 'Architectural · facade & accent',
    heroTitle: 'Facade, accent & linear lighting',
    heroDesc:
      'Edge- and side-lit runs that scale across whole buildings — tuned for uniform grazing across large spans and integrated with your site control gear.',
    checklist: [
      'Even grazing across large spans',
      'Outdoor-rated drivers & data',
      'Integrates with site control gear',
    ],
    gallery: [
      { src: '/assets/images/app-mini-hospitality-facade.jpg', alt: 'Illuminated building facade at dusk' },
      { src: '/assets/images/app-mini-pylon-monument.jpg', alt: 'Monument and pylon signage' },
      { src: '/assets/images/app-mini-outline-trim.jpg', alt: 'Architectural outline trim lighting' },
      { src: '/assets/images/app-mini-hero-twilight.jpg', alt: 'Facade lighting at twilight' },
    ],
    kitHeading: 'Everything for this build, matched and ready.',
    kitLede:
      "For a typical facade or accent run, our engineers pair these three. Swap any part — or send us your elevation and we'll re-spec the whole bundle.",
    kit: [
      {
        envo: true,
        role: 'LED module',
        name: 'EdgeLume Sidelit Module',
        desc: 'Side-lit module for slim edge-lit panels and facade bands, with uniform throw across long continuous runs.',
        img: '/assets/images/mod-sidelit.png',
        spec: [['Type', 'Side-lit'], ['Ingress', 'IP66'], ['CCT options', 'Multiple']],
        href: '/products/led-signage-modules',
      },
      {
        envo: true,
        role: 'Driver',
        name: 'EV-SL Linear Driver',
        desc: 'Constant-voltage linear driver sized for long facade runs, with headroom for the module count across a large span.',
        img: '/assets/images/cat-drivers.png',
        spec: [['Type', 'Constant voltage'], ['Form', 'Slim linear'], ['Mains input', '100–277 V']],
        href: '/products/led-drivers',
      },
      {
        envo: false,
        role: 'Also needed',
        name: 'Signal Converter',
        desc: 'Protocol converter to integrate the run with site control. Not ENVO-branded — we spec it and your distributor supplies it in the same order.',
        img: '/assets/images/cat-controllers-line.png',
        spec: [['Use', 'Control integration'], ['Mounting', 'DIN / surface'], ['Supply', 'Via distributor']],
      },
    ],
  },
]
