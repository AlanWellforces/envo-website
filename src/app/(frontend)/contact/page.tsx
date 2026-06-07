import type { Metadata } from 'next'
import { metadataForRoute } from '@/lib/page-seo'
import Link from 'next/link'
import { ContactForm } from './ContactForm'
import styles from './page.module.css'

export async function generateMetadata(): Promise<Metadata> {
  return metadataForRoute('/contact', {
    title: 'Contact — ENVO',
    description:
      'Talk to the ENVO team about orders, product questions and custom requests by phone or email — we usually reply within one business day.',
  })
}

const PHONES = [
  { region: 'US', display: '888.228.9138', href: 'tel:+18882289138' },
  { region: 'UK', display: '+44 20 3398 6515', href: 'tel:+442033986515' },
  { region: 'AU', display: '+61 2 7254 5288', href: 'tel:+61272545288' },
]

export default function ContactPage() {
  return (
    <div className="theme-light">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">›</span>
          <span>Contact</span>
        </div>

        <section className={styles.hero}>
          <span className={styles.heroEyebrow}>Contact</span>
          <h1 className={styles.heroTitle}>Talk to an engineer.</h1>
          <p className={styles.heroDesc}>
            Our customer care team is ready to help with orders, product-related questions and
            custom requests — we usually reply within one business day.
          </p>
        </section>

        <div className={styles.layout}>
          <ContactForm />

          <aside className={styles.panel}>
            <p className={styles.panelTitle}>Reach us directly</p>

            <div className={styles.detail}>
              <p className={styles.detailLabel}>Phone</p>
              <p className={styles.detailVal}>
                {PHONES.map((p) => (
                  <a key={p.region} href={p.href}>
                    {p.region} · {p.display}
                  </a>
                ))}
              </p>
            </div>

            <div className={styles.detail}>
              <p className={styles.detailLabel}>Email</p>
              <p className={styles.detailVal}>
                <a href="mailto:contact@envo.com">contact@envo.com</a>
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
