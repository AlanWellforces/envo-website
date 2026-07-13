'use client'

// SKU detail pages: "All models in this series" — the sibling selector table
// that used to live inside the Specifications tab (2026-07-13 spec split).
// The viewed SKU is pinned to the first row (tinted + "Current" badge); every
// other row links to its own SKU page and the whole row is a click target.
// Columns carry only what actually differs between models — certifications /
// protections / warranty are series-invariant by design and compact into the
// subtitle line instead (user 2026-07-13: no footer strip, no dedicated column).
// Mobile (<700px) keeps the table shape but narrows to Model + two key columns
// and collapses to the first 5 rows behind a "Show all" button.

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import type { MergedVariant } from './MergedSeriesPage'

const MOBILE_ROWS = 5

// Generic red "PDF file" mark — same glyph as the spec tables (deliberately
// not Adobe's trademarked loop).
const PdfIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden className="pdf-ico">
    <path
      d="M6 2h8.5L20 7.5V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
      fill="none"
      stroke="#e5252a"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    <path d="M14.5 2v5.5H20" fill="none" stroke="#e5252a" strokeWidth="1.7" strokeLinejoin="round" />
    <text x="12" y="17.5" textAnchor="middle" fontSize="6.5" fontWeight="800" fill="#e5252a">
      PDF
    </text>
  </svg>
)

// "103 × 16 × 35.5 mm (4.06 × 0.63 × 1.4 in)" → bold-ish mm line + muted
// imperial line (dual-unit rule; two lines keep the row height stable).
function DimsCell({ value }: { value: string }) {
  const cut = value.indexOf(' (')
  if (cut === -1) return <>{value}</>
  return (
    <span className="dims">
      <b>{value.slice(0, cut)}</b>
      <span className="sub">{value.slice(cut + 1)}</span>
    </span>
  )
}

type Col = {
  key: string
  label: string
  /** shown on mobile (Model column always is) */
  mobile?: boolean
  render: (v: MergedVariant) => ReactNode
}

