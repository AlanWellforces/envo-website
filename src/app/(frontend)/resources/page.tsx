import type { Metadata } from 'next'
import Link from 'next/link'
import { EnvoButton } from '@/components/ui/envo-button'
import { RESOURCES } from '@/data/resources'
import { PURCHASE_CHANNELS } from '@/data/purchase-channels'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Resources — ENVO',
  description:
    'Downloads, answers and the right contact for your region. Product catalogues, spec sheets, IES files, an FAQ, and a direct line to ENVO engineering.',
}

/** Region "where to buy" one-liners — lead-gen framing, no pricing. */
const BUY_COPY: Record<string, string> = {
  'nz-ap': 'Stocked locally with NZ warranty and fast Auckland dispatch across Asia-Pacific.',
  'us-global': 'Carried in the US with local warranty, serving the Americas, EMEA and beyond.',
}

export default function SupportPage() {
  return (
    <div className="theme-light">
      {/* ===== HERO ===== */}
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">›</span>
          <span>Resources</span>
        </div>

        <section className={styles.hero}>
          <span className={styles.heroEyebrow}>Resources</span>
          <h1 className={styles.heroTitle}>
            How can we <em>help?</em>
          </h1>
          <p className={styles.heroDesc}>
            Downloads, answers, and the right contact for your region — in one place.
          </p>

          <div className={styles.intentGrid}>
            <a className={styles.intentCard} href="#downloads">
              <span className={styles.intentIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 3v12" />
                  <path d="M7 10l5 5 5-5" />
                  <path d="M5 21h14" />
                </svg>
              </span>
              <span className={styles.intentTitle}>Documents &amp; downloads</span>
              <span className={styles.intentArrow}>Browse →</span>
            </a>

            <a className={styles.intentCard} href="#faqs">
              <span className={styles.intentIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4" />
                  <circle cx="12" cy="17" r="0.4" />
                </svg>
              </span>
              <span className={styles.intentTitle}>Common questions</span>
              <span className={styles.intentArrow}>Read FAQ →</span>
            </a>

            <Link className={styles.intentCard} href="/find-your-match">
              <span className={styles.intentIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" />
                </svg>
              </span>
              <span className={styles.intentTitle}>Find the right product</span>
              <span className={styles.intentArrow}>Open tool →</span>
            </Link>
          </div>
        </section>
      </div>

      {/* ===== 01 · DOWNLOADS (white band) ===== */}
      <section className={`${styles.bandWhite} ${styles.section}`} id="downloads">
        <div className="container">
          <div className={styles.sectionHead}>
            <span className={styles.sectionNum}>01</span>
            <h2 className={styles.sectionTitle}>Documents &amp; downloads</h2>
          </div>
          <div className={styles.dlGrid}>
            {RESOURCES.map((r) => (
              <Link key={r.slug} href={r.href} className={styles.dlCard}>
                <span className={styles.dlIcon}>{r.icon}</span>
                <span className={styles.dlName}>{r.name}</span>
                <span className={styles.dlCta}>
                  {r.cta} <span>→</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 02 · FAQ (gray band) ===== */}
      <section className={`${styles.bandGray} ${styles.section}`} id="faqs">
        <div className="container">
          <div className={styles.sectionHead}>
            <span className={styles.sectionNum}>02</span>
            <h2 className={styles.sectionTitle}>Frequently asked questions</h2>
          </div>
          <p className={styles.sectionSub}>
            Ordering, product compatibility, installation and warranty — answered in one place.
          </p>
          <Link className={styles.dlCta} href="/resources/faq">
            Read all FAQs <span>→</span>
          </Link>
        </div>
      </section>

      {/* ===== 03 · WHERE TO BUY (gray band) ===== */}
      <section className={`${styles.bandGray} ${styles.section}`} id="buy">
        <div className="container">
          <div className={styles.sectionHead}>
            <span className={styles.sectionNum}>03</span>
            <div>
              <h2 className={styles.sectionTitle}>Where to buy</h2>
              <p className={styles.sectionSub}>
                ENVO doesn&apos;t sell direct — pick your region.
              </p>
            </div>
          </div>
          <div className={styles.buyGrid}>
            {PURCHASE_CHANNELS.map((c) => (
              <div key={c.id} className={styles.buyCard}>
                <div className={styles.buyTop}>
                  <span className={styles.buyFlag} aria-hidden="true">
                    {c.flag}
                  </span>
                  <span>
                    <span className={styles.buyRegion}>{c.regionLabel}</span>
                    <h3 className={styles.buyHeading}>{c.urlLabel}</h3>
                  </span>
                </div>
                <p className={styles.buyBody}>{BUY_COPY[c.id] ?? c.body}</p>
                <a
                  className={styles.buyCta}
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit {c.urlLabel} ↗
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CONTACT ===== */}
      <section className={`${styles.bandGray} ${styles.section}`} id="contact">
        <div className="container">
          <div className={styles.contact}>
            <div className={styles.contactInner}>
              <span className={styles.contactEyebrow}>Still stuck?</span>
              <h2 className={styles.contactTitle}>Talk to an engineer directly.</h2>
              <p className={styles.contactDesc}>
                Custom spec sheets, photometric files and certification docs our public library
                doesn&apos;t cover.
              </p>
              <div className={styles.contactActions}>
                <EnvoButton href="/contact" variant="primary" arrow>
                  Contact engineering
                </EnvoButton>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
