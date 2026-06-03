import Link from 'next/link'
import { ArrowRight } from './icons'

export function FinalCta() {
  return (
    <section className="v4-final">
      <div className="v4-wrap">
        <h2>Let&apos;s light your next project.</h2>
        <p className="lead">
          Find the right system in minutes, get a free layout, or talk to an ENVO engineer.
        </p>
        <div className="v4-cta-row">
          <Link className="v4-btn v4-btn-primary" href="/find-your-match">
            Find your match <ArrowRight />
          </Link>
          <Link className="v4-btn v4-btn-secondary" href="/free-layout-design">
            Get free layout design
          </Link>
          <Link className="v4-btn v4-btn-text" href="/contact">
            Talk to engineering <ArrowRight />
          </Link>
        </div>
        <p className="v4-buyline">
          Already specced it? Buy through your regional distributor —{' '}
          <a href="https://wellforces.co.nz" target="_blank" rel="noopener noreferrer">
            Wellforces↗
          </a>{' '}
          <span>·</span>{' '}
          <a href="https://powersupplymall.com" target="_blank" rel="noopener noreferrer">
            PowerSupplyMall↗
          </a>
        </p>
      </div>
    </section>
  )
}
