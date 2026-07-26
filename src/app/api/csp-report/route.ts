// Collector for Content-Security-Policy-Report-Only violation beacons
// (header set in next.config.ts, audit 2026-07-27). Logs one compact line per
// report to stdout → `docker logs envo-website` on the box. Once the log has
// been quiet for a while, the policy graduates from Report-Only to enforced.
//
// Beacons are fire-and-forget from browsers we don't control: always 204,
// never throw, cap the body so junk can't balloon the logs.

const MAX_BODY = 16_384

export async function POST(req: Request): Promise<Response> {
  try {
    const raw = await req.text()
    if (raw.length > 0 && raw.length <= MAX_BODY) {
      const parsed = JSON.parse(raw)
      // classic reports wrap the payload in "csp-report"; Reporting-API ones don't
      const r = parsed['csp-report'] ?? parsed
      console.warn(
        '[csp-report]',
        JSON.stringify({
          directive: r['violated-directive'] ?? r['effective-directive'] ?? 'unknown',
          blocked: r['blocked-uri'] ?? 'unknown',
          page: r['document-uri'] ?? 'unknown',
        }),
      )
    }
  } catch {
    // malformed beacon — nothing to log
  }
  return new Response(null, { status: 204 })
}
