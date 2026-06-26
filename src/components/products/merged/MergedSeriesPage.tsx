import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { PURCHASE_CHANNELS } from '@/data/purchase-channels'
import './merged-series.css'

type Img = { src: string; local: boolean; alt: string }

export type MergedVariant = {
  name: string
  /** beads lit (drives the lime dots); falls back to no dots when undefined */
  beads?: number
  image: Img
  star?: boolean
  modelCode?: string
  ledBeads?: string
  output?: string
  power?: string
  size?: string
  bestFor?: string
}

export type MergedSharedRow = { label: string; value: ReactNode }
export type MergedDownload = { name: string; meta?: string; href?: string }
export type MergedRelated = { kicker: string; name: string; href: string; image: Img }

export type MergedSeriesProps = {
  breadcrumb: { familyName: string; familyHref: string; seriesLabel: string }
  eyebrow: string
  title: string
  intro: string
  beadtag?: string
  checklist?: string[]
  datasheetUrl?: string
  thumbs?: (Img & { cover?: boolean })[]
  variants: MergedVariant[]
  sharedRows?: MergedSharedRow[]
  overview?: { heading: string; body: string }
  downloads?: MergedDownload[]
  related?: MergedRelated[]
}

// Per-variant spec rows, rendered only when at least one variant carries a value.
const VARIANT_ROWS: { label: string; key: keyof MergedVariant; cls?: string }[] = [
  { label: 'Model code', key: 'modelCode', cls: 'mono' },
  { label: 'LED beads', key: 'ledBeads' },
  { label: 'Output', key: 'output' },
  { label: 'Power', key: 'power' },
  { label: 'Module size', key: 'size' },
  { label: 'Best for', key: 'bestFor', cls: 'best' },
]

function Picture({ img, sizes }: { img: Img; sizes: string }) {
  return img.local ? (
    <Image src={img.src} alt={img.alt} width={300} height={220} sizes={sizes} />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={img.src} alt={img.alt} loading="lazy" />
  )
}

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const FileIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <path d="M14 2v6h6" />
  </svg>
)

/**
 * One page = the whole series. De-shopped hero (variant gallery + service CTA),
 * overview, a single compare + spec table (per-variant rows + shared rows),
 * downloads and related series. Presentational/data-driven: any section or row
 * with no data is omitted rather than shown empty.
 */
