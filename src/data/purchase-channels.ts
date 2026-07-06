// Brand-wide "Where to buy" config. ENVO is supplied worldwide through two
// authorised purchasing channels (the site sells nothing direct — no checkout):
//   - Primary channel  →  wellforces.co.nz     (ENVO's parent company)
//   - Global channel   →  powersupplymall.com  (international service partner)
//
// Copy here is deliberately non-geographic: ENVO's positioning is global
// supply, so channels are named by role, not country. The `id` values are
// historical region ids kept only for localStorage / geo-routing compatibility
// (see RegionProvider + data/distributors.ts) — they are never shown to users.
// Update this file when a channel is added; pages should not hardcode URLs.

export type PurchaseChannel = {
  /** Stable channel id (historical region code). Internal only — never shown. */
  id: 'nz-ap' | 'us-global'
  /** User-facing channel name — role-based, never country/region. */
  channelLabel: string
  /** Primary "View product on …" URL (full https). */
  url: string
  /** Short display label for the primary CTA, e.g. "wellforces.co.nz". */
  urlLabel: string
}

export const PURCHASE_CHANNELS: PurchaseChannel[] = [
  {
    id: 'nz-ap',
    channelLabel: 'Primary Purchasing Channel',
    url: 'https://wellforces.co.nz',
    urlLabel: 'wellforces.co.nz',
  },
  {
    id: 'us-global',
    channelLabel: 'Global Purchasing Channel',
    url: 'https://powersupplymall.com',
    urlLabel: 'powersupplymall.com',
  },
]
