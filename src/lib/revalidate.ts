// Server-side helper for Payload afterChange/afterDelete hooks to invalidate
// Next.js ISR/static pages via the /api/revalidate route. Mirrors the inline
// fetch the Posts/Projects hooks already use, shared so the newer Products /
// Pages / PageSeo hooks stay consistent.
//
// Fire-and-forget and env-guarded: a missing REVALIDATE_SECRET (CI, fresh
// checkout) or a network blip must never fail an editor's save.

export async function revalidatePaths(paths: Iterable<string>, label: string): Promise<void> {
  const list = Array.from(new Set(paths)).filter(Boolean)
  if (list.length === 0) return

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const secret = process.env.REVALIDATE_SECRET
  if (!siteUrl || !secret) return

  try {
    // Paths are clean route strings (slugs/model codes are [A-Za-z0-9-]); the
    // route splits the param on ',' so join the same way the Posts hook does.
    await fetch(`${siteUrl}/api/revalidate?paths=${list.join(',')}`, {
      method: 'POST',
      headers: { 'x-revalidate-secret': secret },
    })
  } catch (err) {
    console.error(`[${label}] revalidate fetch failed:`, err)
  }
}
