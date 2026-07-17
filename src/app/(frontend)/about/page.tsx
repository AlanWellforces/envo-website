import type { Metadata } from 'next'
import { metadataForRoute } from '@/lib/page-seo'
import Link from 'next/link'
import { EnvoButton } from '@/components/ui/envo-button'
import styles from './page.module.css'

export async function generateMetadata(): Promise<Metadata> {
  return metadataForRoute('/about', {
    title: 'About ENVO',
    description:
      'ENVO designs and manufactures professional-grade LED modules, drivers, controllers and accessories for signage and architectural illumination worldwide.',
  })
}

const FAMILIES = [
  { name: 'Signage Modules', desc: 'LED modules for channel letters, light boxes and facades — backlit and sidelit.' },
  { name: 'LED Drivers', desc: 'Stable indoor and IP-rated outdoor power supplies, sized to the install.' },
  { name: 'Control Gear', desc: 'Dimming, signal conversion, sensors and Zigbee smart control.' },
  { name: 'Accessories', desc: 'Connectors, cabling and mounting to complete the system.' },
]

const VALUES = [
  { title: 'Quality & reliability', desc: 'Built and tested to international standards. We pride ourselves on a commitment to quality, reliability and customer satisfaction.' },
  { title: 'Expert, personalised advice', desc: 'From small business owners to large corporations, our team helps you spec the right system for the job.' },
  { title: 'Free layout design', desc: 'Send a sketch and our engineers return a buildable module, driver and wiring layout — at no cost.' },
]

export default function AboutPage() {
  return (
    <div className="theme-light">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">›</span>
          <span>About</span>
        </div>

        <section className={styles.hero}>
          <span className={styles.heroEyebrow}>About ENVO</span>
          <h1 className={styles.heroTitle}>
            Illuminating the world with <em>innovative LED solutions.</em>
          </h1>
          <p className={styles.heroDesc}>
            ENVO designs and manufactures professional-grade LED modules, drivers, controllers and
            accessories — engineered, certified and supported end to end for signage and
            architectural illumination worldwide.
          </p>
        </section>
      </div>

      <section className={`${styles.band} ${styles.bandGray}`}>
        <div className="container">
          <span className={styles.sectionEyebrow}>What we make</span>
          <h2 className={styles.sectionTitle}>One system, four families.</h2>
          <p className={styles.sectionLede}>
            A complete ecosystem for LED signage and lighting — every component engineered to work
            together for clean, reliable installations.
          </p>
          <div className={styles.familyGrid}>
            {FAMILIES.map((f) => (
              <div key={f.name} className={styles.familyCard}>
                <h3 className={styles.familyName}>{f.name}</h3>
                <p className={styles.familyDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.band}>
        <div className="container">
          <span className={styles.sectionEyebrow}>How we work</span>
          <h2 className={styles.sectionTitle}>Engineered, certified, supported.</h2>
          <div className={styles.valueGrid}>
            {VALUES.map((v) => (
              <div key={v.title} className={styles.value}>
                <h3 className={styles.valueTitle}>{v.title}</h3>
                <p className={styles.valueDesc}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.ctaBand}>
        <div className="container">
          <h2 className={styles.ctaTitle}>Let&apos;s light your next project.</h2>
          <p className={styles.ctaDesc}>
            Talk to an ENVO engineer, or send us a sketch for a free layout design.
          </p>
          <div className={styles.ctaRow}>
            <EnvoButton href="/contact" variant="primary" arrow>Talk to engineering</EnvoButton>
            <EnvoButton href="/free-layout-design" variant="ghost">Get free layout design</EnvoButton>
          </div>
        </div>
      </section>
    </div>
  )
}
