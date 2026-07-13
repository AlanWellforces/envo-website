// Canonical product-family metadata used across the marketing site.
// Eventually superseded by Payload (per the three-source rule in CLAUDE.md);
// for now this is the single source of truth used by:
//   - homepage <ProductFamilies>  (compact cards + series sub-links)
//   - /products catalog page       (full cards with tag / sku / pills)
//   - /products/[slug] family page (hero, series grid, applications, etc.)
//   - footer Products column
import { seriesHref, seriesSlug } from './series-registry'

/**
 * Derived route identity for a live series entry. Never hand-write series
 * slugs/hrefs here — 4 of the 5 originals drifted from the real routes and
 * 404'd / killed the metadata lookup (fixed 2026-07-13).
 */
function seriesRoute(marketingFamilySlug: string, code: string) {
  return { href: seriesHref(marketingFamilySlug, code), slug: seriesSlug(code), seriesCode: code }
}

/** Compact spec row used in the family page's "Compare all series" table. */
export type CompareSpec = {
  /** e.g. "Triple LED", "Quad LED", "Triple RGBW", "Single LED" */
  ledConfig: string
  /** e.g. "12V", "24V" */
  voltage: string
  /** e.g. "0.4–1.6W" */
  power: string
  /** e.g. "170°" */
  beam: string
  /** e.g. "IP65" */
  ipRating: string
  /** One short application phrase, e.g. "General signage (workhorse)" */
  bestFor: string
}

// Shared base for every series entry — even disabled ones render a card on the
// family page with image + product name + short description, so these fields
// are required across both variants of the union.
type SeriesBase = {
  label: string
  /** Marketing product name displayed on the series-grid card (e.g. "EcoGlo"). */
  productName: string
  /** One-line description shown on the series-grid card. */
  shortDesc: string
  /** Thumbnail under /public, e.g. "/assets/images/mod-eco.png". */
  image: string
  /** Optional spec row for the comparison table on the family page. */
  compareSpec?: CompareSpec
}

// SeriesLink is a discriminated union on `href`. Series whose href is '#' are
// not yet live — UI renders a disabled card. Live series carry slug +
// seriesCode (Akeneo `series` attribute value) so the detail page can query
// products via lib/products.ts → listProducts({ family, series }).
export type SeriesLink =
  | (SeriesBase & { href: '#' })
  | (SeriesBase & {
      href: string
      /** URL segment under /products/[slug]/. */
      slug: string
      /** Akeneo `series` attribute value (matches `products.series` in the DB). */
      seriesCode: string
      /** Short label shown under the breadcrumb on the detail page. */
      subtitle: string
      /** Hero paragraph on the detail page. */
      description: string

      // ---- Optional rich-page fields. Populate per series as content lands.
      //      Sections render only when their data is present. ----

      /** Eyebrow above the hero h1 (e.g. "SMD2835 · 12V"). */
      heroEyebrow?: string
      /** External datasheet URL for the Datasheet (PDF) hero CTA. */
      datasheetUrl?: string
      /** 4–5 inline metric badges in the hero. */
      heroBadges?: HeroBadge[]
      /** 5–6 feature cards. */
      features?: Feature[]
      /** Spec table rows for the series' reference variant. */
      specifications?: Specification[]
      /** Variant cards aggregating SKUs into LED-count tiers. */
      variants?: SeriesVariant[]
      /** Footnote shown below the variants grid (e.g. CCT suffix guide). */
      variantsFootnote?: string
      /** Per-series application cards. If absent, the page falls back to family.applications. */
      applications?: ApplicationCard[]
      /** "Pair With" cross-product recommendations. */
      pairWith?: PairWithCard[]
      /** Downloadable / requestable resource cards (datasheet, photometric, etc.). */
      resources?: ResourceCard[]
    })

