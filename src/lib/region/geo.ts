import type { RegionId } from '@/components/region/RegionProvider'

// Countries served by the NZ / Asia-Pacific channel (wellforces.co.nz).
// Everything else routes to the US · Global channel (powersupplymall.com),
// which per purchase-channels.ts "serves international customers outside
// the Asia-Pacific region".
const ASIA_PACIFIC = new Set([
  // Oceania + Pacific islands
  'NZ', 'AU', 'FJ', 'PG', 'NC', 'VU', 'WS', 'TO', 'SB', 'CK', 'PF', 'TV',
  'KI', 'NR', 'NU', 'FM', 'MH', 'PW', 'GU', 'AS', 'MP', 'NF', 'TK', 'WF',
  // East Asia
  'CN', 'JP', 'KR', 'KP', 'TW', 'HK', 'MO', 'MN',
  // Southeast Asia
  'SG', 'MY', 'TH', 'VN', 'ID', 'PH', 'KH', 'LA', 'MM', 'BN', 'TL',
  // South Asia
  'IN', 'PK', 'BD', 'LK', 'NP', 'BT', 'MV',
])

// Vercel's x-vercel-ip-country placeholders for unknown/anonymised IPs.
const NOT_A_COUNTRY = new Set(['XX', 'T1'])

export function regionForCountry(country: string | null | undefined): RegionId {
  const code = country?.trim().toUpperCase()
  if (!code || code.length !== 2 || NOT_A_COUNTRY.has(code)) return 'nz-ap'
  return ASIA_PACIFIC.has(code) ? 'nz-ap' : 'us-global'
}
