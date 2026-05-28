import { EnvoButton } from '@/components/ui/envo-button'
import type { HomeCtaData } from '@/lib/home-page'

const DEFAULTS: HomeCtaData = {
  heading: 'Ready to engineer your next project?',
  body: 'Find your match in 60 seconds, or talk to an engineer.',
  primary_label: 'Find your match',
  primary_url: '/find-your-match',
  secondary_label: 'Contact engineering',
  secondary_url: '/contact',
}

export function FinalCta({ data }: { data?: HomeCtaData | null }) {
  const d = data ?? DEFAULTS
  return (
    <section className="final-cta">
      <div className="diamond-bg" aria-hidden="true" />
      <div className="container reveal">
        <h2>{d.heading}</h2>
        <p>{d.body}</p>
        <div className="final-cta-actions">
          <EnvoButton href={d.primary_url} variant="primary" arrow>
            {d.primary_label}
          </EnvoButton>
          <EnvoButton href={d.secondary_url} variant="ghost">
            {d.secondary_label}
          </EnvoButton>
        </div>
      </div>
    </section>
  )
}
