/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { ArrowRight } from './icons'

const STEPS = [
  { n: '1', h: 'Send your drawing', p: 'Elevation, sign face or facade plan — any common format.' },
  { n: '2', h: 'We engineer the layout', p: 'Module spacing, driver sizing and a brightness plan.' },
  { n: '3', h: 'You get a spec + BOM', p: 'A buildable layout and parts list, routed to your distributor.' },
]

export function FreeLayout() {
  return (
    <section className="v4-layout">
      <div className="v4-wrap">
        <div className="grid">
          <div className="pic">
            <img src="/assets/images/app-mini-wayfinding.jpg" alt="ENVO engineered signage layout in situ" />
          </div>
          <div>
            <div className="v4-eyebrow">Free engineering service</div>
            <h2>Free layout design.</h2>
            <p className="lead">
              <b style={{ color: 'var(--v4-ink)' }}>
                Get module spacing, driver sizing and a BOM — from your drawing.
              </b>{' '}
              Send an elevation or sign face; our engineers return a buildable layout. No commitment.
            </p>
            <div className="v4-steps">
              {STEPS.map((s) => (
                <div className="v4-step" key={s.n}>
                  <div className="n">{s.n}</div>
                  <div>
                    <h3>{s.h}</h3>
                    <p>{s.p}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link className="v4-btn v4-btn-primary" href="/free-layout-design">
              Get free layout design <ArrowRight />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
