/* eslint-disable @typescript-eslint/no-explicit-any --
   New-PIM REST payloads are untyped upstream; like src/lib/akeneo/sync.ts this
   adapter works on loose shapes. */
/**
 * New PIM (newpim.wellforces.com, "Catalog" API v1) → legacy Akeneo product shape.
 *
 * Akeneo was retired on 2026-11-05. Rather than rewrite normalise() and every
 * downstream consumer, this adapter fetches ENVO products from the new PIM and
 * translates each one back into the Akeneo shape normalise() already understands:
 *   - attribute codes renamed back (power_rated → power_rating, …, see ATTR_TO_LEGACY)
 *   - value entries {locale, channel, data} → {locale, scope, data}
 *   - certifications → standards_met with the legacy 'c_' option codes
 *   - image_main / image_clean / datasheets → product_image / clean_image /
 *     spec_sheet entries carrying the S3 URL in `aws` (same bucket as Akeneo,
 *     so unchanged media keep byte-identical URLs)
 *   - option codes that were renamed in the new PIM mapped back (OPTION_TO_LEGACY)
 *
 * Env: NEWPIM_BASE_URL (default https://newpim.wellforces.com/v1),
 *      NEWPIM_CLIENT_ID, NEWPIM_CLIENT_SECRET.
 */

const BASE = (process.env.NEWPIM_BASE_URL || 'https://newpim.wellforces.com/v1').replace(/\/$/, '')
const CLIENT_ID = process.env.NEWPIM_CLIENT_ID || ''
const CLIENT_SECRET = process.env.NEWPIM_CLIENT_SECRET || ''

/** new attribute code → legacy Akeneo attribute code read by normalise() */
export const ATTR_TO_LEGACY: Record<string, string> = {
  name: 'product_name',
  description_short: 'short_description',
  power_rated: 'power_rating',
  voltage_output: 'output_voltage',
  voltage_input_min: 'input_voltage_min',
  voltage_input_max: 'input_voltage_max',
  current_rated: 'rated_current',
  outputs_count: 'number_of_output',
  temperature_operating_min: 'temp_min',
  temperature_operating_max: 'temp_max',
  warranty: 'warranty_period',
  packaging_quantity: 'pack_qty',
  lead_time_shipping: 'shipping_lead_time',
  lead_time_manufacturing: 'manufacturing_lead_time',
  luminous_flux: 'led_light_brightness',
  cct: 'cct_value',
  angle_beam: 'beam_angle',
  lifetime: 'life_time',
  series_count_max: 'max_no_series',
  colour_light: 'led_chip_colour',
  seo_description: 'seo_meta_description',
  size_module: 'module_size',
  is_switch_back_light: 'switch_back_light',
  colour_finish: 'finish_colour',
  range_detection_max: 'maximum_detection_range',
  is_multiway: 'multiway',
  power_input_options: 'led_light_power_input',
  ip_rating: 'waterproof',
}

/** per legacy attribute: new option code → legacy option code. Found by diffing the
 *  adapter output against the live site on 2026-11-05 (vocabulary renamed in the new PIM). */
export const OPTION_TO_LEGACY: Record<string, Record<string, string>> = {
  dimming_control: { non_dimmable: 'none', ac_phase_cut: 'triac' },
  led_light_power_input: { power_input_12v: 'power_input_12V', power_input_24v: 'power_input_24V' },
}

/** new channel code → legacy Akeneo scope used by normalise() */
/**
 * Site-placement pins (user decision 2026-11-05). The new PIM moved these SKUs
 * to series `envo_dali` (and SR-2422NK2-DA2 to another family). `envo_dali` is
 * a gated range on the site (RANGES_NOT_ON_OLD_SITE), so the first new-PIM sync
 * hid all 14 and their pages returned 404. Keep their previous series/family so
 * they stay on the pages they had before. Remove a pin once the site's series
 * set is reorganised.
 */
