// src/lib/faqs.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFind = vi.fn()
vi.mock('payload', () => ({ getPayload: vi.fn(async () => ({ find: mockFind })) }))
vi.mock('@/payload.config', () => ({ default: {} }))

import { getFaqs, FAQ_GROUP_LABELS } from './faqs'

beforeEach(() => {
  mockFind.mockReset()
  mockFind.mockResolvedValue({ docs: [] })
})

describe('getFaqs', () => {
  it('queries published faqs sorted by order', async () => {
    await getFaqs()
    const arg = mockFind.mock.calls[0][0]
    expect(arg.collection).toBe('faqs')
    expect(arg.where).toEqual({ _status: { equals: 'published' } })
    expect(arg.sort).toBe('order')
  })

  it('groups items by group key in canonical order, preserving item order', async () => {
    mockFind.mockResolvedValue({ docs: [
      { id: 3, question: 'w', answer: {}, group: 'warranty', order: 0 },
      { id: 1, question: 'o1', answer: {}, group: 'ordering', order: 0 },
      { id: 2, question: 'o2', answer: {}, group: 'ordering', order: 1 },
    ] })
    const groups = await getFaqs()
    expect(groups.map((g) => g.key)).toEqual(['ordering', 'warranty'])
    expect(groups[0].items.map((i) => i.id)).toEqual([1, 2])
    expect(groups[0].label).toBe(FAQ_GROUP_LABELS.ordering)
  })

  it('omits empty groups', async () => {
    mockFind.mockResolvedValue({ docs: [
      { id: 1, question: 'o', answer: {}, group: 'ordering', order: 0 },
    ] })
    const groups = await getFaqs()
    expect(groups).toHaveLength(1)
    expect(groups[0].key).toBe('ordering')
  })
})
