// Test predicates inspect dynamic mock-call shapes — `any` is the right tool here.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Payload before importing the module under test.
const mockFind = vi.fn()
vi.mock('payload', () => ({
  getPayload: vi.fn(async () => ({ find: mockFind })),
}))
vi.mock('@/payload.config', () => ({ default: {} }))

// Import after the mocks.
import { getPosts, getPostBySlug, getPostsByCategory, getPostsByTag, getRelatedPosts, getAllSlugs, type Post } from './posts'

beforeEach(() => {
  mockFind.mockReset()
  mockFind.mockResolvedValue({ docs: [], totalDocs: 0, totalPages: 0 })
})

function findCall() {
  return mockFind.mock.calls[0][0]
}

/** The composite public filter ({ and: [_status, publishedAt] }) nested in a conditions array. */
function publicFilterIn(conditions: object[]) {
  return conditions.find((c: any) => Array.isArray(c.and)) as any
}

describe('posts accessor — publish/date filter', () => {
  it('getPosts filters by published status AND publishedAt <= now', async () => {
    await getPosts({})
    const call = findCall()
    expect(call.collection).toBe('posts')
    const pub = publicFilterIn(call.where.and)
    expect(pub.and.some((c: any) => c._status?.equals === 'published')).toBe(true)
    expect(pub.and.some((c: any) => c.publishedAt?.less_than_equal)).toBe(true)
  })

  it('getPostBySlug filters by slug AND publishedAt', async () => {
    mockFind.mockResolvedValue({ docs: [{ id: 1, slug: 'hello' }], totalDocs: 1, totalPages: 1 })
    await getPostBySlug('hello')
    const call = findCall()
    const conditions: object[] = call.where.and
    expect(conditions.some((c: any) => c.slug?.equals === 'hello')).toBe(true)
    expect(publicFilterIn(conditions).and.some((c: any) => c.publishedAt?.less_than_equal)).toBe(true)
  })

  it('getPostBySlug returns null when not found', async () => {
    mockFind.mockResolvedValue({ docs: [], totalDocs: 0, totalPages: 0 })
    const result = await getPostBySlug('nope')
    expect(result).toBeNull()
  })
})

describe('posts accessor — filter options', () => {
  it('getPosts adds category filter when provided', async () => {
    await getPosts({ category: 'guides' })
    const conditions: object[] = findCall().where.and
    expect(conditions.some((c: any) => c.category?.equals === 'guides')).toBe(true)
  })

  it('getPosts adds featured filter when true', async () => {
    await getPosts({ featured: true })
    const conditions: object[] = findCall().where.and
    expect(conditions.some((c: any) => c.featured?.equals === true)).toBe(true)
  })

  it('getPosts adds tag filter using array element match', async () => {
    await getPosts({ tag: 'dali' })
    const conditions: object[] = findCall().where.and
    // Tag is matched on the nested `tags.tag` path
    expect(conditions.some((c: any) => c['tags.tag']?.equals === 'dali')).toBe(true)
  })

  it('getPostsByCategory uses the category arg', async () => {
    await getPostsByCategory('industry', { limit: 5 })
    const conditions: object[] = findCall().where.and
    expect(conditions.some((c: any) => c.category?.equals === 'industry')).toBe(true)
    expect(findCall().limit).toBe(5)
  })

  it('getPostsByTag uses the tag arg', async () => {
    await getPostsByTag('led-strip')
    const conditions: object[] = findCall().where.and
    expect(conditions.some((c: any) => c['tags.tag']?.equals === 'led-strip')).toBe(true)
  })
})

describe('getRelatedPosts', () => {
  it('queries same category, excludes current id, defaults limit 3', async () => {
    await getRelatedPosts({ id: 7, category: 'guides' } as Pick<Post, 'id' | 'category'>)
    const call = findCall()
    const conditions: object[] = call.where.and
    expect(conditions.some((c: any) => c.category?.equals === 'guides')).toBe(true)
    expect(conditions.some((c: any) => c.id?.not_equals === 7)).toBe(true)
    expect(call.limit).toBe(3)
  })
})

describe('getAllSlugs', () => {
  it('returns just slug strings', async () => {
    mockFind.mockResolvedValue({
      docs: [{ slug: 'a' }, { slug: 'b' }],
      totalDocs: 2,
      totalPages: 1,
    })
    const result = await getAllSlugs()
    expect(result).toEqual(['a', 'b'])
  })

  it('paginates internally to 500 limit (smoke check)', async () => {
    await getAllSlugs()
    expect(findCall().limit).toBe(500)
  })

  it('passes the public filter (published + publishedAt) directly', async () => {
    await getAllSlugs()
    const where = findCall().where
    expect(where.and.some((c: any) => c._status?.equals === 'published')).toBe(true)
    expect(where.and.some((c: any) => c.publishedAt?.less_than_equal)).toBe(true)
  })
})
