/**
 * generate-series-editorial.mts
 * ------------------------------------------------------------------
 * Deterministic, re-runnable generator for signage series-page editorial COPY.
 *
 * Emits ONLY editorial copy (label, headline, lede, strengths, solutions) from
 * the hand-written per-series POSITIONING map.  Product specs (models, CCT
 * options, sharedSpecs, stats) are intentionally ABSENT — they are fetched live
 * from Payload at render time (three-source rule: Akeneo owns product data).
 *
 * No Anthropic API / no key needed — copy is intentionally placeholder-grade
 * ("先占位，之后改"). Re-run any time the POSITIONING map changes:
 *     npx tsx --tsconfig tsconfig.json scripts/generate-series-editorial.mts
 * Output (overwritten wholesale): src/data/series-editorial.generated.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// ---- per-series positioning (the hand-written judgement input) -------------
// Mini (envo_minilux) is intentionally absent — it keeps its hand-built page.
type Pos = {
  label: string            // display name
  headline: string         // Overview hero H1 (placeholder)
  lede: string             // Overview hero sub-copy
  strengths: { title: string; note: string }[]   // 3 hand-written feature bullets
  solutions: { title: string; pick: string }[]   // solution cards
}
const POSITIONING: Record<string, Pos> = {
  envo_ultraflare: {
    label: 'UltraFlare Series',
    headline: 'Premium emitters. Sealed to IP67.',
    lede: 'The premium backlit module for signage that has to look right and survive the weather — premium binned emitters in a fully potted IP67 body.',
    strengths: [
      { title: 'Premium emitters', note: 'Binned chips, consistent lot to lot.' },
      { title: 'Fully potted', note: 'IP67 — outdoor & wet-rated.' },
      { title: 'High output', note: 'Up to 180 lm per module.' },
    ],
    solutions: [
      { title: 'Exposed outdoor signage', pick: 'highest IP, full brightness' },
      { title: 'Coastal & wet locations', pick: 'fully potted body' },
      { title: 'Brand-critical retail facades', pick: 'high colour fidelity' },
      { title: 'Large illuminated cabinets', pick: 'top of the output range' },
    ],
  },
  envo_proglo: {
    label: 'ProGlo Series',
    headline: 'Professional finish. Consistent colour.',
    lede: 'A professional-grade backlit module built on premium emitters for signage shops that need consistent colour and a dependable supply.',
    strengths: [
      { title: 'Premium emitters', note: 'Stable, consistent colour.' },
      { title: 'Even fill', note: 'Wide lens, no hotspots.' },
      { title: 'Efficient', note: 'Low draw per lumen.' },
    ],
    solutions: [
      { title: 'Retail channel letters', pick: 'clean professional fill' },
      { title: 'Corporate facades', pick: 'consistent colour' },
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
    headline: 'Built for water. Sealed to IP67.',
    lede: 'An IP67 24 V backlit module on premium emitters — engineered for wet, humid and washdown environments where ordinary modules fail.',
    strengths: [
      { title: 'IP67 sealed', note: 'Wet & washdown rated.' },
      { title: 'Premium emitters', note: 'Stable colour, long life.' },
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

// ---- build -----------------------------------------------------------------
const out: Record<string, unknown> = {}
for (const [series, pos] of Object.entries(POSITIONING)) {
  out[series] = {
    aiDraft: true,
    label: pos.label,
    headline: pos.headline,
    lede: pos.lede,
    strengths: pos.strengths,   // 3 {title, note}
    solutions: pos.solutions,   // N {title, pick}
  }
  console.log(`  ✓ ${series}`)
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
