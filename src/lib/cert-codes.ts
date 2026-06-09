/**
 * Canonical certification vocabulary — single source of truth.
 *
 * Akeneo's `standards_met` multiselect already emits these exact option codes
 * (e.g. `c_ce`, `c_cul`). The Payload `standards_met` select MUST list the same
 * `value`s, and the Akeneo sync MUST keep codes that appear here. When the two
 * drifted apart, the sync silently dropped every cert (0/224) — so both consumers
 * now import this list instead of maintaining their own copy.
 *
 * Codes below are exactly those observed in use across the envo catalogue
 * (Akeneo scan 2026-06-08). Add a new entry here when PIM introduces a new cert.
 */
export const CERT_OPTIONS = [
  { value: 'c_ce', label: 'CE' },
  { value: 'c_tuv', label: 'TUV' },
  { value: 'c_rohs', label: 'RoHS' },
  { value: 'c_saa', label: 'SAA' },
  { value: 'c_ul', label: 'UL' },
  { value: 'c_cul', label: 'cUL' },
  { value: 'c_cb', label: 'CB' },
  { value: 'c_bis', label: 'BIS' },
  { value: 'c_rcm', label: 'RCM' },
  { value: 'c_fcc', label: 'FCC' },
  { value: 'c_selv', label: 'SELV' },
  { value: 'c_enec', label: 'ENEC' },
  { value: 'c_lm80', label: 'LM-80' },
] as const

/** Set of valid cert codes, for fast membership checks in the sync. */
export const CERT_CODES = new Set<string>(CERT_OPTIONS.map((o) => o.value))
