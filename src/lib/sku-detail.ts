// Data assembly for the SKU detail page (/products/[family]/[sku]) — LED
// Drivers, Control Gear and Accessories only. Signage keeps its merged series
// pages. The page IS the merged series-page layout, scoped to one product
// (user direction 2026-07-08): hero + key specs + datasheet come from THIS
// product alone; the Specifications tab keeps the classic series compare
// table with every sibling model, the viewed SKU tinted + tagged "Current".
import type { Product } from '@/lib/products'
import type { ProductFamily } from '@/data/product-families'
import { seriesLabel } from '@/data/family-map'
import { buildMergedSeriesProps } from '@/lib/merged-series'
import type { MergedSeriesProps, MergedSolution } from '@/components/products/merged/MergedSeriesPage'

// ── "Where it works" derived from the product itself ────────────────────────
// Editorial solutions exist only for signage series, so spec-driven SKUs
// derive their application cards from their own Akeneo copy + spec fields.
// Two evidence tiers: (1) applications the description NAMES, (2) what the
// specs imply (IP, dimming, CV rail, protocol, unit type). Nothing invented.
const DESCRIPTION_APPS: [RegExp, MergedSolution][] = [
  [/street ?light/i, { title: 'Street & area lighting', pick: 'outdoor duty' }],
  [/flood ?light/i, { title: 'Floodlighting', pick: 'high-output installs' }],
  [/architectural/i, { title: 'Architectural illumination', pick: 'façades & feature lighting' }],
  [/channel letter/i, { title: 'Channel letters', pick: 'sign-cabinet duty' }],
  [/light ?box/i, { title: 'Light boxes', pick: 'even backlighting' }],
  [/\bsignage\b/i, { title: 'Signage systems', pick: 'sign-duty rated' }],
  [/led strip|strip light|tape light/i, { title: 'LED strip runs', pick: 'constant-voltage rails' }],
  [/cabinet|showcase|display case/i, { title: 'Display & cabinet lighting', pick: 'compact low-profile' }],
  [/commercial/i, { title: 'Commercial LED systems', pick: 'continuous-duty use' }],
  [/residential|home/i, { title: 'Residential lighting', pick: 'home installations' }],
]

function deriveSolutions(slug: string, p: Product): MergedSolution[] {
  const out: MergedSolution[] = []
  const add = (s: MergedSolution) => {
    if (out.length < 4 && !out.some((x) => x.title === s.title)) out.push(s)
  }
  const text = `${p.description ?? ''} ${p.short_description ?? ''}`

  // Tier 1 — applications the product copy names outright.
  for (const [re, sol] of DESCRIPTION_APPS) if (re.test(text)) add(sol)

  // Tier 2 — what the spec sheet implies.
  const ip = p.waterproof && /^ip\d+$/i.test(p.waterproof) ? p.waterproof.toUpperCase() : null
  if (slug === 'led-drivers') {
    if (ip && Number(ip.slice(2)) >= 65) add({ title: 'Outdoor installations', pick: `${ip} sealed enclosure` })
    else add({ title: 'Indoor installations', pick: 'compact indoor enclosure' })
    if (p.dimming_control?.includes('triac') || /triac[- ]?dim/i.test(p.name))
      add({ title: 'Dimmed retail & hospitality', pick: 'Triac phase dimming' })
    if (p.dimming_control?.includes('dali')) add({ title: 'DALI-controlled buildings', pick: 'DALI dimming' })
    if (p.operation_mode !== 'cc' && (p.output_voltage_v === 12 || p.output_voltage_v === 24))
      add({ title: 'Signage modules & LED strip', pick: `${p.output_voltage_v} V constant voltage` })
  } else {
    const n = p.name
    const proto = /casambi/i.test(n) || p.dimming_control?.includes('casambi') ? 'Casambi'
      : /zig.?bee/i.test(n) || p.dimming_control?.includes('zigbee') ? 'Zigbee'
      : /dali/i.test(n) || p.dimming_control?.includes('dali') ? 'DALI' : null
    if (/sensor/i.test(n)) add({ title: 'Occupancy & daylight automation', pick: 'sensor-driven control' })
    if (/remote/i.test(n)) add({ title: 'Handheld scene control', pick: 'wireless remote' })
    if (/gateway|smart hub/i.test(n)) add({ title: 'Smart-building integration', pick: 'gateway / hub' })
    if (/wall panel|in-?wall|push button|rotary|switch/i.test(n))
      add({ title: 'Wall-point scene switching', pick: 'wall-mounted control' })
    if (proto) add({ title: `${proto} lighting systems`, pick: `${proto} protocol` })
    if (ip && Number(ip.slice(2)) >= 65) add({ title: 'Outdoor installations', pick: `${ip} sealed` })
  }
  return out
}

