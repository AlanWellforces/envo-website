// src/data/selector-config.ts
// Editorial + display config for the product selector tables (Git-owned, per
// the three-source rule). Product spec VALUES come from Akeneo; this file only
// names/orders series and declares which columns/filters a family shows.
// Eventually superseded by a Payload `Series` collection (deferred).

export type SelectorColumn =
  | 'image' | 'model' | 'series' | 'ledCount' | 'output' | 'power'
  | 'beam' | 'cri' | 'ip' | 'maxRun' | 'dims' | 'actions'

export type SelectorFilter = 'search' | 'series' | 'ledCount' | 'voltage' | 'cct' | 'ip' | 'maxHeight'

export type SeriesMeta = {
  /** Akeneo `series` value, e.g. "envo_ecoglo". */
  code: string
  /** Display name, e.g. "EcoGlo". */
  label: string
  /** "Best for" tagline shown in the series group header. */
  bestFor: string
  /** 'backlit' | 'sidelit' — groups the table into two zones. */
  type: 'backlit' | 'sidelit'
  /** Detail page href, or null if the series page is not built yet. */
  detailHref: string | null
}

export type FamilySelectorConfig = {
  familyCode: string
  title: string
  intro: string
  columns: SelectorColumn[]
  filters: SelectorFilter[]
  /** Ordered; first match wins. Series absent here render with a humanised label, sorted last. */
  series: SeriesMeta[]
}

export const SIGNAGE_SELECTOR: FamilySelectorConfig = {
  familyCode: 'led_module',
  title: 'Signage module selector',
  intro:
    'Filter ENVO signage modules by output, beam, ingress rating and size — find the exact model, then open its series page or grab the datasheet.',
  columns: ['image', 'model', 'series', 'ledCount', 'output', 'power', 'beam', 'cri', 'ip', 'maxRun', 'dims', 'actions'],
  filters: ['search', 'series', 'ledCount', 'voltage', 'cct', 'ip', 'maxHeight'],
  series: [
    { code: 'envo_ecoglo',     label: 'EcoGlo',     bestFor: 'Everyday workhorse',          type: 'backlit', detailHref: '/products/led-signage-modules/eco-series' },
    { code: 'envo_proglo',     label: 'ProGlo',     bestFor: 'High-clarity mid-range',      type: 'backlit', detailHref: null },
    { code: 'envo_ultraflare', label: 'UltraFlare', bestFor: 'Deep lightboxes, big letters', type: 'backlit', detailHref: null },
    { code: 'envo_minilux',    label: 'MiniLux',    bestFor: 'Shallow cabinets · 8.9 mm',    type: 'backlit', detailHref: '/products/led-signage-modules/mini-series' },
    { code: 'hydro_lume',      label: 'HydroLume',  bestFor: 'Wet / coastal installs',       type: 'backlit', detailHref: null },
    { code: 'envo_optilume',   label: 'OptiLume',   bestFor: 'Long 24 V runs',               type: 'backlit', detailHref: null },
    { code: 'envo_chromaflux', label: 'ChromaFlux', bestFor: 'Full-colour RGB signs',        type: 'backlit', detailHref: null },
    { code: 'envo_edgelume',   label: 'EdgeLume',   bestFor: 'Thin edge-lit',                type: 'sidelit', detailHref: null },
    { code: 'envo_edgeflare',  label: 'EdgeFlare',  bestFor: 'Edge-lit, brighter',           type: 'sidelit', detailHref: null },
    { code: 'envo_edgeblade',  label: 'EdgeBlade',  bestFor: 'Edge-lit, max output',         type: 'sidelit', detailHref: null },
    { code: 'edge_blade_2',    label: 'EdgeBlade 2', bestFor: 'Edge-lit, double-row',        type: 'sidelit', detailHref: null },
  ],
}

export const SELECTOR_CONFIGS: Record<string, FamilySelectorConfig> = {
  signage: SIGNAGE_SELECTOR,
}
