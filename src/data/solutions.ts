// SEED-ONLY solution data + the shared Solution/KitItem/GalleryImage types.
// Runtime pages read the Payload `solutions` collection via src/lib/solutions.ts;
// this file is consumed only by scripts/seed-solutions.mts (re-run it to reset
// the collection to these values) and as the type source for the mapper.

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

/** "Best for" card — one concrete application this solution suits. */
export type BestForItem = { scenario: string; note: string }

/** Design-consideration row — what gets checked before speccing the build. */
export type Consideration = { title: string; text: string }

/** Recommended-series card — links to a live /products/<family>/<series> page. */
export type SeriesRec = { name: string; blurb: string; href: string; img: string }

/** "When to choose alternatives" row — honest routing to a better fit. */
export type Alternative = { when: string; choose: string; href?: string }

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
  /** Scenario chips on the /solutions card. */
  useCases: string[]
  gallery: GalleryImage[]
  bestFor: BestForItem[]
  considerations: Consideration[]
  series: SeriesRec[]
  kitHeading: string
  kitLede: string
  kit: KitItem[]
  alternatives: Alternative[]
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
    useCases: ['Channel letters', 'Light boxes', 'Edge-lit signage', 'Pylon signs'],
    gallery: [
      { src: '/assets/images/app-mini-channel-letters.jpg', alt: 'Illuminated channel letters on a storefront' },
      { src: '/assets/images/app-mini-halo-letters.jpg', alt: 'Halo-lit channel letters' },
      { src: '/assets/images/app-mini-thin-lightbox.jpg', alt: 'Backlit light box' },
      { src: '/assets/images/app-mini-pylon-monument.jpg', alt: 'Pylon and monument signage' },
    ],
    bestFor: [
      {
        scenario: 'Channel letters',
        note: 'Front-lit, halo-lit and open-face letters — even fill without hot spots, down to shallow, intricate returns.',
      },
      {
        scenario: 'Light boxes',
        note: 'Single- and double-sided cabinets, from slim panels to deep flex-face boxes, lit corner to corner.',
      },
      {
        scenario: 'Edge-lit signage',
        note: 'Thin, double-sided panels where depth is tight and the face still has to read perfectly even.',
      },
      {
        scenario: 'Pylon signs',
        note: 'High-output modules that carry large faces and long viewing distances on pylon and monument signs.',
      },
    ],
    considerations: [
      {
        title: 'Face depth drives the module',
        text: 'Shallow returns need compact, wide-beam modules; deeper cabinets can run higher-output modules at a wider pitch. The depth decides the series before anything else.',
      },
      {
        title: 'Run length drives the driver',
        text: 'Letter count and cable runs set the driver size and circuit split. We spec headroom into every layout so the last letter is as bright as the first.',
      },
      {
        title: 'Outdoor faces need IP66',
        text: 'Weather-exposed faces call for IP66-rated modules and outdoor-rated drivers — the difference between a warranty-grade install and a call-back.',
      },
      {
        title: 'Plan for serviceability',
        text: 'Solderless connectors and modular layouts keep re-lamping a face swap, not a rebuild — worth deciding before the first letter is fabricated.',
      },
    ],
    series: [
      {
        name: 'MiniLux',
        blurb: 'Ultra-compact backlit modules for small letters and shallow, intricate depths.',
        href: '/products/led-signage-modules/mini-series',
        img: '/assets/images/series/envo_minilux.jpg',
      },
      {
        name: 'EcoGlo',
        blurb: 'Cost-effective backlit modules — the everyday workhorse for general signage.',
        href: '/products/led-signage-modules/envo-ecoglo',
        img: '/assets/images/series/envo_ecoglo.jpg',
      },
      {
        name: 'UltraFlare',
        blurb: 'OSRAM-powered high-output modules for large letters and long viewing distances.',
        href: '/products/led-signage-modules/envo-ultraflare',
        img: '/assets/images/series/envo_ultraflare.jpg',
      },
      {
        name: 'EdgeLume',
        blurb: 'Edge-lit modules for slim, double-sided light boxes.',
        href: '/products/led-signage-modules/envo-edgelume',
        img: '/assets/images/series/envo_edgelume.jpg',
      },
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
        href: '/products/led-signage-modules/mini-series',
      },
      {
        envo: true,
        role: 'Driver',
        name: 'EV-SL Linear Driver',
        desc: 'Constant-voltage linear driver sized for long letter runs, with headroom for the module count on a typical frontage.',
        img: '/assets/images/cat-drivers.png',
        spec: [['Type', 'Constant voltage'], ['Form', 'Slim linear'], ['Mains input', '100–277 V']],
        href: '/products/led-drivers/envo-sl-us',
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
    alternatives: [
      {
        when: 'The face needs colour-changing or programmable effects',
        choose: 'ChromaFlux RGBW modules',
        href: '/products/led-signage-modules/envo-chromaflux',
      },
      {
        when: 'The sign should dim, schedule or join a control scene',
        choose: 'ENVO control gear (Zigbee, DALI, Casambi)',
        href: '/products/control-gear',
      },
      {
        when: "You're lighting facades, coves or grazing runs — not sign faces",
        choose: 'Architectural Lighting solution',
        href: '/solutions/architectural-lighting',
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
    img: '/assets/images/app-arch-facade-grazing.jpg',
    eyebrow: 'Architectural · facade & accent',
    heroTitle: 'Facade, accent & linear lighting',
    heroDesc:
      'Grazing, linear and accent runs that scale across whole buildings — tuned for uniform light over large spans and integrated with your site control gear.',
    checklist: [
      'Even grazing across large spans',
      'Outdoor-rated drivers & data',
      'Integrates with site control gear',
    ],
    useCases: ['Facade accent', 'Control systems'],
    gallery: [
      { src: '/assets/images/app-arch-facade-grazing.jpg', alt: 'LED wall grazing on a commercial facade at dusk' },
      { src: '/assets/images/ind-architectural.jpg', alt: 'Linear architectural lighting along a commercial arcade' },
      { src: '/assets/images/app-arch-canopy-linear.jpg', alt: 'Linear soffit lighting at a hotel entrance canopy' },
      { src: '/assets/images/app-arch-step-landscape.jpg', alt: 'Step and landscape accent lighting at dusk' },
    ],
    bestFor: [
      {
        scenario: 'Facade accent & grazing',
        note: 'Wall-grazed textures and feature bands that read evenly across the whole elevation.',
      },
      {
        scenario: 'Linear & cove runs',
        note: 'Continuous soffit, cove and canopy runs without visible joints or bright spots.',
      },
      {
        scenario: 'Entrances & canopies',
        note: 'Arrival points where colour consistency and glare control matter most.',
      },
      {
        scenario: 'Control-integrated scenes',
        note: 'Dimmed, scheduled or colour-tuned scenes driven by Zigbee, DALI or Casambi control gear.',
      },
    ],
    considerations: [
      {
        title: 'Uniformity across the span',
        text: 'Long grazing runs show every pitch error. Module spacing and wall offset are set from your elevation drawing, not a rule of thumb.',
      },
      {
        title: 'Control protocol comes first',
        text: 'Zigbee, DALI or Casambi should be picked before the layout — the protocol decides the wiring topology and which drivers fit.',
      },
      {
        title: 'Outdoor-rated power & data',
        text: 'Drivers and signal gear need weather-rated enclosures, sited where they can be serviced without closing the frontage.',
      },
      {
        title: 'Colour consistency across phases',
        text: 'Tight CCT control matters when a project installs in stages — phase-two panels have to match the wall lit a year earlier.',
      },
    ],
    series: [
      {
        name: 'EdgeLume',
        blurb: 'Side-lit modules for slim facade bands, edge-lit panels and long continuous runs.',
        href: '/products/led-signage-modules/envo-edgelume',
        img: '/assets/images/series/envo_edgelume.jpg',
      },
      {
        name: 'ChromaFlux',
        blurb: 'RGBW colour-changing modules for dynamic, programmable accent scenes.',
        href: '/products/led-signage-modules/envo-chromaflux',
        img: '/assets/images/series/envo_chromaflux.jpg',
      },
      {
        name: 'EV-SL Linear Driver',
        blurb: 'Constant-voltage linear drivers with the headroom long facade runs demand.',
        href: '/products/led-drivers/envo-sl-us',
        img: '/assets/images/cat-drivers.png',
      },
      {
        name: 'Zigbee Control',
        blurb: 'Wireless controllers for dimming, scheduling and scene control across the site.',
        href: '/products/control-gear/envo-zigbee',
        img: '/assets/images/cat-controllers.png',
      },
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
        href: '/products/led-signage-modules/envo-edgelume',
      },
      {
        envo: true,
        role: 'Driver',
        name: 'EV-SL Linear Driver',
        desc: 'Constant-voltage linear driver sized for long facade runs, with headroom for the module count across a large span.',
        img: '/assets/images/cat-drivers.png',
        spec: [['Type', 'Constant voltage'], ['Form', 'Slim linear'], ['Mains input', '100–277 V']],
        href: '/products/led-drivers/envo-sl-us',
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
    alternatives: [
      {
        when: "You're lighting illuminated letters or cabinet signs",
        choose: 'Signage Lighting solution',
        href: '/solutions/signage-lighting',
      },
      {
        when: 'Small accent details viewed up close',
        choose: 'MiniLux compact modules',
        href: '/products/led-signage-modules/mini-series',
      },
      {
        when: 'Full media-facade or pixel-mapped installs',
        choose: 'A custom spec via free layout design',
        href: '/free-layout-design',
      },
    ],
  },
]