// Ordered column candidates — a column renders only when at least one model
// carries a value. ratedCurrent rides under outputVoltage as a sub-line.
function buildColumns(variants: MergedVariant[]): Col[] {
  const has = (k: keyof MergedVariant) => variants.some((v) => v[k])
  const cols: Col[] = []
  if (has('power')) cols.push({ key: 'power', label: 'Power', mobile: true, render: (v) => v.power ?? '—' })
  if (has('outputVoltage'))
    cols.push({
      key: 'out',
      label: 'Output',
      mobile: true,
      render: (v) => (
        <>
          {v.outputVoltage ?? '—'}
          {v.ratedCurrent && <span className="sub">{v.ratedCurrent}</span>}
        </>
      ),
    })
  if (has('ledBeads')) cols.push({ key: 'beads', label: 'LED beads', mobile: !has('outputVoltage'), render: (v) => v.ledBeads ?? '—' })
  if (has('output')) cols.push({ key: 'lm', label: 'Light output', mobile: !has('outputVoltage'), render: (v) => v.output ?? '—' })
  if (has('inputVoltage')) cols.push({ key: 'in', label: 'Input voltage', render: (v) => v.inputVoltage ?? '—' })
  if (has('type') || has('ip'))
    cols.push({
      key: 'typeip',
      label: has('type') && has('ip') ? 'Type · IP' : has('type') ? 'Type' : 'IP rating',
      render: (v) => [v.type, v.ip].filter(Boolean).join(' · ') || '—',
    })
  if (has('dimming')) cols.push({ key: 'dim', label: 'Dimming', render: (v) => v.dimming ?? '—' })
  if (has('size') || has('dimensions'))
    cols.push({
      key: 'dims',
      label: 'Dimensions',
      render: (v) => {
        const d = v.size ?? v.dimensions
        return d ? <DimsCell value={d} /> : '—'
      },
    })
  if (has('datasheetUrl'))
    cols.push({
      key: 'ds',
      label: 'Spec sheet',
      render: (v) =>
        v.datasheetUrl ? (
          <a
            href={v.datasheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Spec sheet PDF — ${v.modelCode ?? v.name}`}
            title="Spec sheet (PDF)"
          >
            <PdfIcon />
          </a>
        ) : (
          '—'
        ),
    })
  return cols
}

// Subtitle: the series facts in one line — count, power span, voltage rails,
// then whatever is IDENTICAL across every model (certs / protections /
// warranty left the table because a series shares them; stated once here).
function buildSubtitle(variants: MergedVariant[]): string {
  const parts: string[] = [`${variants.length} models`]

  const watts = variants
    .map((v) => Number(v.power?.match(/([\d.]+)\s*W/)?.[1]))
    .filter((n) => !Number.isNaN(n) && n > 0)
  if (watts.length === variants.length && watts.length > 0) {
    const lo = Math.min(...watts)
    const hi = Math.max(...watts)
    parts.push(lo === hi ? `${lo} W` : `${lo}–${hi} W`)
  }

  const outs = [...new Set(variants.map((v) => v.outputVoltage).filter((x): x is string => !!x))]
  if (outs.length) {
    const volts = outs.map((o) => o.match(/^([\d.]+) V DC$/)?.[1])
    parts.push(
      volts.every(Boolean)
        ? `${volts.sort((a, b) => Number(a) - Number(b)).join(' / ')} V DC output`
        : outs.join(' / '),
    )
  }

  // series-invariant only — a value missing on any model is never claimed
  const uniform = (k: keyof MergedVariant): string | null => {
    const vals = variants.map((v) => v[k])
    return vals.every((x) => typeof x === 'string' && x === vals[0]) ? (vals[0] as string) : null
  }
  const certs = uniform('certifications')
  if (certs) parts.push(`${certs} listed`)
  const prot = uniform('protections')
  if (prot) parts.push(`${prot} protection`)
  const warranty = uniform('warranty')
  if (warranty) parts.push(`${warranty} warranty`)

  return parts.join(' · ')
}

export function SeriesModelsSection({ eyebrow, variants }: { eyebrow: string; variants: MergedVariant[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const cols = buildColumns(variants)
  const collapsible = variants.length > MOBILE_ROWS + 1

  return (
    <section className="models-band" id="models">
      <div className="mb-eyebrow">{eyebrow}</div>
      <h2>All models in this series</h2>
      <p className="mb-sub">{buildSubtitle(variants)}</p>
      <div className="mb-tablewrap">
        <table className={`mdl-table${open ? ' open' : ''}`}>
          <thead>
            <tr>
              <th>Model</th>
              {cols.map((c) => (
                <th key={c.key} className={c.mobile ? undefined : 'dsk'}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {variants.map((v, i) => {
              const code = v.modelCode ?? v.name
              const rowCls = [v.current ? 'cur' : '', i >= MOBILE_ROWS ? 'xtr' : ''].filter(Boolean).join(' ')
              return (
                <tr
                  key={code}
                  className={rowCls || undefined}
                  onClick={
                    v.href && !v.current
                      ? (e) => {
                          // real links inside the row (code, PDF) keep their own behaviour
                          if (!(e.target as HTMLElement).closest('a')) router.push(v.href!)
                        }
                      : undefined
                  }
                >
                  <th>
                    <span className="mrow">
                      <span className="mthumb">
                        <Image src={v.image.src} alt={v.image.alt} width={92} height={76} sizes="46px" />
                      </span>
                      <span>
                        {v.href && !v.current ? (
                          <Link href={v.href} className="mcode">
                            {code}
                          </Link>
                        ) : (
                          <span className="mcode">{code}</span>
                        )}
                        {v.current && <span className="chip-cur">Current</span>}
                      </span>
                    </span>
                  </th>
                  {cols.map((c) => (
                    <td key={c.key} className={c.mobile ? undefined : 'dsk'}>
                      {c.render(v)}
                    </td>
                  ))}
                </tr>
              )
            })}
            {collapsible && !open && (
              <tr className="mb-more">
                <td colSpan={cols.length + 1}>
                  <button type="button" onClick={() => setOpen(true)}>
                    Show all {variants.length} models ↓
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
