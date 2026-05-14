import Link from 'next/link'

const FAMILIES = [
  {
    name: 'Signage Module',
    href: '/products/led-signage-modules',
    desc: 'High-efficiency LED modules for brilliant signage.',
    img: '/assets/images/cat-modules.png',
    series: [
      { label: 'Mini Series', href: '#' },
      { label: 'Eco Series', href: '/products/signage-eco-series' },
      { label: 'Pro Series', href: '#' },
      { label: 'RGB Series', href: '#' },
      { label: '24V Series', href: '#' },
      { label: 'Sidelit', href: '#' },
    ],
  },
  {
    name: 'LED Driver',
    href: '/products/led-drivers',
    desc: 'Stable power. Maximum performance.',
    img: '/assets/images/cat-drivers.png',
    series: [
      { label: 'Linear Series', href: '#' },
      { label: 'Screw Terminal', href: '#' },
      { label: 'Triac Dimmable', href: '#' },
    ],
  },
  {
    name: 'Control Gear',
    href: '/products/control-gear',
    desc: 'Intelligent control. Seamless integration.',
    img: '/assets/images/cat-controllers.png',
    series: [
      { label: 'Remote & Receiver', href: '#' },
      { label: 'Signal Converter', href: '#' },
      { label: 'Sensor', href: '#' },
      { label: 'Zigbee & Smart', href: '#' },
    ],
  },
  {
    name: 'Accessories',
    href: '/products/accessories',
    desc: 'Complete the system. Every detail matters.',
    img: '/assets/images/cat-sensors.png',
    series: [
      { label: 'Connector', href: '#' },
      { label: 'Cable', href: '#' },
    ],
  },
]

export function ProductFamilies() {
  return (
    <section className="pf-section" id="products">
      <div className="pf-head">
        <h2 className="pf-heading">Explore our product families</h2>
      </div>
      <div className="pf-grid">
        {FAMILIES.map((family) => (
          <article key={family.name} className="pf-card">
            <div className="pf-img">
              <img src={family.img} alt={family.name} />
            </div>
            <div className="pf-body">
              <Link href={family.href} className="pf-name">
                {family.name}
              </Link>
              <div className="pf-desc">{family.desc}</div>
              <div className="pf-links">
                {family.series.map((s) => (
                  <Link key={s.label} href={s.href}>
                    {s.label}
                  </Link>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
