import type { Metadata } from 'next'
import { metadataForRoute } from '@/lib/page-seo'
import Link from 'next/link'
import { EnvoButton } from '@/components/ui/envo-button'
import { getSiteSettings } from '@/lib/site-settings'
import styles from './page.module.css'
import { SketchForm } from './SketchForm'

export async function generateMetadata(): Promise<Metadata> {
  return metadataForRoute('/free-layout-design', {
    title: 'Free Layout Design — ENVO Layout Studio',
    description:
      'Design your channel-letter sign in minutes with ENVO Layout Studio — a free, instant LED module and driver layout tool. Or send a sketch and our engineers will draw it for you.',
  })
}

// Same fallback as /contact — overridden by Site Settings → Contact Details.
const DEFAULT_PHONE = { display: '888.228.9138', href: 'tel:+18882289138' }
const telHref = (display: string) => `tel:${display.replace(/[^\d+]/g, '')}`

// ENVO Layout Studio — the self-serve sign-layout tool (MapMySign engine,
// ENVO-branded). First-party host on envolighting.com DNS → design tool.
const TOOL_URL = 'https://design.envolighting.com/?site=envo'

const HERO_CHECKS = ['Free · no account needed', 'Instant module + driver count', 'Engineer-verified parts']

const WHAT_TO_SEND = [
  'Face dimensions & depth',
  'Face & return colour',
  'A sketch, vector file or photo',
  'Viewing distance & location',
]

