export type LeadType = 'free-layout' | 'find-your-match' | 'contact'
const TYPES: LeadType[] = ['free-layout', 'find-your-match', 'contact']
const KNOWN = new Set(['type', 'name', 'email', 'company', 'phone', 'sourcePath', 'message', 'notes'])

export type NormalizedLead = {
  type: LeadType
  name: string
  email: string
  company?: string
  phone?: string
  sourcePath?: string
  /** Customer's free-text message (contact `message` / free-layout `notes`). */
  message?: string
  data: Record<string, unknown>
}

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')
const isEmail = (v: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

export function normalizeSubmission(
  input: unknown,
): { ok: true; value: NormalizedLead } | { ok: false; errors: string[] } {
  const obj = (input ?? {}) as Record<string, unknown>
  const errors: string[] = []

  const type = str(obj.type) as LeadType
  if (!TYPES.includes(type)) errors.push('type must be one of: ' + TYPES.join(', '))
  const name = str(obj.name)
  if (!name) errors.push('name is required')
  const email = str(obj.email).toLowerCase()
  if (!isEmail(email)) errors.push('a valid email is required')
  if (errors.length) return { ok: false, errors }

  const data: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) if (!KNOWN.has(k)) data[k] = v

  const value: NormalizedLead = { type, name, email, data }
  const company = str(obj.company)
  const phone = str(obj.phone)
  const sourcePath = str(obj.sourcePath)
  const message = str(obj.message) || str(obj.notes)
  if (company) value.company = company
  if (phone) value.phone = phone
  if (sourcePath) value.sourcePath = sourcePath
  if (message) value.message = message
  return { ok: true, value }
}

/** Plain-language summary of the leftover form fields ("signType" → "Sign type"). */
export function buildLeadDetails(data: Record<string, unknown>): string {
  return Object.entries(data)
    .map(([k, v]) => {
      const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())
      return `${label}: ${typeof v === 'string' ? v : JSON.stringify(v)}`
    })
    .join('\n')
}

export function buildLeadEmail(lead: NormalizedLead): { subject: string; text: string } {
  const subject = `New ${lead.type} lead — ${lead.name}`
  const details = buildLeadDetails(lead.data)
  const lines = [
    `Type: ${lead.type}`,
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    lead.company ? `Company: ${lead.company}` : null,
    lead.phone ? `Phone: ${lead.phone}` : null,
    lead.sourcePath ? `Source: ${lead.sourcePath}` : null,
    lead.message ? `\nMessage:\n${lead.message}` : null,
    details ? `\nDetails:\n${details}` : null,
  ].filter((l): l is string => l !== null)
  return { subject, text: lines.join('\n') }
}
