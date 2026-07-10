'use client'

import { useEffect, useRef } from 'react'

import type { Product } from '@/lib/products'
import { datasheetHref } from '@/lib/asset-url'

/**
 * Mini Series · MiniLux Backlit detail page.
 *
 * The visual design is the v3 mockup (Apple-style: Overview / Compare /
 * Solutions tabs, scene banners, cross-section diagrams). To keep the
 * heavily-scoped mockup CSS from leaking into the rest of the app, the
 * mockup body + styles are attached inside a Shadow DOM. The production
 * Sidebar continues to render outside the shadow root in the page layout.
 *
 * Per-variant cells in the Compare tab carry `data-akeneo="<sku>:<field>"`
 * markers; after the shadow attaches, applyAkeneo() substitutes the live
 * values from the Payload products passed in as `variants`. Static design
 * content (IP rating, beam, certs, editorial copy) stays in the mockup.
 *
 * The mockup is the canonical source for this page — when iterating on
 * design, edit
 *   .superpowers/brainstorm/35183-1779324154/content/mini-series-v3.html
 * and re-run scripts/port-mini-mockup.py to regenerate this file.
 */

const MOCKUP_CSS = `  :host {
    display: block;
    min-height: 100vh;
    --bg: #f4f5f7;
    --bg-card: #ffffff;
    --line: #e2e5ea;
    --line-strong: #d5d9e0;
    --text: #1a2332;
    --text-muted: #4a5568;
    --text-subtle: #6a7a8a;
    --bg-sidebar: #030813;
    --sidebar-muted: #8b9cb0;
    --sidebar-subtle: #5a6c80;
    --sidebar-line: rgba(77, 195, 255, 0.10);
    --sidebar-line-strong: rgba(77, 195, 255, 0.22);
    --blue: #0071bc;
    --blue-soft: #e8f1fb;
    --lime: #aec90b;
    --lime-deep: #7a8c08;
    --lime-soft: #f4f8d8;
    /* Site-wide font unification: --mono is aliased to the sans stack so every
       mockup label, eyebrow and dim callout renders in Inter Tight. Token name
       kept for back-compat with the 40+ in-shadow CSS rules. */
    --mono: 'Inter Tight', -apple-system, system-ui, sans-serif;
    --sans: 'Inter Tight', -apple-system, system-ui, sans-serif;
    --sidebar-w: 232px;
    --subnav-h: 44px;
  }
  * { box-sizing: border-box; }
  :host { background: var(--bg); color: var(--text); font-family: var(--sans); line-height: 1.5; }
  html, body { margin: 0; padding: 0; background: var(--bg); color: var(--text); font-family: var(--sans); line-height: 1.5; }
  a { color: inherit; text-decoration: none; }
  img { display: block; }

  /* ============ SIDEBAR (same v3 chrome) ============ */
  .sidebar { position: fixed; top: 0; left: 0; bottom: 0; width: var(--sidebar-w);
    background: linear-gradient(180deg, #1a3a66 0%, #0f2347 20%, #06122a 55%, #03081a 100%);
    border-right: 1px solid var(--sidebar-line-strong);
    display: flex; flex-direction: column; z-index: 100; color: #f5f7fa; }
  .sidebar::before { content:''; position: absolute; inset: 0; pointer-events: none;
    background: radial-gradient(ellipse 400px 300px at 70% 5%, rgba(77,195,255,.18) 0%, transparent 65%),
                radial-gradient(ellipse 300px 400px at 30% 100%, rgba(174,201,11,.06) 0%, transparent 60%); }
  .sidebar > * { position: relative; z-index: 1; }
  .sidebar-brand { padding: 18px 26px; border-bottom: 1px solid var(--sidebar-line); display: flex; align-items: center; gap: 10px; min-height: 72px; }
  .sidebar-brand .logo-full { height: 22px; display: block; }
  /* Collapsed-state E mark (favicon SVG) — hidden by default, shown when sidebar collapses */
  .sidebar-brand .logo-mark { display: none; width: 36px; height: 36px; align-items: center; justify-content: center; }
  .sidebar-brand .logo-mark img { width: 36px; height: 36px; display: block; }
  .sidebar-section { padding: 14px 14px 6px; }
  .sidebar-section .heading {
    font-family: var(--sans);
    font-size: 11px; font-weight: 500;
    color: var(--sidebar-subtle);
    text-transform: none;
    letter-spacing: 0;
    padding: 0 8px 10px;
  }
  .sidebar-items { display: flex; flex-direction: column; gap: 2px; }
  .sidebar-item { display: flex; align-items: center; gap: 11px; padding: 9px 12px; border-radius: 5px; font-size: 13px; color: var(--sidebar-muted); white-space: nowrap; }
  .sidebar-item:hover { background: rgba(77,195,255,.08); color: #f5f7fa; }
  .sidebar-item.active { background: linear-gradient(90deg, rgba(0,113,188,.22), rgba(0,113,188,.05)); color: #fff; position: relative; }
  .sidebar-item.active::before { content:''; position: absolute; left: 0; top: 8px; bottom: 8px; width: 2px; background: var(--lime); box-shadow: 0 0 6px var(--lime); }
  .sidebar-item svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 1.6; flex-shrink: 0; }
  .sidebar-item .label { flex: 1; }
  .sidebar-item .badge { font-family: var(--mono); font-size: 9px; color: var(--sidebar-subtle); background: rgba(255,255,255,.06); padding: 2px 6px; border-radius: 999px; }
  .sidebar-foot { margin-top: auto; padding: 14px; border-top: 1px solid var(--sidebar-line); display: flex; flex-direction: column; gap: 10px; }
  .sidebar-foot .region-row { display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: rgba(77,195,255,.06); border: 1px solid var(--sidebar-line); border-radius: 7px; }
  .sidebar-foot .region-row .flag { font-size: 16px; }
  .sidebar-foot .region-row .lbl { flex: 1; font-size: 12.5px; color: #f5f7fa; }
  .sidebar-foot .region-row .chev { font-family: var(--mono); font-size: 10px; color: var(--sidebar-subtle); }
  .sidebar-foot .status {
    font-family: var(--sans);
    font-size: 11px; font-weight: 400;
    color: var(--sidebar-subtle);
    letter-spacing: 0;
    text-transform: none;
    padding: 0 4px;
  }
  .sidebar-foot .status::before { content:''; display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--lime); margin-right: 8px; vertical-align: 1px; }

  /* Sidebar collapse toggle — bottom row of the sidebar */
  .sidebar-toggle {
    width: 100%;
    padding: 12px 14px;
    background: transparent; color: var(--sidebar-muted);
    border: none; border-top: 1px solid var(--sidebar-line);
    border-radius: 0;
    cursor: pointer;
    display: flex; align-items: center; justify-content: flex-end; gap: 8px;
    font-family: var(--sans); font-size: 11.5px; font-weight: 500;
    letter-spacing: 0;
    transition: color .15s ease, background .15s ease;
    position: relative; z-index: 2;
  }
  .sidebar-toggle:hover { color: var(--lime); background: rgba(174,201,11,0.04); }
  .sidebar-toggle svg { width: 14px; height: 14px; transition: transform .28s cubic-bezier(0.4, 0, 0.2, 1); }
  .sidebar-toggle:focus-visible { outline: none; box-shadow: 0 0 0 2px rgba(174,201,11,0.4) inset; }

  /* Collapsed state — narrow sidebar, icons only */
  body.sidebar-collapsed .sidebar { width: 64px; }
  body.sidebar-collapsed .main { margin-left: 64px; }
  body.sidebar-collapsed .subnav { left: 64px; }
  /* Swap full ENVO wordmark → E mark when collapsed */
  body.sidebar-collapsed .sidebar-brand { padding: 18px 0; justify-content: center; }
  body.sidebar-collapsed .sidebar-brand .logo-full { display: none; }
  body.sidebar-collapsed .sidebar-brand .logo-mark { display: flex; }
  body.sidebar-collapsed .sidebar-section .heading,
  body.sidebar-collapsed .sidebar-item .label,
  body.sidebar-collapsed .sidebar-item .badge,
  body.sidebar-collapsed .sidebar-foot .region-row .lbl,
  body.sidebar-collapsed .sidebar-foot .region-row .chev,
  body.sidebar-collapsed .sidebar-foot .status,
  body.sidebar-collapsed .sidebar-toggle .toggle-label { display: none; }
  body.sidebar-collapsed .sidebar-section { padding: 14px 8px 6px; }
  body.sidebar-collapsed .sidebar-item { gap: 0; justify-content: center; padding: 10px 0; }
  body.sidebar-collapsed .sidebar-foot { padding: 12px 8px; }
  body.sidebar-collapsed .sidebar-foot .region-row { justify-content: center; padding: 8px 0; gap: 0; }
  body.sidebar-collapsed .sidebar-toggle { justify-content: center; padding: 12px 0; }
  body.sidebar-collapsed .sidebar-toggle svg { transform: rotate(180deg); }
  .sidebar { transition: width 0.28s cubic-bezier(0.4, 0, 0.2, 1); }
  .main { transition: margin-left 0.28s cubic-bezier(0.4, 0, 0.2, 1); }

  /* ============ MAIN ============ */
  .main { margin-left: 0; }  /* prod body already pads left */
  /* ENVO-branded subnav — logo + product wordmark left, tabs + lime Buy pill right */
  .subnav {
    position: sticky; top: 0; z-index: 50;
    height: 60px;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 56px;
    background: rgba(244,245,247,.94);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--line);
  }
  .subnav-left { display: flex; align-items: center; position: relative; }
  /* Sub-page path eyebrow — now a button that opens the series-switcher dropdown */
  .subnav-path {
    font-family: var(--sans);
    font-size: 14px;
    color: var(--text);
    text-decoration: none;
    display: inline-flex; align-items: center; gap: 6px;
    transition: opacity .15s ease;
    background: none; border: none; padding: 0;
    cursor: pointer;
  }
  .subnav-path:hover { opacity: 0.7; }
  .subnav-path:focus-visible { outline: 2px solid var(--blue); outline-offset: 4px; border-radius: 4px; }
  .subnav-path .path-fam { font-weight: 600; color: var(--text); }
  .subnav-path .path-chev {
    color: var(--text-subtle);
    transition: transform .15s ease;
    margin-right: 2px;
  }
  .subnav-path[aria-expanded="true"] .path-chev { transform: rotate(180deg); }
  .subnav-path .path-sep { color: var(--text-subtle); margin: 0 2px; }
  .subnav-path .path-prod { color: var(--text-muted); font-weight: 400; }

  /* Series-switcher dropdown — opens beneath the subnav path button */
  .series-dropdown {
    position: absolute;
    top: calc(100% + 6px); left: 0;
    min-width: 280px;
    background: var(--bg-card);
    border: 1px solid var(--line-strong);
    border-radius: 10px;
    box-shadow: 0 12px 32px rgba(10,20,40,0.10), 0 2px 8px rgba(10,20,40,0.06);
    padding: 6px;
    z-index: 200;
    display: flex; flex-direction: column; gap: 1px;
    animation: series-drop-fade .14s ease-out;
  }
  .series-dropdown[hidden] { display: none; }
  @keyframes series-drop-fade {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .series-item {
    display: flex; flex-direction: column; gap: 1px;
    padding: 10px 14px 10px 16px;
    border-radius: 7px;
    text-decoration: none;
    color: var(--text);
    font-family: inherit;
    position: relative;
    transition: background .12s ease;
  }
  .series-item:hover { background: rgba(0,113,188,0.06); }
  .series-item.current { background: rgba(174,201,11,0.10); }
  .series-item.current::before {
    content: ''; position: absolute; left: 4px; top: 10px; bottom: 10px;
    width: 2px; background: var(--lime); border-radius: 2px;
  }
  .series-item .item-label {
    font-size: 14px; font-weight: 600; color: var(--text);
    letter-spacing: -0.005em;
  }
  .series-item .item-prod {
    font-size: 12px; color: var(--text-muted);
    font-family: var(--mono); letter-spacing: 0.02em;
  }
  .series-item.coming-soon {
    opacity: 0.55;
    pointer-events: none;
    cursor: default;
  }
  .series-item.coming-soon .item-label::after {
    content: 'Coming soon';
    display: inline-block;
    margin-left: 10px;
    padding: 2px 7px;
    font-family: var(--mono); font-size: 9px; font-weight: 500;
    color: var(--text-subtle); background: var(--line);
    border-radius: 3px;
    letter-spacing: 0.16em; text-transform: uppercase;
    vertical-align: 2px;
  }

  /* Dropdown head — 2-segment clickable breadcrumb:
       ← ALL CATEGORIES (→ /products) · CURRENT FAMILY (→ /products/<slug>)
     Replaces the old static eyebrow AND the old foot link, since the
     family link is now the right half of this row. */
  .series-dd-head {
    display: flex; align-items: center; gap: 6px;
    padding: 10px 12px 9px;
    font-size: 10px; font-weight: 500;
    letter-spacing: 0.16em; text-transform: uppercase;
    border-bottom: 1px solid var(--line);
    margin-bottom: 4px;
  }
  .series-dd-head a {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 4px 6px;
    border-radius: 4px;
    color: var(--text-subtle);
    text-decoration: none;
    transition: color .12s ease, background .12s ease;
  }
  .series-dd-head a:hover { color: var(--blue); background: var(--blue-soft); }
  .series-dd-head .dd-back-arrow {
    font-size: 12px; letter-spacing: 0;
    margin-right: 1px;
    transition: transform .15s ease;
  }
  .series-dd-head a:hover .dd-back-arrow { transform: translateX(-2px); }
  .series-dd-head .dd-head-sep { color: var(--line-strong); }
  .subnav-tabs { display: flex; align-items: center; gap: 30px; }
  .subnav-tabs a {
    font-family: var(--sans);
    font-size: 14px; font-weight: 400;
    color: var(--text-muted);
    text-decoration: none;
    position: relative;
    padding: 4px 0;
    transition: color .15s ease;
  }
  .subnav-tabs a:hover { color: var(--text); }
  .subnav-tabs a.active {
    color: var(--text); font-weight: 600;
  }
  /* Active tab underline — brand lime, not black */
  .subnav-tabs a.active::after {
    content: ''; position: absolute;
    left: 0; right: 0; bottom: -10px;
    height: 2px; background: var(--lime);
    box-shadow: 0 0 6px rgba(174,201,11,0.45);
  }
  /* Buy = ENVO brand pill: dark base, lime border + arrow on hover */
  .subnav-tabs .buy-pill {
    padding: 9px 22px;
    background: var(--lime); color: var(--text);
    border-radius: 999px;
    font-size: 14px; font-weight: 600;
    letter-spacing: 0.01em;
    transition: background .15s ease, transform .15s ease;
  }
  .subnav-tabs .buy-pill:hover {
    background: #c4e019; color: var(--text);
    transform: translateY(-1px);
  }
  .subnav-tabs .buy-pill::after { display: none; }

  /* ============ HERO — Apple style: centered, stacked, big ============ */
  .hero {
    padding: 96px 24px 56px;
    background: var(--bg-card);
    display: flex; flex-direction: column; align-items: center;
    text-align: center;
  }
  .hero-eyebrow {
    font-family: var(--mono); font-size: 11px;
    color: var(--blue); letter-spacing: 0.22em; text-transform: uppercase;
    margin-bottom: 14px;
  }
  .hero-h1 {
    font-size: clamp(72px, 9vw, 124px);
    line-height: 0.96; letter-spacing: -0.045em;
    margin: 0 0 18px; font-weight: 700;
    color: var(--text);
  }
  .hero-tagline {
    font-size: clamp(22px, 2.2vw, 30px);
    line-height: 1.25; letter-spacing: -0.015em;
    color: var(--text); font-weight: 500;
    margin: 0 0 12px; max-width: 22ch;
  }
  .hero-lede {
    font-size: 17px; line-height: 1.5;
    color: var(--text-muted);
    margin: 0 auto 36px; max-width: 52ch;
  }
  .hero-cta {
    display: flex; gap: 24px; align-items: center; justify-content: center;
    margin-bottom: 64px;
    font-size: 16px;
  }
  .hero-cta .primary {
    padding: 13px 28px;
    background: var(--blue); color: #fff;
    border-radius: 999px;
    font-weight: 500;
  }
  .hero-cta .primary::after { content: '  →'; }
  .hero-cta .ghost {
    color: var(--blue); font-weight: 500;
  }
  .hero-cta .ghost::after { content: ' ›'; }

  .hero-image {
    width: 100%; max-width: 720px;
    aspect-ratio: 4 / 3;
    display: flex; align-items: center; justify-content: center;
    background: radial-gradient(ellipse 60% 40% at 50% 60%, rgba(77,195,255,0.10) 0%, transparent 70%);
  }
  .hero-image img { max-width: 58%; height: auto; object-fit: contain; }

  .hero-bullets {
    margin-top: 28px;
    font-family: var(--mono); font-size: 12px;
    color: var(--text-subtle);
    letter-spacing: 0.08em; text-transform: uppercase;
  }
  .hero-bullets span + span::before { content: ' · '; margin: 0 6px; color: var(--line-strong); }

  /* ============ SECTION BASE — Apple style: no step prefix, large H2.
     Use the SAME horizontal padding as the subnav (56px) so every block
     left/right edge aligns. Drop max-width so it fills the main column
     regardless of sidebar collapse state. ============ */
  .section { padding: 88px 56px; max-width: none; margin: 0; }
  .section-eyebrow {
    font-family: var(--mono); font-size: 11px;
    color: var(--blue); letter-spacing: 0.22em; text-transform: uppercase;
    margin-bottom: 12px;
    display: block;
  }
  .section-h2 {
    font-size: clamp(36px, 4vw, 52px);
    line-height: 1.05; letter-spacing: -0.025em;
    margin: 0 0 12px; font-weight: 700;
    max-width: 22ch;
  }
  .section-sub {
    font-size: 19px; line-height: 1.5;
    color: var(--text-muted);
    margin: 0 0 44px; max-width: 60ch;
  }
  .section-head-row {
    display: flex; align-items: flex-end; justify-content: space-between;
    margin-bottom: 36px; gap: 32px;
  }
  /* Legacy section-head kept for backwards compat (now styled flat) */
  .section-head { margin-bottom: 22px; display: flex; align-items: flex-end; justify-content: space-between; padding-bottom: 0; border-bottom: 0; }
  .section-head .step { font-family: var(--mono); font-size: 11px; color: var(--blue); letter-spacing: 0.22em; text-transform: uppercase; margin-bottom: 6px; display: none; }
  .section-head h2 { font-size: clamp(36px, 4vw, 52px); line-height: 1.05; letter-spacing: -0.025em; margin: 0; font-weight: 700; }
  .section-head .meta { font-family: var(--mono); font-size: 10.5px; color: var(--text-subtle); letter-spacing: 0.1em; }

  /* ============ FEATURES ============ */
  .feature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .feature-card {
    padding: 26px 24px 22px;
    background: var(--bg-card);
    border: 1px solid var(--line);
    border-radius: 12px;
    display: flex; flex-direction: column; gap: 8px;
    min-height: 180px;
  }
  .feature-card .num { font-family: var(--mono); font-size: 11px; color: var(--lime-deep); letter-spacing: 0.18em; }
  .feature-card h3 { font-size: 17px; letter-spacing: -0.01em; margin: 4px 0 6px; font-weight: 700; }
  .feature-card p { font-size: 13.5px; color: var(--text-muted); margin: 0; line-height: 1.55; }

  /* ============ SPEC TABLE ============ */
  .spec-table {
    background: var(--bg-card);
    border: 1px solid var(--line);
    border-radius: 12px;
    overflow: hidden;
  }
  .spec-row {
    display: grid; grid-template-columns: 240px 1fr;
    padding: 14px 22px;
    border-bottom: 1px solid var(--line);
    font-size: 13.5px;
  }
  .spec-row:last-child { border-bottom: 0; }
  .spec-row .lbl { color: var(--text-subtle); font-family: var(--mono); font-size: 11.5px; letter-spacing: 0.06em; text-transform: uppercase; }
  .spec-row .val { color: var(--text); font-weight: 500; }

  /* ============ COMPARE TABLE — flat, no outer card frame ============ */
  .compare-table {
    background: transparent;
    border-radius: 0;
  }
  .compare-row {
    display: grid;
    grid-template-columns: 200px repeat(6, 1fr);
    border-bottom: 1px solid var(--line);
  }
  .compare-row:last-child { border-bottom: 0; }
  /* 3-column variant — used on mini-series page for Single / Duo / Triple */
  .compare-table--3col .compare-row {
    grid-template-columns: 260px repeat(3, 1fr);
  }
  .compare-cell-label {
    padding: 26px 28px 26px 0;     /* no left pad — label text aligns to section/subnav edge */
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    display: flex; align-items: flex-start;
    text-transform: none; letter-spacing: 0;
    line-height: 1.35;
    background: transparent;
  }
  .compare-cell {
    padding: 26px 28px;
    font-size: 15px;
    font-weight: 500;
    color: var(--text);
    display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
    text-align: center;
    min-height: 72px;
    line-height: 1.4;
  }
  /* No column-wide tint anymore — popular = header-only badge. Keep "current"
     reserved for cross-series compare on products-v3. */
  .compare-cell.current { background: rgba(174,201,11,0.06); }
  .compare-cell.sku {
    font-family: var(--mono);
    font-size: 12.5px;
    font-weight: 500;
    color: var(--text-subtle);
    letter-spacing: 0.04em;
  }
  .compare-cell .dim {
    margin-top: 6px;
    font-family: var(--mono);
    font-size: 12.5px;
    color: var(--text-subtle);
    letter-spacing: 0.06em;
    font-weight: 500;
  }
  .compare-row.compare-shared-head {
    background: transparent;
    border-top: 1px solid var(--line);
  }
  .compare-row.compare-shared-head .compare-cell-label {
    font-family: var(--mono);
    font-size: 11px;
    color: var(--text-subtle);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    font-weight: 500;
  }
  .compare-row.compare-shared-head .compare-cell {
    font-size: 14px;
    color: var(--text-muted);
    line-height: 1.7;
    padding: 24px 28px;
  }
  .compare-row.compare-shared-head .compare-cell strong {
    color: var(--text);
    font-weight: 500;
    margin-right: 2px;
  }

  /* Model row — variant name (big) + SKU (small) */
  .compare-row.compare-id {
    background: transparent;
    border-bottom: 1px solid var(--line);
  }
  .compare-row.compare-id .compare-cell {
    padding: 28px 24px 24px;
    align-items: center; text-align: center;
    gap: 6px;
    min-height: auto;
  }
  .compare-row.compare-id .id-name {
    font-size: 22px; font-weight: 600; color: var(--text);
    letter-spacing: -0.015em;
  }
  .compare-row.compare-id .id-sku {
    font-family: var(--mono); font-size: 12px; font-weight: 500;
    color: var(--text-subtle); letter-spacing: 0.02em;
    margin-top: 2px;
  }
  /* MOST POPULAR badge — lime filled pill with star icon, more distinct */
  .compare-row.compare-id .tag {
    display: inline-flex; align-items: center; gap: 5px;
    margin-top: 10px;
    padding: 5px 12px;
    font-family: var(--sans); font-size: 11px; font-weight: 600;
    color: var(--text);
    background: var(--lime);
    border-radius: 999px;
    letter-spacing: 0.02em;
  }
  .compare-row.compare-id .tag svg {
    width: 11px; height: 11px;
    color: var(--text);
  }

  /* Image-only row — product photo, no label, no power */
  .compare-row.compare-head {
    background: transparent;
    border-bottom: 1px solid var(--line);
  }
  .compare-row.compare-head .compare-cell {
    padding: 32px 24px;
    min-height: auto;
    align-items: center; text-align: center;
  }
  .compare-row.compare-head .compare-cell-label { background: transparent; }
  .compare-row.compare-head .compare-cell img {
    width: 160px; height: 160px; object-fit: contain;
  }

  /* Dimension diagram cells — engineering-blueprint style, larger */
  .dim-diagram {
    width: 180px; height: 120px;
    display: block;
    margin-bottom: 10px;
  }
  .dim-diagram .dimline { stroke: var(--text); stroke-width: 1; fill: none; }
  .dim-diagram .ext { stroke: var(--text-subtle); stroke-width: 0.6; stroke-dasharray: 1.5,1.2; fill: none; }
  .dim-diagram .arrow { stroke: var(--text); stroke-width: 1; fill: none; stroke-linejoin: round; stroke-linecap: round; }

  /* Letter "I" with serifs — fill = the letter face (lit-acrylic look) */
  .dim-diagram .letter {
    fill: rgba(174,201,11,0.30);
    stroke: var(--lime-deep);
    stroke-width: 1.4;
    stroke-linejoin: round;
  }

  /* Module top-view diagram — actual physical module */
  .dim-diagram .module-body {
    fill: rgba(77,195,255,0.10);
    stroke: var(--blue);
    stroke-width: 1.4;
    stroke-linejoin: round;
  }
  .dim-diagram .module-led {
    fill: var(--lime);
    stroke: var(--lime-deep);
    stroke-width: 0.5;
  }
  .dim-diagram .dim-txt {
    font-family: var(--mono); font-size: 9px;
    fill: var(--text-subtle);
    letter-spacing: 0.04em;
  }

  /* Cabinet C-shape (open on the face side) */
  .dim-diagram .cabinet-wall {
    fill: rgba(174,201,11,0.10);
    stroke: var(--lime-deep);
    stroke-width: 1.4;
    stroke-linejoin: round;
  }
  .dim-diagram .face-glow {
    stroke: var(--lime); stroke-width: 4;
    stroke-linecap: round;
    opacity: 0.9;
  }
  .dim-diagram .face-glow-soft {
    stroke: var(--lime); stroke-width: 10;
    stroke-linecap: round;
    opacity: 0.2;
  }
  .dim-diagram .led-pt { fill: var(--lime); stroke: var(--lime-deep); stroke-width: 0.5; }
  .dim-diagram .light-ray { stroke: var(--lime); stroke-width: 0.7; opacity: 0.55; stroke-linecap: round; }

  /* Subtitle below row label explaining what's being measured */
  .row-sublabel {
    display: block;
    font-family: var(--sans); font-size: 11.5px;
    color: var(--text-subtle);
    letter-spacing: 0;
    margin-top: 6px;
    text-transform: none;
    font-weight: 400;
    line-height: 1.45;
  }
  .compare-cell-label { flex-direction: column; align-items: flex-start; }
  .compare-cell-label > svg + * { width: 100%; }
  .dim-label {
    font-family: var(--mono); font-size: 13px; font-weight: 600;
    color: var(--text); letter-spacing: 0.04em;
  }
  /* Imperial conversion — secondary, lighter, in parens after the metric value */
  .dim-imp {
    font-style: normal;
    color: var(--text-subtle);
    font-weight: 400;
    margin-left: 4px;
  }

  /* Footer row — per-series CTA links */
  .compare-row.compare-foot { border-bottom: 0; border-top: 1px solid var(--line); background: transparent; }
  .compare-row.compare-foot .compare-cell { align-items: center; text-align: center; padding: 28px; }
  .compare-row.compare-foot .compare-cell-label { background: transparent; }
  .compare-row.compare-foot .compare-cell a {
    font-size: 14px; font-weight: 500;
    color: var(--blue);
  }
  .compare-row.compare-foot .compare-cell a::after { content: ' ›'; }

  /* Group header — full-width subsection label row */
  .compare-row.compare-group-header {
    grid-template-columns: 1fr;
    background: #fafbfc;
    border-bottom: 1px solid var(--line);
    border-top: 1px solid var(--line);
  }
  .compare-row.compare-group-header > div {
    grid-column: 1 / -1;
    padding: 22px 28px;
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 600;
    color: var(--lime-deep);
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }

  /* Span cell — cell that bridges all 3 product columns (used for descriptive sentences). */
  .compare-cell-span3 {
    grid-column: span 3;
    align-items: center;
    text-align: center;
    padding: 22px 28px;
  }
  /* Centered variant — for short shared values like Voltage / IP / CCT etc. */
  .compare-cell-span3-center {
    grid-column: span 3;
    align-items: center;
    text-align: center;
    padding: 22px 28px;
  }

  /* ============ ROW-LEVEL ICONS, SWATCHES, BADGES, THUMBS ============ */
  .row-icon {
    width: 16px; height: 16px;
    stroke: var(--text-subtle);
    fill: none;
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
    margin-right: 8px;
    flex-shrink: 0;
  }
  .compare-cell-label .row-icon { vertical-align: -3px; }

  /* LED dot pattern: 3 dots, fill state indicates LED count */
  .led-dots { display: inline-flex; gap: 6px; align-items: center; margin-right: 10px; }
  .led-dot {
    width: 10px; height: 10px; border-radius: 50%;
    background: var(--lime);
    box-shadow: 0 0 6px rgba(174,201,11,0.5);
  }
  .led-dot.off { background: transparent; border: 1px dashed var(--line-strong); box-shadow: none; }

  /* CCT swatch dots — warm/natural/cool */
  .cct-row { display: inline-flex; align-items: center; gap: 16px; }
  .cct-row .cct {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 13px; color: var(--text);
  }
  .cct-row .cct-swatch {
    width: 14px; height: 14px; border-radius: 50%;
    border: 1px solid var(--line-strong);
    box-shadow: 0 0 0 2px rgba(255,255,255,1);
  }
  .cct-row .cct-swatch.warm { background: radial-gradient(circle at 35% 35%, #ffe1a8 0%, #ffb05a 100%); }
  .cct-row .cct-swatch.natural { background: radial-gradient(circle at 35% 35%, #fff7e1 0%, #fee8b5 100%); }
  .cct-row .cct-swatch.cool { background: radial-gradient(circle at 35% 35%, #e3edff 0%, #b8d0ff 100%); }

  /* Cert logos — real cert organization badges (UL · CE · TUV · RoHS + LM-80 text) */
  .cert-row { display: inline-flex; gap: 18px; flex-wrap: wrap; justify-content: center; align-items: center; }
  .cert-logo {
    height: 40px; width: auto;
    object-fit: contain;
    display: block;
    transition: filter .15s ease;
  }
  .cert-logo:hover { filter: brightness(0.92); }
  .cert-text {
    padding: 4px 10px;
    font-family: var(--mono); font-size: 10.5px; font-weight: 600;
    letter-spacing: 0.08em;
    border: 1px solid var(--line-strong);
    border-radius: 4px;
    color: var(--text-muted);
    background: transparent;
  }

  /* Inline thumbnail for "complete the system" rows */
  .row-thumb {
    display: inline-flex; align-items: center; gap: 12px;
    width: 100%;
  }
  .row-thumb img {
    width: 44px; height: 44px;
    object-fit: contain;
    background: var(--blue-soft);
    border-radius: 8px;
    padding: 4px;
    flex-shrink: 0;
  }
  .row-thumb .body { flex: 1; }

  /* Application card inside a cell — image on top, label + sub below */
  .app-mini {
    display: flex; flex-direction: column; gap: 8px;
    width: 100%;
  }
  .app-mini img {
    width: 100%; aspect-ratio: 16 / 10;
    object-fit: cover;
    border-radius: 8px;
  }
  .app-mini strong {
    font-size: 15px; font-weight: 600; color: var(--text);
    line-height: 1.3;
  }
  .app-mini span {
    font-size: 13px; color: var(--text-muted);
    line-height: 1.45;
  }
  .app-mini .fit-meta {
    margin-top: 6px;
    font-family: var(--mono); font-size: 12px;
    color: var(--text-subtle); letter-spacing: 0.04em;
    padding-top: 10px;
    border-top: 1px dashed var(--line-strong);
    font-weight: 500;
  }

  /* Help row — Find your match / Free layout design CTA inside table */
  .help-row { background: rgba(174,201,11,0.04); }
  .help-row .compare-cell-label { background: rgba(174,201,11,0.05); }
  .help-ctas {
    flex-direction: row !important;
    flex-wrap: wrap; gap: 12px;
    justify-content: flex-start !important;
  }
  .help-ctas .pill {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 18px;
  }
  .help-ctas .pill svg {
    width: 14px; height: 14px; flex-shrink: 0;
  }

  /* Region-aware "your region" highlight on Where-to-buy rows */
  .compare-row.wtb-region-row .compare-cell-label {
    color: var(--text);
    font-weight: 600;
  }
  .compare-row.wtb-region-row.current .compare-cell-label {
    color: var(--lime-deep);
  }
  .compare-row.wtb-region-row.current .compare-cell-label::after {
    content: 'YOUR REGION';
    margin-left: 10px;
    padding: 2px 8px;
    font-family: var(--mono); font-size: 9px; font-weight: 500;
    color: var(--lime-deep); background: var(--lime-soft);
    border-radius: 3px;
    letter-spacing: 0.18em;
    vertical-align: 2px;
  }

  /* Pill-style buy/download link inside cells */
  .compare-cell .pill {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 7px 14px;
    background: var(--bg-card);
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    font-size: 13px; font-weight: 500;
    color: var(--text);
    transition: border-color .15s ease, background .15s ease;
  }
  .compare-cell .pill:hover { border-color: var(--blue); }
  .compare-cell .pill::after { content: ' ›'; color: var(--text-subtle); }
  .compare-cell .pill.primary { background: var(--text); color: #fff; border-color: var(--text); }
  .compare-cell .pill.primary:hover { background: var(--blue); border-color: var(--blue); }
  .compare-cell .pill.primary::after { color: rgba(255,255,255,0.7); }
  .compare-cell .pill.lime { background: var(--lime); color: var(--text); border-color: var(--lime); }
  .compare-cell .pill.lime::after { color: var(--text); }

  /* ============ VARIANTS ============ */
  .variant-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .variant-card {
    padding: 28px 26px 24px;
    background: var(--bg-card);
    border: 1px solid var(--line);
    border-radius: 14px;
    position: relative;
    display: flex; flex-direction: column; gap: 14px;
    min-height: 220px;
  }
  .variant-card.popular { border: 1px solid var(--lime-deep); box-shadow: 0 0 0 1px var(--lime-deep); }
  .variant-card.popular::after {
    content: 'MOST POPULAR'; position: absolute; top: 18px; right: 22px;
    font-family: var(--mono); font-size: 9px; color: var(--lime-deep); letter-spacing: 0.2em;
    padding: 3px 8px; background: var(--lime-soft); border-radius: 4px;
  }
  .variant-card .name { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; margin: 0; }
  .variant-card .sku { font-family: var(--mono); font-size: 11px; color: var(--text-subtle); letter-spacing: 0.12em; }
  .variant-card ul { margin: 6px 0 auto; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 6px; }
  .variant-card li { font-size: 13.5px; color: var(--text-muted); padding-left: 16px; position: relative; }
  .variant-card li::before { content: '·'; color: var(--blue); position: absolute; left: 6px; font-weight: 700; }
  .variant-card .actions { display: flex; gap: 14px; align-items: center; font-size: 12.5px; font-weight: 600; }
  .variant-card .actions a { color: var(--blue); }
  .variant-card .actions a::after { content: ' →'; transition: transform .2s; display: inline-block; }
  .variant-card .actions a:hover::after { transform: translateX(3px); }

  /* ============ APPLICATIONS ============ */
  .app-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .app-card {
    border-radius: 12px; overflow: hidden;
    background: var(--bg-card); border: 1px solid var(--line);
    display: flex; flex-direction: column;
    min-height: 280px;
    position: relative;
  }
  .app-card .img-wrap { aspect-ratio: 16 / 10; overflow: hidden; }
  .app-card img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s ease; }
  .app-card:hover img { transform: scale(1.04); }
  .app-card .body { padding: 18px 20px 22px; }
  .app-card h3 { font-size: 17px; margin: 0 0 6px; letter-spacing: -0.01em; }
  .app-card p { font-size: 13px; color: var(--text-muted); margin: 0; line-height: 1.55; }

  /* ============ PAIR WITH ============ */
  .pair-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .pair-card {
    padding: 22px;
    background: var(--bg-card); border: 1px solid var(--line);
    border-radius: 12px;
    display: flex; flex-direction: column; gap: 10px;
    transition: border-color .15s ease, transform .2s ease;
  }
  .pair-card:hover { border-color: var(--blue); transform: translateY(-2px); }
  .pair-card .thumb { width: 56px; height: 56px; border-radius: 10px; background: linear-gradient(135deg, var(--blue-soft) 0%, transparent 100%); display: flex; align-items: center; justify-content: center; }
  .pair-card .thumb img { width: 78%; height: 78%; object-fit: contain; }
  .pair-card .tag { font-family: var(--mono); font-size: 10px; color: var(--text-subtle); letter-spacing: 0.18em; text-transform: uppercase; }
  .pair-card h3 { font-size: 16px; margin: 0; letter-spacing: -0.005em; }
  .pair-card p { font-size: 12.5px; color: var(--text-muted); margin: 0; line-height: 1.5; }
  .pair-card .more { margin-top: auto; font-size: 12px; font-weight: 600; color: var(--blue); }
  .pair-card .more::after { content: ' →'; }

  /* ============ RESOURCES ============ */
  .res-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .res-card {
    padding: 22px 22px 18px;
    background: var(--bg-card); border: 1px solid var(--line);
    border-radius: 12px;
    display: flex; flex-direction: column; gap: 10px;
    min-height: 180px;
    position: relative;
  }
  .res-card .label { font-family: var(--mono); font-size: 10px; color: var(--lime-deep); letter-spacing: 0.2em; text-transform: uppercase; }
  .res-card h3 { font-size: 16px; margin: 0; letter-spacing: -0.005em; font-weight: 700; }
  .res-card p { font-size: 12.5px; color: var(--text-muted); margin: 0; line-height: 1.5; flex: 1; }
  .res-card .meta { font-family: var(--mono); font-size: 10px; color: var(--text-subtle); letter-spacing: 0.1em; }
  .res-card.download .meta { color: var(--blue); }
  .res-card.download .meta::after { content: ' ↓'; }
  .res-card.request .meta::after { content: ' →'; }

  /* ============ WHERE TO BUY ============ */
  .wtb-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
  .wtb-card {
    padding: 26px;
    background: var(--bg-card); border: 1px solid var(--line);
    border-radius: 12px;
    position: relative;
    display: flex; flex-direction: column; gap: 12px;
    min-height: 240px;
  }
  .wtb-card.primary {
    border: 1px solid var(--lime-deep);
    box-shadow: 0 0 0 1px var(--lime-deep);
    background: linear-gradient(135deg, var(--lime-soft) 0%, transparent 60%);
  }
  .wtb-card.primary::after {
    content: 'YOUR REGION'; position: absolute; top: 18px; right: 22px;
    font-family: var(--mono); font-size: 9px; color: var(--lime-deep); letter-spacing: 0.2em;
    padding: 3px 8px; background: var(--bg-card); border-radius: 4px;
  }
  .wtb-card .flags { font-size: 24px; line-height: 1; }
  .wtb-card .region { font-family: var(--mono); font-size: 10px; color: var(--text-subtle); letter-spacing: 0.2em; text-transform: uppercase; }
  .wtb-card h3 { font-size: 19px; margin: 0; letter-spacing: -0.01em; }
  .wtb-card p { font-size: 13px; color: var(--text-muted); margin: 0; line-height: 1.55; }
  .wtb-card .actions { display: flex; gap: 10px; margin-top: auto; }
  .wtb-card .btn-prim {
    padding: 9px 16px;
    background: var(--text); color: #fff;
    font-size: 12.5px; font-weight: 600;
    border-radius: 4px; letter-spacing: 0.02em;
  }
  .wtb-card .btn-prim::after { content: ' →'; }
  .wtb-card.primary .btn-prim { background: var(--lime); color: var(--text); }
  .wtb-card .btn-ghost {
    padding: 9px 14px;
    border: 1px solid var(--line-strong);
    font-size: 12.5px; color: var(--text-muted);
    border-radius: 4px;
  }

  /* ============ END CTA — match section horizontal padding (56px) ============ */
  .end-cta { padding: 14px 56px 40px; }
  .end-cta-inner { padding: 38px 44px; background: var(--bg-card); border: 1px solid var(--line); border-radius: 16px; display: flex; align-items: center; justify-content: space-between; gap: 32px; }
  .end-cta-inner .eyebrow { font-family: var(--mono); font-size: 11px; letter-spacing: 0.2em; color: var(--blue); text-transform: uppercase; }
  .end-cta-inner h2 { font-size: 30px; letter-spacing: -0.02em; margin: 8px 0 10px; max-width: 22ch; }
  .end-cta-inner p { font-size: 14px; color: var(--text-muted); margin: 0; max-width: 56ch; }
  .end-cta-inner .pri { padding: 12px 22px; background: var(--text); color: #fff; border-radius: 999px; font-size: 13.5px; font-weight: 600; }
  .end-cta-inner .pri::after { content: '  →'; }
  .end-cta-inner .ghost { padding: 12px 22px; color: var(--blue); font-size: 13.5px; font-weight: 600; }

  /* ============ COMPACT INTRO — split layout, solution-first ============ */
  .intro { padding: 40px 24px 28px; max-width: 1200px; margin: 0 auto; }
  .intro-grid {
    display: grid; grid-template-columns: 1.3fr 1fr;
    gap: 64px; align-items: center;
    margin-bottom: 0;
  }
  @media (max-width: 980px) { .intro-grid { grid-template-columns: 1fr; gap: 28px; } }

  .intro-eyebrow {
    font-family: var(--sans);
    font-size: 13px; font-weight: 600;
    color: var(--blue);
    letter-spacing: 0.02em;
    text-transform: none;
    margin-bottom: 14px;
  }
  .intro-h1 {
    font-size: clamp(32px, 3.6vw, 44px);
    line-height: 1.08; letter-spacing: -0.025em;
    margin: 0 0 14px; font-weight: 700;
    max-width: 18ch;
  }
  .intro-lede {
    font-size: 15.5px; line-height: 1.55;
    color: var(--text-muted);
    margin: 0 0 22px;
  }

  .intro-features {
    list-style: none; padding: 0; margin: 0 0 26px;
    display: flex; flex-direction: column; gap: 8px;
  }
  .intro-features li {
    font-size: 14px; line-height: 1.5;
    color: var(--text);
    padding-left: 28px;
    position: relative;
  }
  .intro-features li::before {
    content: '✓';
    position: absolute; left: 0; top: 1px;
    width: 18px; height: 18px;
    display: inline-flex; align-items: center; justify-content: center;
    background: rgba(174,201,11,0.18);
    color: var(--lime-deep);
    font-weight: 700; font-size: 11px;
    border-radius: 50%;
  }
  .intro-features li strong { color: var(--text); font-weight: 600; }

  .intro-cta {
    display: flex; gap: 12px; align-items: center;
    flex-wrap: wrap;
  }
  .intro-cta .cta-lime {
    display: inline-flex; align-items: center;
    padding: 12px 22px;
    background: var(--lime); color: var(--text);
    border-radius: 8px;
    font-size: 14px; font-weight: 600;
  }
  .intro-cta .cta-lime::after { content: ' ›'; margin-left: 2px; }
  .intro-cta .cta-ghost {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 18px;
    background: var(--bg-card);
    border: 1px solid var(--line-strong);
    border-radius: 8px;
    font-size: 14px; font-weight: 500;
    color: var(--text);
  }
  .intro-cta .cta-ghost svg { width: 14px; height: 14px; }

  /* Scene image collage on the right */
  .intro-scenes {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 10px;
    aspect-ratio: 5 / 4;
  }
  .intro-scenes .scene {
    border-radius: 12px;
    overflow: hidden;
    position: relative;
    background: var(--line);
  }
  .intro-scenes .scene img {
    width: 100%; height: 100%; object-fit: cover;
    transition: transform 0.5s ease;
  }
  .intro-scenes .scene:hover img { transform: scale(1.03); }
  .intro-scenes .scene-main { grid-row: 1 / 3; }
  .intro-scenes .scene .caption {
    position: absolute; left: 14px; bottom: 12px;
    font-family: var(--sans);
    font-size: 13px; font-weight: 500;
    color: #fff;
    letter-spacing: 0;
    text-transform: none;
    text-shadow: 0 1px 6px rgba(0,0,0,0.55);
  }

  /* Stats strip below the split — full width */
  .intro-stats {
    display: grid; grid-template-columns: repeat(4, 1fr);
    padding: 20px 0;
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
  }
  .intro-stats .stat {
    display: flex; flex-direction: column; gap: 4px;
    padding: 4px 24px;
    border-left: 1px solid var(--line);
  }
  .intro-stats .stat:first-child { border-left: 0; padding-left: 0; }
  .intro-stats .stat strong {
    font-size: 22px; font-weight: 600; color: var(--text);
    letter-spacing: -0.01em;
  }
  .intro-stats .stat span {
    font-family: var(--sans);
    font-size: 13px; font-weight: 400;
    color: var(--text-muted);
    letter-spacing: 0;
    text-transform: none;
    margin-top: 2px;
  }

  /* ============ TAB PANES — Overview · Compare · Solutions ============ */
  .tab-pane { display: none; }
  .tab-pane.is-active { display: block; }

  /* ============ OVERVIEW — engineering story ============ */
  .feature-card .ic {
    width: 32px; height: 32px;
    display: inline-flex; align-items: center; justify-content: center;
    border-radius: 7px;
    background: rgba(174,201,11,0.14);
    color: var(--lime-deep);
    margin-bottom: 4px;
  }
  .feature-card .ic svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 1.6; }

  /* Compact 6-tile variant — bigger icon, shorter card, single-line body */
  .feature-grid.feature-grid--compact .feature-card {
    min-height: 0;
    padding: 30px 26px 28px;
    gap: 14px;
    align-items: flex-start;
  }
  .feature-grid.feature-grid--compact .feature-card .ic {
    width: 44px; height: 44px;
    border-radius: 10px;
    margin-bottom: 6px;
  }
  .feature-grid.feature-grid--compact .feature-card .ic svg { width: 22px; height: 22px; stroke-width: 1.7; }
  .feature-grid.feature-grid--compact .feature-card h3 {
    font-size: 22px; line-height: 1.1; letter-spacing: -0.018em;
    margin: 2px 0 2px;
    font-weight: 700;
  }
  .feature-grid.feature-grid--compact .feature-card p {
    font-size: 14px; line-height: 1.4;
    color: var(--text-muted);
    margin: 0;
  }

  /* Cross-section illustration */
  .howit-wrap {
    background: var(--bg-card);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 36px 40px 32px;
    display: flex; flex-direction: column; gap: 26px;
  }
  .howit-diagram { width: 100%; height: auto; display: block; max-height: 360px; }
  .howit-legend {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px;
    padding-top: 22px;
    border-top: 1px solid var(--line);
  }
  .howit-legend .item { display: flex; gap: 12px; align-items: flex-start; }
  .howit-legend .swatch { width: 14px; height: 14px; border-radius: 3px; flex-shrink: 0; margin-top: 4px; }
  .howit-legend .swatch.face   { background: rgba(174,201,11,0.30); border: 1.4px solid var(--lime-deep); }
  .howit-legend .swatch.beam   { background: rgba(174,201,11,0.18); border: 1.4px solid var(--lime-deep); }
  .howit-legend .swatch.module { background: rgba(77,195,255,0.20); border: 1.4px solid var(--blue); }
  .howit-legend .swatch.cabinet { background: rgba(0,0,0,0.05); border: 1.4px solid var(--text); }
  .howit-legend .body { font-size: 13px; line-height: 1.5; color: var(--text-muted); }
  .howit-legend .body strong { display: block; color: var(--text); font-weight: 600; margin-bottom: 2px; }

  /* Compact legend — single row of tag tokens, no prose */
  .howit-legend.howit-legend--compact {
    display: flex; flex-wrap: wrap;
    gap: 28px;
    justify-content: center;
    padding-top: 22px;
  }
  .howit-legend.howit-legend--compact .item {
    display: inline-flex; align-items: center; gap: 10px;
    font-size: 13.5px; color: var(--text);
    font-weight: 500;
  }
  .howit-legend.howit-legend--compact .swatch { margin-top: 0; }

  /* Variant mini-summary cards */
  .mini-variant-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  .mini-variant {
    background: var(--bg-card); border: 1px solid var(--line); border-radius: 14px;
    padding: 24px 24px 22px;
    display: flex; flex-direction: column; gap: 12px;
    position: relative;
  }
  .mini-variant.popular { border-color: var(--lime-deep); box-shadow: 0 0 0 1px var(--lime-deep); }
  .mini-variant .img-slot {
    height: 110px;
    display: flex; align-items: center; justify-content: center;
    background: radial-gradient(ellipse 60% 60% at 50% 60%, rgba(77,195,255,0.07) 0%, transparent 70%);
    border-radius: 8px;
  }
  .mini-variant .img-slot img { max-height: 90px; max-width: 80%; object-fit: contain; display: block; }
  .mini-variant .name { font-size: 20px; font-weight: 700; margin: 0; letter-spacing: -0.015em; }
  .mini-variant .sku { font-family: var(--mono); font-size: 11px; color: var(--text-subtle); letter-spacing: 0.06em; }
  .mini-variant .specs {
    display: grid; grid-template-columns: max-content 1fr; gap: 6px 14px;
    font-size: 13px; line-height: 1.45;
    padding-top: 10px; border-top: 1px dashed var(--line-strong);
  }
  .mini-variant .specs dt { color: var(--text-subtle); font-family: var(--mono); font-size: 11px; letter-spacing: 0.04em; text-transform: uppercase; padding-top: 1px; }
  .mini-variant .specs dd { color: var(--text); margin: 0; font-weight: 500; }
  .mini-variant .fit { font-size: 12.5px; color: var(--text-muted); line-height: 1.5; margin-top: 6px; }
  .mini-variant .badge {
    display: inline-flex; align-items: center; gap: 4px;
    position: absolute; top: 18px; right: 22px;
    padding: 4px 10px;
    background: var(--lime); color: var(--text);
    font-family: var(--sans); font-size: 10.5px; font-weight: 600;
    border-radius: 999px;
    letter-spacing: 0.04em;
  }

  /* Assurance strip — certs + warranty + lifetime */
  .assurance-strip {
    display: grid; grid-template-columns: 1.4fr 1fr;
    gap: 0;
    background: var(--bg-card);
    border: 1px solid var(--line);
    border-radius: 14px;
    overflow: hidden;
  }
  .assurance-strip .certs {
    padding: 28px 34px;
    display: flex; gap: 22px; align-items: center; flex-wrap: wrap;
  }
  .assurance-strip .certs .cert-logo { height: 38px; }
  .assurance-strip .promises {
    padding: 28px 34px;
    display: flex; flex-direction: column; gap: 10px;
    border-left: 1px solid var(--line);
    background: linear-gradient(135deg, rgba(174,201,11,0.04) 0%, transparent 60%);
  }
  .assurance-strip .promises div { font-size: 13.5px; color: var(--text-muted); display: flex; gap: 10px; align-items: baseline; }
  .assurance-strip .promises div strong { color: var(--text); font-weight: 600; min-width: 90px; display: inline-block; }
  @media (max-width: 980px) { .assurance-strip { grid-template-columns: 1fr; } .assurance-strip .promises { border-left: 0; border-top: 1px solid var(--line); } }

  /* ============ SOLUTIONS — applications, sizing guide, sign-types ============ */
  .sol-app-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  .sol-card {
    background: var(--bg-card); border: 1px solid var(--line);
    border-radius: 14px; overflow: hidden;
    display: flex; flex-direction: column;
    transition: border-color .15s ease, transform .2s ease;
  }
  .sol-card:hover { border-color: var(--blue); transform: translateY(-2px); }
  .sol-card .img-slot { aspect-ratio: 16 / 10; background: var(--line); overflow: hidden; position: relative; }
  .sol-card .img-slot img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s ease; }
  .sol-card:hover .img-slot img { transform: scale(1.04); }
  .sol-card .img-slot.illus {
    background: linear-gradient(135deg, var(--blue-soft) 0%, #f8faff 60%, var(--bg-card) 100%);
    display: flex; align-items: center; justify-content: center;
  }
  .sol-card .img-slot.illus svg { width: 70%; height: 70%; }
  .sol-card .body { padding: 22px 24px 24px; display: flex; flex-direction: column; gap: 10px; flex: 1; }
  .sol-card h3 { font-size: 18px; margin: 0; letter-spacing: -0.01em; font-weight: 700; }
  .sol-card .desc { font-size: 13.5px; color: var(--text-muted); margin: 0; line-height: 1.55; flex: 1; }
  .sol-card .pick {
    margin: 0; padding-top: 14px;
    border-top: 1px dashed var(--line-strong);
    display: grid; grid-template-columns: max-content 1fr; gap: 6px 12px;
    font-size: 12px;
  }
  .sol-card .pick dt { font-family: var(--mono); color: var(--text-subtle); letter-spacing: 0.06em; text-transform: uppercase; font-size: 10.5px; padding-top: 2px; }
  .sol-card .pick dd { color: var(--text); margin: 0; font-weight: 600; }
  .sol-card .pick dd em { font-style: normal; color: var(--text-muted); font-weight: 400; margin-left: 6px; }

  /* Compact app card — bigger image, one-line spec */
  .sol-app-grid.sol-app-grid--compact .sol-card .img-slot { aspect-ratio: 4 / 3; }
  .sol-app-grid.sol-app-grid--compact .sol-card .body { padding: 18px 22px 20px; gap: 6px; }
  .sol-app-grid.sol-app-grid--compact .sol-card h3 { font-size: 17px; font-weight: 700; letter-spacing: -0.005em; }
  .sol-app-grid.sol-app-grid--compact .sol-card .pick-line {
    margin: 0; font-size: 13.5px; color: var(--text-muted);
    font-family: var(--mono);
    letter-spacing: 0.02em;
  }
  .sol-app-grid.sol-app-grid--compact .sol-card .pick-line strong {
    color: var(--lime-deep); font-weight: 600;
    background: var(--lime-soft);
    padding: 2px 8px;
    border-radius: 3px;
    margin-right: 4px;
    font-family: var(--sans);
    letter-spacing: 0;
    font-size: 12.5px;
  }

  /* Spec / sizing guide — 2-column matched panels */
  .spec-guide {
    display: grid;
    grid-template-columns: 1fr 1fr;
    background: var(--bg-card);
    border: 1px solid var(--line);
    border-radius: 14px;
    overflow: hidden;
  }
  .spec-guide-block { padding: 30px 34px; }
  .spec-guide-block + .spec-guide-block { border-left: 1px solid var(--line); }
  .spec-guide-block h3 {
    font-family: var(--mono); font-size: 11px;
    color: var(--lime-deep); letter-spacing: 0.2em;
    text-transform: uppercase;
    margin: 0 0 4px;
  }
  .spec-guide-block p {
    font-size: 13.5px; color: var(--text-muted);
    margin: 0 0 20px; line-height: 1.55;
  }
  .spec-guide-row {
    display: grid; grid-template-columns: 190px 1fr;
    padding: 14px 0;
    border-bottom: 1px dashed var(--line);
    align-items: center;
    gap: 12px;
  }
  .spec-guide-row:last-child { border-bottom: 0; }
  .spec-guide-row .range {
    font-family: var(--mono); font-size: 13px; font-weight: 600;
    color: var(--text); letter-spacing: 0.02em;
  }
  .spec-guide-row .range em { font-style: normal; color: var(--text-subtle); font-weight: 400; margin-left: 4px; font-size: 11.5px; }
  .spec-guide-row .pick {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    font-size: 13.5px; color: var(--text); font-weight: 500;
  }
  .spec-guide-row .pop {
    font-family: var(--mono); font-size: 9.5px; color: var(--lime-deep);
    background: var(--lime-soft); padding: 3px 8px; border-radius: 3px;
    letter-spacing: 0.16em; font-weight: 600;
  }
  @media (max-width: 980px) { .spec-guide { grid-template-columns: 1fr; } .spec-guide-block + .spec-guide-block { border-left: 0; border-top: 1px solid var(--line); } }

  /* Pick chart — visual sizing bar */
  .pick-chart {
    background: var(--bg-card);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 36px 40px;
    display: flex; flex-direction: column; gap: 18px;
  }
  .pick-chart .pick-axis {
    display: grid; grid-template-columns: 1fr 1fr 1fr;
    font-family: var(--mono); font-size: 11px;
    color: var(--text-subtle);
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }
  .pick-chart .pick-axis span { padding-bottom: 8px; }
  .pick-chart .pick-axis span:nth-child(2) { text-align: center; }
  .pick-chart .pick-axis span:nth-child(3) { text-align: right; }
  .pick-chart .pick-bar {
    display: grid; grid-template-columns: 1fr 1fr 1fr;
    gap: 4px;
    border-radius: 10px;
    overflow: hidden;
  }
  .pick-chart .pick-seg {
    padding: 28px 22px 24px;
    display: flex; flex-direction: column; gap: 6px;
    color: var(--text);
    font-size: 22px; font-weight: 700;
    letter-spacing: -0.015em;
    position: relative;
  }
  .pick-chart .pick-seg span { display: flex; align-items: center; gap: 10px; }
  .pick-chart .pick-seg em {
    font-style: normal;
    font-family: var(--mono); font-size: 11.5px;
    font-weight: 500;
    color: var(--text-subtle);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .pick-chart .pick-seg em.pop {
    color: var(--lime-deep);
    background: var(--lime-soft);
    padding: 3px 8px;
    border-radius: 3px;
    letter-spacing: 0.14em;
    font-size: 9.5px;
    font-weight: 600;
  }
  .pick-chart .pick-seg.single { background: rgba(0,113,188,0.06); }
  .pick-chart .pick-seg.duo    { background: rgba(0,113,188,0.10); }
  .pick-chart .pick-seg.triple { background: rgba(0,113,188,0.14); }
  .pick-chart .pick-foot {
    padding-top: 14px;
    border-top: 1px solid var(--line);
    font-size: 13px;
    color: var(--text-muted);
    text-align: center;
  }
  .pick-chart .pick-foot strong { color: var(--text); font-weight: 600; margin-right: 6px; }

  /* Sign-type cross-section trio */
  .sign-types { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  .sign-type {
    background: var(--bg-card); border: 1px solid var(--line);
    border-radius: 14px;
    padding: 24px 26px 26px;
    display: flex; flex-direction: column; gap: 14px;
  }
  .sign-type .diagram-slot {
    height: 150px;
    background: linear-gradient(180deg, #fafbfc 0%, var(--bg-card) 100%);
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    padding: 12px;
  }
  .sign-type svg { width: 100%; height: 100%; display: block; }
  .sign-type h3 { font-size: 17px; margin: 0; letter-spacing: -0.005em; font-weight: 700; }
  .sign-type p { font-size: 13px; color: var(--text-muted); margin: 0; line-height: 1.55; }
  .sign-type .tag {
    font-family: var(--mono); font-size: 10px; color: var(--text-subtle);
    letter-spacing: 0.18em; text-transform: uppercase;
  }

  /* Compact sign-type — bigger diagram, one-line pick caption */
  .sign-types.sign-types--compact .sign-type { gap: 12px; padding: 24px 24px 22px; }
  .sign-types.sign-types--compact .diagram-slot { height: 180px; }
  .sign-types.sign-types--compact h3 { font-size: 19px; margin-top: 4px; }
  .sign-types.sign-types--compact .pick-line {
    margin: 0; font-family: var(--mono); font-size: 13px;
    color: var(--text-muted); letter-spacing: 0.02em;
  }
  .sign-types.sign-types--compact .pick-line strong {
    color: var(--lime-deep); font-weight: 600;
    background: var(--lime-soft);
    padding: 2px 8px;
    border-radius: 3px;
    margin-right: 6px;
    font-family: var(--sans);
    letter-spacing: 0;
    font-size: 12.5px;
  }

  /* Planning notes — flat list of installer-friendly callouts */
  .plan-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
  .plan-card {
    background: var(--bg-card); border: 1px solid var(--line);
    border-radius: 12px;
    padding: 22px 24px;
    display: grid; grid-template-columns: 36px 1fr; gap: 16px;
    align-items: flex-start;
  }
  .plan-card .ic {
    width: 36px; height: 36px;
    display: inline-flex; align-items: center; justify-content: center;
    border-radius: 8px;
    background: var(--blue-soft);
    color: var(--blue);
    flex-shrink: 0;
  }
  .plan-card .ic svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 1.6; }
  .plan-card h4 { font-size: 14.5px; margin: 0 0 6px; font-weight: 700; letter-spacing: -0.005em; }
  .plan-card p { font-size: 13px; color: var(--text-muted); margin: 0; line-height: 1.55; }
  .plan-card p strong { color: var(--text); font-weight: 600; }

  /* Scene banner — wide cinematic image strip between sections */
  .scene-banner { padding: 0 56px 32px; margin: 0; }
  .scene-banner .frame {
    position: relative;
    border-radius: 16px;
    overflow: hidden;
    background: var(--line);
  }
  .scene-banner img {
    width: 100%;
    aspect-ratio: 21 / 9;
    object-fit: cover;
    display: block;
  }
  .scene-banner.tall img { aspect-ratio: 16 / 9; }
  .scene-banner .caption {
    position: absolute;
    left: 28px; bottom: 22px;
    color: #fff;
    text-shadow: 0 2px 14px rgba(0,0,0,0.55);
    display: flex; flex-direction: column; gap: 4px;
  }
  .scene-banner .caption .eyebrow {
    font-family: var(--mono); font-size: 10.5px;
    letter-spacing: 0.22em; text-transform: uppercase;
    color: rgba(255,255,255,0.85);
  }
  .scene-banner .caption .line {
    font-family: var(--sans); font-size: 22px; font-weight: 600;
    letter-spacing: -0.015em;
    max-width: 30ch;
  }

  /* Per-tab hero — slightly tighter than the canonical hero */
  .tab-hero {
    padding: 80px 56px 56px;
    background: var(--bg-card);
    display: flex; flex-direction: column; align-items: flex-start;
    text-align: left;
    border-bottom: 1px solid var(--line);
  }
  .tab-hero-eyebrow {
    font-family: var(--mono); font-size: 11px;
    color: var(--blue); letter-spacing: 0.22em; text-transform: uppercase;
    margin-bottom: 14px;
  }
  .tab-hero h1 {
    font-size: clamp(48px, 6vw, 72px);
    line-height: 1.02; letter-spacing: -0.035em;
    margin: 0 0 18px; font-weight: 700; color: var(--text);
    max-width: 20ch;
  }
  .tab-hero .lede {
    font-size: 18px; line-height: 1.55;
    color: var(--text-muted);
    margin: 0; max-width: 60ch;
  }
  .tab-hero .stats {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 0;
    margin-top: 40px; width: 100%; max-width: 760px;
    padding: 22px 0;
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
  }
  .tab-hero .stats .stat { padding: 0 22px; border-left: 1px solid var(--line); }
  .tab-hero .stats .stat:first-child { border-left: 0; padding-left: 0; }
  .tab-hero .stats .stat strong {
    display: block;
    font-size: 24px; font-weight: 600; color: var(--text);
    letter-spacing: -0.01em;
  }
  .tab-hero .stats .stat span {
    font-size: 12.5px; color: var(--text-muted);
    margin-top: 4px; display: block;
  }`

