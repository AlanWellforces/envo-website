// Resources FAQ content. EDITORIAL copy — per the three-source rule this
// belongs in Payload CMS (Wei's domain) once an FAQ collection exists. Until
// then this file is the seed/stopgap so the /resources page can ship; migrate
// verbatim into Payload and replace this import when the collection lands.
//
// Grouped by intent so the support page can render labelled sections rather
// than one long undifferentiated list.

export type Faq = {
  q: string
  a: string
}

export type FaqGroup = {
  /** Short section label shown above the group. */
  group: string
  items: Faq[]
}

export const RESOURCE_FAQS: FaqGroup[] = [
  {
    group: 'Ordering & availability',
    items: [
      {
        q: 'Can I buy directly from this website?',
        a: 'No — ENVO is the brand site and does not sell direct. Orders, pricing and stock are handled by your regional distributor: wellforces.co.nz for New Zealand and Asia-Pacific, powersupplymall.com for the United States and the rest of the world. See "Where to buy" below.',
      },
      {
        q: 'How do I get pricing and lead times?',
        a: 'Pricing, stock levels and dispatch times come from your regional distributor, since they vary by market and project volume. Pick your region under "Where to buy" and the distributor will quote current pricing and lead time for your order.',
      },
      {
        q: 'Do you supply samples for evaluation?',
        a: 'Yes. Trade and project customers can request evaluation samples through their regional distributor — useful for confirming brightness, colour temperature and module pitch before committing to a full order.',
      },
    ],
  },
  {
    group: 'Products & compatibility',
    items: [
      {
        q: 'How do I match an LED driver to my modules?',
        a: 'Add up the wattage of every module on the run, then choose a driver whose rated output sits comfortably above that total — loading a driver to no more than about 80% of its rating leaves headroom and extends its life. The driver voltage (12 V or 24 V) must match the modules. Unsure? Use Find your match and we will size it for you.',
      },
      {
        q: 'What is the difference between backlit and sidelit modules?',
        a: 'Backlit modules face forward and light a surface from behind — the standard choice for channel letters and lightboxes. Sidelit (edge-emitting) modules throw light sideways across a shallow cavity, letting you build much thinner illuminated profiles where depth is limited.',
      },
      {
        q: 'Are ENVO modules dimmable or controllable?',
        a: 'Yes, when paired with compatible control gear. Our Zigbee-ready control range supports dimming and scene control; check the specific series spec sheet for its control options and protocol support.',
      },
    ],
  },
  {
    group: 'Installation & technical',
    items: [
      {
        q: 'What IP rating do I need for an outdoor sign?',
        a: 'For exterior installations choose IP65 or higher. Fully exposed or wet locations — coastal, washdown, partly submerged — call for IP66 or IP68. Every ENVO module lists its IP rating on the series spec sheet.',
      },
      {
        q: 'Where do I download IES photometric files?',
        a: 'In the "Documents & downloads" section above — the IES Files pack contains photometric data for lighting calculations and layout software, organised by series.',
      },
      {
        q: 'Which colour temperatures are available?',
        a: 'Most signage series offer warm, neutral and cool white (typically 3000 K, 4000 K and 6500 K), with RGB and RGBW options on the colour-capable series. The exact CCT list is on each series spec sheet.',
      },
    ],
  },
  {
    group: 'Warranty & after-sales',
    items: [
      {
        q: 'What warranty does ENVO provide?',
        a: 'ENVO signage modules carry a multi-year limited warranty (commonly 5 years) covering defects in materials and workmanship under correct installation and rated operating conditions. The exact term is stated on the product documentation.',
      },
      {
        q: 'How do I make a warranty claim or return?',
        a: 'Claims and returns are handled by the distributor you purchased from — wellforces.co.nz or powersupplymall.com. Have your order reference and the product code ready and they will guide you through replacement or repair.',
      },
    ],
  },
]
