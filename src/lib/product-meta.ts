// Meta-description composition for product (SKU) detail pages.
//
// Why: Akeneo copy is shared across variants — one short_description covers a
// whole voltage family (12/24/48V), so up to 26 groups of SKU pages shipped
// byte-identical meta descriptions (audit 2026-07-27). Anchoring every
// description with the page's own SKU makes each one unique and pads the
// too-short ones, without hand-writing 224 rows of copy.

/** Akeneo short_description arrives with raw newlines and broken punctuation
 *  ("performance ,design Open circuit,short circuit") — tidy it for the meta
 *  description without touching numbers ("8.33A", "1,000"). */
export function cleanMetaDescription(text: string | null | undefined): string | undefined {
  if (!text) return undefined
  const cleaned = text
    // C0/DEL control chars — Akeneo PDF extraction ships some SP-series
    // descriptions with U+007F between every word; \s does not match it.
    .replace(/[\x00-\x1f\x7f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([,;])(?=[A-Za-z])/g, '$1 ')
    .trim()
  return cleaned || undefined
}

const MAX_META = 160

/** Unique per-SKU meta description: cleaned catalogue copy first, then a
 *  "<SKU> specifications, datasheet and where to buy." anchor. The copy is
 *  trimmed on a word boundary so the anchor always fits within 160 chars. */
export function productMetaDescription(
  shortDescription: string | null | undefined,
  sku: string,
  descriptor: string,
): string {
  const anchor = `${sku} specifications, datasheet and where to buy.`
  const base = cleanMetaDescription(shortDescription)
  if (!base) return `${descriptor} — specifications, datasheet and where to buy.`
  const room = MAX_META - anchor.length - 1
  const lead =
    base.length > room ? `${base.slice(0, Math.max(0, room - 1)).replace(/\s+\S*$/, '')}…` : base
  return `${lead} ${anchor}`
}
