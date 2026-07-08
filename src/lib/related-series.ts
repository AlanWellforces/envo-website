// Data-driven "Pairs with" cards for series + SKU detail pages: CONCRETE
// paired products (user 2026-07-09 — not series, not categories), linking to
// their SKU detail pages. Matching is spec-based and deterministic:
//   · modules ↔ drivers on the CV rail (24 V OptiLume ↔ 24 V drivers)
//   · RGB context ↔ 5C zigbee receivers
//   · sibling card = the adjacent model in the product's own series
// Kickers carry the old-site customer category (#161 taxonomy) so the card
// still says which menu bucket the pick lives in.
import type { MergedRelated } from '@/components/products/merged/MergedSeriesPage'
import type { Product } from './products'
import { resolveProductImage } from './products'
import {
  SIGNAGE_CATEGORY_ORDER, signageSeriesCategory,
  DRIVER_CATEGORY_ORDER, driverCategories,
  CONTROL_GEAR_CATEGORY_ORDER, controlGearCategories,
  seriesLineArt,
} from '@/data/family-map'
import { PRODUCT_FAMILIES } from '@/data/product-families'

/** Complementary families to cross-sell from each family's detail pages. */
export const COMPLEMENT_FAMILIES: Record<string, string[]> = {
  'led-signage-modules': ['led-drivers', 'control-gear'],
  'led-drivers': ['led-signage-modules', 'control-gear'],
  'control-gear': ['led-drivers', 'led-signage-modules'],
  accessories: ['control-gear', 'led-drivers'],
}

const CATEGORY_ORDER: Record<string, readonly string[]> = {
  'led-signage-modules': SIGNAGE_CATEGORY_ORDER,
  'led-drivers': DRIVER_CATEGORY_ORDER,
  'control-gear': CONTROL_GEAR_CATEGORY_ORDER,
}

/** Customer categories a product belongs to — empty for unmapped/gated series,
    which therefore never surface as a pick. */
function categoriesOf(familySlug: string, p: Product): string[] {
  if (familySlug === 'led-signage-modules') {
    const c = signageSeriesCategory(p.series)
    return c ? [c] : []
  }
  if (familySlug === 'led-drivers') return driverCategories(p.series) ?? []
  if (familySlug === 'control-gear') return controlGearCategories(p)
  return []
}

function familyName(slug: string): string {
  return PRODUCT_FAMILIES.find((f) => f.slug === slug)?.name ?? slug
}

const bySku = (a: Product, b: Product) => a.sku.localeCompare(b.sku)
const byPowerThenSku = (a: Product, b: Product) =>
  (a.power_w ?? Number.MAX_SAFE_INTEGER) - (b.power_w ?? Number.MAX_SAFE_INTEGER) || bySku(a, b)
// siblings walk voltage-mates first, so a 24 V model's neighbour stays 24 V
const byVoltagePowerSku = (a: Product, b: Product) =>
  (a.output_voltage_v ?? 0) - (b.output_voltage_v ?? 0) || byPowerThenSku(a, b)

/** Deterministic representative: the (lower) median of a sorted list — a
    mid-range pick, not the smallest or biggest model. */
const mid = <T,>(arr: T[]): T | null => (arr.length ? arr[Math.floor((arr.length - 1) / 2)] : null)

const isZigbee = (p: Product | null) => !!p && (p.series === 'envo_zigbee' || /zigbee/i.test(p.name ?? ''))
const isRgb = (p: Product | null) => !!p && (p.series === 'envo_chromaflux' || /\brgb\b/i.test(p.name ?? ''))

/** The CV rail voltage of the page being viewed (modules: 12 V except the
    24 V OptiLume line — PIM voltage is nulled by the sync, so series decides). */
function railVoltage(familySlug: string, current: Product | null): number {
  if (familySlug === 'led-signage-modules') return current?.series === 'envo_optilume' ? 24 : 12
  return 12
}

function pickDriver(current: Product | null, currentFamily: string, drivers: Product[]): Product | null {
  const eligible = drivers.filter((p) => categoriesOf('led-drivers', p).length)
  const v = currentFamily === 'led-drivers' ? null : railVoltage(currentFamily, current)
  const matching = eligible.filter((p) => p.operation_mode !== 'cc' && p.output_voltage_v === v)
  return mid((matching.length ? matching : eligible).sort(byPowerThenSku))
}

