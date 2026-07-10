import type { Metadata } from 'next'
import { metadataForRoute } from '@/lib/page-seo'
import Link from 'next/link'
import { ContactForm } from './ContactForm'
import { getSiteSettings } from '@/lib/site-settings'
import styles from './page.module.css'

export async function generateMetadata(): Promise<Metadata> {
  return metadataForRoute('/contact', {
    title: 'Contact — ENVO',
    description:
      'Talk to the ENVO team about orders, product questions and project support by phone or email.',
  })
}

// Built-in contact details — overridden by Site Settings → Contact Details when set.
const DEFAULT_PHONES = [
  { region: 'US', display: '888.228.9138', href: 'tel:+18882289138' },
  { region: 'UK', display: '+44 20 3398 6515', href: 'tel:+442033986515' },
  { region: 'AU', display: '+61 2 7254 5288', href: 'tel:+61272545288' },
]
const telHref = (display: string) => `tel:${display.replace(/[^\d+]/g, '')}`

export default async function ContactPage() {
  const { contact } = await getSiteSettings()
  const email = contact?.email || 'contact@envolighting.com'
  const phones = contact?.phones?.length
    ? contact.phones.map((p) => ({ region: p.label, display: p.number, href: telHref(p.number) }))
    : DEFAULT_PHONES
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
            Product questions, project support, orders — send it through and the right person
            picks it up.
          </p>
        </section>

        <div className={styles.layout}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Send a message</h2>
            <ContactForm />
          </div>

          <aside className={styles.panel}>
            <p className={styles.panelTitle}>Reach us directly</p>

            <div className={styles.detail}>
              <p className={styles.detailLabel}>Email</p>
              <p className={styles.detailVal}>
                <a href={`mailto:${email}`}>{email}</a>
              </p>
            </div>

            <div className={styles.detail}>
              <p className={styles.detailLabel}>Phone</p>
              <p className={styles.detailVal}>
                {phones.map((p) => (
                  <a key={p.region} href={p.href}>
                    {p.region} · {p.display}
                  </a>
                ))}
              </p>
            </div>

            {/* Address block hidden (user 2026-07-09) — hidden-features
                registry §10; the Site Settings → address field stays in the
                CMS untouched, so restoring = re-adding this block. */}
          </aside>
        </div>

        {/* FAQ-by-topic card (mockup contact-9-final.html) intentionally not shipped yet —
            hidden pending content sign-off. Re-add as a client component with topic tabs. */}
      </div>
    </div>
  )
}
