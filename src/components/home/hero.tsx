'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'

const PRODUCTS = [
  {
    href: '/products/led-signage-modules',
    name: 'Signage Module',
    desc: 'Consistent brightness. Built to last.',
    cta: 'Explore Modules',
    img: '/assets/images/cat-modules.png',
  },
  {
    href: '/products/led-drivers',
    name: 'LED Driver',
    desc: 'Stable power. Maximum efficiency.',
    cta: 'Explore Drivers',
    img: '/assets/images/cat-drivers.png',
  },
  {
    href: '/products/control-gear',
    name: 'Control Gear',
    desc: 'Intelligent control. Seamless integration.',
    cta: 'Explore Control Gear',
    img: '/assets/images/cat-controllers.png',
  },
  {
    href: '/products/accessories',
    name: 'Accessories',
    desc: 'Complete the system. Every detail matters.',
    cta: 'Explore Accessories',
    img: '/assets/images/cat-sensors.png',
  },
]

export function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const showReady = () => video.classList.add('ready')
    const onError = () => {
      video.style.display = 'none'
    }

    video.addEventListener('playing', showReady)
    video.addEventListener('loadeddata', showReady)
    video.addEventListener('error', onError)

    video.play().catch(() => {
      // autoplay blocked by browser — fall through, the static dark
      // bg from body still shows through.
    })

    return () => {
      video.removeEventListener('playing', showReady)
      video.removeEventListener('loadeddata', showReady)
      video.removeEventListener('error', onError)
    }
  }, [])

  return (
    <section className="hero">
      <video
        ref={videoRef}
        className="hero-bg-video"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        <source src="/assets/videos/hero-led-night.mp4" type="video/mp4" />
      </video>
      <div className="diamond-bg" aria-hidden="true" />

      <div className="container hero-inner">
        <div className="hero-eyebrow">Engineered Illumination</div>
        <h1>
          Light that <em>performs.</em>
        </h1>
        <p className="hero-sub">
          ENVO designs and manufactures professional grade LED lighting systems that power signage
          and architectural illumination worldwide.
        </p>

        <div className="hero-features">
          <div className="hero-feature">
            <svg className="hero-feature-icon" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="5" />
              <circle cx="12" cy="12" r="1.5" />
            </svg>
            <div className="hero-feature-text">
              <span className="hero-feature-label">Tailored Solutions</span>
              <span className="hero-feature-desc">Built around your project needs</span>
            </div>
          </div>
          <div className="hero-feature">
            <svg className="hero-feature-icon" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4" />
            </svg>
            <div className="hero-feature-text">
              <span className="hero-feature-label">Smart Lighting Control</span>
              <span className="hero-feature-desc">Flexible, reliable, and future ready</span>
            </div>
          </div>
          <div className="hero-feature">
            <svg className="hero-feature-icon" viewBox="0 0 24 24">
              <path d="M3 10h13l3 4v3h-2" />
              <circle cx="7.5" cy="17" r="2" />
              <circle cx="16.5" cy="17" r="2" />
              <path d="M3 10v7h2.5" />
            </svg>
            <div className="hero-feature-text">
              <span className="hero-feature-label">Reliable Delivery</span>
              <span className="hero-feature-desc">Global supply. Consistent quality</span>
            </div>
          </div>
        </div>
      </div>

      <div className="hero-right">
        <div className="hero-product-grid">
          {PRODUCTS.map((p) => (
            <Link key={p.href} href={p.href} className="hero-product-card">
              <div className="hpc-body">
                <div className="hpc-name">{p.name}</div>
                <div className="hpc-desc">{p.desc}</div>
                <div className="hpc-link">
                  {p.cta} <span>→</span>
                </div>
              </div>
              <div className="hpc-img">
                <img src={p.img} alt={p.name} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
