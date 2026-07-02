import { regionForCountry } from '@/lib/region/geo'

// Geo-derived starting region for first-time visitors. Vercel injects
// x-vercel-ip-country at the edge; in dev the header is absent and the
// mapper falls back to the nz-ap default. The response is per-visitor,
// so it must never be CDN-cached.
export async function GET(req: Request) {
  const region = regionForCountry(req.headers.get('x-vercel-ip-country'))
  return Response.json({ region }, { headers: { 'Cache-Control': 'no-store' } })
}
