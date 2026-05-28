import type { HomeQuoteData } from '@/lib/home-page'

const DEFAULTS: HomeQuoteData = {
  text: "Same colour binning across two phases of the same facade — that's spec'd quality.",
  author_role: 'Lead Architect',
  author_location: 'Auckland CBD installation',
}

export function Quote({ data }: { data?: HomeQuoteData | null }) {
  const d = data ?? DEFAULTS
  return (
    <section className="quote-section">
      <div className="container reveal">
        <blockquote>&ldquo;{d.text}&rdquo;</blockquote>
        <div className="quote-attribution">
          <strong>{d.author_role}</strong> · {d.author_location}
        </div>
      </div>
    </section>
  )
}