export const SITE_PINS: Record<string, { series?: string; family?: string }> = {
  'SRP-2305N-10CC100-500': { series: 'sr_triac' },
  'SRP-2305N-15CC100-700': { series: 'sr_triac' },
  'SRP-2305N-25CC250-700': { series: 'sr_triac' },
  'SRP-2305N-36CC350-1050': { series: 'sr_triac' },
  'SRP-2305N-45CC500-1400': { series: 'sr_triac' },
  'SRP-2305N-65CC500-1500': { series: 'sr_triac' },
  'SR-2701S-N': { series: 'sr_triac' },
  'SR-2701S-DT7': { series: 'sr_triac' },
  'SR-2422K8-DA2': { series: 'sr_triac' },
  'SR-2422NK2-DA2': { series: 'sr_triac', family: 'switch_switch_module' },
  'SR-2422NK4-DA2': { series: 'sr_triac' },
  'SR-2422NK8-DA2': { series: 'sr_triac' },
  'SR-2422T8-DA2': { series: 'sr_triac' },
  'SR-2309PRO-5C': { series: 'envo_zigbee' },
}

const CHANNEL_TO_SCOPE: Record<string, string> = {
  master: 'master_catalogue',
}

let tokenCache: { token: string; exp: number } | null = null

export async function getPimToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.exp) return tokenCache.token
  if (!CLIENT_ID || !CLIENT_SECRET) throw new Error('NEWPIM_CLIENT_ID / NEWPIM_CLIENT_SECRET not set')
  const res = await fetch(`${BASE}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'client_credentials', client_id: CLIENT_ID, client_secret: CLIENT_SECRET }),
  })
  if (!res.ok) throw new Error(`New PIM auth failed: ${res.status}`)
  const body = (await res.json()) as { access_token: string; expires_in?: number }
  tokenCache = { token: body.access_token, exp: Date.now() + Math.max(60, (body.expires_in ?? 3600) - 300) * 1000 }
  return tokenCache.token
}

async function api(path: string, params?: Record<string, string>): Promise<any> {
  const url = new URL(BASE + path)
  for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, v)
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${await getPimToken()}` } })
    if (res.status === 404) return null
    if (res.ok) return res.json()
    if (attempt < 2 && (res.status === 401 || res.status >= 500)) {
      if (res.status === 401) tokenCache = null
      await new Promise(r => setTimeout(r, 1500))
      continue
    }
    throw new Error(`New PIM ${path} failed: ${res.status} ${(await res.text()).slice(0, 200)}`)
  }
}

async function mapLimit<T, R>(items: T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let i = 0
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k]) }
  }))
  return out
}

const mediaUrlCache = new Map<string, string | null>()
async function mediaUrl(mediaId: string): Promise<string | null> {
  if (mediaUrlCache.has(mediaId)) return mediaUrlCache.get(mediaId)!
  const m = await api(`/media/${mediaId}`)
  const url: string | null = m?.replicas?.s3?.url ?? null
  mediaUrlCache.set(mediaId, url)
  return url
}

async function assetMediaUrl(assetId: string): Promise<string | null> {
  const r = await api('/assets', { ids: assetId, limit: '5' })
  const a = (r?.items ?? []).find((x: any) => x.id === assetId)
  if (!a || a.status === 'disabled' || !a.media_id) return null
  return mediaUrl(a.media_id)
}

let certMap: Map<string, string> | null = null
async function legacyCertCodes(): Promise<Map<string, string>> {
  if (certMap) return certMap
  certMap = new Map()
  const r = await api('/reference-entities/certification/records', { limit: '500' })
  for (const rec of r?.items ?? []) {
    const legacy = (rec.legacy_codes ?? []).find((c: string) => c.startsWith('standards_met:'))
    certMap.set(rec.code, legacy ? legacy.slice('standards_met:'.length) : `c_${rec.code}`)
  }
  return certMap
}

