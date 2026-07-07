// Data assembly for the SKU detail page (/products/[family]/[sku]) — LED
// Drivers, Control Gear and Accessories only. Signage keeps its merged series
// pages. See docs/superpowers/specs/2026-07-07-product-first-catalogue-design.md §3–4.
import { resolveProductImage, type Product } from '@/lib/products'
import type { ProductFamily } from '@/data/product-families'
import { seriesLineArt } from '@/data/family-map'
import { datasheetHref } from '@/lib/asset-url'
import { formatDims } from '@/lib/units'

/** Product-aware comparison-table layout, chosen by same-series product count.
 *  1 (or 0) → no table; 2–6 → horizontal (specs as rows, SKUs as columns);
 *  >6 → row-based (one row per SKU). See the design spec §4. */
export function pickCompareLayout(sameSeriesCount: number): 'none' | 'horizontal' | 'rows' {
  if (sameSeriesCount <= 1) return 'none'
  if (sameSeriesCount <= 6) return 'horizontal'
  return 'rows'
}

export type CompareColumn = { key: string; label: string; value: (p: Product) => string | null }
export type CompareRow = { sku: string; name: string; href: string; isCurrent: boolean; cells: string[] }
export type SkuDetailProps = {
  breadcrumb: { familyName: string; familyHref: string; name: string }
  sku: string
  name: string
  image: { src: string; local: boolean; alt: string }
  coreSpecs: { label: string; value: string }[]
  datasheetUrl?: string
  compare: { layout: 'none' | 'horizontal' | 'rows'; columns: CompareColumn[]; rows: CompareRow[]; currentSku: string }
}

const dimText = (p: Product): string | null => {
  if (/triac[- ]?dim/i.test(p.name) || p.dimming_control?.includes('triac')) return 'Triac'
  if (p.dimming_control?.includes('dali')) return 'DALI'
  if (p.dimming_control?.includes('0_10v')) return '0–10 V'
  if (/non[- ]?dimmable/i.test(p.name)) return 'None'
  return p.dimming_control?.length ? p.dimming_control.join(' / ') : null
}
const modeText = (p: Product): string | null =>
  p.operation_mode === 'cv' ? 'CV' : p.operation_mode === 'cc' ? 'CC' : p.operation_mode === 'cv_cc' ? 'CV/CC' : null
const ipText = (p: Product): string | null =>
  p.waterproof && p.waterproof !== 'non_waterproof' ? p.waterproof.toUpperCase() : null

const DRIVER_COLUMNS: CompareColumn[] = [
  { key: 'power', label: 'Power', value: (p) => (p.power_w != null ? `${p.power_w} W` : null) },
  { key: 'outv', label: 'Output', value: (p) => (p.output_voltage_v != null ? `${p.output_voltage_v} V` : null) },
  { key: 'dimming', label: 'Dimming', value: dimText },
  { key: 'opmode', label: 'Mode', value: modeText },
  { key: 'ip', label: 'IP', value: ipText },
]
const CONTROL_COLUMNS: CompareColumn[] = [
  { key: 'protocol', label: 'Protocol', value: (p) => (p.dimming_control?.length ? p.dimming_control.join(' / ') : null) },
  { key: 'channels', label: 'Channels', value: (p) => (p.output_channel?.match(/(\d+)/)?.[1] ?? null) },
  { key: 'controltype', label: 'Control type', value: (p) => (p.controller_type?.length ? p.controller_type.join(' / ') : null) },
  { key: 'inv', label: 'Input', value: (p) => (p.input_voltage_min_v != null ? `${p.input_voltage_min_v}${p.input_voltage_max_v && p.input_voltage_max_v !== p.input_voltage_min_v ? `–${p.input_voltage_max_v}` : ''} V` : null) },
]
const ACCESSORY_COLUMNS: CompareColumn[] = [
  { key: 'material', label: 'Material', value: (p) => p.material ?? null },
  { key: 'dims', label: 'Dimensions', value: (p) => formatDims(p.length_mm, p.width_mm, p.height_mm)?.mm ?? null },
  { key: 'ip', label: 'IP', value: ipText },
]

export function compareColumnsFor(slug: string): CompareColumn[] {
  if (slug === 'led-drivers') return DRIVER_COLUMNS
  if (slug === 'control-gear') return CONTROL_COLUMNS
  return ACCESSORY_COLUMNS
}

function coreSpecs(slug: string, p: Product): { label: string; value: string }[] {
  return compareColumnsFor(slug)
    .map((c) => ({ label: c.label, value: c.value(p) }))
    .filter((s): s is { label: string; value: string } => s.value != null)
}

export function buildSkuDetailProps(family: ProductFamily, product: Product, sameSeries: Product[]): SkuDetailProps {
  const img = resolveProductImage(product, seriesLineArt(product.series, family.slug))
  const columns = compareColumnsFor(family.slug)
  const layout = pickCompareLayout(sameSeries.length)
  const rows: CompareRow[] = sameSeries
    .slice()
    .sort((a, b) => (a.power_w ?? 0) - (b.power_w ?? 0) || a.sku.localeCompare(b.sku))
    .map((p) => ({
      sku: p.sku,
      name: p.name,
      href: `/products/${family.slug}/${encodeURIComponent(p.sku)}`,
      isCurrent: p.sku === product.sku,
      cells: columns.map((c) => c.value(p) ?? '—'),
    }))
  return {
    breadcrumb: { familyName: family.name, familyHref: family.href, name: product.name },
    sku: product.sku,
    name: product.name,
    image: { src: img.src, local: img.isLocal, alt: img.alt },
    coreSpecs: coreSpecs(family.slug, product),
    datasheetUrl: product.spec_sheet_url ? (datasheetHref(product.sku) ?? undefined) : undefined,
    compare: { layout, columns, rows, currentSku: product.sku },
  }
}
