import Link from 'next/link'

const STATS = [
  {
    label: '10+ Years of Innovation',
    desc: 'Focused on LED technology and lighting excellence.',
    icon: (
      <svg className="impact-stat-icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <ellipse cx="12" cy="12" rx="10" ry="4" />
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
      </svg>
    ),
  },
  {
    label: 'Global Presence',
    desc: 'Trusted by partners in 60+ countries worldwide.',
    icon: (
      <svg className="impact-stat-icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </svg>
    ),
  },
  {
    label: 'Quality Assurance',
    desc: 'Rigorous testing and international certifications.',
    icon: (
      <svg className="impact-stat-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    label: 'Expert Support',
    desc: 'Engineering, design, and after-sales support, every step of the way.',
    icon: (
      <svg className="impact-stat-icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        <path d="M15 21v-1a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3v1" />
      </svg>
    ),
  },
]

export function Impact() {
  return (
    <section className="impact-section">
      <div className="impact-grid">
        <div className="impact-heading-col">
          <h2 className="impact-heading">
            Lighting systems
            <br />
            engineered for impact.
          </h2>
          <p className="impact-desc">
            From concept to installation, ENVO delivers high-performance LED solutions with expert
            support at every stage.
          </p>
          <Link href="/solutions" className="impact-link">
            Discover our solutions <span>→</span>
          </Link>
        </div>

        <div className="impact-image">
          <img
            src="/assets/images/hero-image.jpg"
            alt="ENVO LED facade installation — modular blue light grid"
          />
        </div>

        <div className="impact-stats">
          {STATS.map((stat) => (
            <div key={stat.label}>
              {stat.icon}
              <div className="impact-stat-label">{stat.label}</div>
              <div className="impact-stat-desc">{stat.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
