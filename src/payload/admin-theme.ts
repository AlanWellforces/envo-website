// Single source for the Editorial Bold admin look — palette, font stack and
// SVG icon geometry shared by AdminStyles (global admin CSS) and the
// Dashboard view. Values were previously duplicated across both files.
//
// The font is self-hosted via next/font (no fonts.googleapis.com request at
// runtime); importing this module from any admin component is what emits the
// @font-face rules into that page's CSS.
import { Inter_Tight } from 'next/font/google'

const interTight = Inter_Tight({ subsets: ['latin'] })

export const ADMIN_FONT_FAMILY = `${interTight.style.fontFamily}, -apple-system, BlinkMacSystemFont, sans-serif`

export const ADMIN_COLORS = {
  blue: '#0071bc',
  blueDark: '#005a98',
  blueSoft: '#e8f2fb',
  lime: '#aec90b',
  limeDark: '#5b6a08',
  limeSoft: '#f3f7d9',
  ink: '#141d2b',
  muted: '#4a5568',
  subtle: '#76828f',
  line: '#e6e9ee',
  canvas: '#f6f7f9',
} as const

/**
 * Inner markup of 24×24 stroke icons (no <svg> wrapper), keyed by what they
 * depict. AdminStyles turns them into CSS mask data-URIs for the nav;
 * Dashboard renders them inline for the quick-action cards.
 */
export const ICON_GEOMETRY: Record<string, string> = {
  grid: "<rect x='3' y='3' width='7' height='7' rx='1'/><rect x='14' y='3' width='7' height='7' rx='1'/><rect x='3' y='14' width='7' height='7' rx='1'/><rect x='14' y='14' width='7' height='7' rx='1'/>",
  box: "<path d='M3 7l9-4 9 4-9 4-9-4z'/><path d='M3 7v10l9 4 9-4V7'/>",
  photo: "<rect x='3' y='3' width='18' height='18' rx='2'/><path d='M3 9h18'/>",
  post: "<path d='M4 4h16v16H4z'/><path d='M8 8h8M8 12h8M8 16h5'/>",
  building: "<path d='M3 9l9-6 9 6v10a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1z'/>",
  question: "<circle cx='12' cy='12' r='9'/><path d='M9.5 9a2.5 2.5 0 115 0c0 1.5-2.5 2-2.5 3.5M12 17h.01'/>",
  inbox:
    "<path d='M22 12h-6l-2 3h-4l-2-3H2'/><path d='M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z'/>",
  page: "<path d='M4 4h11l5 5v11H4z'/><path d='M14 4v6h6'/>",
  search: "<circle cx='11' cy='11' r='7'/><path d='M21 21l-4-4'/>",
  users: "<path d='M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2'/><circle cx='12' cy='7' r='4'/>",
  sliders: "<path d='M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3'/><path d='M1 14h6M9 8h6M17 16h6'/>",
  home: "<path d='M3 9l9-6 9 6v10a1 1 0 01-1 1H4a1 1 0 01-1-1z'/>",
  columns: "<rect x='3' y='3' width='18' height='18' rx='2'/><path d='M3 9h18M9 21V9'/>",
  bulb: "<path d='M9 18h6M10 21h4M12 3a6 6 0 00-4 10.5c.7.6 1 1.6 1 2.5h6c0-.9.3-1.9 1-2.5A6 6 0 0012 3z'/>",
  plus: "<path d='M12 5v14M5 12h14'/>",
}
