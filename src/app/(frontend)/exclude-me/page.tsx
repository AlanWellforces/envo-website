import type { Metadata } from 'next'
import { ExcludeToggle } from './ExcludeToggle'

// Internal utility: flags THIS browser as team traffic so the cookieless
// analytics beacon (PageViewBeacon) stops counting it. Not linked anywhere,
// not in the sitemap, noindexed. Admin-logged-in browsers are excluded
// automatically server-side (/api/track payload-token check); this page is
// for teammates who never log into /admin.

export const metadata: Metadata = {
  title: 'Analytics opt-out — ENVO',
  robots: { index: false, follow: false },
}

export default function ExcludeMePage() {
  return (
    <section style={{ padding: '48px 0' }}>
      <div className="v4-wrap">
        <h1>Analytics opt-out</h1>
        <p style={{ maxWidth: 560, margin: '12px 0 24px' }}>
          Internal page for the ENVO team. Excluding this browser stops it from
          being counted in the site&apos;s visitor stats. The flag lives in this
          browser only — set it once per device/browser you use.
        </p>
        <ExcludeToggle />
      </div>
    </section>
  )
}
