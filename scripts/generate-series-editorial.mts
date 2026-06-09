/**
 * generate-series-editorial.mts
 * ------------------------------------------------------------------
 * Deterministic, re-runnable generator for signage series-page editorial.
 *
 * For each signage (`led_module`) series it:
 *   1. groups Akeneo/Payload products by SUFFIX-LESS model code (collapses the
 *      -WW / -NW / -CW CCT variants into one model — CCT is a shared option,
 *      not a product; see memory project_series-template-product-grain),
 *   2. aggregates the shared specs,
 *   3. assembles PLACEHOLDER Overview + Solutions copy from a hand-written
 *      per-series POSITIONING map (the only judgement input) + the live specs.
 *
 * No Anthropic API / no key needed — copy is intentionally placeholder-grade
 * ("先占位，之后改"). Re-run any time the PIM data changes:
 *     npx tsx --tsconfig tsconfig.json scripts/generate-series-editorial.mts
 * Output (overwritten wholesale): src/data/series-editorial.generated.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
for (const line of fs.readFileSync(path.join(root, '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const _r = createRequire(path.join(root, 'node_modules/payload/dist/bin/dummy.js'))
const ne = _r('@next/env'); if (!ne.default) ne.default = ne
const cfg = await (await import('../src/payload.config.ts')).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: cfg })

// ---- per-series positioning (the hand-written judgement input) -------------
// Mini (envo_minilux) is intentionally absent — it keeps its hand-built page.
type Pos = {
  label: string            // display name
  headline: string         // Overview hero H1 (placeholder)
  lede: string             // Overview hero sub-copy
  // three custom feature bullets {title, note}; three more are auto-added from specs
  strengths: { title: string; note: string }[]
  // solution cards {title, pick}; specs (IP/CCT/LED count) are appended automatically
  solutions: { title: string; pick: string }[]
}
const POSITIONING: Record<string, Pos> = {
  envo_ultraflare: {
    label: 'UltraFlare Series',
    headline: 'Osram inside. Sealed to IP67.',
    lede: 'The premium backlit module for signage that has to look right and survive the weather — genuine Osram emitters in a fully potted IP67 body.',
    strengths: [
      { title: 'Osram emitters', note: 'Premium binned chips, lot to lot.' },
      { title: 'Fully potted', note: 'IP67 — outdoor & wet-rated.' },
      { title: 'High output', note: 'Up to 180 lm per module.' },
    ],
    solutions: [
      { title: 'Exposed outdoor signage', pick: 'highest IP, full brightness' },
      { title: 'Coastal & wet locations', pick: 'fully potted body' },
      { title: 'Brand-critical retail facades', pick: 'Osram colour fidelity' },
      { title: 'Large illuminated cabinets', pick: 'top of the output range' },
    ],
  },
  envo_proglo: {
    label: 'ProGlo Series',
    headline: 'Philips light. Professional finish.',
    lede: 'A professional-grade backlit module built on genuine Philips emitters for signage shops that need consistent colour and a dependable supply.',
    strengths: [
      { title: 'Philips emitters', note: 'Trusted brand, stable colour.' },
      { title: 'Even fill', note: 'Wide lens, no hotspots.' },
      { title: 'Efficient', note: 'Low draw per lumen.' },
    ],
    solutions: [
      { title: 'Retail channel letters', pick: 'clean professional fill' },
      { title: 'Corporate facades', pick: 'consistent Philips colour' },
      { title: 'Lightbox cabinets', pick: 'balanced output' },
      { title: 'Wayfinding & interior signs', pick: 'low-glare even glow' },
    ],
  },
  envo_ecoglo: {
    label: 'EcoGlo Series',
    headline: 'The value backlit module.',
    lede: 'Economical backlit lighting for high-volume signage where cost per letter matters — dependable output without the premium price.',
    strengths: [
      { title: 'Best cost per letter', note: 'Built for volume jobs.' },
      { title: 'Proven output', note: 'Reliable everyday brightness.' },
      { title: 'Easy install', note: 'Daisy-chain, cut to length.' },
    ],
    solutions: [
      { title: 'High-volume channel letters', pick: 'lowest cost per run' },
      { title: 'Standard lightboxes', pick: 'everyday brightness' },
      { title: 'Promotional & temporary signage', pick: 'value first' },
      { title: 'Interior retail signs', pick: 'budget-friendly fill' },
    ],
  },
  envo_optilume: {
    label: 'OptiLume Series',
    headline: 'Efficiency, optimised.',
    lede: 'A 24 V backlit module tuned for efficiency — more sign per watt on long runs and large cabinets.',
    strengths: [
      { title: '24 V bus', note: 'Longer runs, fewer drops.' },
      { title: 'High efficacy', note: 'More light per watt.' },
      { title: 'Even fill', note: 'Wide lens across the face.' },
    ],
    solutions: [
      { title: 'Long letter runs', pick: '24 V holds voltage' },
      { title: 'Large cabinets', pick: 'efficient at scale' },
      { title: 'Energy-conscious projects', pick: 'lowest watts per area' },
      { title: 'Architectural facades', pick: 'clean uniform glow' },
    ],
  },
  hydro_lume: {
    label: 'HydroLume Series',
    headline: 'Built for water. Lit by Philips.',
    lede: 'An IP67 24 V backlit module on Philips emitters — engineered for wet, humid and washdown environments where ordinary modules fail.',
    strengths: [
      { title: 'IP67 sealed', note: 'Wet & washdown rated.' },
      { title: 'Philips emitters', note: 'Stable colour, long life.' },
      { title: '24 V bus', note: 'Long runs without drop-off.' },
    ],
    solutions: [
      { title: 'Wet & washdown signage', pick: 'IP67 sealed body' },
      { title: 'Coastal & marine', pick: 'corrosion-resistant build' },
      { title: 'Pool & leisure venues', pick: 'humidity-proof' },
      { title: 'Outdoor pylon signs', pick: 'all-weather rated' },
    ],
  },
  envo_chromaflux: {
    label: 'ChromaFlux Series',
    headline: 'One module. Every colour.',
    lede: 'An RGBW backlit module that does full-colour and crisp white from the same unit — for signage and feature lighting that has to change.',
    strengths: [
      { title: 'RGBW in one', note: 'Colour + true white.' },
      { title: 'Addressable-ready', note: 'Scenes and effects.' },
      { title: 'Even mix', note: 'No colour fringing.' },
    ],
    solutions: [
      { title: 'Dynamic brand signage', pick: 'colour-changing RGBW' },
      { title: 'Feature & accent lighting', pick: 'scene control' },
      { title: 'Entertainment & hospitality', pick: 'full-colour effects' },
      { title: 'White + colour signs', pick: 'one module does both' },
    ],
  },
  envo_edgelume: {
    label: 'EdgeLume Series',
    headline: 'Edge-lit. Slim by design.',
    lede: 'A sidelit module for slim faces and edge-lit cabinets where a backlit module is simply too deep.',
    strengths: [
      { title: 'Sidelit optic', note: 'Lights from the edge.' },
      { title: 'Ultra-slim builds', note: 'Fits shallow faces.' },
      { title: 'Even edge glow', note: 'No bright spots.' },
    ],
    solutions: [
      { title: 'Slim edge-lit signs', pick: 'sidelit, shallow depth' },
      { title: 'Acrylic light panels', pick: 'edge injection' },
      { title: 'Thin lightboxes', pick: 'minimal cabinet depth' },
      { title: 'Decorative trim', pick: 'fine edge accent' },
    ],
  },
  envo_edgeflare: {
    label: 'EdgeFlare Series',
    headline: 'Edge-lit. Turned up.',
    lede: 'A brighter sidelit module for larger edge-lit faces that need more punch than an entry sidelit can give.',
    strengths: [
      { title: 'Brighter sidelit', note: 'More output per edge.' },
      { title: 'Larger panels', note: 'Drives bigger faces.' },
      { title: 'Even injection', note: 'Uniform edge fill.' },
    ],
    solutions: [
      { title: 'Large edge-lit signs', pick: 'higher sidelit output' },
      { title: 'Wide acrylic panels', pick: 'reaches across the face' },
      { title: 'Premium lightboxes', pick: 'bright, slim profile' },
      { title: 'Architectural edge features', pick: 'strong even glow' },
    ],
  },
  envo_edgeblade: {
    label: 'EdgeBlade Series',
    headline: 'High-output edge-lit.',
    lede: 'The high-output sidelit module — maximum brightness from the edge for the most demanding slim faces.',
    strengths: [
      { title: 'Top sidelit output', note: 'Max brightness per edge.' },
      { title: 'Big slim faces', note: 'Drives the largest panels.' },
      { title: 'Even fill', note: 'Uniform across the edge.' },
    ],
    solutions: [
      { title: 'Large slim facades', pick: 'highest sidelit output' },
      { title: 'Premium edge-lit cabinets', pick: 'bright, shallow' },
      { title: 'Backlit-look signs without the depth', pick: 'sidelit punch' },
      { title: 'Feature architectural panels', pick: 'strong even edge' },
    ],
  },
  edge_blade_2: {
    label: 'EdgeBlade2 Series',
    headline: 'Edge-lit. Sealed and stronger.',
    lede: 'The next EdgeBlade — a 24 V IP67 sidelit module that brings high-output edge lighting outdoors and into wet locations.',
    strengths: [
      { title: 'IP67 sealed', note: 'Edge-lit, now outdoor-rated.' },
      { title: '24 V bus', note: 'Longer runs, big panels.' },
      { title: 'High output', note: 'Brightest EdgeBlade yet.' },
    ],
    solutions: [
      { title: 'Outdoor edge-lit signs', pick: 'IP67 sidelit' },
      { title: 'Large exterior panels', pick: '24 V long runs' },
      { title: 'Wet-location slim faces', pick: 'sealed sidelit' },
      { title: 'Premium exterior facades', pick: 'high-output edge glow' },
    ],
  },
}

// ---- helpers ---------------------------------------------------------------
const stripCct = (sku: string) => sku.replace(/-(WW|NW|CW)$/, '')
const cctCode = (sku: string) => sku.match(/-(WW|NW|CW)$/)?.[1] ?? null
const LED_BY_DIGIT: Record<string, string> = { '1': 'Single', '2': 'Double', '3': 'Triple', '4': 'Quad' }
const ledCount = (modelCode: string, name?: string) => {
  const d = modelCode.match(/0(\d)[A-Z]+$/)?.[1]
  if (d && LED_BY_DIGIT[d]) return LED_BY_DIGIT[d]
  const n = name?.match(/\b(Single|Double|Triple|Quad)\b/i)?.[1]
  return n ? n[0].toUpperCase() + n.slice(1).toLowerCase() : '—'
}
const certName: Record<string, string> = {
  c_ul: 'UL', c_cul: 'cUL', c_ce: 'CE', c_tuv: 'TÜV', c_rohs: 'RoHS',
  c_cb: 'CB', c_bis: 'BIS', c_ccc: 'CCC', c_fcc: 'FCC', c_fc: 'FCC', c_selv: 'SELV', c_lm80: 'LM-80',
}
const uniq = <T,>(a: T[]) => [...new Set(a)]
const num = (n: unknown): number | null => (typeof n === 'number' && !Number.isNaN(n) ? n : null)

// ---- build -----------------------------------------------------------------
const out: Record<string, unknown> = {}
for (const [series, pos] of Object.entries(POSITIONING)) {
  const res = await payload.find({
    collection: 'products',
    where: { and: [{ enabled: { equals: true } }, { series: { equals: series } }] },
    limit: 200, depth: 0,
  })
  const docs = res.docs as Record<string, any>[]
  if (!docs.length) { console.warn(`  ! no products for ${series} — skipped`); continue }

  // group by suffix-less model
  const models: Record<string, Record<string, any>[]> = {}
  for (const d of docs) (models[stripCct(d.sku)] ??= []).push(d)

  const modelRows = Object.entries(models).map(([code, skus]) => {
    const d = skus[0]
    const lwh = [num(d.length_mm), num(d.width_mm), num(d.height_mm)]
    return {
      code,
      leds: ledCount(code, d.productName),
      powerW: num(d.power_w),
      lumens: num(d.brightness_lm),
      dimsMm: lwh.every((x) => x != null) ? lwh.join(' × ') : null,
    }
  }).sort((a, b) => (a.powerW ?? 0) - (b.powerW ?? 0))

  const cctOptions = uniq(
    docs.map((d) => ({ code: cctCode(d.sku), k: num(d.cct_k) }))
      .filter((c) => c.code && c.k)
      .map((c) => `${c.code}=${c.k}K`),
  )
  const beams = uniq(docs.map((d) => num(d.beam_angle_deg)).filter(Boolean))
  // IP: the `waterproof` enum (ip65/ip67/non_waterproof…), else parse the subtitle.
  const ipFromField = docs.map((d) => (d.waterproof as string | null))
    .find((w) => w && /^ip\d+$/i.test(w))
  const ipFromSub = docs.map((d) => (d.subtitle as string | null)?.match(/IP\s?(\d{2})/i)?.[1])
    .find(Boolean)
  const ip = ipFromField ? ipFromField.toUpperCase() : ipFromSub ? `IP${ipFromSub}` : null
  // Volts: numeric fields are null for passive modules — read the nominal "12V"/"24V" off the subtitle.
  const volts = uniq(
    docs.map((d) => num(d.input_voltage_min_v) ?? num(d.output_voltage_v)
      ?? (Number((d.subtitle as string | null)?.match(/(\d+)\s*V\b/i)?.[1]) || null))
      .filter(Boolean),
  )
  const maxLm = Math.max(0, ...docs.map((d) => num(d.brightness_lm) ?? 0)) || null
  const life = docs.find((d) => num(d.lifetime_hrs))?.lifetime_hrs ?? null
  const certs = uniq(docs.flatMap((d) => (d.standards_met as string[] | null) ?? []))
    .map((c) => certName[c] ?? c).filter(Boolean)

  // 4 hero stats from live specs
  const stats = [
    maxLm ? { value: `${maxLm} lm`, label: 'max / module' } : null,
    beams.length ? { value: `${beams[0]}°`, label: 'beam angle' } : null,
    ip ? { value: String(ip), label: 'ingress' } : null,
    cctOptions.length ? { value: `${cctOptions.length} CCT`, label: 'colour temps' } : null,
  ].filter(Boolean)

  // 6 features = 3 positioning strengths + up to 3 auto from specs
  const autoFeatures = [
    volts.length ? { title: `${volts[0]} V DC`, note: `${modelRows.length} models, one platform.` } : null,
    life ? { title: `${Number(life).toLocaleString()} h`, note: 'Rated lifetime.' } : null,
    certs.length ? { title: `${certs.length} marks`, note: certs.slice(0, 6).join(' · ') } : null,
  ].filter(Boolean)
  const features = [...pos.strengths, ...autoFeatures].slice(0, 6)

  out[series] = {
    aiDraft: true,
    label: pos.label,
    overview: { headline: pos.headline, lede: pos.lede, stats, features },
    solutions: { cards: pos.solutions },
    models: modelRows,
    cctOptions,
    sharedSpecs: {
      beamDeg: beams[0] ?? null, ip, voltsDc: volts[0] ?? null,
      lifetimeHrs: num(life), certs,
    },
  }
  console.log(`  ✓ ${series.padEnd(18)} ${modelRows.length} models · ${cctOptions.length} CCT · ${features.length} features`)
}

// ---- write -----------------------------------------------------------------
const banner = `// AUTO-GENERATED by scripts/generate-series-editorial.mts — DO NOT EDIT BY HAND.
// PLACEHOLDER copy ("先占位，之后改"): refine in the POSITIONING map then re-run.
// Editorial here is AI-draft and pending Wei review. See memory
// project_series-template-product-grain.\n`
const body = `${banner}\nexport type SeriesEditorial = (typeof SERIES_EDITORIAL)[keyof typeof SERIES_EDITORIAL]\n\nexport const SERIES_EDITORIAL = ${JSON.stringify(out, null, 2)} as const\n`
const dest = path.join(root, 'src/data/series-editorial.generated.ts')
fs.writeFileSync(dest, body)
console.log(`\nWrote ${Object.keys(out).length} series → ${path.relative(root, dest)}`)
process.exit(0)
