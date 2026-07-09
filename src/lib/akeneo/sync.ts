/* eslint-disable @typescript-eslint/no-explicit-any --
   Akeneo REST payloads are untyped upstream; the value-extraction helpers here
   deliberately work on loose shapes. Typing them properly is tracked tech debt. */
import { CERT_CODES } from '../cert-codes'
import type { getPayload } from 'payload'

const AKENEO_URL    = process.env.AKENEO_URL!
const CLIENT_ID     = process.env.AKENEO_CLIENT_ID!
const CLIENT_SECRET = process.env.AKENEO_CLIENT_SECRET!
const USERNAME      = process.env.AKENEO_USERNAME!
const PASSWORD      = process.env.AKENEO_PASSWORD!

type PayloadInstance = Awaited<ReturnType<typeof getPayload>>

export async function getAkeneoToken(): Promise<string> {
  const res = await fetch(`${AKENEO_URL}/api/oauth/v1/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
    },
    body: JSON.stringify({ grant_type: 'password', username: USERNAME, password: PASSWORD }),
  })
  if (!res.ok) throw new Error(`Akeneo auth failed: ${res.status}`)
  const { access_token } = await res.json() as { access_token: string }
  return access_token
}

export async function fetchEnvoProducts(token: string, limit: number | null, sku?: string): Promise<any[]> {
  if (sku) {
    const res = await fetch(`${AKENEO_URL}/api/rest/v1/products/${encodeURIComponent(sku)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error(`Akeneo fetch failed for SKU ${sku}: ${res.status}`)
    return [await res.json()]
  }

  const search = encodeURIComponent(JSON.stringify({
    brand: [{ operator: 'IN', value: ['envo'], locale: 'en_US' }],
  }))
  const all: any[] = []
  let page = 1
  while (true) {
    const url = `${AKENEO_URL}/api/rest/v1/products?limit=100&page=${page}&search=${search}`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) throw new Error(`Akeneo fetch failed page ${page}: ${res.status}`)
    const body = await res.json() as { _embedded: { items: any[] } }
    const items = body._embedded?.items ?? []
    all.push(...items)
    if (items.length < 100) break
    if (limit && all.length >= limit) break
    page++
  }
  return limit ? all.slice(0, limit) : all
}

function getVal(values: any, attr: string, scope?: string, locale?: string) {
  const arr: any[] = values?.[attr]
  if (!arr?.length) return null
  if (scope) return arr.find(v => v.scope === scope && (locale == null || v.locale === locale))?.data ?? null
  return arr[0]?.data ?? null
}

function getAmount(values: any, attr: string): number | null {
  const d = getVal(values, attr)
  if (d == null) return null
  const n = typeof d === 'object' ? d?.amount : d
  return n != null ? parseFloat(n) : null
}

function getString(values: any, attr: string, scope?: string, locale?: string): string | null {
  const d = getVal(values, attr, scope, locale)
  if (d == null) return null
  if (Array.isArray(d)) return d[0] ?? null
  return String(d)
}

