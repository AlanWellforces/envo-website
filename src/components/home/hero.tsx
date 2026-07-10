import Image from 'next/image'
import { RegionShippingChip } from '@/components/region/RegionShippingChip'
import Link from 'next/link'
import { ArrowRight } from './icons'
import { Lines } from './lines'
import { HeroVideo } from './hero-video'
import type { HomeHeroData } from '@/lib/home-page'

export function Hero({ data = {} }: { data?: HomeHeroData }) {
  return (
    <section className="v4-hero">
      <HeroVideo
        className="v4-hero-bg"
        src="/assets/videos/hero-signage.mp4"
        poster="/assets/images/hero-signage-poster.jpg"
      />
      <div className="v4-wrap">
        <div className="v4-hero-col">
          <div className="v4-eyebrow">{data.eyebrow ?? 'High-Quality LED Signage Components'}</div>
          <h1>
            {data.headline ? (
              <Lines text={data.headline} />
            ) : (
              <>
                Innovative signage
                <br />
                for the digital age.
              </>
            )}
          </h1>
          <p className="lead">
            {data.lead ?? (
              <>
                LED <b>modules, drivers, controllers and accessories</b> — engineered for sign-makers,
                backed by free layout design and shipped fast.
              </>
            )}
          </p>
          <div className="v4-chips">
            <span className="v4-chip">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7.5v5l3.2 2" />
              </svg>{' '}
              Free LED layout design
            </span>
            <RegionShippingChip />
            <span className="v4-chip cert-chip">
              <Image src="/assets/images/certs/ce.png" alt="CE" width={25} height={20} priority />
              <Image src="/assets/images/certs/ul.png" alt="UL" width={20} height={20} priority />
              {/* props match the file's true 528×300 ratio (44:25 = 1.76) so
                  Next's aspect-ratio check passes; CSS sizes it to 20px tall */}
              <Image src="/assets/images/certs/rohs.png" alt="RoHS" width={44} height={25} priority />
              <Image src="/assets/images/certs/tuv.png" alt="TÜV" width={20} height={20} priority />
            </span>
          </div>
          <div className="v4-cta-row">
            <Link className="v4-btn v4-btn-primary" href={data.primary_url ?? '/products'}>
              {data.primary_label ?? 'Explore signage modules'} <ArrowRight />
            </Link>
            <Link className="v4-btn v4-btn-ghost" href={data.ghost_url ?? '/free-layout-design'}>
              {data.ghost_label ?? 'Get free layout design'}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
