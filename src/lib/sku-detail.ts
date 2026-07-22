// Data assembly for the SKU detail page (/products/[family]/[sku]) — LED
// Drivers, Control Gear and Accessories only. Signage keeps its merged series
// pages. The page IS the merged series-page layout, scoped to one product
// (user direction 2026-07-08): hero + key specs + datasheet come from THIS
// product alone; the Specifications tab keeps the classic series compare
// table with every sibling model, the viewed SKU tinted + tagged "Current".
import type { Product } from '@/lib/products'
import type { ProductFamily } from '@/data/product-families'
import { seriesLabel, seriesSectionTitle } from '@/data/family-map'
import { buildMergedSeriesProps } from '@/lib/merged-series'
import { stripCctSuffix } from '@/components/products/catalogue-data'
import { SKU_WHERE_IT_WORKS } from '@/data/sku-where-it-works.generated'
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
  // signage boilerplate (user 2026-07-09): identical on every series page —
  // QA fluff, cert lists (standards row repeat), operation-mode repeat
  /100% testing/i,
  /certifications? from (ce|ul|rohs|t[uü]v|bis|cb)/i,
  /^constant (voltage|current)( system)?: /i,
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
    // "Label: detail" bullets keep the label bold in the grid; labels may
    // start with a digit ("20 Pieces Per String: …")
    const lm = text.match(/^([A-Z0-9][^:]{2,38}):\s+(.{3,})$/)
    if (lm) features.push({ label: lm[1], text: lm[2] })
    else features.push({ text })
  }

  for (const b of blocks) {
    if (b.tag === 'h2') {
      // section labels ("Key Features:", "Application:") are not headlines —
      // real marketing h2s never end with a colon
      if (!out.headline && !/^(key\s+)?features$/i.test(b.text) && !/:$/.test(b.text) && b.text.length <= 60)
        out.headline = b.text
      continue
    }
    if (b.tag === 'li') {
      pushFeature(b.text)
      continue
    }
    // paragraphs: "Label: detail" boilerplate reads as a feature; the first
    // substantial prose paragraph becomes the lede (first two sentences)
    if (/^[A-Z0-9][^:]{2,38}:\s+\S/.test(b.text) && b.text.length < 220) {
      pushFeature(b.text)
    } else if (!out.lede && b.text.length > 60) {
      out.lede = (b.text.match(/[^.!?]+[.!?]+/g)?.slice(0, 2).map((s) => s.trim()).join(' ') ?? b.text).trim()
    }
  }

  if (features.length) out.features = features
  if (cautions.length) out.cautions = cautions
  return out.lede || out.features || out.cautions ? out : null
}

/** First words that must keep their capital when a bullet joins a sentence. */
const PROPER_START =
  /^(IP\d|LED|OTA|DALI|DALI-2|DT8|PF\b|THD|PFC|DO\b|AC\b|DC\b|Zigbee|ZigBee|Casambi|Bluetooth|Philips|Osram|ENVO|USB|RGB|CCT|SMD|UL\b|CE\b|EN\d|IEC)/
const clause = (t: string) => (PROPER_START.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1))
const sentence = (parts: string[], lead: string) =>
  `${lead} ${parts.slice(0, -1).join(', ')}${parts.length > 1 ? ' and ' : ''}${parts[parts.length - 1]}.`

/** Weave the distilled content into short application-led paragraphs (user
 *  2026-07-08, reference: old-trade-site product descriptions — "if you need
 *  a lot of light, this is the module for the job"). Composed strictly from
 *  PIM copy + spec fields; nothing invented. */