export default function MergedSeriesPage(p: MergedSeriesProps) {
  const maxBeads = Math.max(0, ...p.variants.map((v) => v.beads ?? 0))
  const activeVariantRows = VARIANT_ROWS.filter((r) => p.variants.some((v) => v[r.key]))

  return (
    <div className="theme-light pdetail">
      <div className="wrap">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">›</span>
          <Link href="/products">Products</Link>
          <span className="sep">›</span>
          <Link href={p.breadcrumb.familyHref}>{p.breadcrumb.familyName}</Link>
          <span className="sep">›</span>
          <span>{p.breadcrumb.seriesLabel}</span>
        </div>

        {/* ===== HERO ===== */}
        <div className="p-hero">
          <div className="gallery">
            <div className="gstage">
              {p.beadtag && <span className="beadtag">{p.beadtag}</span>}
              <div className="collset">
                {p.variants.map((v) => (
                  <figure key={v.name}>
                    <Picture img={v.image} sizes="120px" />
                    <figcaption>{v.name}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
            {p.thumbs && p.thumbs.length > 0 && (
              <div className="thumbs">
                {p.thumbs.map((t, i) => (
                  <div key={i} className={`t${t.cover ? ' cover' : ''}`}>
                    <Picture img={t} sizes="90px" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-info">
            <div className="eyebrow">{p.eyebrow}</div>
            <h1>{p.title}</h1>
            <p className="intro">{p.intro}</p>

            {p.checklist && p.checklist.length > 0 && (
              <ul className="checklist">
                {p.checklist.map((c) => (
                  <li key={c}>
                    <CheckIcon />
                    {c}
                  </li>
                ))}
              </ul>
            )}

            <div className="cta">
              <Link className="cta-primary" href="/free-layout-design">
                Get a free layout design<span>→</span>
              </Link>
              {p.datasheetUrl && (
                <a className="cta-ghost" href={p.datasheetUrl} target="_blank" rel="noopener noreferrer">
                  ↓ Datasheet (PDF)
                </a>
              )}
            </div>
            <div className="wtb">
              <span className="wtb-lab">Where to buy</span>
              {PURCHASE_CHANNELS.map((c, i) => (
                <span key={c.id} style={{ display: 'inline-flex', gap: 9, alignItems: 'center' }}>
                  {i > 0 && <span className="wtb-dot">·</span>}
                  <a href={c.url} target="_blank" rel="noopener noreferrer">
                    {c.regionLabel}
                  </a>
                </span>
              ))}
            </div>
            <div className="buyfine">Sold through authorised distributors</div>
          </div>
        </div>

        {/* ===== OVERVIEW ===== */}
        {p.overview && (
          <div className="overview">
            <div className="eyebrow">Overview</div>
            <h2>{p.overview.heading}</h2>
            <p>{p.overview.body}</p>
          </div>
        )}

        {/* ===== COMPARE + SPEC TABLE ===== */}
        {(activeVariantRows.length > 0 || (p.sharedRows && p.sharedRows.length > 0)) && (
          <div className="compare">
            <div className="lead">
              <div className="eyebrow">Specifications</div>
              <h2>Compare the range — and every shared spec.</h2>
            </div>
            <div className="cmp-tablewrap">
              <table className="cmp-table">
                <thead>
                  <tr>
                    <th className="rowhead" />
                    {p.variants.map((v) => (
                      <th key={v.name} className={`vcol${v.star ? ' c-star' : ''}`}>
                        {v.star && <span className="star">★ most specified</span>}
                        <div className="vimg">
                          <Picture img={v.image} sizes="110px" />
                        </div>
                        {maxBeads > 0 && (
                          <div className="dots">
                            {Array.from({ length: maxBeads }).map((_, i) => (
                              <i key={i} className={i < (v.beads ?? 0) ? '' : 'off'} />
                            ))}
                          </div>
                        )}
                        <div className="nm">{v.name}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeVariantRows.map((row) => (
                    <tr key={row.key}>
                      <th>{row.label}</th>
                      {p.variants.map((v) => (
                        <td key={v.name} className={row.cls}>
                          {(v[row.key] as string) ?? '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {p.sharedRows?.map((row) => (
                    <tr key={row.label}>
                      <th>{row.label}</th>
                      <td className="shared" colSpan={p.variants.length}>
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== DOWNLOADS ===== */}
        {p.downloads && p.downloads.length > 0 && (
          <div className="downloads">
            <div className="dl-head">
              <div className="eyebrow">Downloads</div>
              <h2>Specs, drawings and compliance — one click away.</h2>
            </div>
            <div className="dl-grid">
              {p.downloads.map((d) => {
                const inner = (
                  <>
                    <span className="dl-ico">
                      <FileIcon />
                    </span>
                    <span className="dl-body">
                      <span className="dl-name">{d.name}</span>
                      {d.meta && <span className="dl-meta">{d.meta}</span>}
                    </span>
                    <span className="dl-arrow">↓</span>
                  </>
                )
                return d.href ? (
                  <a key={d.name} className="dl-card" href={d.href} target="_blank" rel="noopener noreferrer">
                    {inner}
                  </a>
                ) : (
                  <Link key={d.name} className="dl-card" href="/contact">
                    {inner}
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* ===== RELATED ===== */}
        {p.related && p.related.length > 0 && (
          <div className="rel">
            <div className="rel-head">
              <h2>Pairs with</h2>
              <Link href={p.breadcrumb.familyHref}>All {p.breadcrumb.familyName.toLowerCase()} →</Link>
            </div>
            <div className="rel-grid">
              {p.related.map((r) => (
                <Link key={r.name} className="rel-card" href={r.href}>
                  <div className="iw">
                    <Picture img={r.image} sizes="220px" />
                  </div>
                  <div className="bd">
                    <div className="rl">{r.kicker}</div>
                    <div className="rn">{r.name}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
