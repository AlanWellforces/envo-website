import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EnvoButton } from '@/components/ui/envo-button'
import { PRODUCT_FAMILIES, type SeriesLink } from '@/data/product-families'
import { PURCHASE_CHANNELS } from '@/data/purchase-channels'
import familyStyles from '../page.module.css'
import styles from './page.module.css'

type Params = Promise<{ slug: string; series: string }>

type LiveSeries = Extract<SeriesLink, { slug: string }>

function isLive(s: SeriesLink): s is LiveSeries {
  return s.href !== '#'
}

export async function generateStaticParams() {
  const params: { slug: string; series: string }[] = []
  for (const family of PRODUCT_FAMILIES) {
    for (const s of family.series) {
      if (isLive(s)) params.push({ slug: family.slug, series: s.slug })
    }
  }
  return params
}

export const dynamicParams = false

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, series } = await params
  const family = PRODUCT_FAMILIES.find((f) => f.slug === slug)
  const seriesObj = family?.series.find((s): s is LiveSeries => isLive(s) && s.slug === series)
  if (!family || !seriesObj) return {}
  return {
    title: `${seriesObj.label} · ${seriesObj.productName} — ENVO`,
    description: seriesObj.description,
  }
}

export default async function SeriesDetailPage({ params }: { params: Params }) {
  const { slug, series } = await params
  const family = PRODUCT_FAMILIES.find((f) => f.slug === slug)
  if (!family) notFound()
  const seriesObj = family.series.find((s): s is LiveSeries => isLive(s) && s.slug === series)
  if (!seriesObj) notFound()

  const applications = seriesObj.applications ?? family.applications ?? []
  const siblings = family.series.filter((s) => !(isLive(s) && s.slug === series))

  return (
    <div className="theme-light">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">›</span>
          <Link href="/products">Products</Link>
          <span className="sep">›</span>
          <Link href={family.href}>{family.name}</Link>
          <span className="sep">›</span>
          <span>{seriesObj.label}</span>
        </div>
      </div>

      {/* ============== HERO — text-left + product-image-right ============== */}
      <section className="sig-hero">
        <div className={styles.heroSplit}>
          <div className={styles.heroText}>
            {seriesObj.heroEyebrow && (
              <span className="sig-eyebrow">{seriesObj.heroEyebrow}</span>
            )}
            <h1>
              <span className={styles.heroSeriesLabel}>{seriesObj.label}</span>
              {' · '}
              {seriesObj.productName}
            </h1>
            <p className="sig-hero-desc">{seriesObj.description}</p>

            {seriesObj.heroBadges && seriesObj.heroBadges.length > 0 && (
              <div className={styles.heroBadges}>
                {seriesObj.heroBadges.map((b) => (
                  <span key={b.value} className={styles.heroBadge}>
                    <strong>{b.value}</strong>
                    {b.label && <em>{b.label}</em>}
                  </span>
                ))}
              </div>
            )}

            <div className={styles.heroCtas}>
              <EnvoButton href="#where-to-buy" variant="primary" arrow>
                Where to buy
              </EnvoButton>
              {seriesObj.datasheetUrl ? (
                <EnvoButton href={seriesObj.datasheetUrl} variant="ghost">
                  Datasheet (PDF)
                </EnvoButton>
              ) : (
                <EnvoButton href="/contact" variant="ghost">
                  Request datasheet
                </EnvoButton>
              )}
            </div>
          </div>
          <div className={styles.heroImageCol}>
            <Image
              src={seriesObj.image}
              alt={`${seriesObj.productName} module`}
              width={640}
              height={640}
              sizes="(min-width: 1100px) 480px, 100vw"
              priority
            />
          </div>
        </div>
      </section>

      {/* ============== KEY FEATURES ============== */}
      {seriesObj.features && seriesObj.features.length > 0 && (
        <section className={familyStyles.sectionWrap}>
          <div className={familyStyles.sectionHead}>
            <span className={familyStyles.sectionEyebrow}>Key features</span>
            <h2 className={familyStyles.sectionHeading}>
              What makes {seriesObj.productName} the {seriesObj.label.toLowerCase()} pick
            </h2>
          </div>
          <div className={styles.featuresGrid}>
            {seriesObj.features.map((f) => (
              <div key={f.title} className={styles.featureCard}>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============== SPECIFICATIONS ============== */}
      {seriesObj.specifications && seriesObj.specifications.length > 0 && (
        <section className={familyStyles.sectionTinted}>
          <div className={familyStyles.sectionWrap}>
            <div className={familyStyles.sectionHead}>
              <span className={familyStyles.sectionEyebrow}>Specifications</span>
              <h2 className={familyStyles.sectionHeading}>Reference variant — full spec sheet</h2>
              <p className={familyStyles.sectionIntro}>
                Specs below are for the reference variant. Other LED counts scale proportionally —
                see Available Variants for sizing.
              </p>
            </div>
            <div className={styles.specsCard}>
              <dl className={styles.specsList}>
                {seriesObj.specifications.map((s) => (
                  <div key={s.label} className={styles.specsRow}>
                    <dt className={styles.specsLabel}>{s.label}</dt>
                    <dd className={styles.specsValue}>{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>
      )}

      {/* ============== AVAILABLE VARIANTS ============== */}
      {seriesObj.variants && seriesObj.variants.length > 0 && (
        <section className={familyStyles.sectionWrap}>
          <div className={familyStyles.sectionHead}>
            <span className={familyStyles.sectionEyebrow}>Variants</span>
            <h2 className={familyStyles.sectionHeading}>Available variants</h2>
            <p className={familyStyles.sectionIntro}>
              {seriesObj.variants.length} LED-count variants in the {seriesObj.productName} line.
              Each available in 3000K / 4000K / 7000K.
            </p>
          </div>
          <div className={styles.variantsGrid}>
            {seriesObj.variants.map((v) => (
              <div
                key={v.name}
                className={v.badge ? styles.variantCardPopular : styles.variantCard}
              >
                {v.badge && <span className={styles.variantBadge}>{v.badge}</span>}
                <div className={styles.variantImage}>
                  <Image
                    src={v.image ?? seriesObj.image}
                    alt={`${v.name} ${seriesObj.productName}`}
                    width={400}
                    height={400}
                    sizes="(min-width: 1100px) 25vw, (min-width: 641px) 50vw, 100vw"
                  />
                </div>
                <h3 className={styles.variantName}>{v.name}</h3>
                <ul className={styles.variantSpecs}>
                  {v.specs.map((spec) => (
                    <li key={spec}>{spec}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {seriesObj.variantsFootnote && (
            <p className={styles.variantsFootnote}>{seriesObj.variantsFootnote}</p>
          )}
        </section>
      )}

      {/* ============== REGIONAL AVAILABILITY ============== */}
      <section id="where-to-buy" className={familyStyles.sectionTinted}>
        <div className={familyStyles.sectionWrap}>
          <div className={familyStyles.sectionHead}>
            <span className={familyStyles.sectionEyebrow}>Regional availability</span>
            <h2 className={familyStyles.sectionHeading}>Where to buy {seriesObj.productName}</h2>
            <p className={familyStyles.sectionIntro}>
              ENVO works with regional service partners who stock the {seriesObj.label.toLowerCase()},
              handle local warranty and provide region-specific support.
            </p>
          </div>
          <div className={styles.regionGrid}>
            {PURCHASE_CHANNELS.map((c) => (
              <div key={c.id} className={styles.regionCard}>
                <div className={styles.regionHeader}>
                  <span className={styles.regionFlag} aria-hidden="true">
                    {c.flag}
                  </span>
                  <span className={styles.regionLabel}>{c.regionLabel}</span>
                </div>
                <h3 className={styles.regionHeading}>{c.heading}</h3>
                <p className={styles.regionBody}>{c.body}</p>
                <div className={styles.regionCtas}>
                  <EnvoButton href={c.url} variant="primary" arrow>
                    View on {c.urlLabel}
                  </EnvoButton>
                  <EnvoButton href="/contact" variant="ghost">
                    Project &amp; trade enquiry
                  </EnvoButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== WHERE IT WORKS ============== */}
      {applications.length > 0 && (
        <section className={familyStyles.sectionWrap}>
          <div className={familyStyles.sectionHead}>
            <span className={familyStyles.sectionEyebrow}>Where it works</span>
            <h2 className={familyStyles.sectionHeading}>
              Built for {seriesObj.productName.toLowerCase()}-sized jobs
            </h2>
          </div>
          <div className={familyStyles.appsGrid}>
            {applications.map((app) => (
              <article key={app.title} className={familyStyles.appCard}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={app.image} alt={app.title} loading="lazy" />
                <div className={familyStyles.appCardOverlay}>
                  <h3 className={familyStyles.appCardTitle}>{app.title}</h3>
                  <p className={familyStyles.appCardDesc}>{app.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ============== PAIR WITH ============== */}
      {seriesObj.pairWith && seriesObj.pairWith.length > 0 && (
        <section className={familyStyles.sectionTinted}>
          <div className={familyStyles.sectionWrap}>
            <div className={familyStyles.sectionHead}>
              <span className={familyStyles.sectionEyebrow}>Pair with</span>
              <h2 className={familyStyles.sectionHeading}>Match the rest of the system</h2>
              <p className={familyStyles.sectionIntro}>
                {seriesObj.productName} modules are tuned to work with ENVO drivers, controls and
                accessories — pick the matching system parts for a clean install.
              </p>
            </div>
            <div className={styles.pairGrid}>
              {seriesObj.pairWith.map((p) => (
                <Link key={p.title} href={p.href} className={styles.pairCard}>
                  {p.image && (
                    <div className={styles.pairImage}>
                      <Image
                        src={p.image}
                        alt={p.title}
                        width={400}
                        height={240}
                        sizes="(min-width: 1100px) 33vw, (min-width: 641px) 50vw, 100vw"
                      />
                    </div>
                  )}
                  <div className={styles.pairBody}>
                    <h3 className={styles.pairTitle}>{p.title}</h3>
                    <p className={styles.pairDesc}>{p.description}</p>
                    <span className={styles.pairCta}>
                      Explore <span>→</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============== DESIGN ASSISTANCE BANNER ============== */}
      <section className={familyStyles.sectionWrap}>
        <div className={styles.designBanner}>
          <div>
            <span className={styles.designEyebrow}>Free layout design</span>
            <h2 className={styles.designHeading}>Not sure which variant?</h2>
            <p className={styles.designBody}>
              Send your sign sketch — we will spec the {seriesObj.productName} variant, driver and
              accessories for you in 1–2 business days.
            </p>
          </div>
          <div className={styles.designCtas}>
            <EnvoButton href="/free-layout-design" variant="primary" arrow>
              Free layout design
            </EnvoButton>
            <EnvoButton href="#where-to-buy" variant="ghost">
              Where to buy
            </EnvoButton>
          </div>
        </div>
      </section>

      {/* ============== SIBLING SERIES ============== */}
      <section className={familyStyles.sectionWrap}>
        <div className={familyStyles.sectionHead}>
          <span className={familyStyles.sectionEyebrow}>Other series</span>
          <h2 className={familyStyles.sectionHeading}>Other series in {family.name}</h2>
          <p className={familyStyles.sectionIntro}>
            Sibling series tuned for different applications within the family.
          </p>
        </div>
        <div className={styles.siblingList}>
          {siblings.map((s) =>
            isLive(s) ? (
              <Link key={s.label} href={s.href} className={styles.siblingItem}>
                {s.label} <span>→</span>
              </Link>
            ) : (
              <span key={s.label} className={styles.siblingItemDisabled}>
                {s.label}
                <em>· Coming soon</em>
              </span>
            ),
          )}
        </div>
      </section>

      {/* ============== FINAL CTA ============== */}
      <section className="sig-cta-banner">
        <div className="sig-cta-inner">
          <span className="sig-cta-eyebrow">Find your match · 60-sec wizard</span>
          <h2>
            Spec the right {seriesObj.productName} variant. <em>And the system around it.</em>
          </h2>
          <p>
            Tell us your sign type, dimensions and install environment — we will pick the right
            variant in this series, plus matching driver, controller and accessories.
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
