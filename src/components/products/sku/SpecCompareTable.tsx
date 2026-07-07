import Link from 'next/link'
import './sku-detail.css'

type Row = { sku: string; name: string; href: string; isCurrent: boolean; cells: string[] }
type Compare = { layout: 'none' | 'horizontal' | 'rows'; columns: { key: string; label: string }[]; rows: Row[]; currentSku: string }

export function SpecCompareTable({ compare }: { compare: Compare }) {
  if (compare.layout === 'none') return null
  const { columns, rows } = compare

  // Row-based (>6): one row per SKU, action column. Also the mobile form for all layouts.
  const RowBased = (
    <table className="skc-table skc-rows">
      <thead>
        <tr><th>Model</th>{columns.map((c) => <th key={c.key}>{c.label}</th>)}<th aria-label="action" /></tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.sku} className={r.isCurrent ? 'is-current' : undefined}>
            <th scope="row">{r.sku}</th>
            {r.cells.map((cell, i) => <td key={columns[i].key}>{cell}</td>)}
            <td>{r.isCurrent ? <span className="skc-current">Current</span> : <Link href={r.href} className="skc-view">View product</Link>}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  // Horizontal (2–6): specs as rows, SKUs as columns, current column highlighted.
  const Horizontal = (
    <table className="skc-table skc-horizontal">
      <thead>
        <tr>
          <th />
          {rows.map((r) => (
            <th key={r.sku} className={r.isCurrent ? 'is-current' : undefined}>
              {r.sku}
              {r.isCurrent ? <span className="skc-current">Current</span> : <Link href={r.href} className="skc-view">View</Link>}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {columns.map((c, ci) => (
          <tr key={c.key}>
            <th scope="row">{c.label}</th>
            {rows.map((r) => <td key={r.sku} className={r.isCurrent ? 'is-current' : undefined}>{r.cells[ci]}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  )

  return (
    <div className="skc-compare">
      <div className="skc-desktop">{compare.layout === 'rows' ? RowBased : Horizontal}</div>
      {/* Mobile always uses the readable row-based form (no wide horizontal scroll). */}
      <div className="skc-mobile">{RowBased}</div>
    </div>
  )
}
