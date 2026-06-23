/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { ArrowRight } from './icons'

const TILES = [
  { eb: 'Retail · Channel letters', title: 'Harbourview Mall Channel Letters', img: 'app-mini-channel-letters.jpg' },
  { eb: 'Storefront · Light box', title: 'Metro Cafe Storefront Sign', img: 'app-mini-thin-lightbox.jpg' },
  { eb: 'Architectural · Wayfinding', title: 'Pylon & wayfinding signage', img: 'app-mini-wayfinding.jpg' },
]

export function Projects() {
  return (
    <section className="pj">
      <div className="v4-wrap">
        <div className="v4-eyebrow">In the field</div>
        <h2>Signage, lit and installed.</h2>
        <div className="pj-feat">
          <div className="pic">
            <img src="/assets/images/app-mini-hospitality-facade.jpg" alt="Aurora Hotel Facade Wash" />
          </div>
          <div className="info">
            <div className="eb">Hospitality · Facade</div>
            <h3>Aurora Hotel Facade Wash</h3>
            <p>
              Backlit modules and outdoor-rated drivers delivering even brightness across the
              hotel&apos;s street-facing facade — commissioned on schedule and running to spec.
            </p>
            <div className="pj-tags">
              <span>Backlit modules</span>
              <span>Outdoor drivers</span>
            </div>
            <Link className="pj-read" href="/projects">
              Read the case study <ArrowRight />
            </Link>
          </div>
        </div>
        <div className="pj-grid">
          {TILES.map((t) => (
            <Link className="pj-tile" href="/projects" key={t.title}>
              <img src={`/assets/images/${t.img}`} alt={t.title} />
              <span className="ov" />
              <div className="tx">
                <div className="eb">{t.eb}</div>
                <h4>{t.title}</h4>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
