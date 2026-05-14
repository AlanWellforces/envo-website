import type { Metadata } from 'next'
import { Inter_Tight } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/layout/sidebar'
import { Footer } from '@/components/layout/footer'
import { LightBinBar } from '@/components/layout/light-bin-bar'
import { CursorGlow } from '@/components/layout/cursor-glow'
import { RevealOnScroll } from '@/components/layout/reveal-on-scroll'

const interTight = Inter_Tight({
  variable: '--font-inter-tight',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'ENVO — Engineered Illumination',
  description:
    'ENVO designs and manufactures professional-grade LED lighting systems that power signage and architectural illumination worldwide.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={interTight.variable}>
      <body>
        <LightBinBar />
        <Sidebar />
        <CursorGlow />
        {children}
        <Footer />
        <RevealOnScroll />
      </body>
    </html>
  )
}
