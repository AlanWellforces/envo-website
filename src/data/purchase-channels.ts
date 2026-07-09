// Brand-wide "Where to buy" config. ENVO is supplied worldwide through two
// authorised supply channels (the site sells nothing direct — no checkout):
//   - wellforces.co.nz     → New Zealand & Asia-Pacific
//   - powersupplymall.com  → United States & global
//
// Both are equally authorised — there is no primary/secondary channel. So the
// two are NOT ranked ("Primary"/"Global"); instead each carries a `regionLabel`
// stating the coverage it serves, and users pick by their region + domain. The
// `id` values are historical region codes kept only for localStorage / geo-
// routing (see RegionProvider + data/distributors.ts) — never shown to users.
// Update this file when a channel is added; pages should not hardcode URLs.

export type PurchaseChannel = {
  /** Stable channel id (historical region code). Internal only — never shown. */
  id: 'nz-ap' | 'us-global'
  /** Coverage this channel serves, so users pick the right one for their region. */
  regionLabel: string
  /** Destination URL for this channel (full https) — used as a link href only. */
  url: string
}

export const PURCHASE_CHANNELS: PurchaseChannel[] = [
  {
    id: 'nz-ap',
    regionLabel: 'New Zealand & Asia-Pacific',
    url: 'https://wellforces.co.nz',
  },
  {
    id: 'us-global',
    regionLabel: 'United States & Global',
    url: 'https://powersupplymall.com',
  },
]
