import { createHash } from 'crypto'

/**
 * Cookieless visitor hash. Combines IP + UA + UTC date + salt so the same
 * visitor maps to one value per day and rotates daily — gives a rough unique
 * count with no cookie and no recoverable PII. Truncated to 16 hex chars.
 */
export function sessionHash(ip: string, userAgent: string, utcDate: string, salt: string): string {
  return createHash('sha256').update(`${ip}|${userAgent}|${utcDate}|${salt}`).digest('hex').slice(0, 16)
}

const BOT_RE = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|pinterest|vkshare|w3c_validator|headless|lighthouse|gtmetrix|uptime|monitor/i

/** Cheap User-Agent denylist. Empty/missing UA is treated as a bot. */
export function isBot(userAgent: string | null): boolean {
  if (!userAgent || !userAgent.trim()) return true
  return BOT_RE.test(userAgent)
}
