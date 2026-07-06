// Regional distributor registry for the "Find local distributor" CTA.
//
// One place to update when regions/distributors grow: add a distributor to
// DISTRIBUTORS, point regions at it in REGION_TO_DISTRIBUTOR, and (optionally)
// map series to its product pages in SERIES_COLLECTIONS. Series pages resolve
// their links through seriesPurchaseLinks() — nothing else hardcodes URLs.
//
// PSM collection handles were verified against powersupplymall.com's live
// /collections.json (2026-07-06). Wellforces carries the full range but has
// no per-series collections — its product link is a site search, verified
// working. Missing mappings fall back to the distributor's ENVO brand page
// (never a dead per-SKU search: PSM's SKU naming differs from Akeneo's).

import type { RegionId } from '@/components/region/RegionProvider'

export type DistributorId = 'psm' | 'wellforces'

export type Distributor = {
  id: DistributorId
  name: string
  homeUrl: string
  /** Brand-level landing to use when no series-specific page is mapped. */
  brandFallbackUrl: string
  /** Builds a series-search URL; used when no explicit mapping exists but a
   *  search is known to work on this shop (Wellforces). */
  seriesSearchUrl?: (seriesLabel: string) => string
}

export const DISTRIBUTORS: Record<DistributorId, Distributor> = {
  psm: {
    id: 'psm',
    name: 'Power Supply Mall',
    homeUrl: 'https://powersupplymall.com',
    brandFallbackUrl: 'https://powersupplymall.com/search?q=ENVO',
  },
  wellforces: {
    id: 'wellforces',
    name: 'Wellforces',
    homeUrl: 'https://wellforces.co.nz',
    brandFallbackUrl: 'https://wellforces.co.nz/search?q=ENVO',
    seriesSearchUrl: (label) => `https://wellforces.co.nz/search?q=${encodeURIComponent(label)}`,
  },
}

/** Which distributor serves each site region. Extend here when regions grow. */
export const REGION_TO_DISTRIBUTOR: Record<RegionId, DistributorId> = {
  'us-global': 'psm',
  'nz-ap': 'wellforces',
}

export function distributorForRegion(region: RegionId): Distributor | null {
  const id = REGION_TO_DISTRIBUTOR[region]
  return id ? DISTRIBUTORS[id] : null
}

// PSM's per-series collections (live handles). Keyed by Akeneo series code.
const PSM_SERIES_COLLECTIONS: Record<string, string> = {
  envo_minilux: 'minilux',
  envo_ecoglo: 'ecoglo',
  envo_chromaflux: 'chromaflux',
  envo_optilume: 'optilume',
  envo_edgelume: 'edgelume',
  envo_edgeflare: 'edgeflare',
  envo_edgeblade: 'edgeblade',
  edge_blade_2: 'edgeblade2',
  hydro_lume: 'hydrolume',
  envo_se_us: 'envo-se-series',
  envo_sl_us: 'envo-sl-series',
  envo_snpv_us: 'envo-snpv-series',
  envo_sp_us: 'envo-sp-series',
  envo_zigbee: 'envo-zigbee-series',
}

export type SeriesPurchaseLinks = Partial<Record<DistributorId, string>>

/** Distributor product links for one series — explicit collection first, then
 *  a known-good search, then the brand page. Never returns a dead link. */
export function seriesPurchaseLinks(
  seriesCode: string | null | undefined,
  seriesLabel: string,
): SeriesPurchaseLinks {
  const psmHandle = seriesCode ? PSM_SERIES_COLLECTIONS[seriesCode] : undefined
  return {
    psm: psmHandle ? `${DISTRIBUTORS.psm.homeUrl}/collections/${psmHandle}` : DISTRIBUTORS.psm.brandFallbackUrl,
    wellforces:
      seriesCode && DISTRIBUTORS.wellforces.seriesSearchUrl
        ? DISTRIBUTORS.wellforces.seriesSearchUrl(seriesLabel)
        : DISTRIBUTORS.wellforces.brandFallbackUrl,
  }
}
