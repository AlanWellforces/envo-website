/** Product-aware comparison-table layout, chosen by same-series product count.
 *  1 (or 0) → no table; 2–6 → horizontal (specs as rows, SKUs as columns);
 *  >6 → row-based (one row per SKU). See the design spec §4. */
export function pickCompareLayout(sameSeriesCount: number): 'none' | 'horizontal' | 'rows' {
  if (sameSeriesCount <= 1) return 'none'
  if (sameSeriesCount <= 6) return 'horizontal'
  return 'rows'
}
