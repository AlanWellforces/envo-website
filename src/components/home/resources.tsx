import Link from 'next/link'
import { RESOURCES } from '@/data/resources'

export function Resources() {
  return (
    <section className="res-section">
      <div className="res-head">
        <h2 className="res-heading">Tools &amp; Resources</h2>
      </div>
      <div className="res-grid">
        {RESOURCES.map((r) => (
          <Link key={r.slug} href={r.href} className="res-card">
            <div className="res-icon">{r.icon}</div>
            <div className="res-name">{r.name}</div>
            <div className="res-desc">{r.desc}</div>
            <div className="res-cta">
              {r.cta} <span>→</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
