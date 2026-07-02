import type { Metadata } from 'next'
import { Inter_Tight } from 'next/font/google'
import '../globals.css'
import { PageViewBeacon } from '@/components/analytics/PageViewBeacon'
import { Sidebar } from '@/components/layout/sidebar'
import { RegionProvider } from '@/components/region/RegionProvider'
import { TopSubnav } from '@/components/layout/top-subnav'
import { Footer } from '@/components/layout/footer'
import { CursorGlow } from '@/components/layout/cursor-glow'
import { RevealOnScroll } from '@/components/layout/reveal-on-scroll'
import { BackToTop } from '@/components/layout/back-to-top'

const interTight = Inter_Tight({
  variable: '--font-inter-tight',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
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
          <Sidebar />
          <TopSubnav />
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
