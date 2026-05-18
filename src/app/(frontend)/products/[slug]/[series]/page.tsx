import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EnvoButton } from '@/components/ui/envo-button'
import { PRODUCT_FAMILIES, type SeriesLink } from '@/data/product-families'
import { listProducts, type Product } from '@/lib/products'
import familyStyles from '../page.module.css'
import styles from './page.module.css'

type Params = Promise<{ slug: string; series: string }>

/** Narrow a SeriesLink to its live (non-`#`) variant. */
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
    title: `${seriesObj.label} — ${family.name} — ENVO`,
    description: seriesObj.description,
  }
}

// ---- formatters ------------------------------------------------------------

function fmtRange(values: (number | null)[], unit: string): string | null {
  const nums = values.filter((v): v is number => v != null)
  if (nums.length === 0) return null
  const min = Math.min(...nums)
  const max = Math.max(...nums)
  return min === max ? `${min} ${unit}` : `${min}–${max} ${unit}`
}

function fmtList(values: (string | null)[]): string | null {
  const set = new Set(values.filter((v): v is string => v != null && v !== ''))
  if (set.size === 0) return null
  return [...set].sort().join(' / ')
}

function fmtIp(value: string | null): string {
  if (!value) return '—'
  return value.toUpperCase().replace(/_/g, ' ')
}

// ---- page ------------------------------------------------------------------

export default async function SeriesDetailPage({ params }: { params: Params }) {
  const { slug, series } = await params
  const family = PRODUCT_FAMILIES.find((f) => f.slug === slug)
  if (!family) notFound()
  const seriesObj = family.series.find((s): s is LiveSeries => isLive(s) && s.slug === series)
  if (!seriesObj) notFound()

  const { docs: products } = await listProducts({
    family: family.familyCode,
    series: seriesObj.seriesCode,
    limit: 100,
  })

  const variantCount = products.length
  const powerRange = fmtRange(
    products.map((p) => p.power_w),
    'W',
  )
  const cctList = fmtList(products.map((p) => (p.cct_k != null ? `${p.cct_k}K` : null)))
  const ipList = fmtList(products.map((p) => (p.waterproof ? fmtIp(p.waterproof) : null)))

  // Sibling series (same family, excluding current). Used for the bottom strip.
  const siblings = family.series.filter((s) => !(isLive(s) && s.slug === series))

  // Unique datasheets across variants — small download list.
  const datasheets = Array.from(
    new Set(products.map((p) => p.spec_sheet_url).filter((u): u is string => !!u)),
  )

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

      <section className="sig-hero">
        <div className="container">
          <div className="sig-hero-inner">
            <span className="sig-eyebrow">{seriesObj.subtitle}</span>
            <h1>{seriesObj.label}</h1>
            <p className="sig-hero-desc">{seriesObj.description}</p>
          </div>
        </div>
      </section>

      <div className={familyStyles.heroImage}>
        <div className={familyStyles.heroImageInner}>
          <Image
            src={family.image}
            alt={`${seriesObj.label} module`}
            fill
            sizes="(min-width: 1400px) 1320px, 100vw"
            style={{ objectFit: 'contain', padding: '5%' }}
            priority
          />
        </div>
      </div>

      <div className="sig-stats">
        <div className="sig-stat">
          <div className="sig-stat-label">Variants</div>
          <div className="sig-stat-value">{variantCount || '—'}</div>
        </div>
        <div className="sig-stat">
          <div className="sig-stat-label">Power range</div>
          <div className="sig-stat-value">{powerRange ?? '—'}</div>
        </div>
        <div className="sig-stat">
          <div className="sig-stat-label">Color temp</div>
          <div className="sig-stat-value">{cctList ?? '—'}</div>
        </div>
        <div className="sig-stat">
          <div className="sig-stat-label">Rating</div>
          <div className="sig-stat-value">{ipList ?? '—'}</div>
        </div>
      </div>

      <section className={styles.variantsSection}>
        <div className="container">
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionHeading}>Variants in this series</h2>
            <span className={styles.sectionMeta}>
              {variantCount} {variantCount === 1 ? 'SKU' : 'SKUs'}
            </span>
          </div>

          {products.length === 0 ? (
            <div className={styles.empty}>
              Variant data for this series is not yet synced. Talk to engineering for current
              availability.
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">SKU</th>
                    <th scope="col">Name</th>
                    <th scope="col">Power</th>
                    <th scope="col">Voltage</th>
                    <th scope="col">CCT</th>
                    <th scope="col">Rating</th>
                    <th scope="col">Datasheet</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p: Product) => (
                    <tr key={p.id}>
                      <td className={styles.sku}>{p.sku}</td>
                      <td>{p.name}</td>
                      <td className={styles.spec}>
                        {p.power_w != null ? `${p.power_w} W` : <span className={styles.dash}>—</span>}
                      </td>
                      <td className={styles.spec}>
                        {p.output_voltage_v != null ? (
                          `${p.output_voltage_v} V`
                        ) : (
                          <span className={styles.dash}>—</span>
                        )}
                      </td>
                      <td className={styles.spec}>
                        {p.cct_k != null ? `${p.cct_k}K` : <span className={styles.dash}>—</span>}
                      </td>
                      <td className={styles.spec}>
                        {p.waterproof ? fmtIp(p.waterproof) : <span className={styles.dash}>—</span>}
                      </td>
                      <td>
                        {p.spec_sheet_url ? (
                          <a
                            className={styles.dlLink}
                            href={p.spec_sheet_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            PDF →
                          </a>
                        ) : (
                          <span className={styles.dash}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {datasheets.length > 1 && (
            <p className={styles.sectionMeta} style={{ marginTop: 12 }}>
              {datasheets.length} unique datasheets across this series.
            </p>
          )}
        </div>
      </section>

      <section className={styles.siblingSection}>
        <div className="container">
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionHeading}>Other series in {family.name}</h2>
          </div>
          <p className={styles.siblingIntro}>
            Sibling series tuned for different applications within the family. Live series link to
            their detail page — others are rolling out.
          </p>
          <div className={styles.siblingList}>
            {siblings.map((s) =>
              isLive(s) ? (
                <Link key={s.label} href={s.href} className={styles.siblingItem}>
                  {s.label} →
                </Link>
              ) : (
                <span key={s.label} className={styles.siblingItemDisabled}>
                  {s.label}
                  <em>· Coming soon</em>
                </span>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="sig-cta-banner">
        <div className="sig-cta-inner">
          <span className="sig-cta-eyebrow">Find your match · 60-sec wizard</span>
          <h2>
            Spec the right {seriesObj.label} variant. <em>And the system around it.</em>
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
