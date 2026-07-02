// Brand capability band under the home hero. Copy rules: verified facts only —
// no invented stats, no response-time promises (see the 2026-07-02 content
// audit). Certifications and family counts must stay true to the live range.
const PROPS = [
  {
    t: 'Engineered Product System',
    d: 'Modules, drivers and control gear designed to work as one system — matched voltages, dimming and mounting across four product families.',
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
    d: 'Certified to international standards — CE, UL and TÜV among them — with the datasheet for every model a click away.',
    icon: (
      <>
        <path d="M12 3l7.5 2.8v5.4c0 4.6-3.2 7.4-7.5 8.3-4.3-.9-7.5-3.7-7.5-8.3V5.8z" />
        <path d="M8.8 12l2.2 2.2 4.2-4.2" />
      </>
    ),
  },
  {
    t: 'Application Support',
    d: 'From product matching to LED layout design, our engineers help you spec the right light for signage and architectural work.',
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <polygon points="14.8,9.2 13,13 9.2,14.8 11,11" />
      </>
    ),
  },
  {
    t: 'Distributor-backed Availability',
    d: 'Stock held with our distribution partners in New Zealand and the United States, so projects source locally in each region.',
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
    <section className="va">
      <div className="v4-wrap">
        <div className="va-grid">
          {PROPS.map((p, i) => (
            <div className="va-item" key={p.t}>
              <div className="va-top">
                <span className="va-ic">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {p.icon}
                  </svg>
                </span>
                <span className="va-num">0{i + 1}</span>
              </div>
              <h3>{p.t}</h3>
              <p>{p.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
