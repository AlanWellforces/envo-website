import type { FymAnswers, Recommendation } from './types'

const APP_LABEL: Record<FymAnswers['application'], string> = {
  channel_letters: 'channel letters', light_box: 'light box', facade: 'facade', other: 'signage',
}

export function templateExplanation(a: FymAnswers, rec: Recommendation): string {
  const parts: string[] = []
  if (rec.module) {
    parts.push(`For ${a.environment === 'outdoor' ? 'an outdoor' : 'an indoor'} ${APP_LABEL[a.application]} build, the ${rec.module.product.name} is the closest fit — ${rec.module.reason}.`)
  }
  if (rec.driver.kind === 'product') {
    parts.push(`Pair it with the ${rec.driver.product.name}: ${rec.driver.reason}.`)
  } else {
    parts.push(`${rec.driver.reason}.`)
  }
  if (rec.control?.kind === 'product') parts.push(`${rec.control.product.name} handles control — ${rec.control.reason}.`)
  else if (rec.control?.kind === 'note') parts.push(`${rec.control.reason}.`)
  parts.push('Send us the sign drawing for a free layout to confirm exact module spacing and driver sizing.')
  return parts.join(' ')
}

/** Instruction used when an LLM rationale is generated (API route). Kept here so the
    engine package owns the wording; the route passes the recommendation as JSON. */
export function rationalePrompt(a: FymAnswers, rec: Recommendation): string {
  return [
    'You are an LED signage engineer at ENVO, a components supplier. Write ONE short, factual paragraph (max 70 words)',
    "explaining why this recommended setup suits the customer's sign. Plain, helpful, NOT salesy. Do not invent specs.",
    'Never mention prices, stock or availability, and never promise a response time — supply is via authorised channels.',
    `Customer answers: ${JSON.stringify(a)}`,
    `Recommended (from our catalogue): ${JSON.stringify({
      module: rec.module?.product.name ?? null,
      driver: rec.driver.kind === 'product' ? rec.driver.product.name : rec.driver.spec,
      control: rec.control?.kind === 'product' ? rec.control.product.name : (rec.control?.reason ?? null),
      estimatedLoadW: Math.round(rec.estimatedLoadW),
    })}`,
  ].join('\n')
}