export default async function FreeLayoutDesignPage() {
  const { contact } = await getSiteSettings()
  const email = contact?.email || 'contact@envolighting.com'
  const phone = contact?.phones?.length
    ? { display: contact.phones[0].number, href: telHref(contact.phones[0].number) }
    : DEFAULT_PHONE

  return (
    <div className="theme-light">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">›</span>
          <span>Free Layout Design</span>
        </div>
      </div>

      {/* ============ HERO ============ */}
      <section className="sig-hero">
        <div className={styles.heroSplit}>
          <div className={styles.heroText}>
            <span className="sig-eyebrow">ENVO Layout Studio · Free &amp; Instant</span>
            <h1 className={styles.heroTitle}>
              Design your sign
              <br />
              in minutes.
            </h1>
            <p className="sig-hero-desc">
              Drop in your letters, pick an ENVO module, and Layout Studio maps every
              module, sizes the driver and wires the runs — instantly. Spec in minutes,
              verified by engineers. No other LED brand gives you this. Free, no account
              needed to start.
            </p>

            <div className={styles.heroChips}>
              {HERO_CHECKS.map((c) => (
                <span key={c} className={styles.chip}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                  {c}
                </span>
              ))}
            </div>

            <div className={styles.heroCtas}>
              <EnvoButton href={TOOL_URL} variant="primary" arrow target="_blank" rel="noopener">
                Start designing — free
              </EnvoButton>
              <EnvoButton href="#start" variant="ghost">
                Prefer we draw it? Send a sketch
              </EnvoButton>
            </div>
          </div>

          {/* Launch card — a click opens ENVO Layout Studio in a new tab. */}
          <div className={styles.heroVisual}>
            <a
              className={styles.specCard}
              href={TOOL_URL}
              target="_blank"
              rel="noopener"
              aria-label="Open ENVO Layout Studio"
            >
              <div className={styles.specHead}>
                <span className={styles.specFile}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="3" y1="9" x2="21" y2="9" /></svg>
                  ENVO Layout Studio
                </span>
                <span className={styles.specStatus}>Live tool</span>
              </div>
              <div className={styles.specCanvas}>
                <span className={styles.specCaption}>Open the studio · draw your sign</span>
              </div>
              <div className={styles.specStats}>
                <div className={styles.specStat}>
                  <span className={styles.specStatLabel}>Modules</span>
                  <span className={styles.specStatValue}>84 pcs</span>
                  <span className={styles.specStatSub}>Mini Series</span>
                </div>
                <div className={styles.specStat}>
                  <span className={styles.specStatLabel}>Drivers</span>
                  <span className={styles.specStatValue}>2 × 60 W</span>
                  <span className={styles.specStatSub}>Super slim</span>
                </div>
                <div className={styles.specStat}>
                  <span className={styles.specStatLabel}>Total load</span>
                  <span className={styles.specStatValue}>52.4 W</span>
                  <span className={styles.specStatSub}>56% headroom</span>
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className={styles.stepsBand} id="how">
        <div className={styles.stepsInner}>
          <div className={styles.step}>
            <span className={styles.stepNum}>1</span>
            <div>
              <h3>Lay it out</h3>
              <p>Open Layout Studio, drop in your letters or artwork, and pick an ENVO module.</p>
            </div>
          </div>
          <div className={styles.step}>
            <span className={styles.stepNum}>2</span>
            <div>
              <h3>Get the spec</h3>
              <p>Instant module count, driver sizing and wiring — download the marked-up PDF.</p>
            </div>
          </div>
          <div className={styles.step}>
            <span className={styles.stepNum}>3</span>
            <div>
              <h3>Source or quote</h3>
              <p>Source the exact kit through an authorised supply channel, or send the spec to our engineers for a quote and second pair of eyes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ WHAT YOU GET ============ */}
      {/* Tinted band is full-bleed; .section inside keeps the 1200px frame. */}
      <section className={styles.sectionSoft}>
        <div className={styles.section}>
          <div className={styles.sectionLabel}>What You Get</div>
          <h2 className={styles.sectionH2}>A complete, buildable spec</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon} aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /></svg>
            </div>
            <h4>Module Layout</h4>
            <p>Marked-up drawing showing exactly where each LED module mounts.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon} aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
            </div>
            <h4>Driver Sizing</h4>
            <p>Recommended ENVO driver model with safe headroom for the load.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon} aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h2l3-9 4 18 3-9h6" /></svg>
            </div>
            <h4>Wiring Diagram</h4>
            <p>Cable runs, voltage drop calculation and re-injection points if needed.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon} aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" /></svg>
            </div>
            <h4>Bill of Materials</h4>
            <p>Itemised list of every part with quantities — ready to quote.</p>
          </div>
          </div>
        </div>
      </section>

      {/* ============ FORM ============ */}
      <section className={styles.section} id="start">
        <div className={styles.formLayout}>
          <div className={styles.formCard}>
            <div className={styles.sectionLabel}>Prefer we draw it?</div>
            <h2 className={`${styles.sectionH2} ${styles.formTitle}`}>Send a sketch — we&rsquo;ll map it</h2>
            <p className={styles.formLede}>
              Complex face, tricky viewing distance, or just short on time? Send your
              dimensions and our LED engineers will return a full ENVO layout — the same
              spec the studio produces, drawn for you. Or{' '}
              <a href={TOOL_URL} target="_blank" rel="noopener">design it yourself now</a>.
            </p>
            <SketchForm />
          </div>

          <aside className={styles.sidePanel}>
            <div className={styles.sideLabel}>What to send</div>
            <ul className={styles.sideList}>
              {WHAT_TO_SEND.map((item) => (
                <li key={item}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                  {item}
                </li>
              ))}
            </ul>
            <p className={styles.sideNote}>
              <span className={styles.sideDot} aria-hidden="true" />
              Fast turnaround from our engineering team.
            </p>
            <div className={styles.sideDivider} />
            <div className={styles.sideLabel}>Prefer to talk?</div>
            <div className={styles.sideContacts}>
              <a href={phone.href}>{phone.display}</a>
              <a href={`mailto:${email}`}>{email}</a>
            </div>
            <Link href="/contact" className={styles.sideLink}>
              Contact &amp; support <span aria-hidden="true">→</span>
            </Link>
          </aside>
        </div>
      </section>

      {/* ============ CTA BANNER ============ */}
      <section className="sig-cta-banner">
        <div className="sig-cta-inner">
          <span className="sig-cta-eyebrow">Ready to design?</span>
          <h2>
            Lay out your sign in minutes. <em>Free, in your browser.</em>
          </h2>
          <div className="sig-cta-actions">
            <EnvoButton href={TOOL_URL} variant="primary" arrow target="_blank" rel="noopener">
              Open ENVO Layout Studio
            </EnvoButton>
            <EnvoButton href="/products" variant="ghost">
              Browse Products
            </EnvoButton>
          </div>
        </div>
      </section>
    </div>
  )
}
