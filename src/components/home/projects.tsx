import Image from 'next/image'
import Link from 'next/link'
import { getProjects } from '@/lib/projects'

export async function Projects() {
  const { docs } = await getProjects({ limit: 4 })

  // Zero-content state — homepage stays clean until case studies are published.
  if (docs.length === 0) return null

  return (
    <section className="proj-section">
      <div className="proj-head">
        <h2 className="proj-heading">Proven in real-world projects</h2>
      </div>
      <div className="proj-grid">
        {docs.map((p) => {
          const cover = typeof p.cover === 'string' ? p.cover : p.cover?.url
          return (
            <Link key={p.id} href={`/projects/${p.slug}`} className="proj-card">
              <div className="proj-img">
                {cover && (
                  <Image
                    src={cover}
                    alt={p.title}
                    fill
                    sizes="(min-width: 1100px) 25vw, (min-width: 540px) 50vw, 100vw"
                  />
                )}
              </div>
              <div className="proj-body">
                <div className="proj-name">{p.title}</div>
                <div className="proj-desc">{p.excerpt}</div>
                <div className="proj-cta">
                  View case <span>→</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
