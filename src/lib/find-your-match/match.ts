import type { Product } from '@/lib/products'
import type { FymAnswers, Recommendation, DriverPick, ControlPick, ModulePick } from './types'

const SIZE_MODULE_COUNT: Record<FymAnswers['size'], number> = { small: 20, medium: 60, large: 150 }
const SAFETY = 1.2
const IP_RATED = new Set(['ip65', 'ip67', 'ip68'])
const WHITE_BY_COLOUR: Record<string, string> = {
  white_warm: 'warm_white', white_neutral: 'natural_white', white_cool: 'cool_white',
}

const isModule = (p: Product) => p.family === 'led_module'
const isCvDriver = (p: Product) => p.family === 'psu_led_cv'
const isController = (p: Product) => p.family === 'psu_led_controller'
const live = (p: Product) => p.enabled !== false && p.hidden !== true
const ipRated = (p: Product) => !!p.waterproof && IP_RATED.has(p.waterproof)
const isRgb = (p: Product) => p.led_chip_colour === 'rgb' || p.led_chip_colour === 'rgbw'

function scoreModule(p: Product, a: FymAnswers): number {
  let s = 0
  if (a.environment === 'outdoor') s += ipRated(p) ? 3 : -3
  else s += 1
  if (a.colour === 'rgb') s += isRgb(p) ? 4 : -2
  else {
    const want = WHITE_BY_COLOUR[a.colour]
    if (p.led_chip_colour === want) s += 3
    else if (p.led_chip_colour === 'tunable_white') s += 2
    else if (!isRgb(p)) s += 1
    else s -= 1
  }
  if (a.application === 'facade' && (p.brightness_lm ?? 0) >= 150) s += 1
  return s
}

function selectModule(a: FymAnswers, catalog: Product[]): ModulePick {
  const mods = catalog.filter((p) => isModule(p) && live(p))
  if (mods.length === 0) return null
  const best = mods
    .map((p) => ({ p, s: scoreModule(p, a) }))
    .sort((x, y) => y.s - x.s || (x.p.power_w ?? 0) - (y.p.power_w ?? 0))[0].p
  const bits: string[] = []
  if (a.environment === 'outdoor') bits.push(ipRated(best) ? `${best.waterproof?.toUpperCase()} rated for outdoor use` : 'closest available for outdoor use')
  if (a.colour === 'rgb') bits.push(isRgb(best) ? 'RGB colour-changing' : 'nearest colour option')
  else bits.push('matched to your colour temperature')
  return { product: best, reason: bits.join(' · ') }
}

function selectDriver(a: FymAnswers, module: Product | null, catalog: Product[], estimatedLoadW: number): DriverPick {
  const voltageV = module?.output_voltage_v ?? 12
  const outdoor = a.environment === 'outdoor'
  const fits = catalog
    .filter((p) =>
      isCvDriver(p) && live(p) && (p.power_w ?? 0) >= estimatedLoadW &&
      (p.output_voltage_v == null || p.output_voltage_v === voltageV) &&
      (!outdoor || ipRated(p)),
    )
    .sort((x, y) => (x.power_w ?? 0) - (y.power_w ?? 0))
  if (fits.length > 0) {
    return { kind: 'product', product: fits[0], reason: `${fits[0].power_w} W constant-voltage driver, sized above your ~${Math.round(estimatedLoadW)} W load` }
  }
  return {
    kind: 'spec',
    spec: { powerW: Math.ceil(estimatedLoadW), voltageV, ip: outdoor ? 'ip67' : 'ip20', mode: 'cv' },
    reason: `You need roughly a ${Math.ceil(estimatedLoadW)} W · ${voltageV} V${outdoor ? ' · IP67' : ''} constant-voltage driver — available through authorised purchasing channels`,
  }
}

function selectControl(a: FymAnswers, catalog: Product[]): ControlPick {
  if (a.control === 'onoff') return null
  if (a.control === 'smart') {
    // controller_type is sparsely populated in the catalogue, so also match the
    // smart controller families by series code (envo_zigbee / envo_casambi).
    const ctrl = catalog.find((p) => isController(p) && live(p) && (
      (p.controller_type ?? []).some((c) => c === 'zigbee' || c === 'casambi') ||
      /zigbee|casambi/i.test(p.series ?? '')
    ))
    return ctrl
      ? { kind: 'product', product: ctrl, reason: 'Smart controller for app / Zigbee control' }
      : { kind: 'note', reason: 'Add a Zigbee or Casambi controller for smart control — ask an authorised purchasing channel for the current model' }
  }
  const dim = catalog.find((p) => (isCvDriver(p) || isController(p)) && live(p) && (p.dimming_control ?? []).length > 0)
  return dim
    ? { kind: 'product', product: dim, reason: 'Supports dimming' }
    : { kind: 'note', reason: 'Pair with a dimmable (triac / 0–10 V) driver — an authorised purchasing channel can supply one' }
}

export function recommend(answers: FymAnswers, catalog: Product[]): Recommendation {
  const modulePick = selectModule(answers, catalog)
  const perModuleW = modulePick?.product.power_w ?? 1.3
  const estimatedLoadW = SIZE_MODULE_COUNT[answers.size] * perModuleW * SAFETY
  const driver = selectDriver(answers, modulePick?.product ?? null, catalog, estimatedLoadW)
  const control = selectControl(answers, catalog)
  return { module: modulePick, driver, control, estimatedLoadW }
}
