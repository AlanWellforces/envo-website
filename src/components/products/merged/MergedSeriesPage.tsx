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
  /** driver column: output rail, e.g. "12 V DC" */
  outputVoltage?: string
  /** driver column: rated output current, e.g. "8.33 A" */
  ratedCurrent?: string
  /** per-model input voltage (always set on driver pages; elsewhere only when models differ) */
  inputVoltage?: string
  /** driver column: per-model dimming, e.g. "Triac", "DALI", "Non-dimmable" */
  dimming?: string
  /** driver column: per-model ingress rating, e.g. "IP67" */
  ip?: string
  /** signage: rendered as "Module size" */
  size?: string
  /** drivers: the same physical dims rendered as "Dimensions" */
  dimensions?: string
  bestFor?: string
}

export type MergedSharedRow = { label: string; value: ReactNode }
export type MergedKeySpec = {
  icon: 'power' | 'voltage' | 'input' | 'mode' | 'dimming' | 'ip' | 'beam' | 'cct' | 'efficacy' | 'lifetime'
  label: string
  value: string
}
export type MergedSolution = { title: string; pick: string; image?: Img }
export type MergedDownload = { name: string; meta?: string; href?: string }
export type MergedRelated = { kicker: string; name: string; href: string; image: Img }

export type MergedSeriesProps = {
  breadcrumb: { familyName: string; familyHref: string; seriesLabel: string }
  eyebrow: string
  title: string
  /** one line under the H1 naming the product type (drivers: what kind of
   *  power supply this series is) — the hero's only prose */
  heroSubtitle?: string
  intro: string
  beadtag?: string
  checklist?: string[]
  /** icon-grid of the series' identity facts, rendered beside the image (≤6) */
  keySpecs?: MergedKeySpec[]
  datasheetUrl?: string
  /** square tiles under the stage; `label` names the model so variants are
   *  tellable apart (user markup 2026-07-06) */
  thumbs?: (Img & { cover?: boolean; label?: string })[]
  variants: MergedVariant[]
  /** 'columns' (default) shows variants as compare columns; 'rows' lists them
   *  as table rows — for series with too many models for a column table. */
  variantLayout?: 'columns' | 'rows'
  sharedRows?: MergedSharedRow[]
  overview?: { heading: string; body: string }
  solutions?: MergedSolution[]
  downloads?: MergedDownload[]
  related?: MergedRelated[]
}

// Per-variant spec rows, rendered only when at least one variant carries a value.
const VARIANT_ROWS: { label: string; key: keyof MergedVariant; cls?: string }[] = [
  { label: 'Model code', key: 'modelCode', cls: 'mono' },
  { label: 'LED beads', key: 'ledBeads' },
  { label: 'Output', key: 'output' },
  { label: 'Power', key: 'power' },
  { label: 'Output voltage', key: 'outputVoltage' },
  { label: 'Rated current', key: 'ratedCurrent' },
  { label: 'Input voltage', key: 'inputVoltage' },
  { label: 'Dimming', key: 'dimming' },
  { label: 'IP rating', key: 'ip' },
  { label: 'Module size', key: 'size' },
  { label: 'Dimensions', key: 'dimensions' },
  { label: 'Best for', key: 'bestFor', cls: 'best' },
]

function Picture({ img, sizes }: { img: Img; sizes: string }) {
  return <Image src={img.src} alt={img.alt} width={300} height={220} sizes={sizes} />
}

const FileIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <path d="M14 2v6h6" />
  </svg>
)

// Stroke icons for the hero key-spec grid, keyed by MergedKeySpec.icon.
const KEY_SPEC_ICONS: Record<MergedKeySpec['icon'], ReactNode> = {
  power: <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />,
  voltage: (
    <>
      <rect x="2" y="7" width="16" height="10" rx="2" />
      <path d="M22 11v2M6 10v4M10 10v4" />
    </>
  ),
  input: (
    <>
      <path d="M9 2v6M15 2v6M6 8h12v4a6 6 0 0 1-12 0V8z" />
      <path d="M12 18v4" />
    </>
  ),
  mode: (
    <>
      <path d="M4 8h10M4 16h6" />
      <circle cx="17" cy="8" r="2.6" />
      <circle cx="13" cy="16" r="2.6" />
    </>
  ),
  dimming: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" />
    </>
  ),
  ip: <path d="M12 3s6 6.3 6 10.2A6 6 0 0 1 6 13.2C6 9.3 12 3 12 3z" />,
  beam: (
    <>
      <path d="M4 20 12 4l8 16" />
      <path d="M8.5 13a7 7 0 0 0 7 0" />
    </>
  ),
  cct: (
    <>
      <circle cx="12" cy="12" r="5" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
    </>
  ),
  efficacy: (
    <>
      <path d="M4 14a8 8 0 0 1 16 0" />
      <path d="M12 14 15.5 9" />
      <path d="M2 18h20" />
    </>
  ),
  lifetime: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
}

/**
 * One page = the whole series. De-shopped hero (variant gallery + service CTA),
 * overview, a single compare + spec table (per-variant rows + shared rows),
 * downloads and related series. Presentational/data-driven: any section or row
 * with no data is omitted rather than shown empty.
 */
