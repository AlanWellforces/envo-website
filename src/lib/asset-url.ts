// Resolve an Akeneo asset reference into an absolute, downloadable URL.
//
// Why this exists: the Akeneo sync stores IMAGE urls already-absolute (full S3
// URL) but stores `spec_sheet_url` (datasheets) as a RELATIVE key only
// (e.g. "e/d/d/8/<hash>_ENC.pdf"), so using it raw as an href 404s. All assets
// live in the same public bucket, so prepending the base makes datasheets
// downloadable. The durable fix is to normalize this in the sync (Alan); until
// then every datasheet consumer runs its URL through this resolver.
// See memory: project_datasheet-urls-relative-broken.

const AKENEO_ASSET_BASE =
  process.env.NEXT_PUBLIC_AKENEO_ASSET_BASE ??
  'https://wellforces-akeneo-pim.s3.ap-southeast-2.amazonaws.com'

/**
 * Returns an absolute URL for an Akeneo asset path.
 * - `null`/empty → `null`
 * - already absolute (`http(s)://`) → returned unchanged
 * - relative key → base + path
 */
export function resolveAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  return `${AKENEO_ASSET_BASE.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}

/**
 * Customer-facing datasheet link. Routes through our own domain
 * (`/datasheets/<sku>`) so the raw Akeneo S3 host (which carries the
 * "wellforces" bucket name) is never exposed — see the proxy route at
 * src/app/datasheets/[sku]/route.ts. Returns null when there's no SKU.
 */
export function datasheetHref(sku: string | null | undefined): string | null {
  return sku ? `/datasheets/${encodeURIComponent(sku)}` : null
}
