import { Hero } from '@/components/home/hero'
import { Impact } from '@/components/home/impact'
import { Trust } from '@/components/home/trust'
import { ProductFamilies } from '@/components/home/product-families'
import { Solutions } from '@/components/home/solutions'
import { Projects } from '@/components/home/projects'
import { Quote } from '@/components/home/quote'
import { FeaturedDetail } from '@/components/home/featured-detail'
import { Process } from '@/components/home/process'
import { Resources } from '@/components/home/resources'
import { FinalCta } from '@/components/home/final-cta'
import { Newsletter } from '@/components/home/newsletter'

export default function HomePage() {
  return (
    <>
      <Hero />
      <Impact />
      <Trust />
      <ProductFamilies />
      <Solutions />
      <Projects />
      <Quote />
      <FeaturedDetail />
      <Process />
      <Resources />
      <FinalCta />
      <Newsletter />
    </>
  )
}
