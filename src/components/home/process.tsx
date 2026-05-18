import Link from 'next/link'

const STEPS = [
  {
    num: '01',
    name: 'Share Your Project',
    desc: 'Send us drawings, ideas, or reference photos.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M9 7h6M9 11h6M9 15h3" />
        <path d="M16 17l2 2 3-3" />
      </svg>
    ),
  },
  {
    num: '02',
    name: 'Layout & Proposal',
    desc: 'Our engineers create a custom layout & proposal.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 10h18M9 4v16" />
      </svg>
    ),
  },
  {
    num: '03',
    name: 'Solution & Quote',
    desc: 'We provide the right products and a detailed quotation.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <path d="M14 3v6h6" />
        <path d="M9 14l2 2 4-4" />
      </svg>
    ),
  },
  {
    num: '04',
    name: 'Support All the Way',
    desc: 'We support you from order to installation and beyond.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 14v-3a9 9 0 0 1 18 0v3" />
        <path d="M21 14v4a2 2 0 0 1-2 2h-1v-6h3z" />
        <path d="M3 14v4a2 2 0 0 0 2 2h1v-6H3z" />
      </svg>
    ),
  },
]

export function Process() {
  return (
    <section className="proc-section">
      <div className="proc-head">
        <h2 className="proc-heading">Free Layout Design &amp; Expert Support</h2>
        <Link href="/free-layout-design" className="proc-cta">
          Get free layout design <span>→</span>
        </Link>
      </div>
      <div className="proc-grid">
        {STEPS.map((s) => (
          <div key={s.num} className="proc-step">
            <div className="proc-num">{s.num}</div>
            <div className="proc-icon-wrap">{s.icon}</div>
            <div className="proc-name">{s.name}</div>
            <div className="proc-desc">{s.desc}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
