import Image from 'next/image'
import Link from 'next/link'
import { SOLUTIONS } from '@/data/solutions'

export function Solutions() {
  return (
    <section className="sol-section">
      <div className="sol-head">
        <h2 className="sol-heading">Solutions for every application</h2>
      </div>
      <div className="sol-grid">
        {SOLUTIONS.map((s) => (
          <Link key={s.slug} href={s.href} className="sol-card">
            <div className="sol-card-img">
              <Image
                src={s.img}
                alt={s.name}
                fill
                sizes="(min-width: 700px) 50vw, 100vw"
              />
            </div>
            <div className="sol-card-body">
              <div className="sol-name">{s.name}</div>
              <div className="sol-desc">{s.shortDesc}</div>
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
