// src/lib/product-selector.ts
// Server-only. Reads signage/driver/etc. products from the Payload `Products`
// collection and flattens them into rows for the <ProductSelectorTable>.
// Do NOT import from a client component.
import { listProducts, resolveProductImage, type Product } from './products'
import { datasheetHref } from './asset-url'
import { formatDims } from './units'
import { SELECTOR_CONFIGS, type SeriesMeta, type SelectorRow } from '@/data/selector-config'

export type { SelectorRow } from '@/data/selector-config'

const NUM_TO_WORD: Record<number, string> = { 1: 'Single', 2: 'Duo', 3: 'Triple', 4: 'Quad' }

/** Extract an LED-count label from a product name, or null. */
export function parseLedCount(name: string): string | null {
  const word = name.match(/\b(Single|Duo|Double|Triple|Quad)\b/i)
  if (word) return word[1][0].toUpperCase() + word[1].slice(1).toLowerCase()
  const num = name.match(/\b(\d+)\s*LED\b/i)
  if (num) return NUM_TO_WORD[Number(num[1])] ?? `${num[1]}-LED`
  return null
}

function humanise(code: string): string {
  return code.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function voltageOf(p: Product): string | null {
  const first = (p.led_light_power_input ?? [])[0]
  return first ? first.replace('power_input_', '') : null
}

export async function getProductsForSelector(family: string): Promise<SelectorRow[]> {
  const cfg = SELECTOR_CONFIGS[family]
  if (!cfg) throw new Error(`No selector config for family "${family}"`)
  // limit well above any family's SKU count — the default (48) would silently
  // truncate signage (73 SKUs) and drivers (113).
  const { docs } = await listProducts({ family: cfg.familyCode, limit: 500 })
  const metaByCode = new Map<string, SeriesMeta>(cfg.series.map((s) => [s.code, s]))

  const rows = docs.map((p): SelectorRow => {
    const meta = p.series ? metaByCode.get(p.series) : undefined
    return {
      sku: p.sku,
      name: p.name.replace(/^ENVO\s+/, '').replace(/\s+LED Module/, ''),
      seriesCode: p.series ?? '',
      seriesLabel: meta?.label ?? (p.series ? humanise(p.series) : '—'),
      seriesType: meta?.type ?? 'backlit',
      bestFor: meta?.bestFor ?? null,
      detailHref: meta?.detailHref ?? null,
      voltage: voltageOf(p),
      ledCount: parseLedCount(p.name),
      power_w: p.power_w,
      brightness_lm: p.brightness_lm,
      efficacy_lm_w: p.efficacy_lm_w,
      beam: p.beam_angle_deg != null ? `${p.beam_angle_deg}°` : null,
      cct: p.cct_k != null ? `${Math.round(p.cct_k / 1000)}K` : null,
      cri: p.cri,
      ip: p.waterproof ? p.waterproof.toUpperCase() : null,
      maxInSeries: p.max_in_series,
      heightMm: p.height_mm,
      dims: formatDims(p.length_mm, p.width_mm, p.height_mm),
      image: resolveProductImage(p, '/assets/images/cat-modules.png').src,
      specSheetUrl: p.spec_sheet_url ? datasheetHref(p.sku) : null,
    }
  })

  // Sort by series label then SKU so the table groups each series contiguously
  // (the table groups consecutive rows by series — don't rely on Akeneo order).
  return rows.sort(
    (a, b) => a.seriesLabel.localeCompare(b.seriesLabel) || a.sku.localeCompare(b.sku),
  )
}
