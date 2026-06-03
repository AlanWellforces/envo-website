/* eslint-disable @next/next/no-img-element */
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
          <div className="v4-eyebrow">Engineered Illumination</div>
          <h1>
            Light that
            <br />
            performs.
          </h1>
          <p className="lead">
            Professional LED systems for <b>signage, facades, drivers and control</b> — engineered,
            certified, and supported end to end.
          </p>
          <div className="v4-chips">
            <span className="v4-chip">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7.5v5l3.2 2" />
              </svg>{' '}
              10+ years manufacturing
            </span>
            <span className="v4-chip">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3c2.6 2.8 2.6 15.2 0 18M12 3c-2.6 2.8-2.6 15.2 0 18" />
              </svg>{' '}
              60+ countries shipped
            </span>
            <span className="v4-chip">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l7.5 2.8v5.4c0 4.6-3.2 7.4-7.5 8.3-4.3-.9-7.5-3.7-7.5-8.3V5.8z" />
                <path d="M8.8 12l2.2 2.2 4.2-4.2" />
              </svg>{' '}
              CE · UL · RoHS · TÜV
            </span>
          </div>
          <div className="v4-cta-row">
            <Link className="v4-btn v4-btn-primary" href="/find-your-match">
              Find your match <ArrowRight />
            </Link>
            <Link className="v4-btn v4-btn-ghost" href="/free-layout-design">
              Get free layout design
            </Link>
          </div>
        </div>
        <div className="v4-quick">
          <div className="v4-quick-label">Or browse the catalogue</div>
          <div className="v4-quick-grid">
            <Link className="v4-ql" href="/products/led-signage-modules">
              <img src="/assets/images/cat-modules.png" alt="LED signage modules" />
              <span>Signage Modules</span>
            </Link>
            <Link className="v4-ql" href="/products/led-drivers">
              <img src="/assets/images/cat-drivers-line.png" alt="LED drivers" />
              <span>LED Drivers</span>
            </Link>
            <Link className="v4-ql" href="/products/control-gear">
              <img src="/assets/images/cat-controllers-line.png" alt="LED control gear" />
              <span>Control Gear</span>
            </Link>
            <Link className="v4-ql" href="/products/accessories">
              <img src="/assets/images/cat-sensors-line.png" alt="Signage accessories" />
              <span>Accessories</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
