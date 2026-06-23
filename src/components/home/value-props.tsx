const PROPS = [
  {
    t: 'Customized Solutions',
    d: 'We transform your ideas into tailored LED layouts, designed to meet your specific needs.',
    icon: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </>
    ),
  },
  {
    t: 'Trusted Partnerships',
    d: 'Collaborating with sign-makers and integrators to deliver reliable lighting on every project.',
    icon: (
      <>
        <path d="M12 3l7.5 2.8v5.4c0 4.6-3.2 7.4-7.5 8.3-4.3-.9-7.5-3.7-7.5-8.3V5.8z" />
        <path d="M8.8 12l2.2 2.2 4.2-4.2" />
      </>
    ),
  },
  {
    t: 'Free LED Layout Design',
    d: 'Submit your requirements and receive a complimentary LED layout from our engineering team.',
    icon: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </>
    ),
  },
  {
    t: 'Efficient Delivery',
    d: 'We prioritise quick processing and shipping to keep your projects on schedule.',
    icon: (
      <>
        <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" />
        <circle cx="7" cy="17" r="2" />
        <circle cx="17" cy="17" r="2" />
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
