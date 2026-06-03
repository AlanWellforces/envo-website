/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { ArrowRight } from './icons'

const GUIDES = [
  { img: '/assets/images/app-mini-thin-lightbox.jpg', alt: 'Slim LED light box signage', h: 'Understanding IP ratings for outdoor signage', p: 'What IP65 / IP67 mean for facade and exterior builds.' },
  { img: '/assets/images/ind-retail.jpg', alt: 'Retail storefront signage at dusk', h: 'Choosing CCT for storefront brand colour', p: 'How colour temperature changes how a sign reads.' },
  { img: '/assets/images/ind-architectural.jpg', alt: 'Large architectural facade lighting', h: 'Sizing drivers for long module runs', p: 'Avoid voltage drop and hot-spots on large facades.' },
]

export function Guides() {
  return (
    <section className="v4-guides">
      <div className="v4-wrap">
        <div className="v4-sec-head">
          <div>
            <div className="v4-eyebrow">Bright ideas by ENVO</div>
            <h2>Guides & industry notes.</h2>
          </div>
          <Link className="v4-seelink" href="/blog">
            View all guides <ArrowRight />
          </Link>
        </div>
        <div className="v4-guide-grid">
          {GUIDES.map((g) => (
            <Link className="v4-guide" href="/blog" key={g.h}>
              <div className="ph">
                <img src={g.img} alt={g.alt} />
              </div>
              <div className="gb">
                <h3>{g.h}</h3>
                <p>{g.p}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
