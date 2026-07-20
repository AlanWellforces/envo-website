import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
// Relative import on purpose — the config loader can't resolve `@/` aliases.
// series-registry.ts is dependency-free so it stays safe to import here.
import { seriesRedirects } from './src/data/series-registry'

const nextConfig: NextConfig = {
  output: 'standalone',
  // Don't advertise the stack ("Next.js, Payload") in response headers.
  poweredByHeader: false,
  images: {
    // WebP ONLY — deliberately no AVIF. Cloudflare's edge cache ignores
    // `Vary: Accept` on /_next/image (verified live 2026-07-16): whichever
    // format the FIRST requester negotiated gets served to every later
    // client, so with AVIF enabled an old Safari could receive AVIF it
    // cannot decode (broken images). WebP decodes in every browser we
    // support, which turns that cache quirk from a correctness bug into a
    // non-issue. Re-add 'image/avif' only after a CF cache rule keys the
    // cache on the Accept header.
    formats: ['image/webp'],
    // Optimized-image responses were max-age=14400 (Next's default 4h floor),
    // so Cloudflare's edge re-fetched them through the tunnel constantly.
    // Sources are content-stable (hashed media filenames / versioned assets):
    // let edges + browsers keep them for 31 days. Deploys purge the CF cache.
    minimumCacheTTL: 2678400,
    remotePatterns: [
      // Akeneo PIM product images — legacy remote fallback. Product images are
      // now localized onto the box, but datasheets still resolve via Akeneo, so
      // this stays until datasheet localization lands.
      { protocol: 'https', hostname: 'wellforces-akeneo-pim.s3.ap-southeast-2.amazonaws.com' },
      // (Supabase Storage host removed 2026-07-09 — Supabase retired; media is
      // served from the box's local disk.)
    ],
  },
  async redirects() {
    return [
      // www → apex, origin-side backstop (external audit 2026-07-21:
      // https://www.envolighting.com served 200 instead of redirecting).
      // The canonical fix is a Cloudflare redirect rule + "Always Use HTTPS"
      // (Lenny — CF also owns http→https, which never reaches this origin
      // config); this keeps the duplicate host from resolving even before
      // that lands. Host changes on redirect, so no loop is possible.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.envolighting.com' }],
        destination: 'https://envolighting.com/:path*',
        permanent: true,
      },
      // Retired series slugs 308 to their canonical pages — the list lives in
      // src/data/series-registry.ts next to the slug rules themselves.
      ...seriesRedirects(),
    ]
  },
  async headers() {
    // Payload's /api/media/file/* route sends NO Cache-Control, so every
    // product image was a full tunnel round-trip (Payload + disk read) on
    // every view. Same for /assets/* static files (videos, scene images).
    // Filenames are effectively immutable (media files are content-hashed or
    // re-uploads get new names; /assets changes ship with a deploy, which
    // purges the Cloudflare cache) — cache 1 day in browsers, 30 days at the
    // edge, and serve stale while revalidating.
    const longCache = {
      key: 'Cache-Control',
      value: 'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400',
    }
    // Baseline security headers (live audit 2026-07-17 — none were sent).
    // HSTS deliberately has no includeSubDomains: design.envolighting.com and
    // any future subdomain are separate apps we can't vouch for here. SAMEORIGIN
    // keeps Payload's live-preview iframe (same origin) working while blocking
    // third-party embedding.
    const securityHeaders = [
      { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ]
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/api/media/file/:path*', headers: [longCache] },
      { source: '/assets/:path*', headers: [longCache] },
    ]
  },
  // Dev-only: allow the dev server's client JS / HMR chunks to be served when
  // the app is opened over the LAN IP (e.g. testing on a phone or another
  // machine), not just localhost. Without this, Next 16 blocks those requests
  // cross-origin and client components (e.g. the Shadow-DOM mini-series page)
  // never hydrate — the page renders only its SSR shell. No production effect.
  allowedDevOrigins: ['192.168.1.137', '192.168.1.*'],
}

export default withPayload(nextConfig)
