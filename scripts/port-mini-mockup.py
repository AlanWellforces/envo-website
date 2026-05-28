#!/usr/bin/env python3
"""One-shot: read the Mini Series v3 mockup, extract CSS + body, emit a React
client component that drops it into the production app via Shadow DOM."""
from pathlib import Path

MOCK = Path("/Users/marketing/Desktop/envo-website-v2/.superpowers/brainstorm/35183-1779324154/content/mini-series-v3.html")
OUT = Path("/Users/marketing/Desktop/envo-website-v2/src/components/products/mini-series/MiniSeriesPage.tsx")

src = MOCK.read_text().splitlines()

def slice_lines(start, end):
    # inclusive start, inclusive end (1-indexed in file display, 0-indexed in list)
    return "\n".join(src[start - 1:end])

# 1) CSS — inside <style>...</style> at lines 9..1408. Content lines 10..1407.
css = slice_lines(10, 1407)

# Neutralize sidebar-margin rule — production body already pads left by --sidebar-w.
css = css.replace(
    ".main { margin-left: var(--sidebar-w); }",
    ".main { margin-left: 0; }  /* prod body already pads left */",
)

# Critical Shadow DOM fix: the mockup defines its design tokens on `:root`,
# but `:root` does not match anything inside a shadow root (the shadow root is
# a DocumentFragment, not an element). Without this rewrite the mockup CSS
# resolves every var() against the LIGHT-DOM root, which on a /products page
# is the dark theme — the whole mockup paints dark instead of light. Rewrite
# the single top-level `:root {` declaration to `:host {`, which both sets the
# tokens on the host element AND inherits them down into the shadow tree.
# Also add display/min-height/font defaults so the host fills the column.
css = css.replace(
    "  :root {\n",
    "  :host {\n    display: block;\n    min-height: 100vh;\n",
    1,
)
# Shadow DOM has no <html, body> either — the mockup's
# `html, body { margin: 0; padding: 0; background: var(--bg); ... }` rule
# never fires. Re-attach those defaults to :host.
css = css.replace(
    "  html, body { margin: 0; padding: 0; background: var(--bg); color: var(--text); font-family: var(--sans); line-height: 1.5; }",
    "  :host { background: var(--bg); color: var(--text); font-family: var(--sans); line-height: 1.5; }\n"
    "  html, body { margin: 0; padding: 0; background: var(--bg); color: var(--text); font-family: var(--sans); line-height: 1.5; }",
)

# 2) Body content — between <main class="main"> (line 1445) and </main> (line 2248).
# Lines 1446..2247 are the inside. Strip the floating x-nav pill (lines 2250-2251).
body = slice_lines(1446, 2247)

# Replace localhost:3000 with empty so URLs become relative.
body = body.replace("http://localhost:3000", "")
css = css.replace("http://localhost:3000", "")

# Escape backticks and ${ for safe embed in JS template literals.
def js_escape(s):
    return s.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")

css_js = js_escape(css)
body_js = js_escape(body)

tsx = """'use client'

import { useEffect, useRef } from 'react'

import type { Product } from '@/lib/products'

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

const MOCKUP_CSS = `__CSS__`

const MOCKUP_BODY = `__BODY__`

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
  datasheet: (p) => p.spec_sheet_url ? { href: p.spec_sheet_url } : null,
}

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

type Props = { variants: Product[] }

export default function MiniSeriesPage({ variants }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    if (host.shadowRoot) return // already attached (React strict-mode double-invoke guard)
    const shadow = host.attachShadow({ mode: 'open' })
    shadow.innerHTML = `<style>${MOCKUP_CSS}</style>${MOCKUP_BODY}`

    applyAkeneo(shadow, variants)

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

    return () => {
      shadow.removeEventListener('click', onClick)
      window.removeEventListener('hashchange', onHash)
    }
  }, [variants])

  return <div ref={hostRef} className="mini-series-shadow-host" />
}
"""

tsx = tsx.replace("__CSS__", css_js).replace("__BODY__", body_js)

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(tsx)
print(f"wrote {OUT} ({len(tsx)} chars)")
