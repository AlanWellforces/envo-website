/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { ArrowRight } from './icons'

const BADGES = ['Commissioned on schedule', 'Uniform brightness, full facade', 'No hot spots']
const USED = [
  { label: 'UltraFlare modules', href: '/products' },
  { label: 'OptiLume 24V modules', href: '/products' },
  { label: 'Outdoor IP67 driver', href: '/products' },
  { label: 'Zigbee controller', href: '/products' },
]
const MINI = [
  { img: '/assets/images/app-mini-pylon-monument.jpg', alt: 'Pylon and monument signage installation', label: 'Pylon & monument signage' },
  { img: '/assets/images/app-mini-hospitality-facade.jpg', alt: 'Hospitality venue illuminated facade', label: 'Hospitality facade' },
]

export function FeaturedProject() {
  return (
    <section className="v4-action">
      <div className="v4-wrap">
        <div className="v4-sec-head">
          <div>
            <div className="v4-eyebrow">ENVO in action</div>
            <h2>Specified. Installed. Still performing.</h2>
          </div>
          <Link className="v4-seelink" href="/projects">
            All projects <ArrowRight />
          </Link>
        </div>
        <div className="v4-case">
          <div className="pic">
            <img src="/assets/images/featured-project.jpg" alt="ENVO-lit retail facade at night" />
          </div>
          <div className="info">
            <div className="tag">Retail facade · Featured</div>
            <h3>A landmark frontage, lit to spec.</h3>
            <p>
              ENVO modules and drivers delivered uniform brightness across a full retail facade —
              commissioned on schedule and still running to spec.
            </p>
            <div className="v4-badges">
              {BADGES.map((b) => (
                <span key={b}>{b}</span>
              ))}
            </div>
            <div className="v4-used">
              <div className="lbl">Products used</div>
              <div className="row">
                {USED.map((u) => (
                  <Link href={u.href} key={u.label}>
                    {u.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="v4-mini-cases">
          {MINI.map((m) => (
            <Link className="v4-mini" href="/projects" key={m.label}>
              <img src={m.img} alt={m.alt} />
              <span>{m.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
