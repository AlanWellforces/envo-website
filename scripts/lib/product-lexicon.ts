/**
 * Product copy lexicon — canonical spellings for catalogue text
 * (products.name / products.short_description).
 *
 * Two rule shapes:
 *   TYPOS — outright misspellings. Matcher is case-insensitive; any hit
 *           is wrong and `fix` is the replacement.
 *   TERMS — words with exactly one approved form. Matcher is
 *           case-insensitive / variant-tolerant; a hit is flagged only
 *           when the matched text differs from `canonical`, so correctly
 *           written copy never trips it.
 *
 * Consumed by scripts/validate-product-data.ts (the publish gate).
 * Add new entries HERE as they surface — never inline in the validator.
 */

export const TYPOS: Array<[RegExp, string]> = [
  [/\bCurrnt\b/i, 'Current'],
  [/\bCurent\b/i, 'Current'],
  [/\bContol\b/i, 'Control'],
  [/\bConveter\b/i, 'Converter'],
  [/\bVoltag\b/i, 'Voltage'],
  [/\bModul\b/i, 'Module'],
  [/\bWaterproff\b/i, 'Waterproof'],
]

export const TERMS: Array<{ canonical: string; match: RegExp }> = [
  // Brand is always all-caps in copy (site-wide copy rule; legal entity "Envo"
  // appears only on legal pages, never in catalogue text).
  { canonical: 'ENVO', match: /\benvo\b/gi },
  // Official CSA spelling since the 2021 rebrand ("Zigbee", not "ZigBee").
  // The \w* also catches keyboard mangles like "ZigbBee".
  { canonical: 'Zigbee', match: /\bzig\w*bee\b/gi },
  // British spelling across the catalogue.
  { canonical: 'Colour', match: /\bcolou?r\b/gi },
  { canonical: 'Colours', match: /\bcolou?rs\b/gi },
  { canonical: 'In-Wall', match: /\bin[\s-]?wall\b/gi },
  { canonical: 'Constant Current', match: /\bconstant[\s-]+current\b/gi },
  { canonical: '2-Gang', match: /\b2[\s-]?gang\b/gi },
]

export type LexiconIssue = { kind: 'typo' | 'term' | 'whitespace'; found: string; fix: string }

export function lintCopy(text: string): LexiconIssue[] {
  const issues: LexiconIssue[] = []
  for (const [re, fix] of TYPOS) {
    const m = text.match(re)
    if (m) issues.push({ kind: 'typo', found: m[0], fix })
  }
  for (const { canonical, match } of TERMS) {
    for (const m of text.matchAll(match)) {
      if (m[0] !== canonical) issues.push({ kind: 'term', found: m[0], fix: canonical })
    }
  }
  if (text !== text.trim())
    issues.push({ kind: 'whitespace', found: 'leading/trailing whitespace', fix: 'trim' })
  if (/\s{2,}/.test(text.trim()))
    issues.push({ kind: 'whitespace', found: 'doubled whitespace', fix: 'single space' })
  return issues
}
