import { getPayload } from 'payload'
import config from '@payload-config'
import { sessionHash, isBot } from '@/lib/analytics/track'

export async function POST(req: Request) {
  const ua = req.headers.get('user-agent')
  if (isBot(ua)) return new Response(null, { status: 204 })

  let body: { path?: unknown; referrer?: unknown } = {}
  try {
    body = await req.json()
  } catch {
    return new Response(null, { status: 204 })
  }
  const path = typeof body.path === 'string' ? body.path.slice(0, 512) : null
  if (!path) return new Response(null, { status: 204 })
  const referrer = typeof body.referrer === 'string' && body.referrer ? body.referrer.slice(0, 512) : null

  // Cookieless, no stored IP: hash IP+UA+UTC-day+salt.
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  const utcDate = new Date().toISOString().slice(0, 10)
  const salt = process.env.ANALYTICS_SALT || process.env.PAYLOAD_SECRET || 'envo'
  const hash = sessionHash(ip, ua ?? '', utcDate, salt)

  try {
    const payload = await getPayload({ config })
    await payload.create({
      collection: 'events',
      data: { kind: 'pageview', path, referrer, sessionHash: hash },
    })
  } catch {
    // swallow — tracking is fire-and-forget
  }
  return new Response(null, { status: 204 })
}
