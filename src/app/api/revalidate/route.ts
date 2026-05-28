import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { clearSiteSettingsCache } from '@/lib/site-settings'
import { clearHomePageCache } from '@/lib/home-page'

// POST /api/revalidate?paths=/blog,/blog/foo
// Header: x-revalidate-secret: <REVALIDATE_SECRET>
//
// Called by the Posts collection's afterChange hook to invalidate Next.js's
// ISR cache when an editor publishes / unpublishes / edits a post.

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
  for (const p of paths) {
    revalidatePath(p)
  }

  if (paths.includes('/__site-settings')) clearSiteSettingsCache()
  if (paths.includes('/__home-page')) clearHomePageCache()

  return NextResponse.json({ ok: true, revalidated: paths })
}
