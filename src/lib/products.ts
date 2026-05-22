// Server-only — never import this from a client component.
// All functions use the Payload local API (no HTTP, no auth required).
// Replace `Product` with the generated type from `@/payload-types` once
// `npm run generate:types` has been run.

import { getPayload } from 'payload'
import config from '@/payload.config'

export type Product = {
  id: number
  sku: string
  name: string
  family: string | null
  series: string | null
  brand: string
  subtitle: string | null
  short_description: string | null
  description: string | null
  enabled: boolean
  hidden: boolean

  // Media
  image?: unknown
  clean_image?: unknown
  image_url_fallback: string | null
  clean_image_url_fallback: string | null
  spec_sheet_url: string | null

  // Electrical
  power_w: number | null
  output_voltage_v: number | null
  input_voltage_min_v: number | null
  input_voltage_max_v: number | null
  rated_current_a: number | null
  number_of_outputs: number | null
  operation_mode: 'cv' | 'cc' | 'cv_cc' | null
  dimming_control: string[]
  cc_region_min: number | null
  cc_region_max: number | null

  // Driver / Controller
  controller_type: string[] | null
  output_channel: string | null
  output_type: string | null
  module_size: number | null
  switch_no_module: number | null
  switch_operation_method: string | null
  switch_back_light: boolean
  mounting_info: string | null
  finish_colour: string | null
  material: string | null

  // LED / Light Output
  brightness_lm: number | null
  efficacy_lm_w: number | null
  cct_k: number | null
  cri: number | null
  beam_angle_deg: number | null
  lifetime_hrs: number | null
  max_in_series: number | null
  led_chip_colour: string | null
  led_pitch: number | null
  led_light_power_input: string[] | null

  // Physical
  length_mm: number | null
  width_mm: number | null
  height_mm: number | null
  weight_kg: number | null
  waterproof: string | null
  temp_min_c: number | null
  temp_max_c: number | null

  // Sensor
  sensor_type: string | null
  technology: string | null
  maximum_detection_range: string | null
  multiway: boolean

  // Compliance
  standards_met: string[]
  warranty_years: number | null

  // Pricing
  price_nzd: number | null
  inventory_type: string | null
  pack_qty: number | null
  shipping_lead_days: number | null
  manufacturing_lead_days: number | null

  // SEO
  seo_title: string | null
  seo_description: string | null

  // Sync
  categories: { code: string }[]
  akeneo_synced_at: string | null
}

async function payload() {
  return getPayload({ config })
}

/**
 * Resolve the best image URL for a product.
 *
 * Brand rule: prefer the CLEAN (background-removed) image at every step. Falls
 * back to the regular image only if no clean version is available.
 *
 * TODO(#24): Akeneo S3 URLs are intentionally preferred over the Payload
 *            uploads right now because Payload Media uses local-disk storage
 *            and the files are not shared across machines / Vercel. Once Alan
 *            switches Media to a shared adapter (S3 / Supabase Storage), flip
 *            the Akeneo / Payload pairs so Payload uploads (editorial
 *            overrides) win again. Tracked in
 *            https://github.com/AlanWellforces/envo-website/issues/24
 *
 * Returns `isLocal` so callers can pick Next/Image (for same-origin paths) or
 * a plain <img> tag (for external Akeneo S3 URLs that aren't whitelisted in
 * next.config images).
 */
export function resolveProductImage(
  product: Product,
  seriesFallback: string,
): { src: string; isLocal: boolean; alt: string } {
  // 1. Clean image, Akeneo S3
  if (product.clean_image_url_fallback) {
    return { src: product.clean_image_url_fallback, isLocal: false, alt: product.name }
  }
  // 2. Regular image, Akeneo S3
  if (product.image_url_fallback) {
    return { src: product.image_url_fallback, isLocal: false, alt: product.name }
  }
  // 3. Clean image, Payload upload  (disabled by #24 workaround in practice)
  const cleanUpload = product.clean_image as { url?: string; alt?: string } | null | undefined
  if (cleanUpload?.url) {
    return { src: cleanUpload.url, isLocal: true, alt: cleanUpload.alt ?? product.name }
  }
  // 4. Regular image, Payload upload  (disabled by #24 workaround in practice)
  const upload = product.image as { url?: string; alt?: string } | null | undefined
  if (upload?.url) {
    return { src: upload.url, isLocal: true, alt: upload.alt ?? product.name }
  }
  // 5. Series-level Git fallback
  return { src: seriesFallback, isLocal: true, alt: product.name }
}

/** Single product by SKU. Returns null if not found. */
export async function getProduct(sku: string): Promise<Product | null> {
  const p = await payload()
  const result = await p.find({
    collection: 'products',
    where: { and: [{ sku: { equals: sku } }, { enabled: { equals: true } }] },
    limit: 1,
    depth: 1,
  })
  return (result.docs[0] as unknown as Product) ?? null
}

