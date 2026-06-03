/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { ArrowRight } from './icons'

const APPS = [
  { img: '/assets/images/app-mini-channel-letters.jpg', alt: 'Illuminated channel-letter signage at night', h: 'Signage', p: 'Channel letters, light boxes & halo-lit builds.' },
  { img: '/assets/images/ind-architectural.jpg', alt: 'LED-lit architectural building facade', h: 'Architectural Facades', p: 'Even illumination across large surfaces.' },
  { img: '/assets/images/ind-retail.jpg', alt: 'Retail storefront with brand signage lighting', h: 'Retail & Hospitality', p: 'Brand-true colour for storefronts.' },
  { img: '/assets/images/ind-commercial.jpg', alt: 'Commercial signage with lighting control system', h: 'Control Systems', p: 'Dimming, Zigbee & RGB for whole installs.' },
]

export function Apps() {
  return (
    <section className="v4-apps">
      <div className="v4-wrap">
        <div className="v4-sec-head">
          <div>
            <div className="v4-eyebrow">Start from your application</div>
            <h2>Solutions for how the light is used.</h2>
          </div>
          <Link className="v4-seelink" href="/solutions">
            All solutions <ArrowRight />
          </Link>
        </div>
        <div className="v4-app-grid">
          {APPS.map((a) => (
            <Link className="v4-app" href="/solutions" key={a.h}>
              <img src={a.img} alt={a.alt} />
              <div className="body">
                <h3>{a.h}</h3>
                <p>{a.p}</p>
                <span className="go">
                  Explore <ArrowRight />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
