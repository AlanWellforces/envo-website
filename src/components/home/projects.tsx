import Image from 'next/image'
import Link from 'next/link'

const PROJECTS = [
  {
    name: 'Retail Signage',
    desc: 'Global sign solutions with ENVO.',
    img: '/assets/images/ind-retail.jpg',
  },
  {
    name: 'Hotel Facade',
    desc: 'Elegant architectural lighting that stands out.',
    img: '/assets/images/ind-hospitality.jpg',
  },
  {
    name: 'Storefront',
    desc: 'Impactful lighting for premium storefronts.',
    img: '/assets/images/ind-commercial.jpg',
  },
  {
    name: 'Canopy Signage',
    desc: 'High-performance solutions for outdoor excellence.',
    img: '/assets/images/ind-architectural.jpg',
  },
]

export function Projects() {
  return (
    <section className="proj-section" id="projects">
      <div className="proj-head">
        <h2 className="proj-heading">Proven in real-world projects</h2>
      </div>
      <div className="proj-grid">
        {PROJECTS.map((p) => (
          <Link key={p.name} href="/projects" className="proj-card">
            <div className="proj-img">
              <Image
                src={p.img}
                alt={p.name}
                fill
                sizes="(min-width: 1100px) 25vw, (min-width: 540px) 50vw, 100vw"
              />
            </div>
            <div className="proj-body">
              <div className="proj-name">{p.name}</div>
              <div className="proj-desc">{p.desc}</div>
              <div className="proj-cta">
                View case <span>→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
