import Image from 'next/image'
import Link from 'next/link'
import { PROJECTS } from '@/data/projects'

export function Projects() {
  return (
    <section className="proj-section">
      <div className="proj-head">
        <h2 className="proj-heading">Proven in real-world projects</h2>
      </div>
      <div className="proj-grid">
        {PROJECTS.map((p) => (
          <Link key={p.slug} href="/projects" className="proj-card">
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