/** Application use-case card shown on the family page. */
export type ApplicationCard = {
  title: string
  description: string
  /** Image under /public, e.g. "/assets/images/ind-retail.jpg". */
  image: string
}

/**
 * Trust badge — replaces the old free-text "Why choose ENVO" benefits with a
 * scan-friendly icon + short claim. `icon` is one of the keys in
 * components/icons/trust-icons.tsx; add a new one there before referencing it.
 */
export type TrustBadge = {
  icon: 'shield' | 'droplet' | 'sun' | 'bolt' | 'check'
  title: string
  description: string
}

/** FAQ entry on the family page. Plain server-rendered, no accordion JS. */
export type FAQ = { question: string; answer: string }

/** Inline metric badge shown in a series-detail hero (e.g. "0.4–1.6W"). */
export type HeroBadge = {
  /** Primary value, e.g. "0.4–1.6W", "170°", "IP65". */
  value: string
  /** Optional secondary label rendered smaller below the value. */
  label?: string
}

/** Feature card in a series-detail "Key Features" grid. */
export type Feature = { title: string; description: string }

/** Row in a series-detail Specifications table. */
export type Specification = { label: string; value: string }

/** One variant card in a series-detail "Available Variants" grid. */
export type SeriesVariant = {
  /** Variant display name, e.g. "Single LED", "Quad LED". */
  name: string
  /** Bullet specs shown on the card. */
  specs: string[]
  /** Optional badge like "Most popular" to highlight one variant. */
  badge?: string
  /** Optional thumbnail under /public. Falls back to the series image. */
  image?: string
  /**
   * Representative SKU used to pull live image / brightness data from Payload
   * for this variant card. Typically the variant's most popular CCT (e.g.,
   * the 4000K natural-white SKU). The card itself is not a link — this only
   * tells the page which Payload record to display.
   */
  defaultSku?: string
}

/**
 * Downloadable / requestable resource shown in the series-detail "Resources"
 * grid. Renders as a download card when `url` is set, or a "Request via
 * contact" card otherwise.
 */
export type ResourceCard = {
  /** Tag label above the title, e.g. "Datasheet", "Photometric", "Guide". */
  label: string
  /** Card heading, e.g. "EcoGlo Datasheet". */
  title: string
  /** Optional one-line description (e.g. "Covers all 4 LED variants"). */
  description?: string
  /** Direct URL (PDF / ZIP). Omit to render a "Request via contact" CTA. */
  url?: string
  /** Optional file metadata badge, e.g. "PDF · 1.2 MB". */
  meta?: string
}

/** Cross-product recommendation in "Pair With" — link to another family slug. */
export type PairWithCard = {
  title: string
  description: string
  /** Internal href, e.g. "/products/led-drivers". */
  href: string
  /** Optional thumbnail under /public. */
  image?: string
}

export type ProductFamily = {
  slug: string
  href: string
  name: string
  shortDesc: string
  longDesc: string
  tag: string
  sku: string
  pills: string[]
  cta: string
  image: string
  /** Akeneo family code (matches `products.family` in the DB). */
  familyCode: string
  series: SeriesLink[]
  popular?: boolean

  // ---- Optional rich-page fields (populated for led-signage-modules first;
  //      other families render fewer sections until content is authored). ----

  /** 4 short benefit labels shown as pills in the hero. */
  benefitPills?: string[]
  /** Single-line spec callout under the hero image, e.g. "SMD2835 · IP65 · 170° BEAM · 5YR WARRANTY". */
  productSpecsCallout?: string
  /** Application use-case cards. 4–5 entries render in a responsive grid. */
  applications?: ApplicationCard[]
  /** 4–5 icon-led trust claims (replaces the old free-text "Why choose ENVO"). */
  trustBadges?: TrustBadge[]
  /** Q&A entries shown above the final CTA. */
  faqs?: FAQ[]
  /** Slugs of sibling families to feature in "Complete Your System". */
  relatedFamilies?: string[]
}

