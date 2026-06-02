// src/lib/faqs.ts
// Server-only. Reads the Faqs collection via the Payload local API and shapes
// it into ordered, labelled groups for the FAQ page. Do NOT import from a
// client component.
import { getPayload } from 'payload'
import config from '@/payload.config'

export type FaqGroupKey = 'ordering' | 'products' | 'installation' | 'warranty'

export const FAQ_GROUP_LABELS: Record<FaqGroupKey, string> = {
  ordering: 'Ordering & availability',
  products: 'Products & compatibility',
  installation: 'Installation & technical',
  warranty: 'Warranty & after-sales',
}

const GROUP_ORDER: FaqGroupKey[] = ['ordering', 'products', 'installation', 'warranty']

export type Faq = {
  id: number
  question: string
  answer: unknown // Lexical richText document
  group: FaqGroupKey
  order: number
}

export type FaqGroup = { key: FaqGroupKey; label: string; items: Faq[] }

export async function getFaqs(): Promise<FaqGroup[]> {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'faqs',
    where: { _status: { equals: 'published' } },
    sort: 'order',
    limit: 200,
    depth: 0,
  })

  const byGroup = new Map<FaqGroupKey, Faq[]>()
  for (const d of docs as unknown as Faq[]) {
    const arr = byGroup.get(d.group) ?? []
    arr.push(d)
    byGroup.set(d.group, arr)
  }

  return GROUP_ORDER.filter((k) => byGroup.has(k)).map((k) => ({
    key: k,
    label: FAQ_GROUP_LABELS[k],
    items: byGroup.get(k)!,
  }))
}
