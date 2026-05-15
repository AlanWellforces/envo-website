const BADGES = [
  {
    name: 'CE Compliant',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    name: 'RoHS Compliant',
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12l3 3 5-7" />
      </svg>
    ),
  },
  {
    name: 'FCC Compliant',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M2 12c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10S2 17.5 2 12z" />
        <path d="M7 13l3 3 7-8" />
      </svg>
    ),
  },
  {
    name: 'UKCA Compliant',
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M7 10h10M7 14h6" />
      </svg>
    ),
  },
  {
    name: 'ISO 9001 Certified',
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="9" r="6" />
        <path d="M9 14l-2 7 5-3 5 3-2-7" />
      </svg>
    ),
  },
  {
    name: '5-Year Warranty',
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
]

export function Trust() {
  return (
    <section className="trust-section">
      <div className="trust-head">
        <h2 className="trust-heading">Quality you can rely on</h2>
      </div>
      <div className="trust-grid">
        {BADGES.map((b) => (
          <div key={b.name} className="trust-badge">
            {b.icon}
            <span className="trust-name">{b.name}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
