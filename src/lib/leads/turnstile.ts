// Cloudflare Turnstile server-side verification (2026-07-13). Fully gated on
// TURNSTILE_SECRET_KEY — unset (local dev, or until the key lands on the VPS)
// means the check is off and forms behave exactly as before. The matching
// widget renders only when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set.

export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true // feature off — nothing to verify
  if (!token) return false
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    })
    const data = (await res.json()) as { success?: boolean }
    return data.success === true
  } catch {
    // Cloudflare unreachable ≠ the visitor is a bot. Fail OPEN so a siteverify
    // outage never blocks lead capture — the in-process rate limit still holds.
    return true
  }
}
