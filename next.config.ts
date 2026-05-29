import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  // Dev-only: allow the dev server's client JS / HMR chunks to be served when
  // the app is opened over the LAN IP (e.g. testing on a phone or another
  // machine), not just localhost. Without this, Next 16 blocks those requests
  // cross-origin and client components (e.g. the Shadow-DOM mini-series page)
  // never hydrate — the page renders only its SSR shell. No production effect.
  allowedDevOrigins: ['192.168.1.137', '192.168.1.*'],
}

export default withPayload(nextConfig)
