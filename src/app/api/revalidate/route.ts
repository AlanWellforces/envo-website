import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/revalidate?paths=/blog,/blog/foo
// Header: x-revalidate-secret: <REVALIDATE_SECRET>
//
// Called by Payload afterChange hooks (Posts, Homepage global, Site Settings
// global) to invalidate Next.js's cache when an editor publishes a change.
//
// '/__site-settings' is a pseudo-path: footer/contact details render inside
// the root layout on every page, so it revalidates the whole layout tree.

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
    if (p === '/__site-settings') revalidatePath('/', 'layout')
    else revalidatePath(p)
  }

  return NextResponse.json({ ok: true, revalidated: paths })
}
