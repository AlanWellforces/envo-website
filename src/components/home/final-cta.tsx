import { EnvoButton } from '@/components/ui/envo-button'

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
          <EnvoButton href="/find-your-match" variant="primary" arrow>
            Find your match
          </EnvoButton>
          <EnvoButton href="/contact" variant="ghost">
            Contact engineering
          </EnvoButton>
        </div>
      </div>
    </section>
  )
}
