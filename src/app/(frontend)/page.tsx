import { Hero } from '@/components/home/hero'
import { Apps } from '@/components/home/apps'
import { FreeLayout } from '@/components/home/free-layout'
import { FeaturedProject } from '@/components/home/featured-project'
import { ProductRange } from '@/components/home/product-range'
import { TrustSlim } from '@/components/home/trust-slim'
import { Guides } from '@/components/home/guides'
import { FinalCta } from '@/components/home/final-cta'
import '@/components/home/home-v6.css'

export default function HomePage() {
  return (
    <main className="v4">
      <Hero />
      <Apps />
      <FreeLayout />
      <FeaturedProject />
      <ProductRange />
      <TrustSlim />
      <Guides />
      <FinalCta />
    </main>
  )
}