export function overviewParagraphs(
  ov: OverviewContent,
  ctx: { familySlug: string; product: Product; solutions: MergedSolution[] },
): string[] {
  const { familySlug, product: p, solutions } = ctx
  const paras: string[] = []
  const ip = p.waterproof && /^ip\d+$/i.test(p.waterproof) ? p.waterproof.toUpperCase() : null

  // P1 — positioning: the PIM's own lede when it has one, else composed from
  // what the product IS.
  if (ov.lede) {
    paras.push(ov.lede)
  } else if (familySlug === 'led-drivers') {
    const mode = p.operation_mode === 'cc' ? 'constant-current' : 'constant-voltage'
    const sealed = ip && Number(ip.slice(2)) >= 65 // "sealed" claims need real sealing
    const bits = [
      p.power_w != null ? `${p.power_w} W` : null,
      `${mode} LED driver`,
      p.output_voltage_v != null ? `with a ${p.output_voltage_v} V DC output` : null,
    ].filter(Boolean)
    paras.push(`The ${p.sku} is a ${bits.join(' ')}${sealed ? `, sealed to ${ip}` : ''}.`)
  } else if (familySlug === 'control-gear') {
    const n = p.name
    const job = /sensor/i.test(n) ? 'occupancy and daylight automation'
      : /remote/i.test(n) ? 'wireless scene control'
      : /gateway|smart hub/i.test(n) ? 'connecting your lighting to the wider network'
      : /dimmer/i.test(n) ? 'smooth dimming control'
      : /switch|panel/i.test(n) ? 'wall-point lighting control'
      : 'precise lighting control'
    paras.push(`Use the ${p.sku} to bring ${job} to your installation.`)
  }

  // P2 — where it earns its keep: the same applications the Where-it-works
  // band derives, woven into one sentence with the strongest spec as anchor.
  // Applications the positioning sentence already named get no encore.
  const said = (paras[0] ?? '').toLowerCase()
  const fresh = solutions.filter((s) => !said.includes(s.title.replace(/\s*&\s*/g, ' and ').toLowerCase()))
  if (fresh.length) {
    const apps = fresh.slice(0, 4).map((s) => clause(s.title.replace(/\s*&\s*/g, ' and ')))
    const anchor = ip && Number(ip.slice(2)) >= 65 ? `With its ${ip}-sealed build, it`
      : p.dimming_control?.includes('triac') || /triac[- ]?dim/i.test(p.name) ? 'With Triac phase dimming on board, it'
      : p.operation_mode !== 'cc' && (p.output_voltage_v === 12 || p.output_voltage_v === 24)
        ? `Running on ${p.output_voltage_v} V constant voltage, it`
        : 'It'
    paras.push(`${anchor} is built for ${apps.slice(0, -1).join(', ')}${apps.length > 1 ? ' and ' : ''}${apps[apps.length - 1]}.`)
  }

  // P3 — what backs that up: the genuine differentiators in one flowing line.
  const plain = (ov.features ?? []).filter((f) => !f.label).map((f) => clause(f.text))
  if (plain.length) {
    const first = plain.slice(0, 4)
    const rest = plain.slice(4)
    let para = sentence(first, 'Backing that up:')
    if (rest.length) para += ` ${sentence(rest, 'It also offers')}`
    paras.push(para)
  }

  // "Label: detail" boilerplate reads naturally as its own short sentences.
  const labelled = (ov.features ?? []).filter((f) => f.label)
  if (labelled.length) paras.push(labelled.map((f) => `${f.label}: ${f.text}.`).join(' '))

  if (ov.cautions?.length)
    paras.push(
      `Installation notes: ${ov.cautions.map((c) => clause(c.replace(/^DO NOT/i, 'do not'))).join('; ')}.`,
    )
  return paras
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
  const tagged = base.variants.map((v) =>
    v.modelCode === product.sku || (v.modelCode && product.sku.startsWith(v.modelCode))
      ? // href stripped: the current model never self-links (the assembler now
        // fills href in both layouts, not just rows — 2026-07-17).
        { ...v, current: true, href: undefined }
      : v,
  )
  // The viewed SKU leads the models table (user 2026-07-13); siblings keep
  // series order behind it. Every sibling links to its own page — the columns
  // assembler only fills href on rows-layout series, but SKU pages are
  // model-grain across all families, so the stripped code IS the page slug.
  const variants = [...tagged.filter((v) => v.current), ...tagged.filter((v) => !v.current)].map(
    (v) =>
      v.current || v.href || !v.modelCode
        ? v
        : { ...v, href: `/products/${family.slug}/${v.modelCode}` },
  )

  // Overview tab: the Akeneo description distilled to marketing content
  // (parseOverview) — spec repeats and the "General Specification" dump are
  // dropped (that data lives in the spec table), DO-NOTs become installation
  // notes. Section omitted entirely when the PIM has no copy.
  const overviewContent = parseOverview(product.description)

  // H1 = the SKU code (Akeneo names are spec soup — those numbers already live
  // in the key-spec grid). Signage pages are MODEL-grain: the CCT suffix never
  // shows in titles/labels (user 2026-07-09). The descriptive remainder of the
  // name, stripped of brand + SKU, becomes the one-line subtitle.
  const displayCode =
    family.slug === 'led-signage-modules' ? stripCctSuffix(product.sku) : product.sku
  const skuPattern = new RegExp(`\\b${product.sku.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
  const descriptiveName = product.name
    .replace(skuPattern, '')
    .replace(/^\s*envo\s+/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim()

  // 'Where it works' — the per-SKU scene pack (image + concrete copy) when
  // imported, else series editorial, else derived from the product's own
  // copy + specs. Overview prose keeps anchoring on the text-only selection:
  // scene titles ("Bakery fascia lightbox") don't weave into sentences.
  const proseSolutions = base.solutions?.length ? base.solutions : deriveSolutions(family.slug, product)
  const pack = SKU_WHERE_IT_WORKS[product.sku]
  const solutions = pack?.solutions.length ? pack.solutions : proseSolutions

  // EVERY product page leads with the descriptor, never the SKU (user
  // 2026-07-09: 所有产品都要改) — the code moves to the subtitle and stays
  // in the breadcrumb. Products whose PIM name is nothing but brand+SKU
  // fall back to the code.
  const title = descriptiveName || displayCode

  return {
    ...base,
    breadcrumb: { ...base.breadcrumb, seriesLabel: displayCode },
    // No series in the data (the 7 sensors) → seriesLabel would say "Other";
    // the family section ("Sensors") is the honest label instead.
    eyebrow: `${family.tag.split('·')[0].trim()} · ${product.series ? seriesLabel(product.series) : seriesSectionTitle(family.slug, [product])}`,
    title,
    heroSubtitle: title === displayCode ? (product.short_description?.trim() ?? undefined) : displayCode,
    overview: overviewContent
      ? {
          heading: overviewContent.headline ?? `About the ${displayCode}.`,
          paragraphs: overviewParagraphs(overviewContent, { familySlug: family.slug, product, solutions: proseSolutions }),
        }
      : undefined,
    // exact facts for THIS SKU, never series-wide ranges
    keySpecs: solo.keySpecs,
    datasheetUrl: solo.datasheetUrl,
    // One datasheet covers every CCT variant of a model — the label always
    // drops -NW/-WW/-CW, whatever the family. Functional suffixes (-TDM,
    // -RGB, …) are distinct products and stay.
    downloads: solo.datasheetUrl
      ? [
          {
            kind: 'Datasheet',
            name: `${stripCctSuffix(product.sku)} datasheet`,
            meta: 'PDF · specifications & dimensions',
            href: solo.datasheetUrl,
          },
        ]
      : [],
    solutions,
    solutionsHeading: pack?.sectionTitle,
    // hero gallery shows only THIS product (user 2026-07-08): stage = its own
    // image; the thumb strip stays — own tile + any editorial scene photos,
    // never sibling-model tiles
    heroStage: [solo.variants[0].image],
    thumbs: [
      { ...solo.variants[0].image, label: displayCode },
      ...(base.thumbs?.filter((t) => t.cover) ?? []),
    ],
    variants,
    // 2026-07-13 spec split: Specifications tab = THIS model only (opens by
    // default); siblings render below the tabs as "All models in this series".
    // `code` rides into the Downloads tab's inline file-request form.
    skuPage: {
      seriesEyebrow: product.series ? seriesLabel(product.series) : seriesSectionTitle(family.slug, [product]),
      code: displayCode,
    },
  }
}
