import Image from 'next/image'
import Link from 'next/link'
import type { HomeStatsData } from '@/lib/home-page'

const DEFAULT_DATA: HomeStatsData = {
  heading: 'Lighting systems engineered for impact.',
  description: 'From concept to installation, ENVO delivers high-performance LED solutions with expert support at every stage.',
  cta_label: 'Discover our solutions',
  cta_url: '/solutions',
  items: [
    { label: '10+ Years of Innovation', desc: 'Focused on LED technology and lighting excellence.' },
    { label: 'Global Presence',         desc: 'Trusted by partners in 60+ countries worldwide.' },
    { label: 'Quality Assurance',       desc: 'Rigorous testing and international certifications.' },
    { label: 'Expert Support',          desc: 'Engineering, design, and after-sales support, every step of the way.' },
  ],
}

const STAT_ICONS = [
  <svg key={0} className="impact-stat-icon" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <ellipse cx="12" cy="12" rx="10" ry="4" />
    <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
    <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
  </svg>,
  <svg key={1} className="impact-stat-icon" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </svg>,
  <svg key={2} className="impact-stat-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>,
  <svg key={3} className="impact-stat-icon" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="9" cy="8" r="3" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
    <path d="M15 21v-1a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3v1" />
  </svg>,
]

export function Impact({ data }: { data?: HomeStatsData | null }) {
  const d = data ?? DEFAULT_DATA
  const items = d.items.length > 0 ? d.items : DEFAULT_DATA.items
  return (
    <section className="impact-section">
      <div className="impact-grid">
        <div className="impact-heading-col">
          <h2 className="impact-heading">{d.heading}</h2>
          <p className="impact-desc">{d.description}</p>
          <Link href={d.cta_url} className="impact-link">
            {d.cta_label} <span>→</span>
          </Link>
        </div>

        <div className="impact-image">
          <Image
            src="/assets/images/hero-image.jpg"
            alt="ENVO LED facade installation — modular blue light grid"
            fill
            sizes="(min-width: 1280px) 30vw, (min-width: 880px) 50vw, 100vw"
          />
        </div>

        <div className="impact-stats">
          {items.map((item, i) => (
            <div key={i}>
              {STAT_ICONS[i]}
              <div className="impact-stat-label">{item.label}</div>
              <div className="impact-stat-desc">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
