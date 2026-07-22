import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from './icons'

// Feature-plus-stack layout: Signage Modules is the hero card (full scene
// photo, text over its flat left area), the other visible families stack
// beside it. Scene images live in public/assets/images/home-categories/ and carry
// their own studio background, so the cards blend seamlessly.
const SIDE_CATEGORIES = [
  {
    name: 'LED Drivers',
    img: '/assets/images/home-categories/led-drivers-scene.png',
    href: '/products/led-drivers',
    desc: 'Power supplies matched to ENVO module loads.',
  },
  {
    name: 'Control Gear',
    img: '/assets/images/home-categories/control-gear-scene.png',
    href: '/products/control-gear',
    desc: 'Receivers, sensors and smart controllers for dynamic lighting.',
  },
  // Accessories hidden until it has live products — see
  // docs/superpowers/plans/2026-07-08-hidden-features.md
  // {
  //   name: 'Accessories',
  //   img: '/assets/images/home-categories/accessories-scene.png',
  //   href: '/products/accessories',
  //   desc: 'Connectors and cables for clean installations.',
  // },
]

const MODULE_TAGS = ['Mini', 'Eco', 'Pro', 'RGB', '24V', 'Sidelit']

export function ShopByCategory() {
  return (
    <section className="mk-cat">
      <div className="v4-wrap">
        <div className="v4-sec-head">
          <div>
            <div className="v4-eyebrow">Shop by category</div>
            <h2>Everything to build a sign.</h2>
            <p className="lead">
              A matched range of LED modules, drivers and control gear for professional
              signage projects.
            </p>
          </div>
          <Link className="v4-seelink" href="/products">
            View full catalogue <ArrowRight />
          </Link>
        </div>
        <div className="mk-cat-grid">
          <Link className="mk-feature" href="/products/led-signage-modules">
            <Image
              src="/assets/images/home-categories/signage-modules-scene.png"
              alt="ENVO backlit signage modules lighting a channel-letter E"
              width={1556}
              height={1011}
              sizes="(max-width: 980px) 100vw, 56vw"
            />
            <div className="body">
              <h3>Signage Modules</h3>
              <p>Backlit and sidelit modules for channel letters, light boxes and built-up signage.</p>
              <div className="mk-tags">
                {MODULE_TAGS.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
              <span className="explore">
                Explore modules <ArrowRight />
              </span>
            </div>
          </Link>
          <div className="mk-side">
            {SIDE_CATEGORIES.map((c) => (
              <Link className="mk-scard" href={c.href} key={c.name}>
                <div className="cb">
                  <h3>{c.name}</h3>
                  <p>{c.desc}</p>
                  <span className="go">
                    <ArrowRight />
                  </span>
                </div>
                <div className="pic">
                  <Image src={c.img} alt={c.name} width={1192} height={404} sizes="280px" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
