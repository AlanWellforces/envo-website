import type { Metadata } from 'next'
import localFont from 'next/font/local'
import '../globals.css'
import { PageViewBeacon } from '@/components/analytics/PageViewBeacon'
import { Sidebar } from '@/components/layout/sidebar'
import { RegionProvider } from '@/components/region/RegionProvider'
import { Footer } from '@/components/layout/footer'
import { CursorGlow } from '@/components/layout/cursor-glow'
import { RevealOnScroll } from '@/components/layout/reveal-on-scroll'
import { BackToTop } from '@/components/layout/back-to-top'
import { PointerBlur } from '@/components/layout/PointerBlur'

// Vendored variable font (latin subset) — builds must not depend on
// fonts.googleapis.com being reachable.
const interTight = localFont({
  src: '../../fonts/inter-tight-latin.woff2',
  variable: '--font-inter-tight',
  weight: '100 900',
})

const SITE_TITLE = 'ENVO — Engineered Illumination'
const SITE_DESCRIPTION =
  'ENVO designs and manufactures professional-grade LED lighting systems that power signage and architectural illumination worldwide.'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  // Search-engine site-ownership verification. Paste the token from the
  // console into /opt/envo/.env and redeploy — no DNS change needed.
  // (Google: URL-prefix property "HTML tag" method; Bing: msvalidate.01.)
  verification: {
    ...(process.env.GOOGLE_SITE_VERIFICATION && { google: process.env.GOOGLE_SITE_VERIFICATION }),
    ...(process.env.BING_SITE_VERIFICATION && { other: { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } }),
  },
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  // Site-wide share-preview fallback (LinkedIn, Slack, WeChat…). Pages with
  // their own openGraph (blog posts, page-seo overrides) replace this wholesale.
  openGraph: {
    type: 'website',
    siteName: 'ENVO',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: '/assets/images/hero-signage-poster.jpg', width: 1920, height: 1080, alt: 'ENVO LED signage lighting' }],
  },
  twitter: {
    card: 'summary_large_image',
  },
  icons: {
    icon: [
      { url: '/assets/images/favicon.svg', type: 'image/svg+xml' },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={interTight.variable}>
      <body>
        <PageViewBeacon />
        <RegionProvider>
          {/* Region/channel banner hidden for now (user 2026-07-08) — the
              region picker under each purchase CTA still covers the choice.
              Re-enable by restoring <RegionBanner />. */}
          <Sidebar />
          {/* TopSubnav retired (user 2026-07-08): the #157 sidebar lists all
              four categories as top-level items, so the dark Categories bar
              on detail pages was a duplicate. Restore <TopSubnav /> if a
              horizontal category bar is ever wanted again. */}
          <CursorGlow />
          {children}
          <Footer />
          <RevealOnScroll />
          <BackToTop />
          <PointerBlur />
        </RegionProvider>
      </body>
    </html>
  )
}
