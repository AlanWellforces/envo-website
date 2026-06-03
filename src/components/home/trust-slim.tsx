/* eslint-disable @next/next/no-img-element */

const CERTS = [
  { src: '/assets/images/certs/ce.png', alt: 'CE certified' },
  { src: '/assets/images/certs/ul.png', alt: 'UL listed' },
  { src: '/assets/images/certs/rohs.png', alt: 'RoHS compliant' },
  { src: '/assets/images/certs/tuv.png', alt: 'TÜV certified' },
]

export function TrustSlim() {
  return (
    <section className="v4-trust2">
      <div className="v4-wrap">
        <div className="row">
          <div className="promise">
            <div className="ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l7.5 2.8v5.4c0 4.6-3.2 7.4-7.5 8.3-4.3-.9-7.5-3.7-7.5-8.3V5.8z" />
                <path d="M8.8 12l2.2 2.2 4.2-4.2" />
              </svg>
            </div>
            <p>
              <b>Built in-house, tested to international standards.</b> Every ENVO system ships
              certified and QA-checked.
            </p>
          </div>
          <div className="logos">
            {CERTS.map((c) => (
              <img src={c.src} alt={c.alt} key={c.src} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
