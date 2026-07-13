// scripts/check-links.ts
// Broken-link crawler for a RUNNING instance of the site — covers the
// DB-generated dynamic pages, not just links visible in source code.
//
//   npx tsx scripts/check-links.ts --base http://localhost:3000
//   npx tsx scripts/check-links.ts --base https://envolighting.com
//
// Checks (release gate — see DEPLOY.md "Pre-release link check"):
//   1. every sitemap URL answers 200 directly (no redirect hop)
//   2. every internal link/asset on those pages resolves < 400
//      (an internal link that redirects is a warning — link the final URL)
//   3. every canonical points at a 200 page
//   4. no URL on any page points at localhost/127.0.0.1 (skipped when the
//      crawl target itself is localhost — everything would match)
//   5. PDF / image / media / script URLs are fetched like any other link
//   6. every legacy series slug 308s to its canonical page (expectations
//      imported from src/data/series-registry.ts — the URL registry)
//
// Exit code 0 = clean (warnings allowed), 1 = failures found.

import { seriesRedirects } from '../src/data/series-registry'

// ---------------------------------------------------------------- config

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

const BASE = arg('base', 'http://localhost:3000').replace(/\/$/, '')
const CONCURRENCY = Number(arg('concurrency', '8'))
const TIMEOUT_MS = Number(arg('timeout', '30000'))
const UA = 'envo-link-check/1 (+scripts/check-links.ts)'

const baseUrl = new URL(BASE)
const baseIsLocal = ['localhost', '127.0.0.1', '0.0.0.0'].includes(baseUrl.hostname)

// ---------------------------------------------------------------- helpers

type Failure = { check: string; url: string; detail: string; foundOn?: string }
const failures: Failure[] = []
const warnings: Failure[] = []

function fail(check: string, url: string, detail: string, foundOn?: string) {
  failures.push({ check, url, detail, foundOn })
}
function warn(check: string, url: string, detail: string, foundOn?: string) {
  warnings.push({ check, url, detail, foundOn })
}

async function request(url: string, redirect: 'follow' | 'manual'): Promise<Response | null> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(url, {
        redirect,
        headers: { 'user-agent': UA },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
      return res
    } catch (e) {
      if (attempt === 2) {
        fail('network', url, `request failed twice: ${(e as Error).message}`)
        return null
      }
    }
  }
  return null
}

/** Fetch headers + drop the body (don't download PDFs/videos). */
async function statusOf(url: string, redirect: 'follow' | 'manual'): Promise<Response | null> {
  const res = await request(url, redirect)
  if (res && !res.headers.get('content-type')?.includes('text/html')) {
    void res.body?.cancel().catch(() => {})
  }
  return res
}

/** Sitemap/canonical URLs advertise the prod origin — crawl them on --base. */
function toBase(url: string): string {
  const u = new URL(url, BASE)
  return `${BASE}${u.pathname}${u.search}`
}

function isInternal(raw: string, pageUrl: string): boolean {
  try {
    const u = new URL(raw, pageUrl)
    if (!['http:', 'https:'].includes(u.protocol)) return false
    const siteOrigin = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')
    return (
      u.origin === baseUrl.origin ||
      (siteOrigin !== '' && u.origin === new URL(siteOrigin).origin)
    )
  } catch {
    return false
  }
}

async function mapLimit<T>(items: T[], limit: number, fn: (t: T) => Promise<void>) {
  const queue = [...items]
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    for (let next = queue.shift(); next !== undefined; next = queue.shift()) await fn(next)
  })
  await Promise.all(workers)
}

// ------------------------------------------------------- html extraction

const URL_ATTR_RE = /\b(?:href|src|poster)\s*=\s*["']([^"']+)["']/gi
// meta content= values are mostly NOT urls (og:type, descriptions) — only
// harvest ones that look like a url (og:image, twitter:image, …).
const META_CONTENT_RE = /<meta\b[^>]*content\s*=\s*["']((?:https?:\/\/|\/)[^"']+)["']/gi
const SRCSET_RE = /\bsrcset\s*=\s*["']([^"']+)["']/gi
const CANONICAL_RE = /<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']|<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/i
const LOCALHOST_RE = /https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?\S*/gi

/** Attribute values are HTML-escaped — decode before requesting. */
function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
    .replace(/&#x27;/gi, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
}

function extractUrls(html: string): string[] {
  const urls: string[] = []
  for (const m of html.matchAll(URL_ATTR_RE)) urls.push(m[1])
  for (const m of html.matchAll(META_CONTENT_RE)) urls.push(m[1])
  for (const m of html.matchAll(SRCSET_RE)) {
    for (const part of m[1].split(',')) {
      const u = part.trim().split(/\s+/)[0]
      if (u) urls.push(u)
    }
  }
  // Next output only uses root-relative or absolute urls — anything else here
  // is a non-url attribute value the regexes over-matched.
  return urls.map(decodeEntities).filter((u) => /^(https?:\/\/|\/)/.test(u))
}

/**
 * Collapse /_next/image variants: one source image renders as ~8 srcset
 * sizes, all hitting the same source file — checking the largest is enough.
 */
function dedupeImageVariants(targets: Map<string, string>): Map<string, string> {
  const out = new Map<string, string>()
  const bestBySource = new Map<string, { url: string; page: string; w: number }>()
  for (const [target, page] of targets) {
    const u = new URL(target)
    if (u.pathname !== '/_next/image') {
      out.set(target, page)
      continue
    }
    const source = u.searchParams.get('url') ?? target
    const w = Number(u.searchParams.get('w') ?? 0)
    const best = bestBySource.get(source)
    if (!best || w > best.w) bestBySource.set(source, { url: target, page, w })
  }
  for (const { url, page } of bestBySource.values()) out.set(url, page)
  return out
}

