import { Hero } from '@/components/home/hero'
import { ValueProps } from '@/components/home/value-props'
import { ShopByCategory } from '@/components/home/shop-by-category'
import { SignageRange } from '@/components/home/signage-range'
import { getHomePage } from '@/lib/home-page'

import type { Metadata } from 'next'

export const metadata: Metadata = { alternates: { canonical: '/' } }
// import { Projects } from '@/components/home/projects' // hidden until real installs exist
import { WhyEnvo } from '@/components/home/why-envo'
import { FreeLayoutCta } from '@/components/home/free-layout-cta'
import '@/components/home/home-v6.css'

export default async function HomePage() {
  const home = await getHomePage()
  return (
    <main className="v4">
      <Hero data={home.hero} />
      <ValueProps />
      <ShopByCategory />
      <SignageRange />
      {/* <Projects /> hidden until real installs exist */}
      <WhyEnvo data={home.why} />
      <FreeLayoutCta data={home.flCta} />
    </main>
  )
}
