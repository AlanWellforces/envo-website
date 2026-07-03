// Brand capability band under the home hero — a statement line plus four
// capability blocks (no step numbers; this is a manifesto, not a process).
// Copy rules: verified facts only — no invented stats, no response-time
// promises (see the 2026-07-02 content audit).
const DARK = false

const PROPS = [
  {
    t: 'Engineered Product System',
    d: 'LED modules, drivers and control gear designed to work together across signage and architectural applications.',
    icon: (
      <>
        <polygon points="12,2 22,8 12,14 2,8" />
        <polyline points="2,12 12,18 22,12" />
        <polyline points="2,16 12,22 22,16" />
      </>
    ),
  },
  {
    t: 'Certified Range',
    d: 'CE, UL, RoHS and TÜV options support professional specifications and compliance reviews.',
    icon: (
      <>
        <path d="M12 3l7.5 2.8v5.4c0 4.6-3.2 7.4-7.5 8.3-4.3-.9-7.5-3.7-7.5-8.3V5.8z" />
        <path d="M8.8 12l2.2 2.2 4.2-4.2" />
      </>
    ),
  },
  {
    t: 'Application Support',
    d: 'Guidance for module spacing, driver sizing and product selection helps teams specify with confidence.',
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <polygon points="14.8,9.2 13,13 9.2,14.8 11,11" />
      </>
    ),
  },
  {
    t: 'Distributor-backed Availability',
    d: 'Authorised regional partners help customers source ENVO components for local projects.',
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.6 2.8 2.6 15.2 0 18M12 3c-2.6 2.8-2.6 15.2 0 18" />
      </>
    ),
  },
]

export function ValueProps() {
  return (
    <section className={DARK ? 'va va-dark' : 'va'}>
      <div className="v4-wrap">
        <p className="va-statement">
          Modules<span>.</span> Drivers<span>.</span> Controls<span>.</span> Support<span>.</span>
        </p>
        <div className="va-grid">
          {PROPS.map((p) => (
            <div className="va-item" key={p.t}>
              <h3>
                <span className="va-ic">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {p.icon}
                  </svg>
                </span>
                {p.t}
              </h3>
              <p>{p.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
