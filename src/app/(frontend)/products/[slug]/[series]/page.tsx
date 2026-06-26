import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EnvoButton } from '@/components/ui/envo-button'
import MergedSeriesPage from '@/components/products/merged/MergedSeriesPage'
import { PRODUCT_FAMILIES, type SeriesLink } from '@/data/product-families'
import { PURCHASE_CHANNELS } from '@/data/purchase-channels'
import { datasheetHref } from '@/lib/asset-url'
import { getProduct, getProductsByMarketingFamily, resolveProductImage, type Product } from '@/lib/products'
import { seriesSlug as toSeriesSlug, seriesLabel } from '@/data/family-map'
import { ProductCardGrid } from '@/components/products/ProductCardGrid'
import SeriesTemplate from '@/components/products/series/SeriesTemplate'
import { getSeriesTemplateProps } from '@/lib/series-template'
import familyStyles from '../page.module.css'
import styles from './page.module.css'

type Params = Promise<{ slug: string; series: string }>

type LiveSeries = Extract<SeriesLink, { slug: string }>

function isLive(s: SeriesLink): s is LiveSeries {
  return s.href !== '#'
}

export async function generateStaticParams() {
  // DB-driven: every series that has products, across all 4 marketing families.
  const params: { slug: string; series: string }[] = []
  for (const f of ['led-signage-modules', 'led-drivers', 'control-gear', 'accessories']) {
    const products = await getProductsByMarketingFamily(f)
    const slugs = new Set(products.map((p) => toSeriesSlug(p.series)))
    for (const s of slugs) params.push({ slug: f, series: s })
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
  if (!seriesObj) {
    // No curated config → DB-driven generic series view.
    const all = await getProductsByMarketingFamily(slug)
    const products = all.filter((p) => toSeriesSlug(p.series) === series)
    if (products.length === 0) notFound()
    // Signage series with AI-draft editorial render the unified data-driven
    // template (Overview / Specs selector / Solutions). Falls through to the
    // generic card grid for series without editorial.
    const tplProps = await getSeriesTemplateProps(products[0].series ?? '', products)
    if (tplProps) return <SeriesTemplate {...tplProps} />
    return (
      <div className="theme-light">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link><span className="sep">›</span>
            <Link href="/products">Products</Link><span className="sep">›</span>
            <Link href={`/products/${slug}`}>{family.name}</Link><span className="sep">›</span>
            <span>{seriesLabel(products[0].series)}</span>
          </div>
        </div>
        <section className="sig-hero"><div className="container"><div className="sig-hero-inner">
          <span className="sig-eyebrow">{family.name}</span>
          <h1>{seriesLabel(products[0].series)}</h1>
          <p className="sig-hero-desc">{products.length} products in this series</p>
        </div></div></section>
        <section className={familyStyles.sectionWrap}>
          <ProductCardGrid products={products} familySlug={slug} />
        </section>
      </div>
    )
  }

  // Mini Series uses a bespoke design (v3 mockup ported via Shadow DOM) —
  // the generic data-driven template below does not fit its tabbed layout.
  // Pre-fetch the three -NW (Natural White) reference variants from Akeneo so
  // the Compare tab can render live data (SKU, power, dimensions, lumens,
  // max-per-string, datasheet URL); the client component substitutes them
  // into the mockup HTML via [data-akeneo] markers after the shadow attaches.
  if (series === 'mini-series') {
    // Merged single-page detail (one page = the whole MiniLux series). Per-variant
    // table cells prefer live Akeneo values (SKU/lumens/power/dimensions); shared
    // rows + editorial copy are curated real specs (the clean DB nulls these —
    // see memory project_envo-minilux-real-specs / mini-compare-shared-rows-wiring).
    const variantSkus = ['EV-BLML01LBY-NW', 'EV-BLML02LBY-NW', 'EV-BLML03LBY-NW']
    const live = await Promise.all(variantSkus.map((s) => getProduct(s)))
    const dims = (pr: Product | null) =>
      pr?.length_mm && pr?.width_mm && pr?.height_mm
        ? `${pr.length_mm} × ${pr.width_mm} × ${pr.height_mm} mm`
        : undefined

    const META = [
      { name: 'Single', beads: 1, img: 'mod-mini-single.png', output: '~ 29 lm', power: '0.24 W', size: '14 × 9 × 9 mm', bestFor: 'Small letters, outline trim, tight detail' },
      { name: 'Duo', beads: 2, img: 'mod-mini-duo.png', output: '~ 55 lm', power: '0.48 W', size: '25.9 × 9 × 9 mm', bestFor: 'Standard small-to-mid returns' },
      { name: 'Triple', beads: 3, star: true, img: 'mod-mini-triple.png', output: '~ 85 lm', power: '0.72 W', size: '38.1 × 9 × 9 mm', bestFor: 'Larger faces, brighter fills, fewer modules' },
    ] as const
    const variants = META.map((m, i) => {
      const pr = live[i]
      return {
        name: m.name,
        beads: m.beads,
        star: 'star' in m ? m.star : undefined,
        image: { src: `/assets/images/${m.img}`, local: true, alt: `MiniLux ${m.name}` },
        modelCode: (pr?.sku ?? `EV-BLML0${m.beads}LBY-NW`).replace(/-NW$/i, ''),
        ledBeads: String(m.beads),
        output: pr?.brightness_lm != null ? `~ ${pr.brightness_lm} lm` : m.output,
        power: pr?.power_w != null ? `${pr.power_w} W` : m.power,
        size: dims(pr) ?? m.size,
        bestFor: m.bestFor,
      }
    })
    const datasheetUrl = datasheetHref(live.find((v) => v?.spec_sheet_url)?.sku ?? variantSkus[2]) ?? undefined
    const img = (src: string, alt: string, cover = false) => ({ src: `/assets/images/${src}`, local: true, alt, cover })

    return (
      <MergedSeriesPage
        breadcrumb={{ familyName: family.name, familyHref: family.href, seriesLabel: 'MiniLux Series' }}
        eyebrow="Signage modules · Backlit"
        title="MiniLux Series"
        intro="The compact backlit module for small letters and intricate detail. A 180° × 140° Diamondback lens spreads light evenly with no hotspots, even on shallow returns — silicone-potted to IP66."
        beadtag="MiniLux range · 1–3 LED beads"
        checklist={[
          'Even spread, no hotspots — Diamondback 180° × 140° optic',
          'Silicone-potted IP66 — built for outdoor channel letters',
          'Up to ~40 modules per power-injection feed',
          '50,000-hour L70 rated life',
        ]}
        datasheetUrl={datasheetUrl}
        thumbs={[
          img('mod-mini.png', 'MiniLux module'),
          img('mod-mini-line.png', 'MiniLux line drawing'),
          img('app-mini-channel-letters.jpg', 'MiniLux in channel letters', true),
          img('app-mini-halo-letters.jpg', 'MiniLux halo-lit letters', true),
        ]}
        variants={variants}
        sharedRows={[
          { label: 'Colour temperature', value: '3000 K · 4000 K · 7000 K' },
          { label: 'Input voltage', value: '12 V DC · constant voltage' },
          { label: 'Beam angle', value: '180° × 140° · Diamondback optic' },
          { label: 'Efficacy', value: '~ 125 lm / W' },
          { label: 'Ingress protection', value: 'IP66 · silicone-potted' },
          {
            label: 'Operating temp',
            value: (
              <>
                −25 to +60 °C <em className="dim-imp">(−13 to 140 °F)</em>
              </>
            ),
          },
          { label: 'Lifetime', value: '50,000 h · L70' },
          {
            label: 'Certifications',
            value: (
              <span className="certs">
                {['UL', 'cUL', 'CE', 'TÜV', 'RoHS', 'CB', 'LM-80'].map((c) => (
                  <span key={c} className="c">
                    {c}
                  </span>
                ))}
              </span>
            ),
          },
        ]}
        overview={{
          heading: 'Engineered to specify with confidence.',
          body: 'The MiniLux range is one to three binned SMD LEDs behind a Diamondback lens that throws a 180° × 140° beam — so light reaches the face evenly with no scalloping, even on shallow returns and tight radii. Every module is silicone-potted to IP66 and rated for −25 °C to +60 °C, so the same part number performs across climates. Run up to ~40 modules per power-injection point on a 12 V constant-voltage feed.',
        }}
        downloads={[
          { name: 'MiniLux datasheet', meta: 'PDF', href: datasheetUrl },
          { name: 'Installation guide' },
          { name: 'Declaration of Conformity' },
          { name: '2D drawing (DXF)' },
        ]}
        related={[
          { kicker: 'Driver · constant voltage', name: 'EV-SL Linear Driver', href: '/products/led-drivers/envo-sl-us', image: img('mod-eco-line.png', 'EV-SL Linear Driver') },
          { kicker: 'Control gear', name: 'ZigBee Controller', href: '/products/control-gear/envo-zigbee', image: img('cat-controllers-line.png', 'ZigBee Controller') },
          { kicker: 'Step up · larger faces', name: 'EcoGlo Series', href: '/products/led-signage-modules/envo-ecoglo', image: img('series/envo_ecoglo.jpg', 'EcoGlo Series') },
        ]}
      />
    )
  }

  const applications = seriesObj.applications ?? family.applications ?? []
  const siblings = family.series.filter((s) => !(isLive(s) && s.slug === series))

  // Resolve each variant's defaultSku → Payload product. Used both for the
  // variant cards (image + per-variant datasheet) and to pick the hero image:
  // the "Most popular" variant's Payload image takes precedence; otherwise
  // the first variant with a Payload product wins; otherwise we fall back to
  // the Git-side series image.
  const variantData = await Promise.all(
    (seriesObj.variants ?? []).map(async (v) => {
      if (!v.defaultSku) return { variant: v, product: null as Product | null }
      const p = await getProduct(v.defaultSku)
      return { variant: v, product: p && p.enabled && !p.hidden ? p : null }
    }),
  )

  const heroProduct =
    variantData.find((d) => d.variant.badge && d.product)?.product ??
    variantData.find((d) => d.product)?.product ??
    null
  const heroImage = heroProduct
    ? resolveProductImage(heroProduct, seriesObj.image)
    : { src: seriesObj.image, isLocal: true, alt: `${seriesObj.productName} module` }

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
            {heroImage.isLocal ? (
              <Image
                src={heroImage.src}
                alt={heroImage.alt}
                width={640}
                height={640}
                sizes="(min-width: 1100px) 480px, 100vw"
                priority
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={heroImage.src} alt={heroImage.alt} loading="eager" />
            )}
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
      {variantData.length > 0 && (
        <section className={familyStyles.sectionWrap}>
          <div className={familyStyles.sectionHead}>
            <span className={familyStyles.sectionEyebrow}>Variants</span>
            <h2 className={familyStyles.sectionHeading}>Available variants</h2>
            <p className={familyStyles.sectionIntro}>
              {variantData.length} LED-count variants in the {seriesObj.productName} line.
              Each available in 3000K / 4000K / 7000K.
            </p>
          </div>
          <div className={styles.variantsGrid}>
            {variantData.map(({ variant: v, product }) => {
              const image = product
                ? resolveProductImage(product, v.image ?? seriesObj.image)
                : null
              const cardClass = v.badge ? styles.variantCardPopular : styles.variantCard
              return (
                <div key={v.name} className={cardClass}>
                  {v.badge && <span className={styles.variantBadge}>{v.badge}</span>}
                  <div className={styles.variantImage}>
                    {image && !image.isLocal ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image.src} alt={image.alt} loading="lazy" />
                    ) : (
                      <Image
                        src={image?.src ?? v.image ?? seriesObj.image}
                        alt={image?.alt ?? `${v.name} ${seriesObj.productName}`}
                        width={400}
                        height={400}
                        sizes="(min-width: 1100px) 25vw, (min-width: 641px) 50vw, 100vw"
                      />
                    )}
                  </div>
                  <h3 className={styles.variantName}>{v.name}</h3>
                  <ul className={styles.variantSpecs}>
                    {v.specs.map((spec) => (
                      <li key={spec}>{spec}</li>
                    ))}
                  </ul>
                  {product?.spec_sheet_url && (
                    <a
                      href={product.spec_sheet_url}
                      className={styles.variantDatasheet}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Datasheet PDF <span aria-hidden="true">↗</span>
                    </a>
                  )}
                </div>
              )
            })}
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

      {/* ============== RESOURCES ============== */}
      {seriesObj.resources && seriesObj.resources.length > 0 && (
        <section className={familyStyles.sectionWrap}>
          <div className={familyStyles.sectionHead}>
            <span className={familyStyles.sectionEyebrow}>Resources</span>
            <h2 className={familyStyles.sectionHeading}>Datasheet &amp; downloads</h2>
            <p className={familyStyles.sectionIntro}>
              Engineering files for {seriesObj.productName} — datasheets, photometric data and
              compliance certificates.
            </p>
          </div>
          <div className={styles.resourcesGrid}>
            {seriesObj.resources.map((r) => {
              const inner = (
                <>
                  <span className={styles.resourceLabel}>{r.label}</span>
                  <h3 className={styles.resourceTitle}>{r.title}</h3>
                  {r.description && (
                    <p className={styles.resourceDesc}>{r.description}</p>
                  )}
                  <span className={styles.resourceCta}>
                    {r.url ? (
                      <>Download {r.meta && <em>· {r.meta}</em>} <span aria-hidden="true">↗</span></>
                    ) : (
                      <>Request via contact {r.meta && <em>· {r.meta}</em>} <span aria-hidden="true">→</span></>
                    )}
                  </span>
                </>
              )
              return r.url ? (
                <a
                  key={r.title}
                  href={r.url}
                  className={styles.resourceCard}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {inner}
                </a>
              ) : (
                <Link key={r.title} href="/contact" className={styles.resourceCard}>
                  {inner}
                </Link>
              )
            })}
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