// ── Overview distillation (user 2026-07-08) ─────────────────────────────────
// The Akeneo descriptions arrive in five shapes (plain bullet lists, marketing
// paragraphs, Features + "General Specification" dumps, authoring-tool nested
// markup, long technical bullets). Distil them all to marketing content:
// a lede, a Highlights list, installation notes — with every spec repeat
// dropped (the spec table already carries that data).
export type OverviewContent = {
  /** marketing headline lifted from the copy's own <h2>, when it has one */
  headline?: string
  lede?: string
  features?: { label?: string; text: string }[]
  cautions?: string[]
}

/** Bullets that merely restate the spec table get no second airing. */
const SPEC_REPEAT_PATTERNS: RegExp[] = [
  /^output constant (voltage|current)$/i,
  /^(wide )?(ac )?input voltage( range)?\b/i,
  /^dimensions?\b/i,
  /^weight\b/i,
  /^ip\s?\d{2}\b.{0,20}(indoor|outdoor|installation)/i,
  /^\d+ years? warranty$/i,
  /^constant (voltage|current) led driver\b/i, // model summary repeats W/V/A
  /(compliance|conform|meets?).{0,30}(safety regulations|standards)/i,
  /^in compliance with iec/i, // standards row carries certifications
]

const decode = (s: string) =>
  s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()

export function parseOverview(description: string | null | undefined): OverviewContent | null {
  if (!description?.trim()) return null
  // Everything from "General Specification" on is a spec-table repeat — cut it.
  const html = description.split(/<h2[^>]*>\s*General Specification/i)[0]

  // Block-split on closing tags, keeping which block each text came from.
  const blocks: { tag: string; text: string }[] = []
  const re = /<(h2|p|li|div)\b[^>]*>([\s\S]*?)<\/\1>/gi
  // innermost-first: strip nested block wrappers inside a match before decoding
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    const inner = m[2]
    // nested authoring garbage (<h2><p>…</p></h2>): recurse into inner blocks
    if (/<(h2|p|li|div)\b/i.test(inner)) {
      const innerRe = /<(h2|p|li|div)\b[^>]*>([\s\S]*?)<\/\1>/gi
      let im: RegExpExecArray | null
      while ((im = innerRe.exec(inner))) {
        const text = decode(im[2].replace(/<[^>]+>/g, ''))
        if (text) blocks.push({ tag: im[1].toLowerCase(), text })
      }
      continue
    }
    const text = decode(inner.replace(/<[^>]+>/g, ''))
    if (text) blocks.push({ tag: m[1].toLowerCase(), text })
  }
  if (!blocks.length) return null

  const out: OverviewContent = {}
  const features: { label?: string; text: string }[] = []
  const cautions: string[] = []

  const pushFeature = (raw: string) => {
    const text = raw.replace(/[.;\s]+$/, '')
    if (!text) return
    // cautions route BEFORE the feature cap — DO-NOTs often sit last in the list
    if (/^do not\b|^warning\b|^caution\b/i.test(text)) {
      if (cautions.length < 4) cautions.push(text)
      return
    }
    if (features.length >= 8) return
    if (SPEC_REPEAT_PATTERNS.some((p) => p.test(text))) return
    if (features.some((f) => (f.label ? `${f.label}: ${f.text}` : f.text) === text)) return
    // "Label: detail" bullets keep the label bold in the grid
    const lm = text.match(/^([A-Z][^:]{2,38}):\s+(.{3,})$/)
    if (lm) features.push({ label: lm[1], text: lm[2] })
    else features.push({ text })
  }

  for (const b of blocks) {
    if (b.tag === 'h2') {
      if (!out.headline && !/^features:?$/i.test(b.text) && b.text.length <= 60) out.headline = b.text
      continue
    }
    if (b.tag === 'li') {
      pushFeature(b.text)
      continue
    }
    // paragraphs: "Label: detail" boilerplate reads as a feature; the first
    // substantial prose paragraph becomes the lede (first two sentences)
    if (/^[A-Z][^:]{2,38}:\s+\S/.test(b.text) && b.text.length < 220) {
      pushFeature(b.text)
    } else if (!out.lede && b.text.length > 60) {
      out.lede = (b.text.match(/[^.!?]+[.!?]+/g)?.slice(0, 2).map((s) => s.trim()).join(' ') ?? b.text).trim()
    }
  }

  if (features.length) out.features = features
  if (cautions.length) out.cautions = cautions
  return out.lede || out.features || out.cautions ? out : null
}

