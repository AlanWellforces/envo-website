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
import {
  getProjects,
  getProjectBySlug,
  getRelatedProjects,
  getAllProjectSlugs,
  INDUSTRY_LABELS,
} from './projects'

beforeEach(() => {
  mockFind.mockReset()
  mockFind.mockResolvedValue({ docs: [], totalDocs: 0, totalPages: 0 })
})

function findCall() {
  return mockFind.mock.calls[0][0]
}

describe('INDUSTRY_LABELS', () => {
  it('exposes a label for every industry value', () => {
    expect(INDUSTRY_LABELS.retail).toBe('Retail')
    expect(INDUSTRY_LABELS.hotel).toBe('Hotel & Hospitality')
    expect(INDUSTRY_LABELS.storefront).toBe('Storefront')
    expect(INDUSTRY_LABELS.architectural).toBe('Architectural Facade')
    expect(INDUSTRY_LABELS.canopy).toBe('Canopy')
    expect(INDUSTRY_LABELS.other).toBe('Other')
  })
})

describe('getProjects — filters', () => {
  it('always filters to published status', async () => {
    await getProjects({})
    const call = findCall()
    expect(call.collection).toBe('projects')
    expect(call.where._status?.equals).toBe('published')
  })

  it('matches industry with `contains` (multi-select)', async () => {
    await getProjects({ industry: 'retail' })
    expect(findCall().where.industry?.contains).toBe('retail')
  })

  it('matches tag on the nested tags.tag path', async () => {
    await getProjects({ tag: 'facade' })
    expect(findCall().where['tags.tag']?.equals).toBe('facade')
  })

  it('adds featured filter when true', async () => {
    await getProjects({ featured: true })
    expect(findCall().where.featured?.equals).toBe(true)
  })

  it('excludes a slug when excludeSlug provided', async () => {
    await getProjects({ excludeSlug: 'foo' })
    expect(findCall().where.slug?.not_equals).toBe('foo')
  })
})

describe('getProjectBySlug', () => {
  it('filters by slug AND published status', async () => {
    mockFind.mockResolvedValue({ docs: [{ id: 1, slug: 'hello' }], totalDocs: 1 })
    await getProjectBySlug('hello')
    const where = findCall().where
    expect(where.slug?.equals).toBe('hello')
    expect(where._status?.equals).toBe('published')
  })

  it('returns null when not found', async () => {
    mockFind.mockResolvedValue({ docs: [], totalDocs: 0 })
    expect(await getProjectBySlug('nope')).toBeNull()
  })
})

describe('getRelatedProjects', () => {
  it('queries same industry, excludes current slug, defaults limit 3', async () => {
    await getRelatedProjects('hotel', 'current-slug')
    const call = findCall()
    expect(call.where.industry?.contains).toBe('hotel')
    expect(call.where.slug?.not_equals).toBe('current-slug')
    expect(call.limit).toBe(3)
  })
})

describe('getAllProjectSlugs', () => {
  it('returns just slug strings', async () => {
    mockFind.mockResolvedValue({ docs: [{ slug: 'a' }, { slug: 'b' }], totalDocs: 2 })
    expect(await getAllProjectSlugs()).toEqual(['a', 'b'])
  })

  it('uses a 500 limit with pagination disabled', async () => {
    await getAllProjectSlugs()
    expect(findCall().limit).toBe(500)
    expect(findCall().pagination).toBe(false)
  })
})
