import type { MetadataRoute } from 'next'
import { SITE_URL as BASE } from '@/lib/site-url'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Admin UI and JSON APIs — nothing crawlable, keep bots out.
        disallow: ['/admin', '/api/'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  }
}
