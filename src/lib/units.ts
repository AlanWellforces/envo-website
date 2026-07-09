// src/lib/units.ts
// Pure unit helpers. Brand rule: metric primary, US imperial in parentheses,
// so US installers (powersupplymall.com) never have to do mental math.

/** Millimetres → inches, rounded to 2 dp. Null-safe. */
export function mmToIn(mm: number | null | undefined): number | null {
  if (mm == null) return null
  return Math.round((mm / 25.4) * 100) / 100
}

/** Format an L×W×H triple as dual-unit strings, or null if any side is missing. */
export function formatDims(
  l: number | null | undefined,
  w: number | null | undefined,
  h: number | null | undefined,
): { mm: string; in: string } | null {
  if (l == null || w == null || h == null) return null
  return {
    mm: `${l} × ${w} × ${h} mm`,
    in: `${mmToIn(l)} × ${mmToIn(w)} × ${mmToIn(h)} in`,
  }
}
