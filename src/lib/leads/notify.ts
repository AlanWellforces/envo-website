import { buildLeadEmail, type NormalizedLead } from './submission'

const SALES_TO = 'contact@envolighting.com'
const MAIL_FROM = 'ENVO Website <leads@mail.envolighting.com>'

// Notification result — persisted onto the lead (Submissions.notify) so the
// admin list shows exactly which leads never reached the sales inbox.
export type NotifyStatus = 'sent' | 'failed' | 'skipped'

const RETRY_DELAYS_MS = [5_000, 25_000] // attempt 1 → +5s → +25s, then give up

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** One Mailgun send (US region, api.mailgun.net). Throws on non-2xx. */
async function sendSalesEmail(subject: string, text: string, replyTo?: string): Promise<void> {
  const key = process.env.MAILGUN_API_KEY
  const domain = process.env.MAILGUN_DOMAIN
  if (!key || !domain) throw new Error('mailgun not configured')
  const form = new URLSearchParams({ from: MAIL_FROM, to: SALES_TO, subject, text })
  if (replyTo) form.set('h:Reply-To', replyTo)
  const res = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${key}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form,
  })
  if (!res.ok) throw new Error(`mailgun ${res.status}`)
}

/**
 * Sales notification for a new lead — retried (3 attempts, backing off), and
 * the outcome is RETURNED so the caller can stamp it onto the stored lead.
 * Never throws: a dead notification must not break lead capture; a terminal
 * failure lands in the container log (docker logs / deploy.log greppable).
 */
export async function notifyNewLead(lead: NormalizedLead): Promise<NotifyStatus> {
  if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) return 'skipped'
  const { subject, text } = buildLeadEmail(lead)
  for (let attempt = 0; ; attempt++) {
    try {
      await sendSalesEmail(subject, text, lead.email)
      return 'sent'
    } catch (err) {
      if (attempt >= RETRY_DELAYS_MS.length) {
        console.error(
          `[leads] sales notification FAILED after ${attempt + 1} attempts — lead is stored, check /admin`,
          { email: lead.email, type: lead.type, err: err instanceof Error ? err.message : String(err) },
        )
        return 'failed'
      }
      await sleep(RETRY_DELAYS_MS[attempt])
    }
  }
}

/** Digest sender — same transport, no retries (the timer fires again tomorrow). */
export async function sendDigestEmail(subject: string, text: string): Promise<boolean> {
  try {
    await sendSalesEmail(subject, text)
    return true
  } catch (err) {
    console.error('[leads] digest email failed', err instanceof Error ? err.message : String(err))
    return false
  }
}
