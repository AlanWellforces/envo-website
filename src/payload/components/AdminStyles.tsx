// Injects global admin-panel style overrides. Wired as an
// admin.components.providers entry in payload.config.ts so it wraps every
// admin page (this version of Payload has no admin.css config option).
//
// Two jobs:
//  1. Taller rich-text editor (the only richText field in the project).
//  2. Restyle Payload's default left nav to the Editorial Bold direction
//     (white sidebar, grouped labels, dark active pill, per-item icons) —
//     styling only, on top of the stock Nav so collapse/permissions/active
//     behaviour is untouched. Item icons key off Payload's stable per-link
//     ids (#nav-products, #nav-posts, ...) using currentColor masks.

import React from 'react'
import { ADMIN_COLORS, ADMIN_FONT_FAMILY, ICON_GEOMETRY } from '../admin-theme'

const BLUE_HEX = ADMIN_COLORS.blue

// Stroke icon → data-URI for a CSS mask (only the alpha channel matters).
const icon = (paths: string): string => {
  const svg =
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'>" +
    paths +
    '</svg>'
  return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")'
}

// Payload's stable per-link nav ids → shared icon geometry.
const NAV_ICON_KEYS: Record<string, string> = {
  'nav-dashboard': 'grid',
  'nav-products': 'box',
  'nav-media': 'photo',
  'nav-posts': 'post',
  'nav-projects': 'building',
  'nav-faqs': 'question',
  'nav-submissions': 'inbox',
  'nav-pages': 'page',
  'nav-page-seo': 'search',
  'nav-users': 'users',
  'nav-global-site-settings': 'sliders',
  'nav-global-home-page': 'home',
  'nav-pages-overview': 'columns',
  'nav-solutions': 'bulb',
}

const ICONS: Record<string, string> = Object.fromEntries(
  Object.entries(NAV_ICON_KEYS).map(([id, key]) => [id, icon(ICON_GEOMETRY[key])]),
)

const iconRules = Object.entries(ICONS)
  .map(
    ([id, mask]) =>
      '#' +
      id +
      '::before { content: ""; width: 17px; height: 17px; flex: none; background: currentColor; -webkit-mask: ' +
      mask +
      ' no-repeat center / contain; mask: ' +
      mask +
      ' no-repeat center / contain; }',
  )
  .join('\n')

const CSS = `
.ContentEditable__root { min-height: 360px; padding-bottom: 1rem; }

/* ---- Editorial Bold nav ---------------------------------------------- */
aside.nav {
  background: #fff;
  border-right: 1px solid #e6e9ee;
  font-family: ${ADMIN_FONT_FAMILY};
}
.nav__scroll { padding: 8px 16px 12px; }

/* No horizontal padding on the wrapper — the logo carries its own 10px and
   the Dashboard link uses the standard .nav__link padding, so both share the
   items' left edge (wrapper padding would double-indent the link). */
.nav-brand { display: block; padding: 14px 0 0; }
.nav-brand__logo { display: block; padding: 0 10px; }
.nav-brand__logo img { height: 26px; width: auto; display: block; }
.nav-brand a.nav__link { margin-top: 22px; }

.nav-group__toggle {
  font-size: 11px;
  letter-spacing: .09em;
  text-transform: uppercase;
  color: #76828f;
  font-weight: 700;
  margin: 16px 0 6px;
  padding: 0 10px;
}
.nav-group__toggle .nav-group__label { color: #76828f; }
.nav-group__indicator { opacity: 0; transition: opacity .15s; }
.nav-group__toggle:hover .nav-group__indicator { opacity: .7; }

/* Base item (links). The CURRENT page's item renders as a <div.nav__link>
   with a .nav__link-indicator child instead of an <a> — style both, and use
   the div form as the active state (dark pill, like the mockup). */
.nav__link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 9px;
  color: #4a5568;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.2;
}
a.nav__link:hover { background: #f3f5f7; color: #141d2b; text-decoration: none; }
div.nav__link {
  background: #141d2b;
  color: #fff;
  font-weight: 600;
}
.nav__link-indicator { display: none; }
.nav__link .nav__link-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

${iconRules}

.nav__controls { border-top: 1px solid #e6e9ee; margin-top: 12px; padding-top: 10px; }
.nav__controls a { color: #4a5568; }
.nav__controls a:hover { color: #141d2b; }

/* ---- Editorial Bold sub-pages ----------------------------------------
   Same design language as the Dashboard for every list/edit view: light
   grey canvas, white rounded cards, brand-blue primary actions, Inter
   Tight. Uses Payload's own hooks (--font-body, --style-radius-*, the
   .btn custom properties) wherever they exist. */
:root {
  --font-body: ${ADMIN_FONT_FAMILY};
  --style-radius-s: 8px;
  --style-radius-m: 10px;
  --style-radius-l: 14px;
}

/* Canvas + header */
.template-default__wrap { background: #f6f7f9; }
.app-header { border-bottom: 1px solid #e6e9ee; }
.app-header__bg { background: #fff; opacity: 1; }

/* Buttons — Payload exposes per-style custom properties */
.btn--style-primary { --bg-color: ${BLUE_HEX}; --hover-bg: #005a98; --color: #fff; }
.btn--style-secondary { --hover-color: ${BLUE_HEX}; --hover-btn-border: 1px solid ${BLUE_HEX}; }
.btn__label { font-weight: 600; }

/* List views — table becomes a white card */
.list-header__title { font-weight: 800; letter-spacing: -.02em; color: #141d2b; }
.collection-list .table-wrap {
  background: #fff;
  border: 1px solid #e6e9ee;
  border-radius: 14px;
  padding: 6px 18px 12px;
}
.table table thead th {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: #76828f;
  font-weight: 700;
}
.table table tbody td { border-bottom: 1px solid #f0f2f5; }
.table table tbody tr:last-child td { border-bottom: 0; }
.table table tbody tr:hover td { background: #f9fafb; }
.table tbody tr:nth-child(odd) { background: transparent; }
.search-filter__input { background: #fff; }
.pill { font-weight: 600; }

/* "Create New" on list headers — brand-blue pill (stock is a grey pill) */
.list-create-new-doc__create-new-button {
  --bg-color: ${BLUE_HEX};
  --color: #fff;
  --hover-bg: #005a98;
  --hover-color: #fff;
}

/* Edit views */
.doc-header__title { font-weight: 800; letter-spacing: -.02em; }
.doc-tab--active { box-shadow: inset 0 -2px 0 ${BLUE_HEX}; }
.document-fields__sidebar-wrap { background: #fff; border-left: 1px solid #e6e9ee; }

/* Focus ring → brand blue (stock rule reads this var for its shadow) */
input:focus, textarea:focus, select:focus { --theme-success-400: rgba(0, 113, 188, .35); }
`

export const AdminStyles: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <>
    <style dangerouslySetInnerHTML={{ __html: CSS }} />
    {children}
  </>
)

export default AdminStyles