export function normalise(p: any): Record<string, any> {
  const v = p.values ?? {}

  const dimmingRaw: any = getVal(v, 'dimming_control')
  const dimmingArr: string[] = Array.isArray(dimmingRaw) ? dimmingRaw : dimmingRaw ? [dimmingRaw] : []
  const dimmingMap: Record<string, string> = {
    none: 'none', dali: 'dali', dali2: 'dali', '0_10v': '0_10v', '1_10v': '0_10v',
    pwm: 'pwm', triac: 'triac', casambi: 'casambi', dmx: 'dmx', knx: 'knx',
    matter: 'matter', zigbee: 'zigbee',
  }
  const dimming_control = dimmingArr.map(d => dimmingMap[String(d).toLowerCase()] ?? null).filter(Boolean) as string[]

  // Akeneo emits canonical cert codes (e.g. 'c_ce', 'c_cul') that match our
  // Payload select values 1:1 — keep the known ones, log unknowns (don't drop
  // silently; that masked the long-standing 0/224 cert gap).
  const stdRaw: any = getVal(v, 'standards_met')
  const stdArr: string[] = Array.isArray(stdRaw) ? stdRaw : stdRaw ? [stdRaw] : []
  const standards_met = stdArr
    .map(s => String(s).toLowerCase())
    .filter(c => {
      if (CERT_CODES.has(c)) return true
      console.warn(`[akeneo-sync] ${p.identifier}: unknown cert code '${c}' — add it to src/lib/cert-codes.ts`)
      return false
    })

  const ipRaw = getString(v, 'waterproof') ?? ''
  const ipMap: Record<string, string> = {
    non_waterproof: 'non_waterproof', ip20: 'ip20', ip44: 'ip44',
    ip65: 'ip65', ip67: 'ip67', ip68: 'ip68',
  }

  const opRaw = getString(v, 'operation_mode') ?? ''
  const opMap: Record<string, string> = { cv: 'cv', cc: 'cc', cv_cc: 'cv_cc', 'cv+cc': 'cv_cc' }

  const imgArr: any[] = v.product_image ?? []
  const cleanArr: any[] = v.product_clean_image ?? v.clean_image ?? []

  const priceScope = v.price_retail?.find((x: any) => x.scope === 'envo_nz')?.data ?? []
  const priceNzd = priceScope.find((x: any) => x.currency === 'NZD')?.amount ?? null

  const name =
    getVal(v, 'product_name', 'envo_nz', 'en_US') ??
    getVal(v, 'product_name', 'master_catalogue', 'en_US') ??
    getVal(v, 'product_name') ??
    p.identifier

  return {
    sku:                     p.identifier as string,
    family:                  (p.family ?? null) as string | null,
    series:                  getString(v, 'series'),
    brand:                   'envo',
    categories:              (p.categories ?? []).map((c: string) => ({ code: c })),
    akeneo_synced_at:        new Date().toISOString(),
    name:                    String(name),
    subtitle:                getVal(v, 'subtitle', 'envo_nz', 'en_US') ?? getVal(v, 'subtitle') ?? null,
    short_description:       getString(v, 'short_description'),
    description:             getString(v, 'description'),
    enabled:                 p.enabled ?? true,
    hidden:                  false,
    image_url_fallback:      imgArr[0]?.aws ?? imgArr[0]?._links?.download?.href ?? null,
    clean_image_url_fallback: cleanArr[0]?.aws ?? cleanArr[0]?._links?.download?.href ?? null,
    spec_sheet_url:          (v.spec_sheet?.[0]?.aws ?? v.spec_sheet?.[0]?._links?.download?.href) ?? getString(v, 'datasheet_url'),
    power_w:                 getAmount(v, 'power_rating'),
    output_voltage_v:        getAmount(v, 'output_voltage'),
    input_voltage_min_v:     getAmount(v, 'input_voltage_min'),
    input_voltage_max_v:     getAmount(v, 'input_voltage_max'),
    rated_current_a:         getAmount(v, 'rated_current'),
    number_of_outputs:       getVal(v, 'number_of_output') as number | null,
    operation_mode:          opMap[opRaw.toLowerCase()] ?? null,
    dimming_control,
    length_mm:               getAmount(v, 'length'),
    width_mm:                getAmount(v, 'width'),
    height_mm:               getAmount(v, 'height'),
    weight_kg:               getAmount(v, 'weight'),
    waterproof:              ipMap[ipRaw.toLowerCase()] ?? null,
    temp_min_c:              getAmount(v, 'temp_min'),
    temp_max_c:              getAmount(v, 'temp_max'),
    standards_met,
    warranty_years:          getVal(v, 'warranty_period') != null ? parseFloat((getVal(v, 'warranty_period') as any)?.amount ?? getVal(v, 'warranty_period')) : null,
    price_nzd:               priceNzd != null ? parseFloat(priceNzd) : null,
    inventory_type:          getString(v, 'inventory_type'),
    pack_qty:                getVal(v, 'pack_qty') as number | null,
    shipping_lead_days:      getAmount(v, 'shipping_lead_time') ?? (getVal(v, 'shipping_lead_time') != null ? parseInt(String(getVal(v, 'shipping_lead_time'))) || null : null),
    manufacturing_lead_days: getAmount(v, 'manufacturing_lead_time') ?? (getVal(v, 'manufacturing_lead_time') != null ? parseInt(String(getVal(v, 'manufacturing_lead_time'))) || null : null),
    brightness_lm:           getAmount(v, 'led_light_brightness'),
    efficacy_lm_w:           getVal(v, 'efficacy') != null ? parseFloat(String(getVal(v, 'efficacy'))) : null,
    cct_k:                   getVal(v, 'cct_value') != null ? parseFloat(String(getVal(v, 'cct_value'))) : null,
    cri:                     getVal(v, 'cri') != null ? parseFloat(String(getVal(v, 'cri'))) : null,
    beam_angle_deg:          getVal(v, 'beam_angle') != null ? parseFloat(String(getVal(v, 'beam_angle'))) : null,
    lifetime_hrs:            getAmount(v, 'life_time'),
    max_in_series:           getVal(v, 'max_no_series') != null ? parseFloat(String(getVal(v, 'max_no_series'))) : null,
    led_chip_colour:         (() => {
      const raw = getString(v, 'led_chip_colour') ?? ''
      if (raw.includes('warm') || raw.includes('3000') || raw.includes('2700')) return 'warm_white'
      if (raw.includes('neutral') || raw.includes('natural') || raw.includes('4000')) return 'natural_white'
      if (raw.includes('cool') || raw.includes('6000') || raw.includes('7000')) return 'cool_white'
      if (raw.includes('rgbw')) return 'rgbw'
      if (raw.includes('rgb')) return 'rgb'
      if (raw.includes('tunable') || raw.includes('cct')) return 'tunable_white'
      return null
    })(),
    seo_title:               getString(v, 'new_seo_title') ?? getString(v, 'seo_title'),
    seo_description:         getString(v, 'new_seo_meta_description') ?? getString(v, 'seo_meta_description'),
    cc_region_min:           getAmount(v, 'cc_region_min'),
    cc_region_max:           getAmount(v, 'cc_region_max'),
    controller_type:         (() => {
      const raw = getVal(v, 'controller_type')
      const arr: string[] = Array.isArray(raw) ? raw : raw ? [String(raw)] : []
      return arr.length ? arr : null
    })(),
    output_channel:          getString(v, 'output_channel'),
    output_type:             getString(v, 'output_type'),
    module_size:             getVal(v, 'module_size') != null ? parseFloat(String(getVal(v, 'module_size'))) : null,
    switch_no_module:        getVal(v, 'switch_no_module') != null ? parseFloat(String(getVal(v, 'switch_no_module'))) : null,
    switch_operation_method: getString(v, 'switch_operation_method'),
    switch_back_light:       getVal(v, 'switch_back_light') as boolean | null,
    mounting_info:           getString(v, 'mounting_info'),
    finish_colour:           getString(v, 'finish_colour'),
    material:                getString(v, 'material'),
    sensor_type:             (() => {
      const raw = (getString(v, 'sensor_type') ?? '').toLowerCase()
      const map: Record<string, string> = {
        pir: 'pir', microwave: 'microwave', daylight: 'daylight', dual: 'dual',
        'pir+microwave': 'dual', pir_microwave: 'dual',
      }
      return map[raw] ?? null
    })(),
    technology:              getString(v, 'technology'),
    maximum_detection_range: getString(v, 'maximum_detection_range'),
    multiway:                getVal(v, 'multiway') as boolean | null,
    led_pitch:               getAmount(v, 'led_pitch'),
    led_light_power_input:   (() => {
      const raw = getVal(v, 'led_light_power_input')
      const arr: string[] = Array.isArray(raw) ? raw : raw ? [String(raw)] : []
      return arr.length ? arr : null
    })(),
  }
}

export async function upsertProduct(
  payload: PayloadInstance,
  data: Record<string, any>,
): Promise<{ status: 'created' | 'updated' | 'error'; error?: string }> {
  const existing = await payload.find({
    collection: 'products',
    where: { sku: { equals: data.sku } },
    limit: 1,
  })
  if (existing.docs.length > 0) {
    await payload.update({ collection: 'products', id: existing.docs[0].id, data: data as any })
    return { status: 'updated' }
  }
  await payload.create({ collection: 'products', data: data as any })
  return { status: 'created' }
}

export async function disableProduct(
  payload: PayloadInstance,
  sku: string,
): Promise<{ status: 'disabled' | 'not_found' | 'error'; error?: string }> {
  const existing = await payload.find({
    collection: 'products',
    where: { sku: { equals: sku } },
    limit: 1,
  })
  if (!existing.docs.length) return { status: 'not_found' }
  await payload.update({ collection: 'products', id: existing.docs[0].id, data: { enabled: false } as any })
  return { status: 'disabled' }
}
