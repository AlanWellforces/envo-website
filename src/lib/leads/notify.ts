import { buildLeadEmail, type NormalizedLead } from './submission'

const SALES_TO = 'contact@envo-led.com'

/** Best-effort sales notification. No-op (logs) when RESEND_API_KEY is unset. */
export async function notifyNewLead(lead: NormalizedLead): Promise<void> {
  const key = process.env.RESEND_API_KEY
  if (!key) return
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(key)
    const { subject, text } = buildLeadEmail(lead)
    await resend.emails.send({
      from: 'ENVO Website <contact@envo-led.com>',
      to: SALES_TO,
      replyTo: lead.email,
      subject,
      text,
    })
  } catch {
    // Notification must never break lead capture.
  }
}
