// Data-driven "Pairs with" cards for series + SKU detail pages, at the grain
// customers actually browse: the old-site menu CATEGORIES (#161 taxonomy —
// Eco Series / Screw Terminal / Zigbee & Smart…), NOT internal range codenames
// (EcoGlo / SE / SL). Cards deep-link to the pre-filtered catalogue view
// (?series=<category>), the exact targets the sidebar submenus use.
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

/** Customer categories a product belongs to (empty for unmapped/gated series
    — those never surface as a card). */
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

/** Card for one category — image from its first member product. Null when the
    category has no live products. */
function categoryCard(
  familySlug: string,
  category: string,
  products: Product[],
  kicker: string,
): MergedRelated | null {
  const member = products.find((p) => categoriesOf(familySlug, p).includes(category))
  if (!member) return null
  const img = resolveProductImage(member, seriesLineArt(member.series, familySlug))
  return {
    kicker,
    name: category,
    href: `/products/${familySlug}?series=${encodeURIComponent(category)}`,
    image: { src: img.src, local: img.isLocal, alt: img.alt },
  }
}

/** First category from `preferred` (then the family's full order) that has
    live products and isn't excluded. */
function firstNonEmpty(
  familySlug: string,
  preferred: string[],
  products: Product[],
  kicker: string,
  exclude: string[] = [],
): MergedRelated | null {
  const order = [...preferred, ...(CATEGORY_ORDER[familySlug] ?? [])]
  for (const cat of order) {
    if (exclude.includes(cat)) continue
    const card = categoryCard(familySlug, cat, products, kicker)
    if (card) return card
  }
  return null
}

/** The complementary category most relevant to the product being viewed. */
function preferredCategories(compFamily: string, cur: Product | null): string[] {
  if (compFamily === 'led-drivers') return ['Screw Terminal']
  if (compFamily === 'control-gear') return ['Zigbee & Smart']
  // signage modules: match the driver's rail (24 V drivers ↔ 24V Series);
  // colour controllers sell the colour story
  if (cur?.output_voltage_v === 24) return ['24V Series']
  if (cur && (cur.series === 'envo_zigbee' || /zigbee/i.test(cur.name ?? ''))) return ['RGB Series']
  return ['Eco Series']
}

/**
 * Up to three cards: the most relevant customer category of each complementary
 * family, then the next sibling category in the current family (wrapping,
 * skipping every category the current product itself belongs to).
 */
export function pickRelatedCategories(
  currentFamilySlug: string,
  current: Product | null,
  productsByFamily: Record<string, Product[]>,
): MergedRelated[] {
  const cards: MergedRelated[] = []

  for (const comp of COMPLEMENT_FAMILIES[currentFamilySlug] ?? []) {
    const products = productsByFamily[comp] ?? []
    if (!products.length) continue
    const card = firstNonEmpty(comp, preferredCategories(comp, current), products, familyName(comp))
    if (card) cards.push(card)
  }

  const own = productsByFamily[currentFamilySlug] ?? []
  const currentCats = current ? categoriesOf(currentFamilySlug, current) : []
  const order = CATEGORY_ORDER[currentFamilySlug] ?? []
  if (own.length && order.length) {
    // start scanning right after the product's first category, wrap around
    const start = Math.max(order.indexOf(currentCats[0] ?? ''), 0) + 1
    const rotated = [...order.slice(start), ...order.slice(0, start)]
    const sibling = firstNonEmpty(
      currentFamilySlug, rotated, own, `Also in ${familyName(currentFamilySlug)}`, currentCats,
    )
    if (sibling) cards.push(sibling)
  }

  return cards.slice(0, 3)
}