// Shadow-DOM HTML can't use <Image>, so the raw <img> tags below served the
// ORIGINAL files — ~3 MB of PNG/JPEG for this route. optimizeMockupImages()
// rewrites every /assets/images src to the Next optimizer endpoint instead:
// browsers negotiate AVIF/WebP at a bounded width (~10-20× smaller) and
// Cloudflare edge-caches /_next/image responses. Widths must be values from
// next.config deviceSizes/imageSizes. Applied once at module load.
export function optimizeMockupImages(html: string): string {
  const widthFor = (src: string): number => {
    if (src.includes('/certs/')) return 256 // tiny inline logos
    if (/app-mini-(hero-twilight|cabinet-detail|halo-letters)/.test(src)) return 1920 // full-bleed banners
    return 1080 // cards, module shots, ecosystem tiles
  }
  return html.replace(
    /src="(\/assets\/images\/[^"]+)"/g,
    (_, src: string) => `src="/_next/image?url=${encodeURIComponent(src)}&w=${widthFor(src)}&q=75"`,
  )
}

const MOCKUP_BODY = `
  <div class="subnav">
    <div class="subnav-left">
      <button class="subnav-path" id="series-trigger" type="button" aria-expanded="false" aria-haspopup="menu" aria-controls="series-dropdown">
        <span class="path-fam">Mini Series</span>
        <svg class="path-chev" width="9" height="9" viewBox="0 0 10 10" aria-hidden="true">
          <path d="M2 3.5 L5 6.5 L8 3.5" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="path-sep">·</span>
        <span class="path-prod">MiniLux Backlit</span>
      </button>
      <div class="series-dropdown" id="series-dropdown" role="menu" hidden></div>
    </div>
    <div class="subnav-tabs">
      <a data-tab class="active" href="#overview">Overview</a>
      <a data-tab href="#compare">Specs</a>
      <a data-tab href="#solutions">Solutions</a>
      <a class="buy-pill" href="#compare">Buy</a>
    </div>
  </div>


  <!-- ============ OVERVIEW PANE ============ -->
  <div class="tab-pane is-active" data-tab-pane="overview">

    <!-- Hero -->
    <div class="tab-hero">
      <div class="tab-hero-eyebrow">MiniLux Backlit · Mini Series</div>
      <h1>8.9 mm. No hotspots.</h1>
      <p class="lede">The thinnest backlit module ENVO makes — Diamondback lens, IP66, 12 V DC.</p>
      <div class="stats">
        <div class="stat"><strong>8.9 mm</strong><span>module size</span></div>
        <div class="stat"><strong>180°×140°</strong><span>Diamondback lens</span></div>
        <div class="stat"><strong>IP66</strong><span>outdoor-rated</span></div>
        <div class="stat"><strong>5 yr</strong><span>warranty</span></div>
      </div>
    </div>

    <!-- Scene banner: look inside an opened channel letter -->
    <div class="scene-banner tall">
      <div class="frame">
        <img decoding="async" src="/assets/images/app-mini-cabinet-detail.jpg" alt="Top-down view of an opened channel letter showing the MiniLux modules mounted to the back panel">
        <div class="caption">
          <span class="eyebrow">// Inside an opened channel letter</span>
          <span class="line">One row of modules. The whole face glows.</span>
        </div>
      </div>
    </div>

    <!-- Cross-section: how MiniLux lights a sign -->
    <section class="section">
      <span class="section-eyebrow">// How it works</span>
      <h2 class="section-h2">Even fill at 30 mm. No hotspots.</h2>
      <div class="howit-wrap">
        <svg viewBox="0 0 900 320" class="howit-diagram" aria-label="Cross-section of a backlit channel letter showing MiniLux modules, beam spread and face panel">
          <defs>
            <pattern id="hatch-cab" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(0,0,0,0.10)" stroke-width="1"/>
            </pattern>
            <linearGradient id="beam-grad" x1="0.5" y1="1" x2="0.5" y2="0">
              <stop offset="0%" stop-color="rgba(174,201,11,0.32)"/>
              <stop offset="100%" stop-color="rgba(174,201,11,0.04)"/>
            </linearGradient>
          </defs>

          <!-- Beam cones — drawn first so they sit behind the cabinet outline -->
          <g opacity="0.85">
            <path d="M200 256 L 90 90 L 310 90 Z" fill="url(#beam-grad)"/>
            <path d="M350 256 L 240 90 L 460 90 Z" fill="url(#beam-grad)"/>
            <path d="M500 256 L 390 90 L 610 90 Z" fill="url(#beam-grad)"/>
            <path d="M650 256 L 540 90 L 760 90 Z" fill="url(#beam-grad)"/>
          </g>

          <!-- Cabinet side walls -->
          <rect x="60" y="70" width="20" height="206" fill="url(#hatch-cab)" stroke="#1a2332" stroke-width="1.2"/>
          <rect x="800" y="70" width="20" height="206" fill="url(#hatch-cab)" stroke="#1a2332" stroke-width="1.2"/>

          <!-- Back panel (modules mount here) -->
          <rect x="60" y="266" width="760" height="10" fill="url(#hatch-cab)" stroke="#1a2332" stroke-width="1.2"/>

          <!-- Face panel (translucent acrylic / vinyl) -->
          <rect x="80" y="70" width="720" height="14" fill="rgba(174,201,11,0.30)" stroke="#7a8c08" stroke-width="1.2"/>
          <line x1="120" y1="84" x2="780" y2="84" stroke="#aec90b" stroke-width="3" opacity="0.55" stroke-linecap="round"/>
          <text x="440" y="60" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="11" fill="#6a7a8a" letter-spacing="0.06em">FACE PANEL · TRANSLUCENT ACRYLIC / VINYL</text>

          <!-- 4 MiniLux modules along the back panel (Triple LED layout) -->
          <g>
            <rect x="180" y="248" width="40" height="9" rx="1.5" fill="rgba(77,195,255,0.20)" stroke="#0071bc" stroke-width="1.4"/>
            <circle cx="187" cy="252.5" r="2" fill="#aec90b" stroke="#7a8c08" stroke-width="0.5"/>
            <circle cx="200" cy="252.5" r="2" fill="#aec90b" stroke="#7a8c08" stroke-width="0.5"/>
            <circle cx="213" cy="252.5" r="2" fill="#aec90b" stroke="#7a8c08" stroke-width="0.5"/>

            <rect x="330" y="248" width="40" height="9" rx="1.5" fill="rgba(77,195,255,0.20)" stroke="#0071bc" stroke-width="1.4"/>
            <circle cx="337" cy="252.5" r="2" fill="#aec90b" stroke="#7a8c08" stroke-width="0.5"/>
            <circle cx="350" cy="252.5" r="2" fill="#aec90b" stroke="#7a8c08" stroke-width="0.5"/>
            <circle cx="363" cy="252.5" r="2" fill="#aec90b" stroke="#7a8c08" stroke-width="0.5"/>

            <rect x="480" y="248" width="40" height="9" rx="1.5" fill="rgba(77,195,255,0.20)" stroke="#0071bc" stroke-width="1.4"/>
            <circle cx="487" cy="252.5" r="2" fill="#aec90b" stroke="#7a8c08" stroke-width="0.5"/>
            <circle cx="500" cy="252.5" r="2" fill="#aec90b" stroke="#7a8c08" stroke-width="0.5"/>
            <circle cx="513" cy="252.5" r="2" fill="#aec90b" stroke="#7a8c08" stroke-width="0.5"/>

            <rect x="630" y="248" width="40" height="9" rx="1.5" fill="rgba(77,195,255,0.20)" stroke="#0071bc" stroke-width="1.4"/>
            <circle cx="637" cy="252.5" r="2" fill="#aec90b" stroke="#7a8c08" stroke-width="0.5"/>
            <circle cx="650" cy="252.5" r="2" fill="#aec90b" stroke="#7a8c08" stroke-width="0.5"/>
            <circle cx="663" cy="252.5" r="2" fill="#aec90b" stroke="#7a8c08" stroke-width="0.5"/>
          </g>

          <!-- Daisy-chain cable between modules -->
          <path d="M220 252 L 330 252" stroke="#0071bc" stroke-width="1" fill="none" stroke-dasharray="2 2" opacity="0.55"/>
          <path d="M370 252 L 480 252" stroke="#0071bc" stroke-width="1" fill="none" stroke-dasharray="2 2" opacity="0.55"/>
          <path d="M520 252 L 630 252" stroke="#0071bc" stroke-width="1" fill="none" stroke-dasharray="2 2" opacity="0.55"/>

          <!-- Beam-angle annotation on middle module -->
          <line x1="350" y1="248" x2="350" y2="135" stroke="#6a7a8a" stroke-width="0.6" stroke-dasharray="2 2"/>
          <path d="M 268 175 A 100 100 0 0 1 432 175" fill="none" stroke="#7a8c08" stroke-width="1.4" stroke-dasharray="3 2"/>
          <text x="350" y="165" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="13" fill="#7a8c08" font-weight="600">180° beam (along run)</text>

          <!-- Module label -->
          <line x1="500" y1="259" x2="500" y2="298" stroke="#6a7a8a" stroke-width="0.6" stroke-dasharray="1.5 1.5"/>
          <text x="500" y="312" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="11" fill="#6a7a8a" letter-spacing="0.06em">MINILUX MODULE · 8.9 mm</text>

          <!-- Cabinet depth dimension on the right -->
          <line x1="848" y1="84" x2="848" y2="276" stroke="#1a2332" stroke-width="0.8"/>
          <line x1="841" y1="84" x2="855" y2="84" stroke="#1a2332" stroke-width="0.8"/>
          <line x1="841" y1="276" x2="855" y2="276" stroke="#1a2332" stroke-width="0.8"/>
          <text font-family="ui-monospace,Menlo,monospace" font-size="11" fill="#1a2332" letter-spacing="0.04em" transform="translate(870 180) rotate(-90)" text-anchor="middle">CABINET DEPTH · 30–80 mm</text>
        </svg>

        <div class="howit-legend howit-legend--compact">
          <span class="item"><span class="swatch face"></span>Translucent face</span>
          <span class="item"><span class="swatch beam"></span>180°×140° beam</span>
          <span class="item"><span class="swatch module"></span>MiniLux · 8.9 mm</span>
          <span class="item"><span class="swatch cabinet"></span>30–80 mm cabinet</span>
        </div>
      </div>
    </section>

    <!-- Six selling points — icon + headline + one-liner -->
    <section class="section">
      <span class="section-eyebrow">// Why MiniLux</span>
      <h2 class="section-h2">Six things, fast.</h2>
      <div class="feature-grid feature-grid--compact">
        <div class="feature-card">
          <span class="ic"><svg viewBox="0 0 24 24"><rect x="4" y="9" width="16" height="6" rx="1"/><path d="M4 12h16"/></svg></span>
          <h3>8.9 mm tall</h3>
          <p>Fits where strip modules don't.</p>
        </div>
        <div class="feature-card">
          <span class="ic"><svg viewBox="0 0 24 24"><path d="M12 21a9 9 0 0 1-9-9"/><path d="M21 12a9 9 0 0 1-9 9"/><path d="M12 21V12L4 5"/><path d="M12 12l8-7"/></svg></span>
          <h3>180°×140° lens</h3>
          <p>Diamondback optic kills hotspots.</p>
        </div>
        <div class="feature-card">
          <span class="ic"><svg viewBox="0 0 24 24"><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="12" r="2.5"/><path d="M8.5 12h7"/></svg></span>
          <h3>Cut every 14 mm</h3>
          <p>Daisy-chain any letter contour.</p>
        </div>
        <div class="feature-card">
          <span class="ic"><svg viewBox="0 0 24 24"><path d="M13 2l-9 12h7v8l9-12h-7z"/></svg></span>
          <h3>12 V DC bus</h3>
          <p>One slim driver. 40 per string.</p>
        </div>
        <div class="feature-card">
          <span class="ic"><svg viewBox="0 0 24 24"><path d="M12 3c5 6 7 9 7 13a7 7 0 0 1-14 0c0-4 2-7 7-13z"/></svg></span>
          <h3>IP66 sealed</h3>
          <p>Outdoor. −25&nbsp;°C to +60&nbsp;°C.</p>
        </div>
        <div class="feature-card">
          <span class="ic"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7"/></svg></span>
          <h3>Binned 2835</h3>
          <p>Same colour, lot to lot.</p>
        </div>
      </div>
    </section>

    <!-- Variant mini-summary -->
    <section class="section">
      <div class="section-head-row">
        <div>
          <span class="section-eyebrow">// Three variants</span>
          <h2 class="section-h2">Three sizes. One platform.</h2>
        </div>
        <a href="#compare" data-tab class="cta-ghost" style="padding: 10px 18px; background: var(--bg-card); border: 1px solid var(--line-strong); border-radius: 8px; font-size: 13.5px; font-weight: 500; color: var(--text); display: inline-flex; align-items: center; gap: 8px; white-space: nowrap;">
          Full spec comparison →
        </a>
      </div>
      <div class="mini-variant-grid">
        <div class="mini-variant">
          <div class="img-slot"><img loading="lazy" decoding="async" src="/assets/images/mod-mini-single.png" alt="MiniLux Single LED module"></div>
          <h3 class="name">Single</h3>
          <span class="sku">EV-BLML01LBY · 0.24 W</span>
          <dl class="specs">
            <dt>Size</dt><dd>14 × 8.9 × 8.9 mm</dd>
            <dt>Cut</dt><dd>Every 14 mm</dd>
            <dt>Fits</dt><dd>Tight curves · trim</dd>
          </dl>
        </div>
        <div class="mini-variant">
          <div class="img-slot"><img loading="lazy" decoding="async" src="/assets/images/mod-mini-duo.png" alt="MiniLux Duo LED module"></div>
          <h3 class="name">Duo</h3>
          <span class="sku">EV-BLML02LBY · 0.48 W</span>
          <dl class="specs">
            <dt>Size</dt><dd>25.9 × 8.9 × 8.9 mm</dd>
            <dt>Cut</dt><dd>Every 26 mm</dd>
            <dt>Fits</dt><dd>Channel letters</dd>
          </dl>
        </div>
        <div class="mini-variant popular">
          <span class="badge">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15 9 22 9.5 16.5 14 18 21 12 17.5 6 21 7.5 14 2 9.5 9 9"/></svg>
            Most popular
          </span>
          <div class="img-slot"><img loading="lazy" decoding="async" src="/assets/images/mod-mini-triple.png" alt="MiniLux Triple LED module"></div>
          <h3 class="name">Triple</h3>
          <span class="sku">EV-BLML03LBY · 0.72 W</span>
          <dl class="specs">
            <dt>Size</dt><dd>38.1 × 8.9 × 8.9 mm</dd>
            <dt>Cut</dt><dd>Every 38 mm</dd>
            <dt>Fits</dt><dd>Bright lightboxes</dd>
          </dl>
        </div>
      </div>
    </section>

    <!-- Assurance: certs + warranty + lifetime -->
    <section class="section">
      <span class="section-eyebrow">// Certified worldwide</span>
      <h2 class="section-h2">Six marks. 50,000-hour rated life.</h2>
      <div class="assurance-strip">
        <div class="certs">
          <img loading="lazy" decoding="async" class="cert-logo" src="/assets/images/certs/ul.png" alt="UL" title="UL listed (USA)">
          <span class="cert-text" title="cUL — UL listed for Canada">cUL</span>
          <img loading="lazy" decoding="async" class="cert-logo" src="/assets/images/certs/ce.png" alt="CE" title="CE marking (EU)">
          <img loading="lazy" decoding="async" class="cert-logo" src="/assets/images/certs/tuv.png" alt="TÜV" title="TÜV SÜD tested">
          <img loading="lazy" decoding="async" class="cert-logo" src="/assets/images/certs/rohs.png" alt="RoHS" title="RoHS compliant">
          <span class="cert-text" title="IEC CB Scheme — international product safety">CB</span>
        </div>
        <div class="promises">
          <div><strong>50,000 h</strong> rated life</div>
          <div><strong>−25 → +60 °C</strong> rated</div>
          <div><strong>100 %</strong> factory tested</div>
        </div>
      </div>
    </section>

  </div>

  <!-- ============ ONE MERGED COMPARE TABLE — specs · applications · pair · downloads · where-to-buy ============ -->
  <section class="section tab-pane" id="where-to-buy" data-tab-pane="compare">
    <div class="compare-table compare-table--3col">

      <!-- Product image row — top of table, real per-variant photos from envo-led.com -->
      <div class="compare-row compare-head">
        <div class="compare-cell-label"></div>
        <div class="compare-cell"><img loading="lazy" decoding="async" src="/assets/images/mod-mini-single.png" alt="MiniLux Single LED module"></div>
        <div class="compare-cell"><img loading="lazy" decoding="async" src="/assets/images/mod-mini-duo.png" alt="MiniLux Duo LED module"></div>
        <div class="compare-cell"><img loading="lazy" decoding="async" src="/assets/images/mod-mini-triple.png" alt="MiniLux Triple LED module"></div>
      </div>

      <!-- Model row — variant name (big) + SKU (small under) -->
      <div class="compare-row compare-id">
        <div class="compare-cell-label">
          <svg class="row-icon" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 12h16"/></svg>
          Model
        </div>
        <div class="compare-cell">
          <strong class="id-name">Single LED</strong>
          <span class="id-sku" data-akeneo="EV-BLML01LBY-NW:sku">EV-BLML01LBY-NW</span>
        </div>
        <div class="compare-cell">
          <strong class="id-name">Duo LED</strong>
          <span class="id-sku" data-akeneo="EV-BLML02LBY-NW:sku">EV-BLML02LBY-NW</span>
        </div>
        <div class="compare-cell">
          <strong class="id-name">Triple LED</strong>
          <span class="id-sku" data-akeneo="EV-BLML03LBY-NW:sku">EV-BLML03LBY-NW</span>
          <span class="tag"><svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15 9 22 9.5 16.5 14 18 21 12 17.5 6 21 7.5 14 2 9.5 9 9"/></svg>Most popular</span>
        </div>
      </div>

      <!-- Power row — wattage per variant -->
      <div class="compare-row">
        <div class="compare-cell-label">
          <svg class="row-icon" viewBox="0 0 24 24"><polyline points="13,2 4,14 12,14 11,22 20,10 12,10 13,2"/></svg>
          Power
        </div>
        <div class="compare-cell" data-akeneo="EV-BLML01LBY-NW:power">0.24 W</div>
        <div class="compare-cell" data-akeneo="EV-BLML02LBY-NW:power">0.48 W</div>
        <div class="compare-cell" data-akeneo="EV-BLML03LBY-NW:power">0.72 W</div>
      </div>

      <!-- Module size — physical L × W × H of each variant (top-down view) -->
      <div class="compare-row">
        <div class="compare-cell-label">
          <span>
            <svg class="row-icon" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/></svg>
            Module size
          </span>
          <span class="row-sublabel">Physical dimensions · L × W × H</span>
        </div>
        <!-- Single LED · 26 × 12 × 6 mm -->
        <div class="compare-cell">
          <svg class="dim-diagram" viewBox="0 0 180 120">
            <rect class="module-body" x="70" y="48" width="40" height="22" rx="2"/>
            <circle class="module-led" cx="90" cy="59" r="3.5"/>
            <!-- Length dim (top) -->
            <line class="dimline" x1="70" y1="38" x2="110" y2="38"/>
            <line class="ext" x1="70" y1="46" x2="70" y2="35"/>
            <line class="ext" x1="110" y1="46" x2="110" y2="35"/>
            <polyline class="arrow" points="74,35 70,38 74,41"/>
            <polyline class="arrow" points="106,35 110,38 106,41"/>
            <!-- Width dim (right) -->
            <line class="dimline" x1="120" y1="48" x2="120" y2="70"/>
            <line class="ext" x1="112" y1="48" x2="123" y2="48"/>
            <line class="ext" x1="112" y1="70" x2="123" y2="70"/>
            <polyline class="arrow" points="117,52 120,48 123,52"/>
            <polyline class="arrow" points="117,66 120,70 123,66"/>
          </svg>
          <span class="dim-label" data-akeneo="EV-BLML01LBY-NW:size">14 × 8.9 × 8.9 mm <em class="dim-imp">(0.55 × 0.35 × 0.35 in)</em></span>
        </div>
        <!-- Duo LED · 50 × 12 × 6 mm -->
        <div class="compare-cell">
          <svg class="dim-diagram" viewBox="0 0 180 120">
            <rect class="module-body" x="55" y="48" width="70" height="22" rx="2"/>
            <circle class="module-led" cx="73" cy="59" r="3.5"/>
            <circle class="module-led" cx="107" cy="59" r="3.5"/>
            <line class="dimline" x1="55" y1="38" x2="125" y2="38"/>
            <line class="ext" x1="55" y1="46" x2="55" y2="35"/>
            <line class="ext" x1="125" y1="46" x2="125" y2="35"/>
            <polyline class="arrow" points="59,35 55,38 59,41"/>
            <polyline class="arrow" points="121,35 125,38 121,41"/>
            <line class="dimline" x1="135" y1="48" x2="135" y2="70"/>
            <line class="ext" x1="127" y1="48" x2="138" y2="48"/>
            <line class="ext" x1="127" y1="70" x2="138" y2="70"/>
            <polyline class="arrow" points="132,52 135,48 138,52"/>
            <polyline class="arrow" points="132,66 135,70 138,66"/>
          </svg>
          <span class="dim-label" data-akeneo="EV-BLML02LBY-NW:size">25.9 × 8.9 × 8.9 mm <em class="dim-imp">(1.02 × 0.35 × 0.35 in)</em></span>
        </div>
        <!-- Triple LED · 74 × 12 × 6 mm -->
        <div class="compare-cell popular">
          <svg class="dim-diagram" viewBox="0 0 180 120">
            <rect class="module-body" x="38" y="48" width="100" height="22" rx="2"/>
            <circle class="module-led" cx="62" cy="59" r="3.5"/>
            <circle class="module-led" cx="88" cy="59" r="3.5"/>
            <circle class="module-led" cx="114" cy="59" r="3.5"/>
            <line class="dimline" x1="38" y1="38" x2="138" y2="38"/>
            <line class="ext" x1="38" y1="46" x2="38" y2="35"/>
            <line class="ext" x1="138" y1="46" x2="138" y2="35"/>
            <polyline class="arrow" points="42,35 38,38 42,41"/>
            <polyline class="arrow" points="134,35 138,38 134,41"/>
            <line class="dimline" x1="148" y1="48" x2="148" y2="70"/>
            <line class="ext" x1="140" y1="48" x2="151" y2="48"/>
            <line class="ext" x1="140" y1="70" x2="151" y2="70"/>
            <polyline class="arrow" points="145,52 148,48 151,52"/>
            <polyline class="arrow" points="145,66 148,70 151,66"/>
          </svg>
          <span class="dim-label" data-akeneo="EV-BLML03LBY-NW:size">38.1 × 8.9 × 8.9 mm <em class="dim-imp">(1.50 × 0.35 × 0.35 in)</em></span>
        </div>
      </div>

      <!-- LEDs per module -->
      <div class="compare-row">
        <div class="compare-cell-label">
          <svg class="row-icon" viewBox="0 0 24 24"><circle cx="6" cy="12" r="3"/><circle cx="12" cy="12" r="3"/><circle cx="18" cy="12" r="3"/></svg>
          LEDs per module
        </div>
        <div class="compare-cell">
          <span class="led-dots"><span class="led-dot"></span><span class="led-dot off"></span><span class="led-dot off"></span></span>
          1 × SMD 2835
        </div>
        <div class="compare-cell">
          <span class="led-dots"><span class="led-dot"></span><span class="led-dot"></span><span class="led-dot off"></span></span>
          2 × SMD 2835
        </div>
        <div class="compare-cell popular">
          <span class="led-dots"><span class="led-dot"></span><span class="led-dot"></span><span class="led-dot"></span></span>
          3 × SMD 2835
        </div>
      </div>

      <!-- Lumen output per module — per-variant, estimated from SMD2835 typical ~125 lm/W -->
      <div class="compare-row">
        <div class="compare-cell-label">
          <svg class="row-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/></svg>
          Lumen output
        </div>
        <div class="compare-cell" data-akeneo="EV-BLML01LBY-NW:lumens">~ 30 lm</div>
        <div class="compare-cell" data-akeneo="EV-BLML02LBY-NW:lumens">~ 60 lm</div>
        <div class="compare-cell" data-akeneo="EV-BLML03LBY-NW:lumens">~ 90 lm</div>
      </div>

      <!-- Max modules per power feed — depends on driver capacity + V-drop tolerance -->
      <div class="compare-row">
        <div class="compare-cell-label">
          <svg class="row-icon" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.5 1l3-3a5 5 0 0 0-7-7l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.5-1l-3 3a5 5 0 0 0 7 7l1.5-1.5"/></svg>
          Max modules per run
        </div>
        <div class="compare-cell" data-akeneo="EV-BLML01LBY-NW:maxInString">40</div>
        <div class="compare-cell" data-akeneo="EV-BLML02LBY-NW:maxInString">40</div>
        <div class="compare-cell" data-akeneo="EV-BLML03LBY-NW:maxInString">40</div>
      </div>


      <!-- Common specs (shared across all 3 variants — flow without a group header) -->
      <div class="compare-row">
        <div class="compare-cell-label">
          <svg class="row-icon" viewBox="0 0 24 24"><path d="M13 2l-9 12h7v8l9-12h-7z"/></svg>
          Input voltage
        </div>
        <div class="compare-cell compare-cell-span3-center">12 V DC (constant voltage)</div>
      </div>
      <div class="compare-row">
        <div class="compare-cell-label">
          <svg class="row-icon" viewBox="0 0 24 24"><path d="M12 3c5 6 7 9 7 13a7 7 0 0 1-14 0c0-4 2-7 7-13z"/></svg>
          IP rating
        </div>
        <div class="compare-cell compare-cell-span3-center">IP66 · weather-sealed</div>
      </div>
      <div class="compare-row">
        <div class="compare-cell-label">
          <svg class="row-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
          CCT options
        </div>
        <div class="compare-cell compare-cell-span3-center">
          <div class="cct-row">
            <span class="cct"><span class="cct-swatch warm"></span>3000 K Warm</span>
            <span class="cct"><span class="cct-swatch natural"></span>4000 K Natural</span>
            <span class="cct"><span class="cct-swatch cool"></span>7000 K Cool</span>
          </div>
        </div>
      </div>
      <div class="compare-row">
        <div class="compare-cell-label">
          <svg class="row-icon" viewBox="0 0 24 24"><path d="M12 3v9l4 4M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z"/></svg>
          Beam angle
        </div>
        <div class="compare-cell compare-cell-span3-center">180° × 140° · Diamondback optic lens</div>
      </div>
      <div class="compare-row">
        <div class="compare-cell-label">
          <svg class="row-icon" viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8"/><path d="M21 7v6h-6"/></svg>
          Efficacy
        </div>
        <div class="compare-cell compare-cell-span3-center">~ 125 lm / W</div>
      </div>
      <div class="compare-row">
        <div class="compare-cell-label">
          <svg class="row-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
          Lifetime
        </div>
        <div class="compare-cell compare-cell-span3-center">50,000 hours · L70</div>
      </div>
      <div class="compare-row">
        <div class="compare-cell-label">
          <svg class="row-icon" viewBox="0 0 24 24"><path d="M14 4v8a2 2 0 1 0 4 0V8m-4 8a2 2 0 1 0 4 0M10 4H6v16h4M10 4v16M6 8h2M6 12h2M6 16h2"/></svg>
          Operating temp
        </div>
        <div class="compare-cell compare-cell-span3-center">−25 °C to +60 °C <em class="dim-imp">(−13 °F to 140 °F)</em></div>
      </div>
      <div class="compare-row">
        <div class="compare-cell-label">
          <svg class="row-icon" viewBox="0 0 24 24"><path d="M12 2l8 4v6c0 4.5-3.5 8.5-8 10-4.5-1.5-8-5.5-8-10V6z"/><path d="M9 12l2 2 4-4"/></svg>
          Warranty
        </div>
        <div class="compare-cell compare-cell-span3-center">5 years</div>
      </div>
      <div class="compare-row">
        <div class="compare-cell-label">
          <svg class="row-icon" viewBox="0 0 24 24"><circle cx="12" cy="9" r="6"/><path d="M9 14l-2 7 5-3 5 3-2-7"/></svg>
          Certifications
        </div>
        <div class="compare-cell compare-cell-span3-center">
          <div class="cert-row">
            <img loading="lazy" decoding="async" class="cert-logo" src="/assets/images/certs/ul.png" alt="UL" title="UL listed">
            <img loading="lazy" decoding="async" class="cert-logo" src="/assets/images/certs/ce.png" alt="CE" title="CE marking">
            <img loading="lazy" decoding="async" class="cert-logo" src="/assets/images/certs/tuv.png" alt="TÜV" title="TÜV SÜD tested">
            <img loading="lazy" decoding="async" class="cert-logo" src="/assets/images/certs/rohs.png" alt="RoHS" title="RoHS compliant">
            <span class="cert-text" title="cUL — UL listed for Canada">cUL</span>
            <span class="cert-text" title="IEC CB Scheme — international product safety">CB</span>
          </div>
        </div>
      </div>
      <!-- Applications — image cards per variant, each with fit-dimensions as sub-text -->
      <div class="compare-row">
        <div class="compare-cell-label">
          <span>
            <svg class="row-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>
            Best fit
          </span>
          <span class="row-sublabel">Which signs each variant suits</span>
        </div>
        <div class="compare-cell">
          <div class="app-mini">
            <img loading="lazy" decoding="async" src="/assets/images/app-mini-outline-trim.jpg" alt="Border & outline accents">
            <strong>Border &amp; edge accents</strong>
            <span>Tight curves, decorative outline, low-density fill</span>
            <span class="fit-meta">Cabinet depth 30–80 mm (1.2–3.1 in) · fine LED pitch on tight geometry</span>
          </div>
        </div>
        <div class="compare-cell">
          <div class="app-mini">
            <img loading="lazy" decoding="async" src="/assets/images/app-mini-channel-letters.jpg" alt="Slim channel letters">
            <strong>Standard channel letters</strong>
            <span>Wordmarks · architectural signage · medium density</span>
            <span class="fit-meta">Cabinet depth 30–80 mm (1.2–3.1 in) · balanced brightness vs. cost</span>
          </div>
        </div>
        <div class="compare-cell popular">
          <div class="app-mini">
            <img loading="lazy" decoding="async" src="/assets/images/app-mini-thin-lightbox.jpg" alt="Mid-narrow channel letters and thin lightboxes">
            <strong>High-brightness lightboxes</strong>
            <span>Long straight runs · thick translucent faces · bright signs</span>
            <span class="fit-meta">Cabinet depth 30–80 mm (1.2–3.1 in) · highest LED density per unit length</span>
          </div>
        </div>
      </div>

      <!-- Help CTA — for buyers unsure which variant fits their sign -->
      <div class="compare-row help-row">
        <div class="compare-cell-label">
          <span>
            <svg class="row-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 015 0c0 2-2.5 2-2.5 4"/><circle cx="12" cy="17" r="0.5"/></svg>
            Not sure which fits?
          </span>
          <span class="row-sublabel">Have an engineer spec it</span>
        </div>
        <div class="compare-cell compare-cell-span3 help-ctas">
          <a class="pill primary" href="/free-layout-design">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>
            Free Layout Design · engineer-reviewed
          </a>
        </div>
      </div>

      <!-- Complete the system — rows flow without group header -->
      <div class="compare-row">
        <div class="compare-cell-label">
          <svg class="row-icon" viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="8" rx="1"/><path d="M7 8V6M17 8V6M7 18v-2M17 18v-2"/></svg>
          Driver
        </div>
        <div class="compare-cell compare-cell-span3">
          <div class="row-thumb">
            <img loading="lazy" decoding="async" src="/assets/images/cat-drivers.png" alt="">
            <div class="body">
              <a href="/products/led-drivers/envo-sl-us"><strong>EV-SL Linear 12 V</strong></a> — slim 60–100 W variants drive any Mini run. Max 40 modules per string on a constant-voltage feed; parallel multiple strings for longer letters.
            </div>
          </div>
        </div>
      </div>
      <div class="compare-row">
        <div class="compare-cell-label">
          <svg class="row-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 3v9l5 3"/></svg>
          Dimming
        </div>
        <div class="compare-cell compare-cell-span3">
          <div class="row-thumb">
            <img loading="lazy" decoding="async" src="/assets/images/cat-drivers.png" alt="" style="filter: hue-rotate(-15deg) brightness(1.05);">
            <div class="body">
              <a href="/products/led-drivers/envo-sp-us"><strong>EV-SP-TDM</strong></a> triac-dimmable driver — phase-cut from a wall plate, no controller required.
            </div>
          </div>
        </div>
      </div>
      <div class="compare-row">
        <div class="compare-cell-label">
          <svg class="row-icon" viewBox="0 0 24 24"><path d="M9 8h6M9 16h6"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="12" r="3"/></svg>
          Accessories
        </div>
        <div class="compare-cell compare-cell-span3">
          <div class="row-thumb">
            <img loading="lazy" decoding="async" src="/assets/images/cat-sensors.png" alt="">
            <div class="body">
              <strong>IP67 push-fit connectors</strong> · 16 AWG pre-tinned cable — weather-tight cable runs.
            </div>
          </div>
        </div>
      </div>

      <!-- Downloads — rows flow without group header -->
      <div class="compare-row">
        <div class="compare-cell-label">
          <svg class="row-icon" viewBox="0 0 24 24"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="14 3 14 9 20 9"/></svg>
          Datasheet
        </div>
        <div class="compare-cell"><a class="pill" href="#" data-akeneo="EV-BLML01LBY-NW:datasheet">PDF · 0.4 MB</a></div>
        <div class="compare-cell"><a class="pill" href="#" data-akeneo="EV-BLML02LBY-NW:datasheet">PDF · 0.5 MB</a></div>
        <div class="compare-cell popular"><a class="pill" href="#" data-akeneo="EV-BLML03LBY-NW:datasheet">PDF · 0.6 MB</a></div>
      </div>

    </div>

    <p style="font-family: var(--mono); font-size: 11px; color: var(--text-subtle); margin: 18px 4px 0; letter-spacing: 0.04em;">
      Suffix the model number with −WW (3000 K), −NW (4000 K) or −CW (7000 K) to specify CCT. Each LED draws 0.24 W at 0.02 A; power and current scale linearly with LED count.
    </p>
  </section>

  <!-- ============ SOLUTIONS PANE ============ -->
  <div class="tab-pane" data-tab-pane="solutions">

    <!-- Hero -->
    <div class="tab-hero">
      <div class="tab-hero-eyebrow">Applications · Where MiniLux works</div>
      <h1>One module. Six sign types.</h1>
      <p class="lede">Built for shallow cabinets — 30 to 80 mm — indoors or out.</p>
      <div class="stats">
        <div class="stat"><strong>30–80 mm</strong><span>cabinet depth</span></div>
        <div class="stat"><strong>40</strong><span>modules per string</span></div>
        <div class="stat"><strong>3 CCTs</strong><span>3000 / 4000 / 7000 K</span></div>
        <div class="stat"><strong>IP66</strong><span>outdoor-rated</span></div>
      </div>
    </div>

    <!-- Scene banner: cinematic twilight street -->
    <div class="scene-banner">
      <div class="frame">
        <img decoding="async" src="/assets/images/app-mini-hero-twilight.jpg" alt="Twilight pedestrian street lined with illuminated boutique signs">
        <div class="caption">
          <span class="eyebrow">// Built for the blue hour</span>
          <span class="line">From quiet boutiques to airport halls.</span>
        </div>
      </div>
    </div>

    <!-- Six application cards — image-led, micro-copy -->
    <section class="section">
      <span class="section-eyebrow">// Where it lives</span>
      <h2 class="section-h2">Six application categories.</h2>
      <div class="sol-app-grid sol-app-grid--compact">

        <!-- 1. Retail channel letters -->
        <div class="sol-card">
          <div class="img-slot"><img loading="lazy" decoding="async" src="/assets/images/app-mini-channel-letters.jpg" alt="Retail storefront channel letters"></div>
          <div class="body">
            <h3>Retail channel letters</h3>
            <p class="pick-line"><strong>Duo</strong> · 40–60 mm · 4000 K</p>
          </div>
        </div>

        <!-- 2. Slim lightboxes -->
        <div class="sol-card">
          <div class="img-slot"><img loading="lazy" decoding="async" src="/assets/images/app-mini-thin-lightbox.jpg" alt="Slim wall-mounted lightbox"></div>
          <div class="body">
            <h3>Slim lightboxes</h3>
            <p class="pick-line"><strong>Triple</strong> · 30–50 mm · 7000 K</p>
          </div>
        </div>

        <!-- 3. Outline trim -->
        <div class="sol-card">
          <div class="img-slot"><img loading="lazy" decoding="async" src="/assets/images/app-mini-outline-trim.jpg" alt="Decorative outline trim accent"></div>
          <div class="body">
            <h3>Outline &amp; trim</h3>
            <p class="pick-line"><strong>Single</strong> · 30–50 mm · 3000 K</p>
          </div>
        </div>

        <!-- 4. Hospitality / architectural facade -->
        <div class="sol-card">
          <div class="img-slot"><img loading="lazy" decoding="async" src="/assets/images/app-mini-hospitality-facade.jpg" alt="Hotel facade with backlit name sign at dusk"></div>
          <div class="body">
            <h3>Hospitality facades</h3>
            <p class="pick-line"><strong>Triple</strong> · 50–80 mm · 3000 K</p>
          </div>
        </div>

        <!-- 5. Pylon / monument signs -->
        <div class="sol-card">
          <div class="img-slot"><img loading="lazy" decoding="async" src="/assets/images/app-mini-pylon-monument.jpg" alt="Freestanding pylon monument sign at corporate park entrance"></div>
          <div class="body">
            <h3>Pylon &amp; monument</h3>
            <p class="pick-line"><strong>Triple</strong> · 60–80 mm · 7000 K</p>
          </div>
        </div>

        <!-- 6. Interior wayfinding -->
        <div class="sol-card">
          <div class="img-slot"><img loading="lazy" decoding="async" src="/assets/images/app-mini-wayfinding.jpg" alt="Modern interior wayfinding sign in airport terminal or museum"></div>
          <div class="body">
            <h3>Interior wayfinding</h3>
            <p class="pick-line"><strong>Single</strong> · 30–50 mm · 4000 K</p>
          </div>
        </div>

      </div>
    </section>

    <!-- Sizing — single visual chart -->
    <section class="section">
      <span class="section-eyebrow">// Pick by</span>
      <h2 class="section-h2">Variant in one glance.</h2>
      <div class="pick-chart">
        <div class="pick-axis">
          <span>Tight curves &amp; trim</span>
          <span>Standard letters</span>
          <span>Bright lightboxes</span>
        </div>
        <div class="pick-bar">
          <div class="pick-seg single"><span>Single</span><em>EV-BLML01LBY · 0.24 W</em></div>
          <div class="pick-seg duo"><span>Duo <em class="pop">DEFAULT</em></span><em>EV-BLML02LBY · 0.48 W</em></div>
          <div class="pick-seg triple"><span>Triple <em class="pop">BRIGHTEST</em></span><em>EV-BLML03LBY · 0.72 W</em></div>
        </div>
        <div class="pick-foot">
          <span><strong>All variants</strong> · 8.9 mm · 12 V DC · IP66 · cabinet 30–80 mm · max 40 per string</span>
        </div>
      </div>
    </section>

    <!-- Scene banner: halo-lit letters showcase -->
    <div class="scene-banner tall">
      <div class="frame">
        <img loading="lazy" decoding="async" src="/assets/images/app-mini-halo-letters.jpg" alt="Halo-lit stainless-steel letters on a dark concrete wall, glowing warm white from behind">
        <div class="caption">
          <span class="eyebrow">// Halo reverse-lit</span>
          <span class="line">Premium signage. Same module.</span>
        </div>
      </div>
    </div>

    <!-- Three sign-type cross-sections — diagram-led, one-line caption -->
    <section class="section">
      <span class="section-eyebrow">// Install patterns</span>
      <h2 class="section-h2">Three ways to mount.</h2>
      <div class="sign-types sign-types--compact">

        <!-- Channel letter (face-lit) -->
        <div class="sign-type">
          <div class="diagram-slot">
            <svg viewBox="0 0 200 110" xmlns="http://www.w3.org/2000/svg">
              <defs><pattern id="h-cab1" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="rgba(0,0,0,0.10)" stroke-width="0.8"/></pattern></defs>
              <path d="M40 86 L 100 26 L 100 8 L 40 68 Z" fill="url(#h-cab1)" stroke="#1a2332" stroke-width="1"/>
              <path d="M100 26 L 160 86 L 160 68 L 100 8 Z" fill="url(#h-cab1)" stroke="#1a2332" stroke-width="1"/>
              <path d="M40 86 L 160 86 L 160 96 L 40 96 Z" fill="url(#h-cab1)" stroke="#1a2332" stroke-width="1"/>
              <path d="M48 70 L 100 18 L 152 70 Z" fill="rgba(174,201,11,0.30)" stroke="#7a8c08" stroke-width="1.2"/>
              <g><rect x="62" y="84" width="14" height="4" rx="0.8" fill="rgba(77,195,255,0.30)" stroke="#0071bc" stroke-width="0.8"/><circle cx="69" cy="86" r="1" fill="#aec90b"/></g>
              <g><rect x="93" y="84" width="14" height="4" rx="0.8" fill="rgba(77,195,255,0.30)" stroke="#0071bc" stroke-width="0.8"/><circle cx="100" cy="86" r="1" fill="#aec90b"/></g>
              <g><rect x="124" y="84" width="14" height="4" rx="0.8" fill="rgba(77,195,255,0.30)" stroke="#0071bc" stroke-width="0.8"/><circle cx="131" cy="86" r="1" fill="#aec90b"/></g>
            </svg>
          </div>
          <h3>Face-lit channel</h3>
          <p class="pick-line"><strong>Duo</strong> · 40–60 mm</p>
        </div>

        <!-- Slim lightbox -->
        <div class="sign-type">
          <div class="diagram-slot">
            <svg viewBox="0 0 200 110" xmlns="http://www.w3.org/2000/svg">
              <defs><pattern id="h-cab2" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="rgba(0,0,0,0.10)" stroke-width="0.8"/></pattern></defs>
              <rect x="22" y="30" width="156" height="40" fill="rgba(174,201,11,0.30)" stroke="#7a8c08" stroke-width="1.2"/>
              <rect x="22" y="64" width="156" height="8" fill="url(#h-cab2)" stroke="#1a2332" stroke-width="1"/>
              <rect x="22" y="28" width="156" height="6" fill="url(#h-cab2)" stroke="#1a2332" stroke-width="1"/>
              <rect x="14" y="28" width="10" height="44" fill="url(#h-cab2)" stroke="#1a2332" stroke-width="1"/>
              <rect x="176" y="28" width="10" height="44" fill="url(#h-cab2)" stroke="#1a2332" stroke-width="1"/>
              <g><rect x="40" y="62" width="22" height="4" rx="0.8" fill="rgba(77,195,255,0.30)" stroke="#0071bc" stroke-width="0.8"/><circle cx="44" cy="64" r="1" fill="#aec90b"/><circle cx="51" cy="64" r="1" fill="#aec90b"/><circle cx="58" cy="64" r="1" fill="#aec90b"/></g>
              <g><rect x="89" y="62" width="22" height="4" rx="0.8" fill="rgba(77,195,255,0.30)" stroke="#0071bc" stroke-width="0.8"/><circle cx="93" cy="64" r="1" fill="#aec90b"/><circle cx="100" cy="64" r="1" fill="#aec90b"/><circle cx="107" cy="64" r="1" fill="#aec90b"/></g>
              <g><rect x="138" y="62" width="22" height="4" rx="0.8" fill="rgba(77,195,255,0.30)" stroke="#0071bc" stroke-width="0.8"/><circle cx="142" cy="64" r="1" fill="#aec90b"/><circle cx="149" cy="64" r="1" fill="#aec90b"/><circle cx="156" cy="64" r="1" fill="#aec90b"/></g>
            </svg>
          </div>
          <h3>Slim lightbox</h3>
          <p class="pick-line"><strong>Triple</strong> · 30–50 mm</p>
        </div>

        <!-- Halo / reverse-lit -->
        <div class="sign-type">
          <div class="diagram-slot">
            <svg viewBox="0 0 200 110" xmlns="http://www.w3.org/2000/svg">
              <defs><pattern id="h-cab3" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="rgba(0,0,0,0.10)" stroke-width="0.8"/></pattern></defs>
              <rect x="20" y="86" width="160" height="6" fill="url(#h-cab3)" stroke="#1a2332" stroke-width="1"/>
              <ellipse cx="100" cy="86" rx="80" ry="40" fill="rgba(174,201,11,0.18)" stroke="none" opacity="0.7"/>
              <ellipse cx="100" cy="86" rx="50" ry="22" fill="rgba(174,201,11,0.32)" stroke="none" opacity="0.9"/>
              <rect x="50" y="28" width="100" height="34" fill="#1a2332" stroke="#0a121f" stroke-width="1"/>
              <rect x="50" y="58" width="100" height="6" fill="url(#h-cab3)" stroke="#1a2332" stroke-width="1"/>
              <g><rect x="63" y="78" width="14" height="4" rx="0.8" fill="rgba(77,195,255,0.30)" stroke="#0071bc" stroke-width="0.8"/><circle cx="70" cy="80" r="1" fill="#aec90b"/></g>
              <g><rect x="93" y="78" width="14" height="4" rx="0.8" fill="rgba(77,195,255,0.30)" stroke="#0071bc" stroke-width="0.8"/><circle cx="100" cy="80" r="1" fill="#aec90b"/></g>
              <g><rect x="123" y="78" width="14" height="4" rx="0.8" fill="rgba(77,195,255,0.30)" stroke="#0071bc" stroke-width="0.8"/><circle cx="130" cy="80" r="1" fill="#aec90b"/></g>
            </svg>
          </div>
          <h3>Halo (reverse-lit)</h3>
          <p class="pick-line"><strong>Single</strong> · 25–40 mm</p>
        </div>

      </div>
    </section>

  </div>

  <!-- ============ END CTA ============ -->
  <section class="end-cta">
    <div class="end-cta-inner">
      <div>
        <div class="eyebrow">// NOT SURE WHICH VARIANT?</div>
        <h2>Send a sign sketch. We pick the variant.</h2>
        <p>Drop a sketch, CAD or photo — an ENVO engineer reviews the letter strokes and cabinet depth, then writes back the right Mini variant + driver + accessory list with reasoning. No charge.</p>
      </div>
      <div style="display:flex; gap: 10px; flex-shrink: 0;">
        <a class="pri" href="/free-layout-design">Start a layout design</a>
      </div>
    </div>
  </section>
`

