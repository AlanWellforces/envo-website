// Data-driven "Pairs with" cards for the merged series page. Series lists and
// URLs are derived from live products (same source as generateStaticParams) —
// NOT from PRODUCT_FAMILIES.series, whose hand-written entries predate the
// DB-driven routes and no longer match the live slugs.
import type { MergedRelated } from '@/components/products/merged/MergedSeriesPage'
import type { Product } from './products'
import { resolveProductImage } from './products'
import { seriesLabel, seriesSlug, seriesLineArt } from '@/data/family-map'
import { PRODUCT_FAMILIES } from '@/data/product-families'

/** Complementary families to cross-sell from each family's series pages. */
export const COMPLEMENT_FAMILIES: Record<string, string[]> = {
  'led-signage-modules': ['led-drivers', 'control-gear'],
  'led-drivers': ['led-signage-modules', 'control-gear'],
  'control-gear': ['led-drivers', 'led-signage-modules'],
  accessories: ['control-gear', 'led-drivers'],
}

type SeriesEntry = { slug: string; code: string | null; products: Product[] }

/** Group by series slug, preserving first-seen order (mirrors the page). */
function seriesOf(products: Product[]): SeriesEntry[] {
  const order: SeriesEntry[] = []
  const bySlug = new Map<string, SeriesEntry>()
  for (const p of products) {
    const slug = seriesSlug(p.series)
    let entry = bySlug.get(slug)
    if (!entry) {
      entry = { slug, code: p.series ?? null, products: [] }
      bySlug.set(slug, entry)
      order.push(entry)
    }
    entry.products.push(p)
  }
  return order
}

function card(familySlug: string, entry: SeriesEntry, kicker: string): MergedRelated {
  const lineArt = seriesLineArt(entry.code, familySlug)
  const img = resolveProductImage(entry.products[0], lineArt)
  return {
    kicker,
    name: seriesLabel(entry.code),
    href: `/products/${familySlug}/${entry.slug}`,
    image: { src: img.src, local: img.isLocal, alt: img.alt },
  }
}

function familyName(slug: string): string {
  return PRODUCT_FAMILIES.find((f) => f.slug === slug)?.name ?? slug
}

/**
 * Up to three cards: the flagship series of each complementary family
 * (flagship = most products), then the next sibling series in the current
 * family (wrapping). Families without products are skipped.
 */
export function pickRelatedSeries(
  currentFamilySlug: string,
  currentSeriesSlug: string,
  productsByFamily: Record<string, Product[]>,
): MergedRelated[] {
  const cards: MergedRelated[] = []

  for (const comp of COMPLEMENT_FAMILIES[currentFamilySlug] ?? []) {
    const entries = seriesOf(productsByFamily[comp] ?? [])
    if (!entries.length) continue
    const flagship = entries.reduce((a, b) => (b.products.length > a.products.length ? b : a))
    cards.push(card(comp, flagship, familyName(comp)))
  }

  const siblings = seriesOf(productsByFamily[currentFamilySlug] ?? [])
  const idx = siblings.findIndex((s) => s.slug === currentSeriesSlug)
  if (siblings.length > 1 && idx !== -1) {
    const next = siblings[(idx + 1) % siblings.length]
    cards.push(card(currentFamilySlug, next, `Also in ${familyName(currentFamilySlug)}`))
  }

  return cards.slice(0, 3)
}
