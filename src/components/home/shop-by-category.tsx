/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { ArrowRight } from './icons'

const CATEGORIES = [
  {
    name: 'Signage Module',
    img: '/assets/images/cat-modules.png',
    href: '/products/led-signage-modules',
    desc: 'High-uniformity backlit & sidelit LED modules for channel letters, light boxes and built-up signage.',
    tags: ['Mini', 'Eco', 'Pro', 'RGB', '24V', 'Sidelit'],
  },
  {
    name: 'LED Driver',
    img: '/assets/images/cat-drivers.png',
    href: '/products/led-drivers',
    desc: 'Constant-voltage supplies — screw-terminal, super-slim linear and triac-dimmable, indoor and outdoor.',
    tags: ['Screw Terminal', 'Linear', 'Triac Dimmable'],
  },
  {
    name: 'Control Gear',
    img: '/assets/images/cat-controllers.png',
    href: '/products/control-gear',
    desc: 'Remotes, receivers, signal converters, sensors and ZigBee smart controllers for dynamic scenes.',
    tags: ['Remote & Receiver', 'Signal Converter', 'Sensor', 'ZigBee'],
  },
  {
    name: 'Accessories',
    img: '/assets/images/cat-sensors.png',
    href: '/products/accessories',
    desc: 'Connectors and cables that make every install fast, clean and reliable.',
    tags: ['Connector', 'Cable'],
  },
]

export function ShopByCategory() {
  return (
    <section className="mk-cat">
      <div className="v4-wrap">
        <div className="v4-eyebrow">Shop by category</div>
        <h2>Everything to build a sign.</h2>
        <p className="lead">
          High-quality LED modules, drivers, controllers and accessories — engineered to work
          together as one system.
        </p>
        <div className="mk-cat-grid">
          {CATEGORIES.map((c) => (
            <Link className="mk-ccard" href={c.href} key={c.name}>
              <div className="pic">
                <img src={c.img} alt={c.name} />
              </div>
              <div className="cb">
                <div className="ct">
                  <h3>{c.name}</h3>
                  <ArrowRight />
                </div>
                <p>{c.desc}</p>
                <div className="mk-tags">
                  {c.tags.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