export default function MergedSeriesPage(p: MergedSeriesProps) {
  const maxBeads = Math.max(0, ...p.variants.map((v) => v.beads ?? 0))
  const activeVariantRows = VARIANT_ROWS.filter((r) => p.variants.some((v) => v[r.key]))
  const single = p.variants.length === 1

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
              {/* Many-model series show one representative image, not a row of
                  squished figures. ≤4 variants show the full collection set. */}
              <div className="collset">
                {(p.variantLayout === 'rows' ? p.variants.slice(0, 1) : p.variants.slice(0, 4)).map((v) => (
                  <figure key={v.name}>
                    <Picture img={v.image} sizes="120px" />
                    {p.variantLayout !== 'rows' && <figcaption>{v.name}</figcaption>}
                  </figure>
                ))}
              </div>
            </div>
            {p.thumbs && p.thumbs.length > 0 && (
              <div className="thumbs">
                {p.thumbs.map((t, i) => (
                  <figure key={i} className="thumb-fig">
                    <div className={`t${t.cover ? ' cover' : ''}`}>
                      <Picture img={t} sizes="90px" />
                    </div>
                    {t.label && <figcaption>{t.label}</figcaption>}
                  </figure>
                ))}
              </div>
            )}
          </div>

          <div className="p-info">
            <div className="eyebrow">{p.eyebrow}</div>
            <h1>{p.title}</h1>
            {p.heroSubtitle && <p className="hero-sub">{p.heroSubtitle}</p>}
            {/* Hero shows the key-spec grid ONLY (user-locked 2026-07-06):
                no intro paragraph, no grid title, no checklist — the H1 (plus
                the type subtitle) goes straight to the facts. `intro`/
                `checklist` stay in the props for later reuse elsewhere. */}
            {p.keySpecs && p.keySpecs.length > 0 && (
              <div className="kspecs">
                <div className="kspecs-grid">
                  {p.keySpecs.map((s) => (
                    <div key={s.label} className="ks">
                      <svg className="ks-ico" viewBox="0 0 24 24" aria-hidden>
                        {KEY_SPEC_ICONS[s.icon]}
                      </svg>
                      <span className="ks-bd">
                        <span className="ks-lab">{s.label}</span>
                        <span className="ks-val">{s.value}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
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

        {/* ===== SPEC — single model: one combined definition list ===== */}
        {single && (activeVariantRows.length > 0 || (p.sharedRows && p.sharedRows.length > 0)) && (
          <div className="compare">
            <div className="lead">
              <div className="eyebrow">Specifications</div>
              <h2>Full specification.</h2>
            </div>
            <dl className="shared-specs">
              {activeVariantRows
                .filter((r) => r.key !== 'bestFor')
                .map((r) => (
                  <div key={r.key}>
                    <dt>{r.label}</dt>
                    <dd className={r.cls}>{(p.variants[0][r.key] as string) ?? '—'}</dd>
                  </div>
                ))}
              {p.sharedRows?.map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
            {p.variants[0].bestFor && <p className="spec-bestfor">Best for {p.variants[0].bestFor}.</p>}
          </div>
        )}

        {/* ===== COMPARE + SPEC TABLE (multi-model) ===== */}
        {!single &&
          (activeVariantRows.length > 0 || (p.sharedRows && p.sharedRows.length > 0)) &&
          (p.variantLayout === 'rows' ? (
            // Many models → variants as rows + shared specs as a definition list.
            <div className="compare">
              <div className="lead">
                <div className="eyebrow">Specifications</div>
                <h2>{p.variants.length} models — full spec reference.</h2>
              </div>
              {(() => {
                const cols = activeVariantRows.filter((r) => r.key !== 'modelCode' && r.key !== 'bestFor')
                return (
                  <div className="cmp-tablewrap">
                    <table className="cmp-table rows">
                      <thead>
                        <tr>
                          <th className="rowhead">Model</th>
                          {cols.map((r) => (
                            <th key={r.key}>{r.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {p.variants.map((v) => (
                          <tr key={v.name}>
                            <th className="mono">{v.modelCode ?? v.name}</th>
                            {cols.map((r) => (
                              <td key={r.key} className={r.cls}>
                                {(v[r.key] as string) ?? '—'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              })()}
              {p.sharedRows && p.sharedRows.length > 0 && (
                <dl className="shared-specs">
                  {p.sharedRows.map((row) => (
                    <div key={row.label}>
                      <dt>{row.label}</dt>
                      <dd>{row.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          ) : (
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
          ))}

        {/* ===== SOLUTIONS — where this series fits ===== */}
        {p.solutions && p.solutions.length > 0 && (
          <div className="solutions">
            <div className="sol-head">
              <div className="eyebrow">Where it works</div>
              <h2>Built for the job.</h2>
            </div>
            <div className={`sol-grid${p.solutions.some((s) => s.image) ? ' has-img' : ''}`}>
              {p.solutions.map((s) => (
                <div key={s.title} className={`sol-card${s.image ? ' img' : ''}`}>
                  {s.image && (
                    <div className="sol-img">
                      <Picture img={s.image} sizes="280px" />
                    </div>
                  )}
                  <div className="sol-bd">
                    <h3>{s.title}</h3>
                    <p>{s.pick}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== DOWNLOADS — only files we actually host; the rest is a request link ===== */}
        {(() => {
          const files = (p.downloads ?? []).filter((d) => d.href)
          if (files.length === 0) return null
          return (
            <div className="downloads">
              <div className="dl-head">
                <div className="eyebrow">Downloads</div>
                <h2>Specs, drawings and compliance — one click away.</h2>
              </div>
              <div className="dl-grid">
                {files.map((d) => (
                  <a key={d.name} className="dl-card" href={d.href} target="_blank" rel="noopener noreferrer">
                    <span className="dl-ico">
                      <FileIcon />
                    </span>
                    <span className="dl-body">
                      <span className="dl-name">{d.name}</span>
                      {d.meta && <span className="dl-meta">{d.meta}</span>}
                    </span>
                    <span className="dl-arrow">↓</span>
                  </a>
                ))}
              </div>
              <p className="dl-contact">
                Need installation guides, drawings or compliance certificates?{' '}
                <Link href="/contact">Request files →</Link>
              </p>
            </div>
          )
        })()}

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
