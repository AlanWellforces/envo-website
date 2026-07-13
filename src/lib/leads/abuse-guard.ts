// Anti-abuse guards for the public /api/submissions endpoint (2026-07-13).
// In-memory and per-process by design: production is a single Node container
// on the VPS, and these are anti-burst brakes, not billing-grade quotas — a
// reset on deploy is fine. Cloudflare's edge rate-limit rule (see DEPLOY.md)
// backstops anything that outruns the process.

const RATE_WINDOW_MS = 10 * 60 * 1000
const RATE_MAX = 5 // submissions per IP per window
const DEDUP_WINDOW_MS = 10 * 60 * 1000
const GC_THRESHOLD = 10_000 // entries — opportunistic sweep, keeps memory bounded

const ipHits = new Map<string, number[]>()
const seenContent = new Map<string, number>()

/** Best client IP behind our stack: Cloudflare Tunnel sets cf-connecting-ip;
 *  x-real-ip / first x-forwarded-for hop cover local + other proxies. */
export function clientIp(headers: Headers): string {
  return (
    headers.get('cf-connecting-ip') ??
    headers.get('x-real-ip') ??
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  )
}

/** Sliding-window limit: true = over budget (caller should 429). Recording
 *  happens on the same call, so a blocked request does not extend the window. */
export function rateLimited(ip: string, now = Date.now()): boolean {
  const hits = (ipHits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS)
  if (hits.length >= RATE_MAX) {
    ipHits.set(ip, hits)
    return true
  }
  hits.push(now)
  ipHits.set(ip, hits)
  if (ipHits.size > GC_THRESHOLD) {
    for (const [k, v] of ipHits) if (v.every((t) => now - t >= RATE_WINDOW_MS)) ipHits.delete(k)
  }
  return false
}

/** Short-term duplicate: the same email re-sending the same content within
 *  the window. True = caller should skip the write (and still report success
 *  — the sender already has their submission in the pipeline). The recorded
 *  timestamp is NOT refreshed on a duplicate, so a legitimate resend after
 *  the window always lands. */
export function isDuplicate(
  parts: { type: string; email: string; message?: string },
  now = Date.now(),
): boolean {
  const key = `${parts.type}|${parts.email}|${(parts.message ?? '').trim().slice(0, 500)}`
  const last = seenContent.get(key)
  if (last !== undefined && now - last < DEDUP_WINDOW_MS) return true
  seenContent.set(key, now)
  if (seenContent.size > GC_THRESHOLD) {
    for (const [k, t] of seenContent) if (now - t >= DEDUP_WINDOW_MS) seenContent.delete(k)
  }
  return false
}

/** Test hook — the maps are module-level state. */
export function resetAbuseGuards(): void {
  ipHits.clear()
  seenContent.clear()
}