function pickModule(current: Product | null, currentFamily: string, modules: Product[]): Product | null {
  const eligible = modules.filter((p) => categoriesOf('led-signage-modules', p).length)
  const preferred =
    currentFamily === 'led-drivers' && current?.output_voltage_v === 24
      ? eligible.filter((p) => p.series === 'envo_optilume')
      : isZigbee(current) || isRgb(current)
        ? eligible.filter((p) => p.series === 'envo_chromaflux')
        : eligible.filter((p) => p.series === 'envo_ecoglo')
  return mid((preferred.length ? preferred : eligible).sort(bySku))
}

function pickControl(current: Product | null, controls: Product[]): Product | null {
  const eligible = controls.filter((p) => categoriesOf('control-gear', p).length)
  const zigs = eligible.filter(isZigbee)
  let pool = zigs.length ? zigs : eligible
  // a receiver/dimmer sits in the module's power chain — a motion sensor
  // doesn't; only fall back to sensors when nothing else exists
  const inChain = pool.filter((p) => p.family !== 'sensor' && !/sensor/i.test(p.name ?? ''))
  if (inChain.length) pool = inChain
  if (isRgb(current)) {
    const fiveC = pool.filter((p) => /5c/i.test(p.sku))
    if (fiveC.length) pool = fiveC
  }
  return mid(pool.sort(bySku))
}

function card(familySlug: string, chosen: Product, kicker?: string): MergedRelated {
  const cat = categoriesOf(familySlug, chosen)[0]
  const img = resolveProductImage(chosen, seriesLineArt(chosen.series, familySlug))
  return {
    kicker: kicker ?? `${familyName(familySlug)}${cat ? ` · ${cat}` : ''}`,
    name: chosen.sku,
    href: `/products/${familySlug}/${encodeURIComponent(chosen.sku)}`,
    image: { src: img.src, local: img.isLocal, alt: img.alt },
  }
}

/** The adjacent model in the product's own series (wrapping); when the series
    has no other models, the mid pick of the next customer category that does. */
function pickSibling(familySlug: string, current: Product, own: Product[]): Product | null {
  const series = own
    .filter((p) => categoriesOf(familySlug, p).length && p.series === current.series)
    .sort(byVoltagePowerSku)
  if (series.length > 1) {
    const i = series.findIndex((p) => p.sku === current.sku)
    return series[(Math.max(i, 0) + 1) % series.length]
  }
  const order = CATEGORY_ORDER[familySlug] ?? []
  const currentCats = categoriesOf(familySlug, current)
  const start = Math.max(order.indexOf(currentCats[0] ?? ''), 0) + 1
  const rotated = [...order.slice(start), ...order.slice(0, start)]
  for (const cat of rotated) {
    if (currentCats.includes(cat)) continue
    const members = own.filter((p) => p.sku !== current.sku && categoriesOf(familySlug, p).includes(cat))
    const pick = mid(members.sort(bySku))
    if (pick) return pick
  }
  return null
}

/**
 * Up to three cards: the concrete product of each complementary family that
 * best matches the one being viewed, then its series sibling.
 */
export function pickRelatedProducts(
  currentFamilySlug: string,
  current: Product | null,
  productsByFamily: Record<string, Product[]>,
): MergedRelated[] {
  const cards: MergedRelated[] = []

  for (const comp of COMPLEMENT_FAMILIES[currentFamilySlug] ?? []) {
    const products = productsByFamily[comp] ?? []
    if (!products.length) continue
    const chosen =
      comp === 'led-drivers' ? pickDriver(current, currentFamilySlug, products)
      : comp === 'led-signage-modules' ? pickModule(current, currentFamilySlug, products)
      : pickControl(current, products)
    if (chosen) cards.push(card(comp, chosen))
  }

  const own = productsByFamily[currentFamilySlug] ?? []
  if (current && own.length) {
    const sibling = pickSibling(currentFamilySlug, current, own)
    if (sibling) cards.push(card(currentFamilySlug, sibling, `Also in ${familyName(currentFamilySlug)}`))
  }

  return cards.slice(0, 3)
}
