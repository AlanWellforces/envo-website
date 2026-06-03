/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { ArrowRight } from './icons'

const FAMILIES = [
  { img: '/assets/images/cat-modules.png', alt: 'Signage Modules', h: 'Signage Modules', p: 'LED modules for letters, boxes & facades.' },
  { img: '/assets/images/cat-drivers.png', alt: 'LED Drivers', h: 'LED Drivers', p: 'Stable indoor & IP67 outdoor power supplies.' },
  { img: '/assets/images/cat-controllers.png', alt: 'Control Gear', h: 'Control Gear', p: 'Dimming, Zigbee & RGB control.' },
  { img: '/assets/images/cat-sensors.png', alt: 'Accessories', h: 'Accessories', p: 'Connectors, mounting & sensors.' },
]

export function ProductRange() {
  return (
    <section className="v4-fam">
      <div className="v4-wrap">
        <div className="v4-sec-head">
          <div>
            <div className="v4-eyebrow">The range</div>
            <h2>One system, four families.</h2>
          </div>
          <Link className="v4-seelink" href="/products">
            Full catalogue <ArrowRight />
          </Link>
        </div>
        <div className="v4-fam-grid">
          {FAMILIES.map((f) => (
            <Link className="v4-famcard" href="/products" key={f.h}>
              <div className="ph">
                <img src={f.img} alt={f.alt} />
              </div>
              <div className="fb">
                <h3>{f.h}</h3>
                <p>{f.p}</p>
                <span className="go">
                  View range <ArrowRight />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