/** All products in a family, sorted by name. */
export async function getProductsByFamily(
  family: string,
  opts: { limit?: number } = {},
): Promise<Product[]> {
  const p = await payload()
  const result = await p.find({
    collection: 'products',
    where: { and: [{ family: { equals: family } }, { enabled: { equals: true } }, { hidden: { equals: false } }] },
    sort: 'name',
    limit: opts.limit ?? 200,
    depth: 1,
  })
  return result.docs as unknown as Product[]
}

export type ProductFilters = {
  // Catalog
  family?: string
  series?: string
  search?: string                  // matches name + SKU (case-insensitive)

  // Electrical — drivers
  operation_mode?: 'cv' | 'cc' | 'cv_cc'
  dimming_control?: string[]       // any of: 'dali','0_10v','pwm','triac','casambi','dmx','knx','matter','zigbee','none'
  output_voltage_min?: number      // output_voltage_v >=
  output_voltage_max?: number      // output_voltage_v <=
  input_voltage_min?: number       // input_voltage_min_v >=
  input_voltage_max?: number       // input_voltage_max_v <=
  power_min?: number               // power_w >=
  power_max?: number               // power_w <=
  rated_current_min?: number       // rated_current_a >=
  rated_current_max?: number       // rated_current_a <=

  // Light output — LED modules / fixtures
  brightness_min?: number          // brightness_lm >=
  brightness_max?: number          // brightness_lm <=
  cct_min?: number                 // cct_k >=
  cct_max?: number                 // cct_k <=
  cri_min?: number                 // cri >=
  led_chip_colour?: string         // 'warm_white'|'natural_white'|'cool_white'|'tunable_white'|'rgb'|'rgbw'

  // Physical / compliance
  waterproof?: string              // 'ip20'|'ip44'|'ip65'|'ip67'|'ip68'|'non_waterproof'
  standards_met?: string[]         // any of: 'c_ce','c_saa','c_rcm','c_ul','c_tuv','c_fcc','c_rohs','c_enec'

  // Pagination
  limit?: number
  page?: number
  sort?: string                    // Payload field name, prefix '-' for descending e.g. '-price_nzd'
}

/** Paginated product list with optional filters — for catalog / search pages. */
export async function listProducts(
  opts: ProductFilters = {},
): Promise<{ docs: Product[]; totalDocs: number; totalPages: number }> {
  const p = await payload()

  const conditions: import('payload').Where[] = [
    { enabled: { equals: true } },
    { hidden: { equals: false } },
  ]

  // Catalog
  if (opts.family) conditions.push({ family: { equals: opts.family } })
  if (opts.series) conditions.push({ series: { equals: opts.series } })
  if (opts.search) {
    conditions.push({
      or: [
        { name: { like: opts.search } },
        { sku:  { like: opts.search } },
      ],
    })
  }

  // Electrical
  if (opts.operation_mode) conditions.push({ operation_mode: { equals: opts.operation_mode } })
  if (opts.dimming_control?.length) {
    conditions.push({ or: opts.dimming_control.map(d => ({ dimming_control: { contains: d } })) })
  }
  if (opts.output_voltage_min != null) conditions.push({ output_voltage_v: { greater_than_equal: opts.output_voltage_min } })
  if (opts.output_voltage_max != null) conditions.push({ output_voltage_v: { less_than_equal: opts.output_voltage_max } })
  if (opts.input_voltage_min  != null) conditions.push({ input_voltage_min_v: { greater_than_equal: opts.input_voltage_min } })
  if (opts.input_voltage_max  != null) conditions.push({ input_voltage_max_v: { less_than_equal: opts.input_voltage_max } })
  if (opts.power_min != null) conditions.push({ power_w: { greater_than_equal: opts.power_min } })
  if (opts.power_max != null) conditions.push({ power_w: { less_than_equal: opts.power_max } })
  if (opts.rated_current_min != null) conditions.push({ rated_current_a: { greater_than_equal: opts.rated_current_min } })
  if (opts.rated_current_max != null) conditions.push({ rated_current_a: { less_than_equal: opts.rated_current_max } })

  // Light output
  if (opts.brightness_min != null) conditions.push({ brightness_lm: { greater_than_equal: opts.brightness_min } })
  if (opts.brightness_max != null) conditions.push({ brightness_lm: { less_than_equal: opts.brightness_max } })
  if (opts.cct_min != null) conditions.push({ cct_k: { greater_than_equal: opts.cct_min } })
  if (opts.cct_max != null) conditions.push({ cct_k: { less_than_equal: opts.cct_max } })
  if (opts.cri_min != null) conditions.push({ cri: { greater_than_equal: opts.cri_min } })
  if (opts.led_chip_colour) conditions.push({ led_chip_colour: { equals: opts.led_chip_colour } })

  // Physical / compliance
  if (opts.waterproof) conditions.push({ waterproof: { equals: opts.waterproof } })
  if (opts.standards_met?.length) {
    conditions.push({ or: opts.standards_met.map(s => ({ standards_met: { contains: s } })) })
  }

  const result = await p.find({
    collection: 'products',
    where: { and: conditions },
    sort: opts.sort ?? 'name',
    limit: opts.limit ?? 48,
    page: opts.page ?? 1,
    depth: 1,
  })

  return {
    docs: result.docs as unknown as Product[],
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
  }
}
