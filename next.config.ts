import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    // Serve AVIF/WebP at display size instead of original JPG/PNG.
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // Akeneo PIM product images (products.image_url_fallback / clean_*)
      { protocol: 'https', hostname: 'wellforces-akeneo-pim.s3.ap-southeast-2.amazonaws.com' },
      // Supabase Storage (Payload media binaries once the S3 adapter is live)
      { protocol: 'https', hostname: 'amqqqdgosgfmojjcuzcz.supabase.co' },
    ],
  },
  // Dev-only: allow the dev server's client JS / HMR chunks to be served when
  // the app is opened over the LAN IP (e.g. testing on a phone or another
  // machine), not just localhost. Without this, Next 16 blocks those requests
  // cross-origin and client components (e.g. the Shadow-DOM mini-series page)
  // never hydrate — the page renders only its SSR shell. No production effect.
  allowedDevOrigins: ['192.168.1.137', '192.168.1.*'],
}

export default withPayload(nextConfig)
