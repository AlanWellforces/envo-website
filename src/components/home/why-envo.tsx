const PILLARS = [
  {
    t: 'In-house engineering',
    d: 'Binned LEDs, validated thermal design and consistent output batch after batch.',
    icon: (
      <>
        <path d="M14 3v4a1 1 0 0 0 1 1h4" />
        <path d="M5 3h9l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
        <path d="M8 13h8M8 17h5" />
      </>
    ),
  },
  {
    t: 'Fully certified',
    d: 'CE, UL, RoHS and TÜV across the range — specs pass review, installs clear inspection.',
    icon: (
      <>
        <path d="M12 3l7.5 2.8v5.4c0 4.6-3.2 7.4-7.5 8.3-4.3-.9-7.5-3.7-7.5-8.3V5.8z" />
        <path d="M8.8 12l2.2 2.2 4.2-4.2" />
      </>
    ),
  },
  {
    t: 'End-to-end support',
    d: 'Free layout design, wattage calculations and responsive technical help.',
    icon: <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4L3 21l1.1-3.2A8.4 8.4 0 1 1 21 11.5Z" />,
  },
]

// NOTE: these proof numbers are placeholders pending verification — confirm or replace before shipping publicly.
const STATS = [
  { n: '10+', l: 'years manufacturing' },
  { n: '60+', l: 'countries shipped' },
  { n: '5yr', l: 'standard warranty' },
  { n: '48h', l: 'layout turnaround', lime: true },
]

export function WhyEnvo() {
  return (
    <section className="wd">
      <div className="v4-wrap">
        <div className="v4-eyebrow">Why ENVO</div>
        <h2>
          Engineered, certified,
          <br />
          supported.
        </h2>
        <div className="wd-grid">
          {PILLARS.map((p) => (
            <div className="wd-pillar" key={p.t}>
              <div className="wd-ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {p.icon}
                </svg>
              </div>
              <h3>{p.t}</h3>
              <p>{p.d}</p>
            </div>
          ))}
        </div>
        <div className="wd-stats">
          {STATS.map((s) => (
            <div className="wd-stat" key={s.l}>
              <div className={s.lime ? 'num lime' : 'num'}>{s.n}</div>
              <div className="lbl">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
