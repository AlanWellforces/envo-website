import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from './icons'

export function Hero() {
  return (
    <section className="v4-hero">
      <video
        className="v4-hero-bg"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/assets/images/hero-signage-poster.jpg"
      >
        <source src="/assets/videos/hero-signage.mp4" type="video/mp4" />
      </video>
      <div className="v4-wrap">
        <div className="v4-hero-col">
          <div className="v4-eyebrow">High-Quality LED Signage Components</div>
          <h1>
            Innovative signage
            <br />
            for the digital age.
          </h1>
          <p className="lead">
            LED <b>modules, drivers, controllers and accessories</b> — engineered for sign-makers,
            backed by free layout design and shipped fast.
          </p>
          <div className="v4-chips">
            <span className="v4-chip">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7.5v5l3.2 2" />
              </svg>{' '}
              Free LED layout design
            </span>
            <span className="v4-chip">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3c2.6 2.8 2.6 15.2 0 18M12 3c-2.6 2.8-2.6 15.2 0 18" />
              </svg>{' '}
              Ships fast, US-stocked
            </span>
            <span className="v4-chip cert-chip">
              <Image src="/assets/images/certs/ce.png" alt="CE" width={25} height={20} priority />
              <Image src="/assets/images/certs/ul.png" alt="UL" width={20} height={20} priority />
              <Image src="/assets/images/certs/rohs.png" alt="RoHS" width={35} height={20} priority />
              <Image src="/assets/images/certs/tuv.png" alt="TÜV" width={20} height={20} priority />
            </span>
          </div>
          <div className="v4-cta-row">
            <Link className="v4-btn v4-btn-primary" href="/products">
              Explore signage modules <ArrowRight />
            </Link>
            <Link className="v4-btn v4-btn-ghost" href="/free-layout-design">
              Get free layout design
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
