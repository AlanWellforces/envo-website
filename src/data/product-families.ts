// Canonical product-family metadata used across the marketing site.
// Eventually superseded by Payload (per the three-source rule in CLAUDE.md);
// for now this is the single source of truth used by:
//   - homepage <ProductFamilies>  (compact cards + series sub-links)
//   - /products catalog page       (full cards with tag / sku / pills)
//   - footer Products column

// SeriesLink is a discriminated union. Series whose href is '#' are not yet
// live — UI renders a disabled "Coming soon" pill. Live series carry slug +
// seriesCode (Akeneo `series` attribute value) so the detail page can query
// products via lib/products.ts → listProducts({ family, series }).
export type SeriesLink =
  | { label: string; href: '#' }
  | {
      label: string
      href: string
      /** URL segment under /products/[slug]/. */
      slug: string
      /** Akeneo `series` attribute value (matches `products.series` in the DB). */
      seriesCode: string
      /** Short label shown under the breadcrumb on the detail page. */
      subtitle: string
      /** Hero paragraph on the detail page. */
      description: string
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
}

export const PRODUCT_FAMILIES: ProductFamily[] = [
  {
    slug: 'led-signage-modules',
    href: '/products/led-signage-modules',
    name: 'Signage Modules',
    shortDesc: 'High-efficiency LED modules for brilliant signage.',
    longDesc:
      'Six module families calibrated for every cabinet depth, brightness target and signage type — from compact channel letters to deep floodlit Quads.',
    tag: 'Modules · Light source',
    sku: '6 series · 0.36–1.92 W',
    pills: ['6 series', 'IP65 / IP68', '5-yr warranty'],
    cta: 'Explore modules',
    image: '/assets/images/cat-modules.png',
    familyCode: 'led_module',
    popular: true,
    series: [
      { label: 'Mini Series', href: '#' },
      {
        label: 'Eco Series',
        href: '/products/led-signage-modules/eco-series',
        slug: 'eco-series',
        seriesCode: 'envo_ecoglo',
        subtitle: 'Backlit LED module · Signage Modules',
        description:
          'A cost-tuned backlit LED module family for channel letters and shallow cabinets. Calibrated brightness and even diffusion across the spec, in single- through quad-LED variants — built for installers spec-ing volume jobs without compromising signage quality.',
      },
      { label: 'Pro Series', href: '#' },
      { label: 'RGB Series', href: '#' },
      { label: '24V Series', href: '#' },
      { label: 'Sidelit', href: '#' },
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
      { label: 'Linear Series', href: '#' },
      { label: 'Screw Terminal', href: '#' },
      { label: 'Triac Dimmable', href: '#' },
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
      { label: 'Remote & Receiver', href: '#' },
      { label: 'Signal Converter', href: '#' },
      { label: 'Sensor', href: '#' },
      { label: 'Zigbee & Smart', href: '#' },
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
      { label: 'Connector', href: '#' },
      { label: 'Cable', href: '#' },
    ],
  },
]
