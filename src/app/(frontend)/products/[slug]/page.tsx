import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EnvoButton } from '@/components/ui/envo-button'
import { PRODUCT_FAMILIES, type SeriesLink } from '@/data/product-families'
import { TrustIcon } from '@/components/ui/trust-icon'
import styles from './page.module.css'

type Params = Promise<{ slug: string }>

function isLive(s: SeriesLink): s is Extract<SeriesLink, { slug: string }> {
  return s.href !== '#'
}

export async function generateStaticParams() {
  return PRODUCT_FAMILIES.map((f) => ({ slug: f.slug }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const family = PRODUCT_FAMILIES.find((f) => f.slug === slug)
  if (!family) return {}
  return {
    title: `${family.name} — ENVO`,
    description: family.longDesc,
  }
}

export default async function ProductFamilyPage({ params }: { params: Params }) {
  const { slug } = await params
  const family = PRODUCT_FAMILIES.find((f) => f.slug === slug)
  if (!family) notFound()

  const related = (family.relatedFamilies ?? [])
    .map((rs) => PRODUCT_FAMILIES.find((f) => f.slug === rs))
    .filter((f): f is NonNullable<typeof f> => !!f)

  return (
    <div className="theme-light">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">›</span>
          <Link href="/products">Products</Link>
          <span className="sep">›</span>
          <span>{family.name}</span>
        </div>
      </div>

      {/* ============== HERO (text-only) ============== */}
      <section className="sig-hero">
        <div className="container">
          <div className="sig-hero-inner">
            <span className="sig-eyebrow">{family.tag}</span>
            <h1>{family.name}</h1>
            <p className="sig-hero-desc">{family.longDesc}</p>
            {family.benefitPills && family.benefitPills.length > 0 && (
              <div className={styles.heroBenefits}>
                {family.benefitPills.map((pill) => (
                  <span key={pill} className={styles.heroBenefitPill}>
                    {pill}
                  </span>
                ))}
              </div>
            )}
            {family.productSpecsCallout && (
              <span className={styles.heroSpecCallout}>{family.productSpecsCallout}</span>
            )}
          </div>
        </div>
      </section>

      {/* ============== SERIES — COMPARE TABLE ============== */}
      <section className={styles.sectionWrap}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionEyebrow}>Series</span>
          <h2 className={styles.sectionHeading}>Our {family.name.toLowerCase()} series</h2>
          <p className={styles.sectionIntro}>
            {family.series.length} series tuned for different applications. Specs side-by-side —
            tap a live row to see its variants.
          </p>
        </div>
        <div className={styles.compareWrap}>
          <table className={styles.compareTable}>
            <thead>
              <tr>
                <th scope="col"></th>
                <th scope="col">Series</th>
                {family.series.some((s) => s.compareSpec) ? (
                  <>
                    <th scope="col">LED config</th>
                    <th scope="col">Voltage</th>
                    <th scope="col">Power</th>
                    <th scope="col">Beam</th>
                    <th scope="col">Rating</th>
                    <th scope="col">Best for</th>
                  </>
                ) : (
                  <th scope="col">Description</th>
                )}
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {family.series.map((s) => {
                const live = isLive(s)
                return (
                  <tr
                    key={s.label}
                    className={live ? styles.compareRowLive : styles.compareRowDisabled}
                  >
                    <td className={styles.compareThumbCell}>
                      <div className={styles.compareThumb}>
                        <Image
                          src={s.image}
                          alt={s.productName}
                          width={120}
                          height={90}
                          sizes="80px"
                        />
                      </div>
                    </td>
                    <td className={styles.compareSeriesCell}>
                      {live ? (
                        <Link
                          href={s.href}
                          style={{ color: 'inherit', textDecoration: 'none' }}
                        >
                          {s.label}
                          <span className="product">{s.productName}</span>
                        </Link>
                      ) : (
                        <>
                          {s.label}
                          <span className="product">{s.productName}</span>
                        </>
                      )}
                    </td>
                    {s.compareSpec ? (
                      <>
                        <td className={styles.compareSpec}>{s.compareSpec.ledConfig}</td>
                        <td className={styles.compareSpec}>{s.compareSpec.voltage}</td>
                        <td className={styles.compareSpec}>{s.compareSpec.power}</td>
                        <td className={styles.compareSpec}>{s.compareSpec.beam}</td>
                        <td className={styles.compareSpec}>{s.compareSpec.ipRating}</td>
                        <td className={styles.compareBestFor}>{s.compareSpec.bestFor}</td>
                      </>
                    ) : (
                      <td className={styles.compareBestFor}>{s.shortDesc}</td>
                    )}
                    <td className={styles.compareArrow}>
                      {live ? (
                        <Link
                          href={s.href}
                          style={{ color: 'inherit', textDecoration: 'none' }}
                        >
                          Explore <span>→</span>
                        </Link>
                      ) : (
                        <span className={styles.compareTag}>Coming soon</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ============== CONFIGURATOR PROMO ============== */}
      <section className={styles.sectionTinted}>
        <div className={styles.sectionWrap}>
          <div className={styles.configStrip}>
            <div className={styles.configCopy}>
              <span className={styles.configEyebrow}>Self-serve configurator</span>
              <h2 className={styles.configHeading}>
                Not sure which {family.name.toLowerCase()} fits your project?
              </h2>
              <p className={styles.configBody}>
                Tell us your sign type, size and depth — get a recommended ENVO module + driver +
                accessory BOM in 60 seconds.
              </p>
            </div>
            <EnvoButton href="/find-your-match" variant="primary" arrow>
              Find your match
            </EnvoButton>
          </div>
        </div>
      </section>

      {/* ============== APPLICATIONS ============== */}
      {family.applications && family.applications.length > 0 && (
        <section className={styles.sectionWrap}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionEyebrow}>Applications</span>
            <h2 className={styles.sectionHeading}>Built for signage applications</h2>
            <p className={styles.sectionIntro}>
              Where ENVO modules go to work — from compact channel letters to outdoor facade
              signage.
            </p>
          </div>
          <div className={styles.appsGrid}>
            {family.applications.map((app) => (
              <article key={app.title} className={styles.appCard}>
                <Image
                  src={app.image}
                  alt={app.title}
                  width={520}
                  height={693}
                  sizes="(min-width: 1100px) 25vw, (min-width: 641px) 50vw, 100vw"
                />
                <div className={styles.appCardOverlay}>
                  <h3 className={styles.appCardTitle}>{app.title}</h3>
                  <p className={styles.appCardDesc}>{app.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ============== TRUST BADGES ============== */}
      {family.trustBadges && family.trustBadges.length > 0 && (
        <section className={styles.sectionTinted}>
          <div className={styles.sectionWrap}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionEyebrow}>Why ENVO</span>
              <h2 className={styles.sectionHeading}>
                Built for {family.name.toLowerCase()} that ship and last
              </h2>
            </div>
            <div className={styles.badgesGrid}>
              {family.trustBadges.map((b) => (
                <div key={b.title} className={styles.badge}>
                  <span className={styles.badgeIcon}>
                    <TrustIcon name={b.icon} />
                  </span>
                  <h3 className={styles.badgeTitle}>{b.title}</h3>
                  <p className={styles.badgeDesc}>{b.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============== COMPLETE YOUR SYSTEM ============== */}
      {related.length > 0 && (
        <section className={styles.sectionWrap}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionEyebrow}>Complete your system</span>
            <h2 className={styles.sectionHeading}>Pair your {family.name.toLowerCase()} with the rest</h2>
            <p className={styles.sectionIntro}>
              ENVO modules work best when paired with engineered drivers, controls and
              accessories from the same system.
            </p>
          </div>
          <div className={styles.systemGrid}>
            {related.map((rf) => (
              <Link key={rf.slug} href={rf.href} className={styles.systemCard}>
                <div className={styles.systemCardImg}>
                  <Image
                    src={rf.image}
                    alt={rf.name}
                    width={560}
                    height={315}
                    sizes="(min-width: 1100px) 33vw, (min-width: 641px) 50vw, 100vw"
                  />
                </div>
                <div className={styles.systemCardBody}>
                  <div className={styles.systemCardName}>{rf.name}</div>
                  <p className={styles.systemCardDesc}>{rf.shortDesc}</p>
                  <span className={styles.systemCardCta}>
                    Explore {rf.name.toLowerCase()} <span>→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ============== FAQ ============== */}
      {family.faqs && family.faqs.length > 0 && (
        <section className={styles.sectionTinted}>
          <div className={styles.sectionWrap}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionEyebrow}>FAQ</span>
              <h2 className={styles.sectionHeading}>Common questions</h2>
              <p className={styles.sectionIntro}>
                Quick answers to what installers and specifiers most often ask about ENVO{' '}
                {family.name.toLowerCase()}.
              </p>
            </div>
            <dl className={styles.faqList}>
              {family.faqs.map((item) => (
                <div key={item.question} className={styles.faqItem}>
                  <dt className={styles.faqQuestion}>{item.question}</dt>
                  <dd className={styles.faqAnswer}>{item.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {/* ============== FINAL CTA ============== */}
      <section className="sig-cta-banner">
        <div className="sig-cta-inner">
          <span className="sig-cta-eyebrow">Find your match · 60-sec wizard</span>
          <h2>
            Ready to start your <em>next project?</em>
          </h2>
          <p>
            Tell us your sign type, dimensions and install environment — we will spec the right
            series in this family, plus matching driver, controller and accessories.
          </p>
          <div className="sig-cta-actions">
            <EnvoButton href="/find-your-match" variant="primary" arrow>
              Try Find your match
            </EnvoButton>
            <EnvoButton href="/contact" variant="ghost">
              Contact engineering
            </EnvoButton>
          </div>
        </div>
      </section>
    </div>
  )
}