export const PRODUCT_FAMILIES: ProductFamily[] = [
  {
    slug: 'led-signage-modules',
    href: '/products/led-signage-modules',
    name: 'Signage Modules',
    shortDesc: 'High-efficiency LED modules for brilliant signage.',
    longDesc:
      'High-efficiency LED modules delivering bright, uniform illumination and long life for channel letters, lightboxes and signage applications.',
    tag: 'Modules · Light source',
    sku: '6 series · 0.36–1.92 W',
    pills: ['6 series', 'IP65 / IP68', '5-yr warranty'],
    cta: 'Explore modules',
    image: '/assets/images/cat-modules.png',
    familyCode: 'led_module',
    popular: true,
    benefitPills: [
      'Consistent brightness',
      'Energy efficient',
      'Built to last',
      '50,000 h rated life',
    ],
    productSpecsCallout: 'SMD2835 · IP65 · 170° beam · 50,000 h life',
    applications: [
      {
        title: 'Channel Letters',
        description: 'Uniform illumination with excellent clarity and depth.',
        image: '/assets/images/ind-retail.jpg',
      },
      {
        title: 'Lightboxes',
        description: 'Bright, even lighting for all types of backlit signs.',
        image: '/assets/images/ind-commercial.jpg',
      },
      {
        title: 'Retail Signage',
        description: 'Eye-catching displays that drive brand visibility.',
        image: '/assets/images/ind-hospitality.jpg',
      },
      {
        title: 'Facade Signage',
        description: 'Weather-resistant performance for outdoor applications.',
        image: '/assets/images/ind-architectural.jpg',
      },
    ],
    trustBadges: [
      {
        icon: 'shield',
        title: '50,000-hour rated life',
        description: 'Every module is rated for 50,000 hours of operation. Warranty terms are published per series on each datasheet.',
      },
      {
        icon: 'droplet',
        title: 'IP65 sealed',
        description: 'Rated for outdoor and humid environments out of the box.',
      },
      {
        icon: 'sun',
        title: '3000K – 7000K',
        description: 'Warm, neutral and cool white available across the family.',
      },
      {
        icon: 'bolt',
        title: '12V & 24V',
        description: 'Mix-and-match modules and ENVO drivers to spec.',
      },
    ],
    faqs: [
      {
        question: 'What is the difference between frontlit and backlit signage?',
        answer:
          'Frontlit signs are lit from the front for maximum readability — face-lit faces with internal modules. Backlit (halo-lit) signs project light from the rear of opaque letters onto the wall behind, creating a soft glow around the letter for a premium feel. ENVO modules ship in variants tuned for each pattern — Eco / Pro for frontlit, Sidelit for halo.',
      },
      {
        question: 'How long does an LED signage module last?',
        answer:
          'ENVO modules are rated for 50,000 hours of typical operation. At 12 hours per day, that is roughly 11 years of service. Warranty terms are published per series — check each product’s datasheet.',
      },
      {
        question: 'How many modules do I need for my sign?',
        answer:
          'Module count depends on letter stroke width, cabinet depth and target brightness. Send us your sign through Free layout design for an exact BOM, or talk to engineering — we will spec the right module + driver + spacing for your sign size.',
      },
      {
        question: 'How do I pick the right IP rating?',
        answer:
          'Indoor signs sit at IP20 minimum; outdoor channel letters and lightboxes need IP65 or higher. All ENVO signage modules ship IP65-rated as standard, with IP67/IP68 options for fully submerged or coastal installs.',
      },
    ],
    relatedFamilies: ['led-drivers', 'control-gear', 'accessories'],
    series: [
      {
        label: 'Mini Series',
        productName: 'MiniLux Backlit',
        shortDesc: 'The thinnest backlit module ENVO makes — 8.9 mm, Diamondback lens, IP66.',
        image: '/assets/images/mod-mini.png',
        compareSpec: {
          ledConfig: 'Single · Duo · Triple',
          voltage: '12V DC',
          power: '0.24 / 0.48 / 0.72 W',
          beam: '180° × 140°',
          ipRating: 'IP66',
          bestFor: 'Shallow cabinets (30–80 mm)',
        },
        ...seriesRoute('led-signage-modules', 'envo_minilux'),
        subtitle: 'Backlit LED module · Signage Modules',
        description:
          'A single 0.24 W SMD 2835 LED behind a Diamondback 180° × 140° optic lens, encapsulated to IP66, on a 12 V DC constant-voltage bus. Triple, Duo and Single variants share the same chip, lens and driver — pick by how much light each unit length needs to throw.',
      },
      {
        label: 'Eco Series',
        productName: 'EcoGlo',
        shortDesc: 'Quad-LED backlit module — the everyday workhorse for general signage.',
        image: '/assets/images/mod-eco.png',
        compareSpec: {
          ledConfig: 'Quad LED',
          voltage: '12V',
          power: '0.4–1.6W',
          beam: '170°',
          ipRating: 'IP65',
          bestFor: 'General signage (workhorse)',
        },
        ...seriesRoute('led-signage-modules', 'envo_ecoglo'),
        subtitle: 'Backlit LED module · Signage Modules',
        description:
          'A cost-tuned backlit LED module family for channel letters and shallow cabinets. Calibrated brightness and even diffusion across the spec, in single- through quad-LED variants — built for installers spec-ing volume jobs without compromising signage quality.',
        heroEyebrow: 'SMD2835 · 12V',
        heroBadges: [
          { value: '0.4–1.6W', label: 'Single → Quad' },
          { value: 'Quad LED', label: 'Max variant' },
          { value: '170°', label: 'Beam angle' },
          { value: '12V DC', label: 'Constant voltage' },
          { value: 'IP65', label: 'Weather-sealed' },
        ],
        features: [
          {
            title: 'Workhorse build',
            description:
              'The everyday Eco module — proven across thousands of channel letters and lightbox installs without breaking the spec budget.',
          },
          {
            title: '3 CCT options',
            description:
              '3000K warm, 4000K natural and 7000K cool — pick the temperature that matches the brand.',
          },
          {
            title: 'IP65 sealed',
            description:
              'Resin-potted PCB and silicone-sealed lens survive humidity, dust and direct rain on outdoor signage.',
          },
          {
            title: '170° wide beam',
            description:
              'Diamondback optics deliver even illumination across letter faces and lightbox panels — no scalloping, no hot spots.',
          },
          {
            title: '4 power tiers',
            description:
              'Single, Duo, Triple and Quad LED variants in the same form factor — match output to letter size without changing modules.',
          },
          {
            title: 'Certified & supported',
            description:
              'Backed by UL · CE · TUV · LM-80 · RoHS certifications and ENVO global support.',
          },
        ],
        specifications: [
          { label: 'LED type', value: 'SMD 2835' },
          { label: 'LEDs per module', value: '4 (Quad LED reference variant)' },
          { label: 'Power per module', value: '1.6 W' },
          { label: 'Input voltage', value: '12 V DC (constant voltage)' },
          { label: 'CCT options', value: '3000K warm · 4000K natural · 7000K cool' },
          { label: 'Beam angle', value: '170°' },
          { label: 'IP rating', value: 'IP65' },
          { label: 'Operating temp', value: '−25°C to +60°C' },
          { label: 'Max series', value: '20 modules per run' },
          { label: 'Application depth', value: '40 – 120 mm letter / cabinet depth' },
          { label: 'Certification', value: 'UL · CE · TUV · LM-80 · RoHS' },
          { label: 'Warranty', value: '5 years' },
        ],
        variants: [
          {
            name: 'Single LED',
            specs: ['0.4 W · 1 × SMD2835', 'Letter strokes 25–40 mm', 'Border accents, small letters'],
            defaultSku: 'EV-BLEG01LBY-NW',
          },
          {
            name: 'Duo LED',
            specs: ['0.8 W · 2 × SMD2835', 'Letter strokes 40–60 mm', 'Slim channel letters'],
            defaultSku: 'EV-BLEG02LBY-NW',
          },
          {
            name: 'Triple LED',
            specs: ['1.2 W · 3 × SMD2835', 'Letter strokes 60–80 mm', 'Mid-size channel letters'],
            defaultSku: 'EV-BLEG03LBY-NW',
          },
          {
            name: 'Quad LED',
            specs: ['1.6 W · 4 × SMD2835', 'Letter strokes 80–120 mm', 'Lightboxes & large letters'],
            badge: 'Most popular',
            defaultSku: 'EV-BLEG04LBY-NW',
          },
        ],
        variantsFootnote:
          'Add suffix −WW (3000K), −NW (4000K) or −CW (7000K) to the model number to specify CCT.',
        applications: [
          {
            title: 'Channel letters',
            description:
              'EcoGlo Duo / Triple / Quad cover the full letter-size range — uniform output without scalloping.',
            image: '/assets/images/ind-retail.jpg',
          },
          {
            title: 'Lightboxes',
            description:
              'Quad LED variant delivers even backlight across cabinets up to 120 mm deep.',
            image: '/assets/images/ind-commercial.jpg',
          },
          {
            title: 'Border & edge accents',
            description:
              'Single LED variant is sized for trim, edge details and outline lighting.',
            image: '/assets/images/ind-hospitality.jpg',
          },
        ],
        pairWith: [
          {
            title: 'EV-SL Linear 12V Driver',
            description:
              'Slim 60W / 100W 12V drivers — comfortably drive 60+ EcoGlo Quad modules in series.',
            href: '/products/led-drivers',
            image: '/assets/images/cat-drivers.png',
          },
          {
            title: 'Triac dimmable driver',
            description:
              'Want dimming? Pair with EV-SP-TDM triac-dimmable drivers and a wall dimmer.',
            href: '/products/led-drivers',
            image: '/assets/images/cat-drivers.png',
          },
          {
            title: 'Connectors & cables',
            description:
              'IP67 push-fit connectors and pre-tinned 16AWG cables to wire the run cleanly.',
            href: '/products/accessories',
            image: '/assets/images/cat-sensors.png',
          },
        ],
        resources: [
          {
            label: 'Datasheet',
            title: 'EcoGlo Datasheet',
            description: 'Full specs for all 4 LED variants and 3 CCT options.',
            url: 'https://wellforces-akeneo-pim.s3.ap-southeast-2.amazonaws.com/d/6/4/6/d6463bba636326069341b37708dcca84b9372628_EcoGlo.pdf',
            meta: 'PDF',
          },
          {
            label: 'Photometric',
            title: 'IES photometric files',
            description: 'Light distribution data for lighting simulations (DIALux, Relux).',
            meta: 'On request',
          },
          {
            label: 'Guide',
            title: 'Stroke width guide',
            description: 'Pick the right LED count for your letter stroke and cabinet depth.',
            meta: 'On request',
          },
          {
            label: 'Compliance',
            title: 'Compliance pack',
            description: 'UL · CE · TUV · LM-80 · RoHS certificates bundled.',
            meta: 'On request',
          },
        ],
      },
      {
        label: 'Pro Series',
        productName: 'UltraFlare',
        shortDesc: 'Quad-LED high-output for deeper lightboxes and large channel letters.',
        image: '/assets/images/mod-pro.png',
        compareSpec: {
          ledConfig: 'Quad LED',
          voltage: '12V',
          power: '0.8–1.92W',
          beam: '170°',
          ipRating: 'IP65',
          bestFor: 'Deep lightboxes, large letters',
        },
        href: '#',
      },
      {
        label: 'RGB Series',
        productName: 'ChromaFlux',
        shortDesc: 'Triple-LED RGBW backlit module for full-colour and dynamic signs.',
        image: '/assets/images/mod-rgb.png',
        compareSpec: {
          ledConfig: 'Triple RGBW',
          voltage: '12V',
          power: '1.0W',
          beam: '160°',
          ipRating: 'IP65',
          bestFor: 'Full-colour signs',
        },
        href: '#',
      },
      {
        label: '24V Series',
        productName: 'OptiLume',
        shortDesc: 'Quad-LED 24V backlit module for long runs and lower voltage drop.',
        image: '/assets/images/mod-24v.png',
        compareSpec: {
          ledConfig: 'Quad LED',
          voltage: '24V',
          power: '0.5–1.6W',
          beam: '170°',
          ipRating: 'IP65',
          bestFor: 'Long runs, low V-drop',
        },
        href: '#',
      },
      {
        label: 'Sidelit',
        productName: 'EdgeLume',
        shortDesc: 'Single-LED side-emitting module for thin lightboxes and edge-lit signs.',
        image: '/assets/images/mod-sidelit.png',
        compareSpec: {
          ledConfig: 'Single LED',
          voltage: '12V',
          power: '0.36W',
          beam: '120°',
          ipRating: 'IP65',
          bestFor: 'Edge-lit thin lightboxes',
        },
        href: '#',
      },
    ],
  },
  {
    slug: 'led-drivers',
    href: '/products/led-drivers',
    name: 'LED Drivers',
    shortDesc: 'Stable power. Maximum performance.',
    longDesc:
      'Constant-voltage power supplies tuned for signage and architectural duty — wide input, low ripple, full protections, weatherproof or panel-mount.',
    tag: 'Drivers · Power',
    sku: '3 series · 30–320 W',
    pills: ['3 series', '12 / 24 V', 'IP20 / IP67'],
    cta: 'Explore drivers',
    image: '/assets/images/cat-drivers.png',
    familyCode: 'psu_led_cv',
    series: [
      {
        label: 'Linear Series',
        productName: 'Linear Driver',
        shortDesc: 'Slim linear-form drivers for surface-mount and channel-letter installs.',
        image: '/assets/images/cat-drivers.png',
        ...seriesRoute('led-drivers', 'envo_sl_us'),
        subtitle: 'Linear-form driver · LED Drivers',
        description:
          'Slim linear-form drivers for surface-mount and channel-letter installs.',
        variants: [
          { name: 'ENVO EV-SL-100-12 Linear Type LED Driver 100W 12V', defaultSku: 'EV-SL-100-12', specs: [] },
          { name: 'ENVO EV-SL-100-24 Linear Type LED Driver 100W 24V', defaultSku: 'EV-SL-100-24', specs: [] },
          { name: 'ENVO EV-SL-100-48 Linear Type LED Driver 100W 48V', defaultSku: 'EV-SL-100-48', specs: [] },
          { name: 'ENVO EV-SL-150-12 Linear Type LED Driver 150W 12V', defaultSku: 'EV-SL-150-12', specs: [] },
          { name: 'ENVO EV-SL-150-24 Linear Type LED Driver 150W 24V', defaultSku: 'EV-SL-150-24', specs: [] },
          { name: 'ENVO EV-SL-150-48 Linear Type LED Driver 150W 48V', defaultSku: 'EV-SL-150-48', specs: [] },
          { name: 'ENVO EV-SL-60-12US Linear Type LED Driver 60W 12V', defaultSku: 'EV-SL-60-12US', specs: [] },
          { name: 'ENVO EV-SL-60-24US Linear Type LED Driver 60W 24V', defaultSku: 'EV-SL-60-24US', specs: [] },
        ],
      },
      {
        label: 'Screw Terminal',
        productName: 'Screw-Terminal Driver',
        shortDesc: 'Panel-mount drivers with screw terminals for tidy in-cabinet wiring.',
        image: '/assets/images/cat-drivers.png',
        ...seriesRoute('led-drivers', 'envo_se_us'),
        subtitle: 'Panel-mount driver · LED Drivers',
        description:
          'Panel-mount drivers with screw terminals for tidy in-cabinet wiring.',
        variants: [
          { name: 'ENVO EV-SE-15-12US LED Driver 15W 12V', defaultSku: 'EV-SE-15-12US', specs: [] },
          { name: 'ENVO EV-SE-15-24US LED Driver 15W 24V', defaultSku: 'EV-SE-15-24US', specs: [] },
          { name: 'ENVO EV-SE-20-12US LED Driver 20W 12V', defaultSku: 'EV-SE-20-12US', specs: [] },
          { name: 'ENVO EV-SE-20-24US LED Driver 20W 24V', defaultSku: 'EV-SE-20-24US', specs: [] },
          { name: 'ENVO EV-SE-30-12US LED Driver 30W 12V', defaultSku: 'EV-SE-30-12US', specs: [] },
          { name: 'ENVO EV-SE-30-24US LED Driver 30W 24V', defaultSku: 'EV-SE-30-24US', specs: [] },
          { name: 'ENVO EV-SE-50-12US LED Driver 50W 12V', defaultSku: 'EV-SE-50-12US', specs: [] },
          { name: 'ENVO EV-SE-50-24US LED Driver 50W 24V', defaultSku: 'EV-SE-50-24US', specs: [] },
          { name: 'ENVO EV-SE-75-12US LED Driver 75W 12V', defaultSku: 'EV-SE-75-12US', specs: [] },
          { name: 'ENVO EV-SE-75-24US LED Driver 75W 24V', defaultSku: 'EV-SE-75-24US', specs: [] },
        ],
      },
      {
        label: 'Triac Dimmable',
        productName: 'Triac Dimmable Driver',
        shortDesc: 'Phase-cut compatible drivers for retrofit dimming.',
        image: '/assets/images/cat-drivers.png',
        href: '#',
      },
    ],
  },
  {
    slug: 'control-gear',
    href: '/products/control-gear',
    name: 'Control Gear',
    shortDesc: 'Intelligent control. Seamless integration.',
    longDesc:
      'From single-zone remote dimmers to multi-protocol Zigbee gateways — bridge ENVO drivers to the rest of the lighting ecosystem.',
    tag: 'Control · Logic',
    sku: '4 series · IR / RF / DMX / Zigbee',
    pills: ['4 series', '1–32 zones', 'Smart-home ready'],
    cta: 'Explore controls',
    image: '/assets/images/cat-controllers.png',
    familyCode: 'psu_led_controller',
    series: [
      {
        label: 'Remote & Receiver',
        productName: 'Remote & Receiver',
        shortDesc: 'Single- and multi-zone remote dimmers for everyday installs.',
        image: '/assets/images/cat-controllers.png',
        href: '#',
      },
      {
        label: 'Signal Converter',
        productName: 'Signal Converter',
        shortDesc: 'Bridge between DMX, 0-10V and PWM signal protocols.',
        image: '/assets/images/cat-controllers.png',
        href: '#',
      },
      {
        label: 'Sensor',
        productName: 'Sensor',
        shortDesc: 'PIR and microwave motion sensors for automated control.',
        image: '/assets/images/cat-sensors.png',
        href: '#',
      },
      {
        label: 'Zigbee & Smart',
        productName: 'Zigbee Gateway',
        shortDesc: 'Connect ENVO drivers to Zigbee-based smart-home systems.',
        image: '/assets/images/cat-controllers.png',
        ...seriesRoute('control-gear', 'envo_zigbee'),
        subtitle: 'Zigbee gateway & controllers · Control Gear',
        description:
          'Connect ENVO drivers to Zigbee-based smart-home systems.',
        variants: [
          { name: 'ENVO PRO DALI2 DT8 LED Controller RGBWW 5 CH 12-36VDC', defaultSku: 'SR-2309PRO-5C', specs: [] },
          { name: 'ENVO ZigbBee Mini In Wall AC Phase Smart Dimmer', defaultSku: 'EV-ZB9041A-D', specs: [] },
          { name: 'ENVO ZigBee 2Gang In-wall Switch - On/Off Control', defaultSku: 'EV-ZB9101SAC-HPS2CH', specs: [] },
          { name: 'ENVO ZigBee 5 Channel Controller 12-48V 4-8A per Channel', defaultSku: 'EV-ZB9101EA-5C', specs: [] },
          { name: 'ENVO ZigBee AC Phase Dimmer', defaultSku: 'EV-ZB9101SAC-HP', specs: [] },
          { name: 'ENVO ZigBee Blinds Controller - On/Off and Level Control', defaultSku: 'EV-ZB9080A', specs: [] },
          { name: 'ENVO ZigBee Classic Remote 3-in-1 - 4 Zones', defaultSku: 'EV-ZB2803-G4-5C', specs: [] },
          { name: 'ENVO ZigBee Classic Remote Single Colour - 4 Zones', defaultSku: 'EV-ZB9001K12-DIM-Z4', specs: [] },
          { name: 'ENVO ZigBee Economic RGB+CCT Color Remote', defaultSku: 'EV-ZB2868K7-5C', specs: [] },
          { name: 'ENVO ZigBee Economic Single Color Remote', defaultSku: 'EV-ZB2868K7-DIM', specs: [] },
          { name: 'ENVO ZigBee Gateway Smart Hub', defaultSku: 'EV-ZBGW', specs: [] },
          { name: 'ENVO ZigBee In-wall Switch - On/Off Control, 16A', defaultSku: 'EV-ZB9101SAC-HPB', specs: [] },
          { name: 'ENVO ZigBee Self-powered Remote', defaultSku: 'EV-ZBP2801KS', specs: [] },
          { name: 'ENVO ZigBee Single Colour Mini Controller 12-36V 8A 1 Channel', defaultSku: 'EV-ZB9101CS', specs: [] },
          { name: 'ENVO ZigBee Super Thin 5 Channel Controller 12-24V 4A per Channel', defaultSku: 'EV-ZB1029-5C', specs: [] },
          { name: 'ENVO ZigBee to DALI + 0/1-10V 2-in-1 Conveter', defaultSku: 'EV-ZBDA-2421', specs: [] },
          { name: 'ENVO ZigBee US Standard Push Button Smart Dimmer', defaultSku: 'EV-ZB2835PAC(US)', specs: [] },
        ],
      },
    ],
  },
  {
    slug: 'accessories',
    href: '/products/accessories',
    name: 'Accessories',
    shortDesc: 'Complete the system. Every detail matters.',
    longDesc:
      'Waterproof connectors, pre-tinned cables, junction boxes and mounting brackets — the small parts that make every install cleaner and weather-tight.',
    tag: 'Accessories · Hardware',
    sku: 'Connectors · Cables · Boxes · Hardware',
    pills: ['4 categories', 'IP65 / IP68', 'UL listed'],
    cta: 'Explore accessories',
    image: '/assets/images/cat-sensors.png',
    familyCode: 'accessory_general',
    series: [
      {
        label: 'Connector',
        productName: 'Connector',
        shortDesc: 'Waterproof in-line connectors rated to IP65/IP68.',
        image: '/assets/images/cat-sensors.png',
        href: '#',
      },
      {
        label: 'Cable',
        productName: 'Cable',
        shortDesc: 'Pre-tinned multi-core cables ready for clean field termination.',
        image: '/assets/images/cat-sensors.png',
        href: '#',
      },
    ],
  },
]
