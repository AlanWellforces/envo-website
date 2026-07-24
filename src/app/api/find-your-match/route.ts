import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { listProducts } from '@/lib/products'
import { recommend } from '@/lib/find-your-match/match'
import { toRecommendationDto } from '@/lib/find-your-match/dto'
import { templateExplanation, rationalePrompt } from '@/lib/find-your-match/explain'
import type { FymAnswers } from '@/lib/find-your-match/types'
import { clientIp, rateLimited } from '@/lib/leads/abuse-guard'

// Find Your Match is parked — the /find-your-match page hard-404s (planned
// rework into a layout calculator, #124/#125). This endpoint 404s to match:
// while parked it must not run the catalogue query, write analytics, or call
// the paid AI for anonymous callers. To re-enable, flip FEATURE_PARKED
// (alongside restoring the page's entry points) — the handler below already
// ships a price-free DTO and is rate-limited, so it's safe to expose.
const FEATURE_PARKED = true

export async function POST(req: Request) {
  if (FEATURE_PARKED) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Cheap anonymous abuse cap (shared with the lead forms): bounds catalogue
  // reads and paid-AI calls per IP.
  if (rateLimited(clientIp(req.headers))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let answers: FymAnswers
  try {
    answers = (await req.json()) as FymAnswers
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Feed the engine the live ENVO catalogue. (On Wellforces, a different
  // catalogue source would be passed — the engine is catalogue-agnostic.)
  const { docs } = await listProducts({ limit: 1000 })
  const rec = recommend(answers, docs)

  // Best-effort usage log (no free-text notes — privacy). Never blocks the reply.
  try {
    const payload = await getPayload({ config })
    await payload.create({
      collection: 'events',
      data: {
        kind: 'find-your-match',
        data: {
          application: answers.application,
          environment: answers.environment,
          colour: answers.colour,
          size: answers.size,
          control: answers.control,
        },
      },
    })
  } catch {
    // logging failure must not affect the recommendation
  }

  let explanation = templateExplanation(answers, rec)
  const key = process.env.ANTHROPIC_API_KEY
  if (key) {
    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk')
      const client = new Anthropic({ apiKey: key })
      const msg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{ role: 'user', content: rationalePrompt(answers, rec) }],
      })
      const text = msg.content.find((b) => b.type === 'text')
      if (text && 'text' in text && text.text.trim()) explanation = text.text.trim()
    } catch {
      // Fall back to the template explanation on any AI error.
    }
  }

  // Ship a whitelisted DTO — never the raw Product (price/stock/lead-time).
  return NextResponse.json({ ...toRecommendationDto(rec), explanation })
}
