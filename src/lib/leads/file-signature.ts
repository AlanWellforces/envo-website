// Real file-type detection by magic bytes — the upload route must not trust
// the filename extension or the browser-supplied MIME (both spoofable). Every
// type the lead form accepts (JPG/PNG/GIF/WEBP/PDF/DWG) has a stable signature;
// anything without a recognised signature (renamed executable, HTML, an SVG
// carrying <script>) returns null and is rejected.

export type DetectedType = 'jpg' | 'png' | 'gif' | 'webp' | 'pdf' | 'dwg'

const startsWith = (buf: Uint8Array, bytes: number[], offset = 0): boolean =>
  bytes.every((b, i) => buf[offset + i] === b)

const ascii = (s: string): number[] => [...s].map((c) => c.charCodeAt(0))

/** Detect the true type from the leading bytes, or null if not a recognised
 *  (allowed) binary type. */
export function detectType(buf: Uint8Array): DetectedType | null {
  if (buf.length < 4) return null
  if (startsWith(buf, [0xff, 0xd8, 0xff])) return 'jpg'
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png'
  if (startsWith(buf, ascii('GIF8'))) return 'gif'
  // WEBP: "RIFF"...."WEBP"
  if (startsWith(buf, ascii('RIFF')) && startsWith(buf, ascii('WEBP'), 8)) return 'webp'
  if (startsWith(buf, ascii('%PDF'))) return 'pdf'
  // DWG: modern versions all begin "AC10".. (AC1012 … AC1032)
  if (startsWith(buf, ascii('AC10'))) return 'dwg'
  return null
}

/** Which detected types satisfy a claimed extension. jpg/jpeg share a family;
 *  the rest map 1:1. Lets a real PNG through even if named .jpg (harmless) but
 *  rejects anything whose bytes aren't a recognised allowed type. */
export function isAllowedUpload(buf: Uint8Array): boolean {
  return detectType(buf) !== null
}
