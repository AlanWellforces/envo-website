import { Hero } from '@/components/home/hero'
import { ValueProps } from '@/components/home/value-props'
import { ShopByCategory } from '@/components/home/shop-by-category'
import { SignageRange } from '@/components/home/signage-range'
import { getHomePage } from '@/lib/home-page'

import type { Metadata } from 'next'
import { metadataForRoute } from '@/lib/page-seo'
import { SITE_TITLE, SITE_DESCRIPTION } from '@/lib/site-url'

export function generateMetadata(): Promise<Metadata> {
  return metadataForRoute('/', { title: SITE_TITLE, description: SITE_DESCRIPTION })
}
// import { Projects } from '@/components/home/projects' // hidden until real installs exist
import { WhyEnvo } from '@/components/home/why-envo'
import { FreeLayoutCta } from '@/components/home/free-layout-cta'
import '@/components/home/home-v6.css'

export default async function HomePage() {
  const home = await getHomePage()
  return (
    <div className="v4">
      <Hero data={home.hero} />
      <ValueProps />
      <ShopByCategory />
      <SignageRange />
      {/* <Projects /> hidden until real installs exist */}
      <WhyEnvo data={home.why} />
      <FreeLayoutCta data={home.flCta} />
    </div>
  )
}
