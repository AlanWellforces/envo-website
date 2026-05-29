import type { Metadata } from 'next'
import Link from 'next/link'
import { EnvoButton } from '@/components/ui/envo-button'
import { RESOURCES } from '@/data/resources'
import { RESOURCE_FAQS } from '@/data/resource-faqs'
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

      {/* ===== JUMP NAV ===== */}
      <nav className={styles.jumpnav} aria-label="Resources sections">
        <div className="container">
          <div className={styles.jumpnavInner}>
            <a className={styles.jumpLink} href="#downloads">
              Downloads
            </a>
            <a className={styles.jumpLink} href="#faqs">
              FAQs
            </a>
            <a className={styles.jumpLink} href="#help">
              Get help
            </a>
            <a className={styles.jumpLink} href="#buy">
              Where to buy
            </a>
            <a className={styles.jumpLink} href="#contact">
              Contact
            </a>
          </div>
        </div>
      </nav>

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
          {RESOURCE_FAQS.map((group) => (
            <div key={group.group} className={styles.faqGroup}>
              <h3 className={styles.faqGroupTitle}>{group.group}</h3>
              <div className={styles.faqList}>
                {group.items.map((item) => (
                  <details key={item.q} className={styles.faqItem}>
                    <summary className={styles.faqQ}>{item.q}</summary>
                    <div className={styles.faqA}>{item.a}</div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== 03 · GET HELP (white band) ===== */}
      <section className={`${styles.bandWhite} ${styles.section}`} id="help">
        <div className="container">
          <div className={styles.sectionHead}>
            <span className={styles.sectionNum}>03</span>
            <h2 className={styles.sectionTitle}>Not sure? Let us help you choose</h2>
          </div>
          <div className={styles.helpGrid}>
            <Link className={styles.helpCard} href="/find-your-match">
              <span className={styles.helpIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 2l2.4 7.4H22l-6 4.4 2.3 7.2-6.3-4.6L5.7 21l2.3-7.2-6-4.4h7.6z" />
                </svg>
              </span>
              <span>
                <span className={styles.helpTitle}>Match driver to modules</span>
                <span className={styles.helpDesc}>
                  Size the driver and confirm voltage for your run.
                </span>
                <span className={styles.helpCta}>Find your match →</span>
              </span>
            </Link>

            <Link className={styles.helpCard} href="/free-layout-design">
              <span className={styles.helpIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </span>
              <span>
                <span className={styles.helpTitle}>Plan a layout</span>
                <span className={styles.helpDesc}>
                  Send dimensions, get a free layout and parts list.
                </span>
                <span className={styles.helpCta}>Free layout design →</span>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== 04 · WHERE TO BUY (gray band) ===== */}
      <section className={`${styles.bandGray} ${styles.section}`} id="buy">
        <div className="container">
          <div className={styles.sectionHead}>
            <span className={styles.sectionNum}>04</span>
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
                <EnvoButton href="/free-layout-design" variant="ghost">
                  Free layout design
                </EnvoButton>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
