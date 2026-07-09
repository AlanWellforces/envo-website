# Mobile header — persistent logo + menu + catalogue search

**Date:** 2026-07-09 · **Author:** Claude (approved by marketing)

## Problem

On mobile (≤980px) the ENVO logo only existed inside the nav drawer — the brand was
invisible until the user opened the menu. The only fixed chrome was a floating
hamburger button, which several pages carved space around with one-off
`padding-left: 52px` breadcrumb hacks.

## Decision (user-picked layout)

A fixed 56px mobile header under the 3px light-bin bar, left-aligned brand group —
matching the desktop sidebar's top-left logo anchor (user rejected a centered logo
for that reason):

```
[☰] ENVO ······················· [🔍]
```

- **Menu**: the existing `.mobile-menu-toggle` moves inside the bar (static, becomes ✕
  in place; the old "slide to the drawer corner" rule is gone).
- **Logo**: `logo-envo-darkbg.svg` links home; the drawer's own logo is hidden on
  mobile (redundant).
- **Search**: links to `/products?search=1`; `CatalogueFilter` reads the param and
  scrolls/focuses its search input — on phones the filter rail (and search box) sits
  below the results, so the button must deliver the user to the input, not just the page.

## Layout mechanics

- Body reserves the strip globally on mobile: `padding-top: 59px`
  (3 + 56), `body.has-topsubnav: 99px` (59 + 40 sub-nav).
- `.top-subnav` and `.sidebar` (drawer) drop to `top: calc(59px + var(--region-banner-h))`;
  the region-banner push-down pattern is unchanged (header follows `--region-banner-h`).
- Removed the two `padding-left: 52px` breadcrumb hamburger-clearance hacks
  (`products-catalogue.css`, `merged-series.css`).
- Desktop ≥981px: `.mobile-header { display: none }` — zero change.

## Verified (headless Chrome, 375×812 + 1440×900)

Home header/drawer states, search-button focus lands on the catalogue input,
`window.innerWidth === 375` on home + catalogue (no intrinsic-width zoom-out),
series-page breadcrumb clean without the hack, desktop header hidden.

Note: dev-DB session pooler hit its 15-conn cap with two dev servers up — worktree
runs on the 6543 transaction pooler (local `.env.local` only, not committed).
