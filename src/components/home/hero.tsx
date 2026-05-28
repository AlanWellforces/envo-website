'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { PRODUCT_FAMILIES } from '@/data/product-families'
import type { HomeHeroData } from '@/lib/home-page'

const HERO_COPY_DEFAULTS: Record<string, { name: string; desc: string; cta: string }> = {
  'led-signage-modules': { name: 'Signage Module', desc: 'Consistent brightness. Built to last.',           cta: 'Explore Modules' },
  'led-drivers':         { name: 'LED Driver',     desc: 'Stable power. Maximum efficiency.',                cta: 'Explore Drivers' },
  'control-gear':        { name: 'Control Gear',   desc: 'Intelligent control. Seamless integration.',      cta: 'Explore Control Gear' },
  'accessories':         { name: 'Accessories',    desc: 'Complete the system. Every detail matters.',      cta: 'Explore Accessories' },
}

const PRODUCTS = PRODUCT_FAMILIES.filter((f) => HERO_COPY_DEFAULTS[f.slug]).map((f) => ({
  href: f.href,
  img: f.image,
  ...HERO_COPY_DEFAULTS[f.slug],
}))

const DEFAULT_FEATURES = [
  { label: 'Tailored Solutions',      desc: 'Built around your project needs' },
  { label: 'Smart Lighting Control',  desc: 'Flexible, reliable, and future ready' },
  { label: 'Reliable Delivery',       desc: 'Global supply. Consistent quality' },
]

const FEATURE_ICONS = [
  <svg key={0} className="hero-feature-icon" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.5" />
  </svg>,
  <svg key={1} className="hero-feature-icon" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4" />
  </svg>,
  <svg key={2} className="hero-feature-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 10h13l3 4v3h-2" />
    <circle cx="7.5" cy="17" r="2" />
    <circle cx="16.5" cy="17" r="2" />
    <path d="M3 10v7h2.5" />
  </svg>,
]

export function Hero({ data }: { data?: HomeHeroData | null }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const showReady = () => video.classList.add('ready')
    const onError = () => { video.style.display = 'none' }

    video.addEventListener('playing', showReady)
    video.addEventListener('loadeddata', showReady)
    video.addEventListener('error', onError)
    video.play().catch(() => {})

    return () => {
      video.removeEventListener('playing', showReady)
      video.removeEventListener('loadeddata', showReady)
      video.removeEventListener('error', onError)
    }
  }, [])

  const eyebrow    = data?.eyebrow    || 'Engineered Illumination'
  const headline   = data?.headline   || 'Light that performs.'
  const subheading = data?.subheading || 'ENVO designs and manufactures professional grade LED lighting systems that power signage and architectural illumination worldwide.'
  const videoUrl   = data?.video_url  || '/assets/videos/hero-led-night.mp4'
  const features   = (data?.features && data.features.length > 0) ? data.features : DEFAULT_FEATURES

  return (
    <section className="hero">
      <video
        ref={videoRef}
        className="hero-bg-video"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      >
        <source src={videoUrl} type="video/mp4" />
      </video>
      <div className="diamond-bg" aria-hidden="true" />

      <div className="container hero-inner">
        <div className="hero-eyebrow">{eyebrow}</div>
        <h1>{headline}</h1>
        <p className="hero-sub">{subheading}</p>

        <div className="hero-features">
          {features.map((f, i) => (
            <div key={i} className="hero-feature">
              {FEATURE_ICONS[i]}
              <div className="hero-feature-text">
                <span className="hero-feature-label">{f.label}</span>
                <span className="hero-feature-desc">{f.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="hero-right">
        <div className="hero-product-grid">
          {PRODUCTS.map((p) => (
            <Link key={p.href} href={p.href} className="hero-product-card">
              <div className="hpc-body">
                <div className="hpc-name">{p.name}</div>
                <div className="hpc-desc">{p.desc}</div>
                <div className="hpc-link">{p.cta} <span>→</span></div>
              </div>
              <div className="hpc-img">
                <Image
                  src={p.img}
                  alt={p.name}
                  width={400}
                  height={300}
                  sizes="(min-width: 980px) 200px, 30vw"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
