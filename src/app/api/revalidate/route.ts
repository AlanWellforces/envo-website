import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/revalidate?paths=/blog,/blog/foo
// Header: x-revalidate-secret: <REVALIDATE_SECRET>
//
// Called by Payload afterChange hooks (Posts, Projects, Products, Pages,
// PageSeo, Homepage global, Site Settings global) to invalidate Next.js's
// cache when an editor publishes a change.
//
// Two caches sit in front of a page: Next's ISR/static cache (cleared by
// revalidatePath) and Cloudflare's edge cache (~10 min TTL). Clearing only
// Next leaves the public URL stale until the edge entry expires, so we also
// purge the affected URLs from Cloudflare when its API creds are present
// (they are on prod; absent in dev/CI, where the purge simply no-ops).
//
// '/__site-settings' is a pseudo-path: footer/contact details render inside
// the root layout on every page, so it revalidates the whole layout tree (and
// purges the whole zone, since every page is affected).

async function purgeCloudflare(paths: string[], purgeEverything: boolean): Promise<void> {
  const token = process.env.CF_API_TOKEN
  const zone = process.env.CF_ZONE_ID
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!token || !zone || !siteUrl) return

  const body = purgeEverything
    ? { purge_everything: true }
    : { files: paths.map((p) => new URL(p, siteUrl).toString()) }

  try {
    await fetch(`https://api.cloudflare.com/client/v4/zones/${zone}/purge_cache`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    // Edge purge is best-effort — the entry expires on its own TTL anyway.
  }
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-revalidate-secret')
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const pathsParam = searchParams.get('paths')
  if (!pathsParam) {
    return NextResponse.json({ ok: false, error: 'missing paths param' }, { status: 400 })
  }

  const paths = pathsParam.split(',').filter(Boolean)
  let purgeEverything = false
  const cfUrls: string[] = []
  for (const p of paths) {
    if (p === '/__site-settings') {
      revalidatePath('/', 'layout')
      purgeEverything = true // layout change touches every page
    } else {
      revalidatePath(p)
      cfUrls.push(p)
    }
  }

  await purgeCloudflare(cfUrls, purgeEverything)

  return NextResponse.json({ ok: true, revalidated: paths })
}
