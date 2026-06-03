import type { Metadata } from 'next'
import { metadataForRoute } from '@/lib/page-seo'
import Link from 'next/link'
import { EnvoButton } from '@/components/ui/envo-button'
import styles from './page.module.css'
import { SketchForm } from './SketchForm'

export async function generateMetadata(): Promise<Metadata> {
  return metadataForRoute('/free-layout-design', {
    title: 'Free Layout Design — ENVO',
    description:
      'Send us your sign sketch and dimensions. Our LED engineering team replies within 24 hours with a free module count, driver size and wiring layout.',
  })
}

export default function FreeLayoutDesignPage() {
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
            <span className="sig-eyebrow">Free Service · 24h Turnaround</span>
            <h1>
              Free Layout Design
              <br />
              <em>Send a Sketch, Get a Spec</em>
            </h1>
            <p className="sig-hero-desc">
              Tell us the sign size, viewing distance and install location. Our LED engineering
              team replies within 24 hours with a free module count, driver sizing and wiring
              layout — ready for you to quote and install.
            </p>

            <div className={styles.heroBadges}>
              <div className={styles.badge}>
                <span className={styles.badgeIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
                <span>
                  <span className={styles.badgeTitle}>100%</span>
                  <br />
                  <span className={styles.badgeSub}>Free of charge</span>
                </span>
              </div>
              <div className={styles.badge}>
                <span className={styles.badgeIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                </span>
                <span>
                  <span className={styles.badgeTitle}>24-Hour</span>
                  <br />
                  <span className={styles.badgeSub}>Reply</span>
                </span>
              </div>
              <div className={styles.badge}>
                <span className={styles.badgeIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></svg>
                </span>
                <span>
                  <span className={styles.badgeTitle}>15+ Years</span>
                  <br />
                  <span className={styles.badgeSub}>Experience</span>
                </span>
              </div>
            </div>

            <div className={styles.heroCtas}>
              <EnvoButton href="#start" variant="primary" arrow>
                Send My Sketch
              </EnvoButton>
              <EnvoButton href="#how" variant="ghost">
                How It Works
              </EnvoButton>
            </div>
          </div>

          <div className={styles.heroVisual} aria-hidden="true">
            <div className={styles.paper}>
              <div className={styles.paperLetter}>A</div>
              <span className={`${styles.paperDot} ${styles.paperDot1}`} />
              <span className={`${styles.paperDot} ${styles.paperDot2}`} />
              <span className={`${styles.paperDot} ${styles.paperDot3}`} />
              <span className={`${styles.paperDot} ${styles.paperDot4}`} />
              <span className={`${styles.paperDot} ${styles.paperDot5}`} />
              <span className={styles.paperDim}>Ø 800 mm · 32 modules · EV-SL-100-12</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className={`${styles.section} ${styles.sectionSoft}`} id="how">
        <div className={styles.sectionLabel}>How It Works</div>
        <h2 className={styles.sectionH2}>Three steps from sketch to spec</h2>
        <div className={styles.stepsGrid}>
          <div className={styles.stepCard}>
            <div className={styles.stepNum}>01</div>
            <h3>Send your sketch</h3>
            <p>Upload a photo, drawing or vector file. Tell us the height, width, depth, viewing distance and install location.</p>
          </div>
          <div className={styles.stepCard}>
            <div className={styles.stepNum}>02</div>
            <h3>We engineer the layout</h3>
            <p>Our team marks up your file with module positions, driver placement, wiring runs and connector specs.</p>
          </div>
          <div className={styles.stepCard}>
            <div className={styles.stepNum}>03</div>
            <h3>You quote &amp; build</h3>
            <p>Within 24 hours you&apos;ll have a complete bill of materials — ENVO modules, drivers, connectors and cable lengths.</p>
          </div>
        </div>
      </section>

      {/* ============ WHAT YOU GET ============ */}
      <section className={styles.section}>
        <div className={styles.sectionLabel}>What You Get</div>
        <h2 className={styles.sectionH2}>A complete, buildable spec</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon} aria-hidden="true">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /></svg>
            </div>
            <h4>Module Layout</h4>
            <p>Marked-up drawing showing exactly where each LED module mounts.</p>
          </div>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon} aria-hidden="true">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
            </div>
            <h4>Driver Sizing</h4>
            <p>Recommended ENVO driver model with safe headroom for the load.</p>
          </div>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon} aria-hidden="true">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h2l3-9 4 18 3-9h6" /></svg>
            </div>
            <h4>Wiring Diagram</h4>
            <p>Cable runs, voltage drop calculation and re-injection points if needed.</p>
          </div>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon} aria-hidden="true">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" /></svg>
            </div>
            <h4>Bill of Materials</h4>
            <p>Itemised list of every part with quantities — ready to quote.</p>
          </div>
        </div>
      </section>

      {/* ============ FORM ============ */}
      <section className={`${styles.section} ${styles.sectionSoft}`} id="start">
        <div className={styles.formCard}>
          <div className={styles.sectionLabel}>Get Started</div>
          <h2 className={styles.sectionH2}>Tell us about your sign</h2>
          <p className={styles.formLead}>
            We&apos;ll reply within 24 hours with a complete layout. No fees, no commitment — just
            a faster way to spec your project.
          </p>
          <SketchForm />
        </div>
      </section>

      {/* ============ CTA BANNER ============ */}
      <section className="sig-cta-banner">
        <div className="sig-cta-inner">
          <span className="sig-cta-eyebrow">Not ready yet?</span>
          <h2>
            Browse our products. <em>We&apos;ll be here when you are.</em>
          </h2>
          <div className="sig-cta-actions">
            <EnvoButton href="/products" variant="primary" arrow>
              View Products
            </EnvoButton>
            <EnvoButton href="/contact" variant="ghost">
              Talk to Sales
            </EnvoButton>
          </div>
        </div>
      </section>
    </div>
  )
}
