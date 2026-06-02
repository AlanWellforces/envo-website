// src/lib/product-selector.ts
// Server-only. Reads signage/driver/etc. products from the Payload `Products`
// collection and flattens them into rows for the <ProductSelectorTable>.
// Do NOT import from a client component.

const NUM_TO_WORD: Record<number, string> = { 1: 'Single', 2: 'Duo', 3: 'Triple', 4: 'Quad' }

/** Extract an LED-count label from a product name, or null. */
export function parseLedCount(name: string): string | null {
  const word = name.match(/\b(Single|Duo|Double|Triple|Quad)\b/i)
  if (word) return word[1][0].toUpperCase() + word[1].slice(1).toLowerCase()
  const num = name.match(/\b(\d+)\s*LED\b/i)
  if (num) return NUM_TO_WORD[Number(num[1])] ?? `${num[1]}-LED`
  return null
}
