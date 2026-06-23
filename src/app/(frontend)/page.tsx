import { Hero } from '@/components/home/hero'
import { ValueProps } from '@/components/home/value-props'
import { ShopByCategory } from '@/components/home/shop-by-category'
import { SignageRange } from '@/components/home/signage-range'
import { Projects } from '@/components/home/projects'
import { WhyEnvo } from '@/components/home/why-envo'
import { FreeLayoutCta } from '@/components/home/free-layout-cta'
import '@/components/home/home-v6.css'

export default function HomePage() {
  return (
    <main className="v4">
      <Hero />
      <ValueProps />
      <ShopByCategory />
      <SignageRange />
      <Projects />
      <WhyEnvo />
      <FreeLayoutCta />
    </main>
  )
}
