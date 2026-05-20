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

/** Paginated product list with optional filters — for catalog / search pages. */
export async function listProducts(opts: {
  family?: string
  series?: string
  limit?: number
  page?: number
} = {}): Promise<{ docs: Product[]; totalDocs: number; totalPages: number }> {
  const p = await payload()

  const conditions: object[] = [
    { enabled: { equals: true } },
    { hidden: { equals: false } },
  ]
  if (opts.family) conditions.push({ family: { equals: opts.family } })
  if (opts.series) conditions.push({ series: { equals: opts.series } })

  const result = await p.find({
    collection: 'products',
    where: { and: conditions },
    sort: 'name',
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
