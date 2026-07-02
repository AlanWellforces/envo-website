import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { normalizeSubmission } from '@/lib/leads/submission'
import { notifyNewLead } from '@/lib/leads/notify'

export async function POST(req: Request) {
  // Accept JSON or multipart (the form may include a sketch file).
  let raw: Record<string, unknown> = {}
  let file: File | null = null
  const ct = req.headers.get('content-type') ?? ''
  if (ct.includes('multipart/form-data')) {
    const form = await req.formData()
    for (const [k, v] of form.entries()) {
      if (v instanceof File) file = v.size > 0 ? v : file
      else raw[k] = v
    }
  } else {
    try {
      raw = (await req.json()) as Record<string, unknown>
    } catch {
      return NextResponse.json({ ok: false, errors: ['invalid body'] }, { status: 400 })
    }
  }

  const result = normalizeSubmission(raw)
  if (!result.ok) return NextResponse.json({ ok: false, errors: result.errors }, { status: 400 })
  const lead = result.value

  const payload = await getPayload({ config })

  let sketchId: number | undefined
  if (file) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer())
      const media = await payload.create({
        collection: 'media',
        data: { alt: `Sketch — ${lead.name}` },
        file: { data: buffer, name: file.name, mimetype: file.type, size: file.size },
      })
      sketchId = media.id
    } catch {
      // Persist the lead even if the upload fails.
    }
  }

  const created = await payload.create({
    collection: 'submissions',
    data: {
      type: lead.type,
      name: lead.name,
      email: lead.email,
      company: lead.company,
      phone: lead.phone,
      sourcePath: lead.sourcePath,
      data: lead.data,
      ...(sketchId ? { sketch: sketchId } : {}),
    },
  })

  await notifyNewLead(lead)
  return NextResponse.json({ ok: true, id: created.id })
}
