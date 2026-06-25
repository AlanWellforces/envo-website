// Client-safe types + constants for the resources document library.
// Kept separate from resource-library.ts (which imports Payload, server-only)
// so the client <ResourceLibrary> can import these without bundling Payload.

export type DatasheetDoc = {
  id: string
  title: string
  url: string
  /** short family label used for the chip + range filter */
  range: string
}

/** Display order for the range filter; only ranges present in the data render. */
export const RANGE_ORDER = ['Signage', 'Drivers', 'Control gear', 'Accessories', 'Other'] as const
