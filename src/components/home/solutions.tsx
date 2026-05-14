import Link from 'next/link'

const SOLUTIONS = [
  {
    href: '/solutions/signage-lighting',
    name: 'Signage Lighting',
    desc: 'High-performance solutions for channel letters, light boxes, and edge-lit signage.',
    img: '/assets/images/ind-retail.jpg',
  },
  {
    href: '/solutions/architectural-lighting',
    name: 'Architectural Lighting',
    desc: 'Accent, linear, facade, step, and landscape architectural lighting for LED systems.',
    img: '/assets/images/ind-architectural.jpg',
  },
]

export function Solutions() {
  return (
    <section className="sol-section" id="solutions">
      <div className="sol-head">
        <h2 className="sol-heading">Solutions for every application</h2>
      </div>
      <div className="sol-grid">
        {SOLUTIONS.map((s) => (
          <Link key={s.href} href={s.href} className="sol-card">
            <div className="sol-card-img">
              <img src={s.img} alt={s.name} />
            </div>
            <div className="sol-card-body">
              <div className="sol-name">{s.name}</div>
              <div className="sol-desc">{s.desc}</div>
              <div className="sol-cta">
                Explore solutions <span>→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
