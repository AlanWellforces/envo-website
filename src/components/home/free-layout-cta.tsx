import Link from 'next/link'
import { ArrowRight } from './icons'

export function FreeLayoutCta() {
  return (
    <section className="flB">
      <div className="v4-wrap">
        <div className="panel">
          <div className="glow" />
          <div className="txt">
            <div className="eb">Free service · 24h</div>
            <h2>Get a free layout design for your next project.</h2>
            <p>
              Send us your sign or facade dimensions. We&apos;ll return a wired layout, parts list
              and wattage budget — typically within 24 hours.
            </p>
            <div className="btns">
              <Link className="fl-lime" href="/free-layout-design">
                Get free layout design <ArrowRight />
              </Link>
              <Link className="fl-ghost" href="/products">
                Browse catalogue
              </Link>
            </div>
          </div>
          <div className="vis">
            <div className="sketch">
              <div className="dim dim-w">2400 mm</div>
              <div className="dim dim-h">900 mm</div>
              <div className="ph2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 9h18" />
                </svg>
                <span>your sign outline</span>
              </div>
              <div className="badge">→ wired layout + BOM</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
