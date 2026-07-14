// Normalize Payload media URLs for rendering.
//
// Why this exists: on prod Payload has a serverURL configured, so populated
// media docs come back with ABSOLUTE urls
// (https://envolighting.com/api/media/file/…). next/image treats an absolute
// URL as a remote image and refuses it unless the host is whitelisted in
// images.remotePatterns — which broke every blog cover on the live site
// (/_next/image → 400). The same file requested via a RELATIVE path goes
// through the optimizer as a local image and works, and it renders identically
// in local dev (where Payload already returns relative urls). Stripping the
// origin is tighter than whitelisting our own domain in remotePatterns, which
// would open the optimizer to any path on it.

/**
 * Returns a same-origin Payload media URL (`/api/media/…`) as a relative path.
 * Anything else — already-relative paths, other hosts (e.g. the Akeneo S3
 * bucket) — is returned unchanged. `null`/empty → `null`.
 */
export function relativeMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    if (u.pathname.startsWith('/api/media/')) return `${u.pathname}${u.search}`
    return url
  } catch {
    // not absolute — already a relative path, nothing to strip
    return url
  }
}
