// Declarative spec layout for the generic product detail page. Each group renders
// only if ≥1 of its rows has a value. Formatters keep dual units / enum labels
// consistent with the rest of the site.
import { formatDims } from '@/lib/units'
import type { Product } from '@/lib/products'

export type SpecRow = { label: string; value: (p: Product) => string | null }
export type SpecGroup = { title: string; rows: SpecRow[] }

const num = (v: number | null | undefined, unit = ''): string | null =>
  v == null ? null : `${v}${unit}`
const list = (v: string[] | null | undefined): string | null =>
  v && v.length ? v.join(', ') : null
const OP_MODE: Record<string, string> = { cv: 'Constant voltage', cc: 'Constant current', cv_cc: 'CV / CC' }

// Up to 4 headline spec chips for the hero, echoing the mini-series stat row.
// Priority order; only populated fields appear, family-agnostic.
export function heroStats(p: Product): { value: string; label: string }[] {
  const candidates: { value: string | null; label: string }[] = [
    { value: p.power_w != null ? `${p.power_w} W` : null, label: 'Power' },
    { value: p.brightness_lm != null ? `${p.brightness_lm} lm` : null, label: 'Brightness' },
    { value: p.output_voltage_v != null ? `${p.output_voltage_v} V` : null, label: 'Output' },
    { value: p.cct_k != null ? `${p.cct_k} K` : null, label: 'Colour temp' },
    { value: p.beam_angle_deg != null ? `${p.beam_angle_deg}°` : null, label: 'Beam angle' },
    { value: p.rated_current_a != null ? `${p.rated_current_a} A` : null, label: 'Rated current' },
    { value: p.waterproof ? p.waterproof.toUpperCase() : null, label: 'Ingress' },
    { value: p.warranty_years != null ? `${p.warranty_years} yr` : null, label: 'Warranty' },
  ]
  return candidates.filter((c): c is { value: string; label: string } => c.value != null).slice(0, 4)
}

export const SPEC_GROUPS: SpecGroup[] = [
  {
    title: 'Electrical',
    rows: [
      { label: 'Power', value: (p) => num(p.power_w, ' W') },
      { label: 'Output voltage', value: (p) => num(p.output_voltage_v, ' V') },
      { label: 'Input voltage', value: (p) =>
        p.input_voltage_min_v != null && p.input_voltage_max_v != null
          ? `${p.input_voltage_min_v}–${p.input_voltage_max_v} V` : null },
      { label: 'Rated current', value: (p) => num(p.rated_current_a, ' A') },
      { label: 'Outputs', value: (p) => num(p.number_of_outputs) },
      { label: 'Operation mode', value: (p) => p.operation_mode ? OP_MODE[p.operation_mode] ?? p.operation_mode : null },
      { label: 'Dimming / control', value: (p) => list(p.dimming_control) },
    ],
  },
  {
    title: 'Light output',
    rows: [
      { label: 'Brightness', value: (p) => num(p.brightness_lm, ' lm') },
      { label: 'Efficacy', value: (p) => num(p.efficacy_lm_w, ' lm/W') },
      { label: 'Colour temperature', value: (p) => num(p.cct_k, ' K') },
      { label: 'CRI', value: (p) => num(p.cri) },
      { label: 'Beam angle', value: (p) => num(p.beam_angle_deg, '°') },
      { label: 'LED colour', value: (p) => p.led_chip_colour ?? null },
      { label: 'Max in series', value: (p) => num(p.max_in_series) },
      { label: 'Lifetime', value: (p) => num(p.lifetime_hrs, ' h') },
    ],
  },
  {
    title: 'Control',
    rows: [
      { label: 'Controller type', value: (p) => list(p.controller_type) },
      { label: 'Output channels', value: (p) => p.output_channel ?? null },
      { label: 'Output type', value: (p) => p.output_type ?? null },
    ],
  },
  {
    title: 'Physical',
    rows: [
      { label: 'Dimensions', value: (p) => {
        const d = formatDims(p.length_mm, p.width_mm, p.height_mm)
        return d ? `${d.mm} (${d.in})` : null
      } },
      { label: 'Weight', value: (p) => num(p.weight_kg, ' kg') },
      { label: 'IP rating', value: (p) => p.waterproof ? p.waterproof.toUpperCase() : null },
      { label: 'Operating temp', value: (p) =>
        p.temp_min_c != null && p.temp_max_c != null
          ? `${p.temp_min_c} °C to ${p.temp_max_c} °C` : null },
      { label: 'Material', value: (p) => p.material ?? null },
      { label: 'Finish', value: (p) => p.finish_colour ?? null },
      { label: 'Mounting', value: (p) => p.mounting_info ?? null },
    ],
  },
  {
    title: 'Certifications',
    rows: [
      { label: 'Standards', value: (p) => list(p.standards_met) },
    ],
  },
  {
    title: 'Support',
    rows: [
      { label: 'Warranty', value: (p) => num(p.warranty_years, p.warranty_years === 1 ? ' year' : ' years') },
    ],
  },
]