const num = (v: unknown): number | null => {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

const FORMATTERS: Record<string, (p: Product) => { text?: string; href?: string } | null> = {
  sku: (p) => ({ text: p.sku }),
  power: (p) => {
    const w = num(p.power_w)
    return w == null ? null : { text: `${w} W` }
  },
  size: (p) => {
    const l = num(p.length_mm), w = num(p.width_mm), h = num(p.height_mm)
    if (l == null || w == null || h == null) return null
    const mm = `${l} × ${w} × ${h} mm`
    const inches = `(${(l / 25.4).toFixed(2)} × ${(w / 25.4).toFixed(2)} × ${(h / 25.4).toFixed(2)} in)`
    return { text: `${mm}|||${inches}` } // pipes = imperial split marker; renderer wraps in <em class="dim-imp">
  },
  lumens: (p) => {
    const lm = num(p.brightness_lm)
    return lm == null ? null : { text: `~ ${Math.round(lm)} lm` }
  },
  maxInString: (p) => {
    const n = num(p.max_in_series)
    return n == null ? null : { text: String(n) }
  },
  datasheet: (p) => {
    const href = p.spec_sheet_url ? datasheetHref(p.sku) : null
    return href ? { href } : null
  },
}

// Exposed for optimize-mockup-images.test.ts only — asserts no raw asset src
// survives the optimizer rewrite (a regression would silently re-ship ~3 MB).
export const MOCKUP_BODY_FOR_TESTS = MOCKUP_BODY

function applyAkeneo(shadow: ShadowRoot, variants: Product[]) {
  const bySku = new Map(variants.map((v) => [v.sku, v]))
  shadow.querySelectorAll<HTMLElement>('[data-akeneo]').forEach((el) => {
    const marker = el.getAttribute('data-akeneo') || ''
    const [sku, field] = marker.split(':')
    const product = bySku.get(sku)
    if (!product) return
    const fmt = FORMATTERS[field]
    if (!fmt) return
    const out = fmt(product)
    if (!out) return

    if (out.href !== undefined && el.tagName === 'A') {
      ;(el as HTMLAnchorElement).href = out.href
      ;(el as HTMLAnchorElement).target = '_blank'
      ;(el as HTMLAnchorElement).rel = 'noopener'
    }
    if (out.text !== undefined) {
      if (out.text.includes('|||')) {
        // size: mm primary + imperial secondary
        const [main, imp] = out.text.split('|||')
        el.innerHTML = `${main} <em class="dim-imp">${imp}</em>`
      } else {
        el.textContent = out.text
      }
    }
  })
}

export type SeriesSibling = {
  label: string
  productName: string
  href: string
  live: boolean
  current: boolean
}

type Props = { variants: Product[]; siblings: SeriesSibling[] }

export default function MiniSeriesPage({ variants, siblings }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    // React strict mode invokes effects twice. We can't re-attach a shadow root,
    // but we DO need to re-bind event listeners after the first cleanup removed
    // them — so reuse the existing shadow if present and only render content once.
    const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' })
    if (!shadow.firstChild) {
      shadow.innerHTML = `<style>${MOCKUP_CSS}</style>${optimizeMockupImages(MOCKUP_BODY)}`
      applyAkeneo(shadow, variants)
    }

    // Tab switching (mirrors the mockup script). Scoped to this shadow root.
    const VALID = ['overview', 'compare', 'solutions']
    const DEFAULT_TAB = 'overview'

    const setActive = (raw: string) => {
      const name = VALID.includes(raw) ? raw : DEFAULT_TAB
      shadow.querySelectorAll('[data-tab-pane]').forEach((p) => {
        p.classList.toggle('is-active', p.getAttribute('data-tab-pane') === name)
      })
      shadow.querySelectorAll('[data-tab]').forEach((a) => {
        const target = (a.getAttribute('href') || '').replace(/^#/, '')
        a.classList.toggle('active', target === name)
      })
      window.scrollTo({ top: 0, behavior: 'auto' })
    }

    const fromHash = () => {
      const h = (window.location.hash || '').replace(/^#/, '').split('#')[0]
      return h || DEFAULT_TAB
    }

    const onClick = (e: Event) => {
      const target = e.target as HTMLElement | null
      const a = target?.closest('a[data-tab], a.buy-pill') as HTMLAnchorElement | null
      if (!a) return
      const href = a.getAttribute('href') || ''
      if (!href.startsWith('#')) return
      const name = href.replace(/^#/, '').split('#')[0]
      if (!VALID.includes(name)) return
      e.preventDefault()
      if (window.location.hash !== '#' + name) {
        history.replaceState(null, '', '#' + name)
      }
      setActive(name)
    }

    const onHash = () => setActive(fromHash())

    shadow.addEventListener('click', onClick)
    window.addEventListener('hashchange', onHash)
    setActive(fromHash())

    // Series-switcher dropdown — populate items + wire toggle / outside-click / Esc.
    const trigger = shadow.querySelector<HTMLButtonElement>('#series-trigger')
    const dropdown = shadow.querySelector<HTMLDivElement>('#series-dropdown')
    if (trigger && dropdown) {
      const itemsHtml = siblings
        .map((s) => {
          const cls = ['series-item']
          if (s.current) cls.push('current')
          if (!s.live) cls.push('coming-soon')
          const tag = s.live && !s.current ? 'a' : 'span'
          const hrefAttr = s.live && !s.current ? ` href="${s.href}"` : ''
          const roleAttr = s.live ? ' role="menuitem"' : ''
          return `<${tag} class="${cls.join(' ')}"${hrefAttr}${roleAttr}>
            <span class="item-label">${s.label}</span>
            <span class="item-prod">${s.productName}</span>
          </${tag}>`
        })
        .join('')
      dropdown.innerHTML = `
        <div class="series-dd-head">
          <a href="/products">
            <span class="dd-back-arrow" aria-hidden="true">←</span>
            All categories
          </a>
          <span class="dd-head-sep" aria-hidden="true">·</span>
          <a href="/products/led-signage-modules">LED Signage Modules</a>
        </div>
        ${itemsHtml}
      `

      const close = () => {
        dropdown.hidden = true
        trigger.setAttribute('aria-expanded', 'false')
      }
      const open = () => {
        dropdown.hidden = false
        trigger.setAttribute('aria-expanded', 'true')
      }
      const onTriggerClick = (e: Event) => {
        e.preventDefault()
        e.stopPropagation()
        if (dropdown.hidden) open()
        else close()
      }
      const onOutsideClick = (e: Event) => {
        if (dropdown.hidden) return
        const path = (e as Event & { composedPath?: () => EventTarget[] }).composedPath?.() ?? []
        if (path.includes(trigger) || path.includes(dropdown)) return
        close()
      }
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !dropdown.hidden) close()
      }
      trigger.addEventListener('click', onTriggerClick)
      document.addEventListener('click', onOutsideClick)
      document.addEventListener('keydown', onKey)

      return () => {
        shadow.removeEventListener('click', onClick)
        window.removeEventListener('hashchange', onHash)
        trigger.removeEventListener('click', onTriggerClick)
        document.removeEventListener('click', onOutsideClick)
        document.removeEventListener('keydown', onKey)
      }
    }

    return () => {
      shadow.removeEventListener('click', onClick)
      window.removeEventListener('hashchange', onHash)
    }
  }, [variants, siblings])

  return <div ref={hostRef} className="mini-series-shadow-host" />
}
