import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from './icons'

const SERIES = [
  { name: 'Mini Series', model: 'MiniLux', desc: 'Compact backlit modules for small letters and intricate detail.', scene: 'app-mini-channel-letters.jpg' },
  { name: 'Eco Series', model: 'EcoGlo', desc: 'Cost-effective backlit modules for everyday signage.', scene: 'app-mini-thin-lightbox.jpg' },
  { name: 'Pro Series', model: 'UltraFlare', desc: 'High-output backlit modules for large, deep faces.', scene: 'app-mini-hospitality-facade.jpg' },
  { name: 'RGB Series', model: 'ChromaFlux', desc: 'RGBW colour-changing modules for dynamic signs.', scene: 'app-mini-hero-twilight.jpg' },
  { name: '24V Series', model: 'OptiLume', desc: 'Long single runs with fewer injection points.', scene: 'app-mini-pylon-monument.jpg' },
  { name: 'Sidelit', model: 'EdgeLume', desc: 'Edge-lit single-LED modules for slim faces.', scene: 'app-mini-outline-trim.jpg' },
]

export function SignageRange() {
  return (
    <section className="sersec grad">
      <div className="glow" />
      <div className="v4-wrap">
        <div className="v4-sec-head">
          <div>
            <div className="v4-eyebrow">Explore the signage module range</div>
            <h2>Six series, one fit for every face.</h2>
          </div>
          <Link className="v4-seelink" href="/products">
            View full catalogue <ArrowRight />
          </Link>
        </div>
        <div className="sgrid">
          {SERIES.map((s) => (
            <Link className="scard" href="/products/led-signage-modules" key={s.name}>
              <div className="ph">
                <Image
                  src={`/assets/images/${s.scene}`}
                  alt={`${s.name} application`}
                  fill
                  sizes="(min-width: 981px) 33vw, 100vw"
                />
                <span className="ov" />
                <span className="model">{s.model}</span>
              </div>
              <div className="sb">
                <h3>{s.name}</h3>
                <p>{s.desc}</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="sfeat-grid">
          <Link className="sfeat" href="/products/led-drivers">
            <div className="eb">Super-slim &amp; ultra-thin drivers</div>
            <h3>Drivers that sit behind the extrusion.</h3>
            <p>
              Super-slim linear supplies for narrow or tight spots — tuck them behind channels and
              profiles, out of sight.
            </p>
            <span className="go">
              View LED drivers <ArrowRight />
            </span>
          </Link>
          <Link className="sfeat" href="/products/control-gear">
            <div className="eb">Smart lighting · ZigBee</div>
            <h3>Seamless control, wide compatibility.</h3>
            <p>
              ZigBee smart control gear for energy-efficient scenes — integrating with the systems
              you already run.
            </p>
            <span className="go">
              Explore smart control gear <ArrowRight />
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}
