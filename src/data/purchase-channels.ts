// Brand-wide "Where to buy" config. Used by series detail pages (and
// eventually any product page). Two regional distributors:
//   - NZ / Asia-Pacific  →  wellforces.co.nz  (parent company)
//   - US / Global        →  powersupplymall.com (US service partner)
//
// The marketing site does not sell direct (no checkout) — these URLs are the
// canonical destinations. Update this file when a new region or partner is
// added; pages should not hardcode the URLs.

export type PurchaseChannel = {
  /** ISO-ish region identifier, used as React key. */
  id: 'nz-ap' | 'us-global'
  /** Single emoji used as the visual region marker. */
  flag: string
  /** Short uppercase region label shown above the heading. */
  regionLabel: string
  /** Heading shown on the channel card. */
  heading: string
  /** One-paragraph body explaining what's available in this region. */
  body: string
  /** Primary "View product on …" URL (full https). */
  url: string
  /** Short display label for the primary CTA, e.g. "wellforces.co.nz". */
  urlLabel: string
  /** Home-hero fulfillment chip — region-true and attributed to the
   *  distributor (ENVO itself stocks and ships nothing). */
  fulfillmentChip: string
}

export const PURCHASE_CHANNELS: PurchaseChannel[] = [
  {
    id: 'nz-ap',
    flag: '🇳🇿',
    regionLabel: 'New Zealand · Asia-Pacific',
    heading: 'Available through wellforces.co.nz',
    body: 'ENVO\'s Asia-Pacific service partner — full range carried locally with NZ warranty, NZD pricing and same-day Auckland dispatch for trade and project customers.',
    url: 'https://wellforces.co.nz',
    urlLabel: 'wellforces.co.nz',
    fulfillmentChip: 'NZ-stocked · ships via our distributor',
  },
  {
    id: 'us-global',
    flag: '🇺🇸',
    regionLabel: 'United States · Global region',
    heading: 'Available through powersupplymall.com',
    body: 'ENVO\'s US service partner stocks the full range with local warranty support and serves international customers outside the Asia-Pacific region.',
    url: 'https://powersupplymall.com',
    urlLabel: 'powersupplymall.com',
    fulfillmentChip: 'US-stocked · ships via our distributor',
  },
]
