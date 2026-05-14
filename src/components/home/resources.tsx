import Link from 'next/link'

const RESOURCES = [
  {
    name: 'Product Catalog',
    desc: 'Explore our complete product portfolio.',
    cta: 'Download PDF',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <path d="M14 3v6h6" />
        <path d="M9 13h6M9 17h4" />
      </svg>
    ),
  },
  {
    name: 'Specification Sheets',
    desc: 'Detailed specs for every product series.',
    cta: 'Download PDF',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <path d="M14 3v6h6" />
        <path d="M8 12h8M8 16h8M8 8h2" />
      </svg>
    ),
  },
  {
    name: 'Installation Guides',
    desc: 'Step-by-step guides for quick & easy installation.',
    cta: 'Download PDF',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M14.7 6.3a4 4 0 0 1-5.66 5.66L4 17v3h3l5.04-5.04a4 4 0 0 1 5.66-5.66l-2.83 2.83-2.83-2.83 2.83-2.83z" />
      </svg>
    ),
  },
  {
    name: 'IES Files',
    desc: 'Photometric data for lighting calculations.',
    cta: 'Download ZIP',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M21 8v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8" />
        <path d="M1 3h22v5H1z" />
        <path d="M10 12h4" />
      </svg>
    ),
  },
]

export function Resources() {
  return (
    <section className="res-section" id="support">
      <div className="res-head">
        <h2 className="res-heading">Tools &amp; Resources</h2>
      </div>
      <div className="res-grid">
        {RESOURCES.map((r) => (
          <Link key={r.name} href="/support/resources" className="res-card">
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
