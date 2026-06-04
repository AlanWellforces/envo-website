import { NextResponse } from 'next/server'
import { listProducts } from '@/lib/products'
import { recommend } from '@/lib/find-your-match/match'
import { templateExplanation, rationalePrompt } from '@/lib/find-your-match/explain'
import type { FymAnswers } from '@/lib/find-your-match/types'

export async function POST(req: Request) {
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

  return NextResponse.json({ ...rec, explanation })
}
