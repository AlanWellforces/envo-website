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

// Vendored variable font (latin subset) — builds must not depend on
// fonts.googleapis.com being reachable.
const interTight = localFont({
  src: '../../fonts/inter-tight-latin.woff2',
  variable: '--font-inter-tight',
  weight: '100 900',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'ENVO — Engineered Illumination',
  description:
    'ENVO designs and manufactures professional-grade LED lighting systems that power signage and architectural illumination worldwide.',
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
        </RegionProvider>
      </body>
    </html>
  )
}
