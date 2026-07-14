import { NextResponse } from 'next/server'
import { after } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { buildLeadDetails, normalizeSubmission } from '@/lib/leads/submission'
import { notifyNewLead } from '@/lib/leads/notify'
import { clientIp, rateLimited, isDuplicate } from '@/lib/leads/abuse-guard'
import { verifyTurnstile } from '@/lib/leads/turnstile'

// Matches the Free Layout form's advertised list: JPG · PNG · PDF · DWG · SVG.
const SKETCH_EXT = /\.(jpe?g|png|webp|gif|pdf|svg|dwg)$/i
const SKETCH_MAX_BYTES = 20 * 1024 * 1024 // 20 MB, as advertised
const DATA_MAX_CHARS = 20_000 // free-form field payload cap

const bad = (errors: string[], status = 400) => NextResponse.json({ ok: false, errors }, { status })

export async function POST(req: Request) {
  // Accept JSON or multipart (the form may include a sketch file).
  let raw: Record<string, unknown> = {}
  let file: File | null = null
  const ct = req.headers.get('content-type') ?? ''
  if (ct.includes('multipart/form-data')) {
    if (Number(req.headers.get('content-length') ?? 0) > SKETCH_MAX_BYTES + 1024 * 1024) {
      return bad(['attachment must be 20 MB or smaller'], 413)
    }
    const form = await req.formData()
    for (const [k, v] of form.entries()) {
      if (v instanceof File) file = v.size > 0 ? v : file
      else raw[k] = v
    }
  } else {
    if (Number(req.headers.get('content-length') ?? 0) > 256 * 1024) {
      return bad(['request too large'], 413)
    }
    try {
      raw = (await req.json()) as Record<string, unknown>
    } catch {
      return bad(['invalid body'])
    }
  }

  // ── anti-abuse (2026-07-13) ─────────────────────────────────────────────
  // Honeypot: the forms carry an offscreen "website" field no human fills.
  // Report success so the bot learns nothing; store nothing.
  if (typeof raw.website === 'string' && raw.website.trim() !== '') {
    return NextResponse.json({ ok: true })
  }

  const ip = clientIp(req.headers)
  if (rateLimited(ip)) {
    return bad(['too many requests — please wait a few minutes and try again'], 429)
  }

  const result = normalizeSubmission(raw)
  if (!result.ok) return bad(result.errors)
  const lead = result.value

  // Turnstile guards upload-bearing submissions: the Free Layout form always,
  // plus any other form actually carrying a file (the contact form's
  // attachment is optional). No-op until the TURNSTILE_* keys are configured
  // — see .env.example / DEPLOY.md.
  if (lead.type === 'free-layout' || file) {
    const token = typeof raw['cf-turnstile-response'] === 'string' ? raw['cf-turnstile-response'] : undefined
    if (!(await verifyTurnstile(token, ip))) {
      return bad(['verification failed — please reload the page and try again'])
    }
  }

  // Same sender, same content, minutes apart = double-click / retry spam.
  // The first submission is already in the pipeline, so report success.
  if (isDuplicate({ type: lead.type, email: lead.email, message: lead.message })) {
    return NextResponse.json({ ok: true })
  }

  // Cap the free-form remainder so a hostile body can't store megabytes.
  if (JSON.stringify(lead.data).length > DATA_MAX_CHARS) {
    return bad(['form data too large'])
  }

  // Validate the sketch BEFORE creating anything — a rejected file must be a
  // visible error, never a silently sketch-less "success".
  if (file) {
    if (file.size > SKETCH_MAX_BYTES) return bad(['attached file must be 20 MB or smaller'])
    if (!SKETCH_EXT.test(file.name)) {
      return bad(['attached file must be a JPG, PNG, PDF, SVG or DWG file'])
    }
  }

  const payload = await getPayload({ config })

  let sketchId: number | undefined
  if (file) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer())
      const uploaded = await payload.create({
        collection: 'lead-files', // staff-only read — sketches are customer PII
        data: { alt: `Sketch — ${lead.name}` },
        file: { data: buffer, name: file.name, mimetype: file.type, size: file.size },
      })
      sketchId = uploaded.id
    } catch {
      return bad(['we could not store your file — please try again or email it to contact@envolighting.com'])
    }
  }

  let createdId: number | string
  try {
    const created = await payload.create({
      collection: 'submissions',
      data: {
        type: lead.type,
        name: lead.name,
        email: lead.email,
        company: lead.company,
        phone: lead.phone,
        sourcePath: lead.sourcePath,
        message: lead.message,
        details: buildLeadDetails(lead.data) || undefined,
        data: lead.data,
        ...(sketchId ? { sketch: sketchId } : {}),
      },
    })
    createdId = created.id
  } catch {
    // e.g. Payload's stricter email validation — surface as a client error,
    // not a 500 with the lead lost.
    return bad(['please check your details and try again'])
  }

  // Notify sales off the response path (retried inside notifyNewLead; never
  // blocks the reply). The outcome is stamped onto the lead so the admin list
  // shows exactly which leads never reached the inbox.
  after(async () => {
    const status = await notifyNewLead(lead)
    try {
      await payload.update({ collection: 'submissions', id: createdId, data: { notify: status } })
    } catch {
      // the status column is observability, not truth — never let it throw
    }
  })
  return NextResponse.json({ ok: true, id: createdId })
}
