import Link from 'next/link'

export function FinalCta() {
  return (
    <section className="final-cta">
      <div className="diamond-bg" aria-hidden="true" />
      <div className="container reveal">
        <h2>
          Ready to engineer your <em>next project?</em>
        </h2>
        <p>Find your match in 60 seconds, or talk to an engineer.</p>
        <div className="final-cta-actions">
          <Link href="/find-your-match" className="btn btn-primary">
            Find your match <span className="btn-arrow">→</span>
          </Link>
          <Link href="/contact" className="btn btn-ghost">
            Contact engineering
          </Link>
        </div>
      </div>
    </section>
  )
}
