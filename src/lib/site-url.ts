// Single source for the site's public origin — canonicals (layout metadataBase),
// sitemap.xml and robots.txt all derive from it.
//
// Production builds MUST set NEXT_PUBLIC_SITE_URL (https://envolighting.com on
// the box — /opt/envo/.env, see DEPLOY.md). Failing the build here beats the
// silent alternative: a deploy that lost the env var would otherwise ship
// localhost canonicals and a localhost sitemap to search engines. sitemap.ts /
// robots.ts are evaluated during `next build`, so a missing var aborts the
// build and the previous release keeps running.
export const SITE_URL = (() => {
  const raw = process.env.NEXT_PUBLIC_SITE_URL
  if (raw) return raw.replace(/\/$/, '')
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'NEXT_PUBLIC_SITE_URL is not set — a production build would emit localhost canonicals/sitemap. Set it (https://envolighting.com) in the box env; see DEPLOY.md.',
    )
  }
  return 'http://localhost:3000'
})()