export function buildSkuDetailProps(
  family: ProductFamily,
  product: Product,
  sameSeries: Product[],
): MergedSeriesProps {
  const series = product.series ?? ''
  // Series-wide assembly drives the compare table + shared rows (identical to
  // the series page); a single-product assembly supplies the exact hero facts.
  // SKU heroes may show up to 8 key specs (user 2026-07-08); series keep 6.
  // Control gear has no real ranges (its "series" mixes dimmers, remotes,
  // gateways, sensors…), so a compare table is noise — those SKUs render the
  // plain "Full specification" panel instead (user 2026-07-08).
  const comparable = family.slug !== 'control-gear' && sameSeries.length > 1
  const base = buildMergedSeriesProps(family, series, comparable ? sameSeries : [product])
  const solo = buildMergedSeriesProps(family, series, [product], { maxKeySpecs: 8 })

  // groupSeriesModels strips CCT suffixes; the spec-driven families' SKUs are
  // unsuffixed, so modelCode === sku — with a startsWith fallback just in case.
  const variants = base.variants.map((v) =>
    v.modelCode === product.sku || (v.modelCode && product.sku.startsWith(v.modelCode))
      ? { ...v, current: true }
      : v,
  )

  // Overview tab: the Akeneo description distilled to marketing content
  // (parseOverview) — spec repeats and the "General Specification" dump are
  // dropped (that data lives in the spec table), DO-NOTs become installation
  // notes. Section omitted entirely when the PIM has no copy.
  const overviewContent = parseOverview(product.description)

  // H1 = the SKU code (Akeneo names are spec soup — those numbers already live
  // in the key-spec grid). The descriptive remainder of the name, stripped of
  // brand + SKU, becomes the one-line subtitle.
  const skuPattern = new RegExp(`\\b${product.sku.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
  const descriptiveName = product.name
    .replace(skuPattern, '')
    .replace(/^\s*envo\s+/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim()

  return {
    ...base,
    breadcrumb: { ...base.breadcrumb, seriesLabel: product.sku },
    eyebrow: `${family.tag.split('·')[0].trim()} · ${seriesLabel(product.series)}`,
    title: product.sku,
    heroSubtitle:
      descriptiveName || (solo.heroSubtitle ?? product.short_description?.trim() ?? product.subtitle?.trim() ?? undefined),
    overview: overviewContent
      ? { heading: overviewContent.headline ?? `About the ${product.sku}.`, ...overviewContent }
      : undefined,
    // exact facts for THIS SKU, never series-wide ranges
    keySpecs: solo.keySpecs,
    datasheetUrl: solo.datasheetUrl,
    downloads: solo.datasheetUrl ? [{ name: `${product.sku} datasheet`, meta: 'PDF', href: solo.datasheetUrl }] : [],
    // 'Where it works' — editorial when authored, else derived from the
    // product's own copy + specs (user 2026-07-08).
    solutions: base.solutions?.length ? base.solutions : deriveSolutions(family.slug, product),
    // hero gallery shows only THIS product (user 2026-07-08): stage = its own
    // image; the thumb strip stays — own tile + any editorial scene photos,
    // never sibling-model tiles
    heroStage: [solo.variants[0].image],
    thumbs: [
      { ...solo.variants[0].image, label: product.sku },
      ...(base.thumbs?.filter((t) => t.cover) ?? []),
    ],
    variants,
  }
}
