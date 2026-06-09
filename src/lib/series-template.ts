import type { Product } from './products'
import { resolveProductImage } from './products'
import { parseLedCount } from './product-selector'

export type SeriesModel = {
  code: string                 // suffix-less model code, e.g. EV-BLUF02LBY
  leds: string                 // Single | Double | Triple | Quad | —
  powerW: number | null
  lumens: number | null
  dimsMm: string | null
  image: { src: string; isLocal: boolean; alt: string }
  datasheetUrl: string | null
}

const stripCct = (sku: string) => sku.replace(/-(WW|NW|CW)$/i, '')
const num = (n: unknown): number | null =>
  typeof n === 'number' && !Number.isNaN(n) ? n : null

/** Collapse CCT variants into suffix-less models, sorted by ascending power. */
export function groupSeriesModels(products: Product[]): SeriesModel[] {
  const byCode = new Map<string, Product[]>()
  for (const prod of products) {
    const code = stripCct(prod.sku)
    const list = byCode.get(code) ?? []
    list.push(prod)
    byCode.set(code, list)
  }
  const rows: SeriesModel[] = []
  for (const [code, skus] of byCode) {
    const rep = skus[0]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productName: string | null = (rep as any).productName ?? null
    const labelSource: string = productName ?? rep.name
    const lwh = [num(rep.length_mm), num(rep.width_mm), num(rep.height_mm)]
    rows.push({
      code,
      leds: parseLedCount(labelSource) ?? '—',
      powerW: num(rep.power_w),
      lumens: num(rep.brightness_lm),
      dimsMm: lwh.every((x) => x != null) ? lwh.join(' × ') : null,
      image: resolveProductImage(rep, ''),
      datasheetUrl: rep.spec_sheet_url ?? null,
    })
  }
  return rows.sort((a, b) => (a.powerW ?? 0) - (b.powerW ?? 0))
}