function mapOption(legacyAttr: string, data: any): any {
  const m = OPTION_TO_LEGACY[legacyAttr]
  if (!m) return data
  if (Array.isArray(data)) return data.map(d => (typeof d === 'string' && m[d]) || d)
  return (typeof data === 'string' && m[data]) || data
}

/** Translate one new-PIM product into the legacy Akeneo shape. */
export async function toLegacy(p: any): Promise<any> {
  const out: Record<string, any[]> = {}
  for (const [code, entries] of Object.entries<any[]>(p.values ?? {})) {
    const legacy = ATTR_TO_LEGACY[code] ?? code
    out[legacy] = entries.map(e => ({
      locale: e.locale ?? null,
      scope: e.channel == null ? null : (CHANNEL_TO_SCOPE[e.channel] ?? e.channel),
      data: mapOption(legacy, e.data),
    }))
  }
  // ENVO's own Akeneo channel (envo_nz) no longer exists; normalise() prefers
  // it for name/subtitle, so alias the master values onto it.
  for (const attr of ['product_name', 'subtitle']) {
    const master = out[attr]?.find(e => e.scope === 'master_catalogue' && e.locale === 'en_US')
    if (master && !out[attr].some(e => e.scope === 'envo_nz')) out[attr].push({ ...master, scope: 'envo_nz' })
  }
  // Prices are NOT synced from the new PIM yet (user decision 2026-11-05, to be
  // discussed): there is no envo_nz channel, so price_nzd normalises to null on
  // creates, and SYNC_PROTECTED_FIELDS keeps the stored price on updates.

  const certs = await legacyCertCodes()
  const cert = p.values?.certifications?.[0]?.data
  delete out.certifications
  if (Array.isArray(cert)) out.standards_met = [{ locale: null, scope: null, data: cert.map((c: string) => certs.get(c) ?? `c_${c}`) }]

  const img = async (newAttr: string, legacyAttr: string) => {
    delete out[newAttr]
    const id = p.values?.[newAttr]?.[0]?.data
    if (typeof id === 'string' && id) out[legacyAttr] = [{ locale: null, scope: null, data: id, aws: await mediaUrl(id) }]
  }
  await img('image_main', 'product_image')
  await img('image_clean', 'clean_image')

  delete out.datasheets
  const sheetIds: string[] = p.values?.datasheets?.[0]?.data ?? []
  if (sheetIds.length) {
    const url = await assetMediaUrl(sheetIds[0])
    if (url) out.spec_sheet = [{ locale: null, scope: null, data: sheetIds[0], aws: url }]
  }

  const pin = SITE_PINS[p.identifier]
  const series = pin?.series ?? p.values?.series?.[0]?.data
  if (series != null) out.series = [{ locale: null, scope: null, data: series }]

  return {
    identifier: p.identifier,
    family: pin?.family ?? p.family ?? null,
    enabled: p.enabled ?? true,
    categories: p.categories ?? [],
    values: out,
  }
}

/** All ENVO products (or one SKU) from the new PIM, in legacy Akeneo shape. */
export async function fetchEnvoProducts(limit: number | null, sku?: string): Promise<any[]> {
  let raw: any[] = []
  if (sku) {
    const p = await api(`/products/${encodeURIComponent(sku)}`)
    if (!p) throw new Error(`New PIM: SKU ${sku} not found`)
    raw = [p]
  } else {
    const search = JSON.stringify({ brand: [{ operator: 'IN', value: ['envo'], locale: 'en_US' }] })
    let cursor: string | undefined
    do {
      const body = await api('/products', { search, limit: '100', ...(cursor ? { cursor } : {}) })
      raw.push(...(body?.items ?? []))
      cursor = body?.next_cursor ?? undefined
      if (limit && raw.length >= limit) break
    } while (cursor)
    if (limit) raw = raw.slice(0, limit)
  }
  return mapLimit(raw, 8, toLegacy)
}
