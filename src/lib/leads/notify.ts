import { buildLeadEmail, type NormalizedLead } from './submission'

const SALES_TO = 'contact@envo-led.com'
const MAIL_FROM = 'ENVO Website <leads@mail.envolighting.com>'

/**
 * Best-effort sales notification via Mailgun (US region, api.mailgun.net).
 * No-op when MAILGUN_API_KEY / MAILGUN_DOMAIN are unset. Never throws — a
 * failed notification must not break lead capture.
 */
export async function notifyNewLead(lead: NormalizedLead): Promise<void> {
  const key = process.env.MAILGUN_API_KEY
  const domain = process.env.MAILGUN_DOMAIN
  if (!key || !domain) return
  try {
    const { subject, text } = buildLeadEmail(lead)
    const form = new URLSearchParams({
      from: MAIL_FROM,
      to: SALES_TO,
      subject,
      text,
      'h:Reply-To': lead.email,
    })
    await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${key}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form,
    })
  } catch {
    // Notification must never break lead capture.
  }
}