// ---------------------------------------------------------------- checks

async function fetchSitemapUrls(): Promise<string[]> {
  const res = await request(`${BASE}/sitemap.xml`, 'follow')
  if (!res || !res.ok) {
    fail('sitemap', `${BASE}/sitemap.xml`, `status ${res?.status ?? 'unreachable'}`)
    return []
  }
  const xml = await res.text()
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim())
  if (urls.length === 0) fail('sitemap', `${BASE}/sitemap.xml`, 'no <loc> entries found')
  return urls
}

async function checkLegacyRedirects() {
  for (const r of seriesRedirects()) {
    const src = `${BASE}${r.source}`
    const res = await statusOf(src, 'manual')
    if (!res) continue
    if (res.status !== 308 && res.status !== 301) {
      fail('legacy-redirect', src, `expected 308/301, got ${res.status}`)
      continue
    }
    const loc = res.headers.get('location') ?? ''
    const locPath = new URL(loc, BASE).pathname
    if (locPath !== r.destination) {
      fail('legacy-redirect', src, `redirects to ${locPath}, expected ${r.destination}`)
      continue
    }
    const dest = await statusOf(`${BASE}${r.destination}`, 'follow')
    if (dest && dest.status !== 200) {
      fail('legacy-redirect', `${BASE}${r.destination}`, `redirect target answers ${dest.status}`)
    }
  }
}

async function main() {
  console.log(`check-links → ${BASE} (concurrency ${CONCURRENCY})`)
  if (baseIsLocal) console.log('note: localhost target — the no-localhost-refs check is skipped')

  await checkLegacyRedirects()

  const sitemapUrls = await fetchSitemapUrls()
  console.log(`sitemap: ${sitemapUrls.length} URLs`)

  // page URL → 200 + collect its outbound internal links
  const linkTargets = new Map<string, string>() // url on base origin → first page it was found on
  const canonicals = new Map<string, string>() // canonical target → page

  await mapLimit(sitemapUrls, CONCURRENCY, async (advertised) => {
    const pageUrl = toBase(advertised)
    const res = await request(pageUrl, 'manual')
    if (!res) return
    if (res.status !== 200) {
      fail('sitemap-200', pageUrl, `status ${res.status}${res.status >= 300 && res.status < 400 ? ` → ${res.headers.get('location')}` : ''}`)
      void res.body?.cancel().catch(() => {})
      return
    }
    if (!res.headers.get('content-type')?.includes('text/html')) {
      void res.body?.cancel().catch(() => {})
      return
    }
    const html = await res.text()

    if (!baseIsLocal) {
      for (const m of html.matchAll(LOCALHOST_RE)) {
        fail('localhost-ref', m[0].slice(0, 120), 'page content points at localhost', pageUrl)
      }
    }

    const canonical = CANONICAL_RE.exec(html)
    const canonicalHref = canonical?.[1] ?? canonical?.[2]
    if (canonicalHref) canonicals.set(toBase(canonicalHref), pageUrl)

    for (const raw of extractUrls(html)) {
      if (raw.startsWith('#') || raw.startsWith('mailto:') || raw.startsWith('tel:') || raw.startsWith('data:')) continue
      if (!isInternal(raw, pageUrl)) continue
      const target = toBase(new URL(raw, pageUrl).href)
      if (!linkTargets.has(target)) linkTargets.set(target, pageUrl)
    }
  })

  // canonical targets must answer 200 directly
  await mapLimit([...canonicals.entries()], CONCURRENCY, async ([target, page]) => {
    const res = await statusOf(target, 'manual')
    if (res && res.status !== 200) fail('canonical', target, `status ${res.status}`, page)
  })

  // every internal link/asset must resolve < 400; redirects are warnings
  const targets = [...dedupeImageVariants(linkTargets).entries()].filter(([t]) => !canonicals.has(t))
  console.log(`internal link targets: ${targets.length + canonicals.size}`)
  await mapLimit(targets, CONCURRENCY, async ([target, page]) => {
    const direct = await statusOf(target, 'manual')
    if (!direct) return
    if (direct.status >= 300 && direct.status < 400) {
      const final = await statusOf(target, 'follow')
      if (final && final.status >= 400) {
        fail('internal-link', target, `redirects to a ${final.status}`, page)
      } else {
        warn('internal-redirect', target, `link redirects (${direct.status} → ${direct.headers.get('location')}) — link the final URL`, page)
      }
      return
    }
    if (direct.status >= 400) fail('internal-link', target, `status ${direct.status}`, page)
  })

  // ------------------------------------------------------------- report
  const fmt = (f: Failure) => `  [${f.check}] ${f.url}\n      ${f.detail}${f.foundOn ? `\n      found on ${f.foundOn}` : ''}`
  if (warnings.length) {
    console.log(`\n⚠ ${warnings.length} warning(s):`)
    for (const w of warnings.slice(0, 50)) console.log(fmt(w))
    if (warnings.length > 50) console.log(`  … and ${warnings.length - 50} more`)
  }
  if (failures.length) {
    console.log(`\n✗ ${failures.length} failure(s):`)
    for (const f of failures) console.log(fmt(f))
    process.exit(1)
  }
  console.log(`\n✓ clean — ${sitemapUrls.length} sitemap pages, ${targets.length} internal targets checked (${linkTargets.size} collected, image size-variants collapsed), ${canonicals.size} canonicals, ${seriesRedirects().length} legacy redirects`)
}

main()
