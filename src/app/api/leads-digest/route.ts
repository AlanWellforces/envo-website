import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { buildDigestEmail, type DigestLead } from '@/lib/leads/digest'
import { sendDigestEmail } from '@/lib/leads/notify'

// Daily "unhandled leads" reminder — hit by a timer on the box (see
// DEPLOY.md), never by browsers. Feature is OFF (404) until
// LEADS_DIGEST_SECRET is set; the wrong secret is a 401.
// Emails only when at least one lead has sat in status=New for over 24 h,
// so a quiet day sends nothing.

export async function GET(req: Request) {
  const secret = process.env.LEADS_DIGEST_SECRET
  if (!secret) return NextResponse.json({ ok: false }, { status: 404 })
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${secret}`) return NextResponse.json({ ok: false }, { status: 401 })

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'submissions',
    where: { and: [{ status: { equals: 'new' } }, { createdAt: { less_than: cutoff } }] },
    sort: '-createdAt',
    limit: 100,
    depth: 0,
  })

  if (docs.length === 0) return NextResponse.json({ ok: true, pending: 0, sent: false })

  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://envolighting.com').replace(/\/$/, '')
  const { subject, text } = buildDigestEmail(docs as DigestLead[], site)
  const sent = await sendDigestEmail(subject, text)
  return NextResponse.json({ ok: true, pending: docs.length, sent })
}
