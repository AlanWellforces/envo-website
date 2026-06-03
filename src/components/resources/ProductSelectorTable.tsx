// src/components/resources/ProductSelectorTable.tsx
'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { SelectorRow, FamilySelectorConfig, SelectorFilter } from '@/data/selector-config'
import styles from './ProductSelectorTable.module.css'

const uniq = (xs: (string | null)[]) =>
  [...new Set(xs.filter((x): x is string => !!x))].sort()

export function ProductSelectorTable({
  rows,
  config,
}: {
  rows: SelectorRow[]
  config: FamilySelectorConfig
}) {
  const [q, setQ] = useState('')
  const [series, setSeries] = useState('')
  const [led, setLed] = useState('')
  const [volt, setVolt] = useState('')
  const [cct, setCct] = useState('')
  const [ip, setIp] = useState('')
  const [maxH, setMaxH] = useState(40)

  const opts = useMemo(
    () => ({
      series: uniq(rows.map((r) => r.seriesLabel)),
      led: uniq(rows.map((r) => r.ledCount)),
      volt: uniq(rows.map((r) => r.voltage)),
      cct: uniq(rows.map((r) => r.cct)),
      ip: uniq(rows.map((r) => r.ip)),
    }),
    [rows],
  )

  const filtered = rows.filter(
    (r) =>
      (!q || (r.name + ' ' + r.sku).toLowerCase().includes(q.toLowerCase())) &&
      (!series || r.seriesLabel === series) &&
      (!led || r.ledCount === led) &&
      (!volt || r.voltage === volt) &&
      (!cct || r.cct === cct) &&
      (!ip || r.ip === ip) &&
      (maxH >= 40 || (r.heightMm != null && r.heightMm <= maxH)),
  )

  const backlit = filtered.filter((r) => r.seriesType === 'backlit')
  const sidelit = filtered.filter((r) => r.seriesType === 'sidelit')

  const reset = () => {
    setQ(''); setSeries(''); setLed(''); setVolt(''); setCct(''); setIp(''); setMaxH(40)
  }

  return (
    <div>
      <div className={styles.bar}>
        <div className={`${styles.f} ${styles.search}`}>
          <label>Search</label>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="model or SKU…" />
        </div>
        <Select label="Series" value={series} set={setSeries} opts={opts.series} filter="series" />
        <Select label="LED count" value={led} set={setLed} opts={opts.led} filter="ledCount" />
        <Select label="Voltage" value={volt} set={setVolt} opts={opts.volt} filter="voltage" />
        <Select label="CCT" value={cct} set={setCct} opts={opts.cct} filter="cct" />
        <Select label="IP rating" value={ip} set={setIp} opts={opts.ip} filter="ip" />
        {config.filters.includes('maxHeight') && (
          <div className={styles.f}>
            <label>Max height {maxH >= 40 ? 'any' : `≤${maxH}mm`}</label>
            <input type="range" min={6} max={40} step={1} value={maxH} onChange={(e) => setMaxH(+e.target.value)} />
          </div>
        )}
        <div className={styles.right}>
          <span className={styles.count}><b>{filtered.length}</b> modules</span>
          <button className={styles.reset} onClick={reset}>Reset</button>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table>
          <thead>
            <tr>
              <th></th><th>Model</th><th>Series</th><th>LED</th>
              <th className={styles.num}>Output</th><th className={styles.num}>Power</th>
              <th className={styles.num}>Beam</th><th className={styles.num}>CRI</th><th>IP</th>
              <th className={styles.num}>Max run</th><th>Dimensions (L×W×H)</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td className={styles.none} colSpan={12}>No modules match these filters.</td></tr>
            )}
            <Zone title="Backlit modules" rows={backlit} />
            <Zone title="Sidelit / edge-emitting" rows={sidelit} />
          </tbody>
        </table>
      </div>
      <p className={styles.hint}>
        ↗ <b>View</b> opens the series detail page; greyed = page not built yet.
        Need the full kit? → <Link href="/find-your-match">Find your match</Link>.
      </p>
    </div>
  )

  function Select({ label, value, set, opts, filter }: { label: string; value: string; set: (v: string) => void; opts: string[]; filter: SelectorFilter }) {
    if (!config.filters.includes(filter)) return null
    return (
      <div className={styles.f}>
        <label>{label}</label>
        <select value={value} onChange={(e) => set(e.target.value)}>
          <option value="">All</option>
          {opts.map((o) => <option key={o}>{o}</option>)}
        </select>
      </div>
    )
  }

  function Zone({ title, rows }: { title: string; rows: SelectorRow[] }) {
    if (!rows.length) return null
    const counts = new Map<string, number>()
    for (const r of rows) counts.set(r.seriesLabel, (counts.get(r.seriesLabel) ?? 0) + 1)
    let cur = ''
    const out: React.ReactNode[] = [
      <tr key={title} className={styles.group}><td colSpan={12}>{title} — {rows.length}</td></tr>,
    ]
    for (const r of rows) {
      if (r.seriesLabel !== cur) {
        cur = r.seriesLabel
        out.push(
          <tr key={`${title}-${cur}`} className={styles.group}>
            <td colSpan={12} style={{ paddingLeft: 22 }}>{cur}{r.bestFor ? ` · ${r.bestFor}` : ''} — {counts.get(cur)}</td>
          </tr>,
        )
      }
      out.push(
        <tr key={r.sku}>
          <td>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.thumb} loading="lazy" src={r.image} alt="" />
          </td>
          <td><strong>{r.name}</strong>{r.voltage && <span className={styles.tag}>{r.voltage}</span>}<span className={styles.sub}>{r.sku}</span></td>
          <td><span className={styles.tag} style={{ margin: 0 }}>{r.seriesLabel}</span></td>
          <td>{r.ledCount ?? '—'}</td>
          <td className={styles.num}>{r.brightness_lm ?? '—'} lm<span className={styles.sub}>{r.efficacy_lm_w ?? '—'} lm/W</span></td>
          <td className={styles.num}>{r.power_w ?? '—'} W</td>
          <td className={styles.num}>{r.beam ?? '—'}</td>
          <td className={styles.num}>{r.cri ?? '—'}</td>
          <td>{r.ip ?? '—'}</td>
          <td className={styles.num}>{r.maxInSeries ?? '—'}</td>
          <td>{r.dims ? <>{r.dims.mm}<span className={styles.sub}>{r.dims.in}</span></> : '—'}</td>
          <td>
            {r.detailHref
              ? <Link className={styles.view} href={r.detailHref}>View →</Link>
              : <span className={styles.view} aria-disabled="true">View →</span>}
            {r.specSheetUrl && <a className={styles.pdf} href={r.specSheetUrl} target="_blank" rel="noopener noreferrer">Datasheet ↗</a>}
          </td>
        </tr>,
      )
    }
    return <>{out}</>
  }
}
