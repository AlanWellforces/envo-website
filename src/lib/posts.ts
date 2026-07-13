// Server-only — never import this from a client component.
// All functions use the Payload local API (no HTTP, no auth required).
// Every read goes through this module so the publishedAt <= now filter is
// applied centrally. Route handlers and components must NOT call
// payload.find({ collection: 'posts' }) directly.

import { getPayload, type Where } from 'payload'
import config from '@/payload.config'
import { relativeMediaUrl } from './media-url'

export type PostCategory =
  | 'guides'
  | 'tech_insights'
  | 'company_news'
  | 'industry'

export type Post = {
  id: number
  title: string
  slug: string
  excerpt: string
  cover: { url?: string; alt?: string } | number
  body: unknown // Lexical JSON
  category: PostCategory
  tags: { tag: string }[]
  publishedAt: string // ISO
  featured: boolean
  seoTitle: string | null
  seoDescription: string | null
  ogImage: { url?: string; alt?: string } | number | null
  readingTime: number | null
  _status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
}

async function payload() {
  return getPayload({ config })
}

/**
 * On prod Payload has a serverURL, so populated media come back with ABSOLUTE
 * urls — which next/image rejects (remotePatterns) and broke every blog cover
 * on the live site. Rewrite them to relative paths once, centrally, so no
 * consumer has to remember to. See src/lib/media-url.ts for the full story.
 */
function normalizeMediaUrls(doc: Post): Post {
  for (const media of [doc.cover, doc.ogImage]) {
    if (media && typeof media === 'object' && media.url) {
      media.url = relativeMediaUrl(media.url) ?? media.url
    }
  }
  return doc
}

/**
 * Filter applied to every public read: published only, and not future-dated.
 * The explicit _status condition is required — Payload's local find() does NOT
 * exclude drafts by itself (the `draft` option only controls version merging),
 * so without it an unpublished post keeps showing on /blog.
 */
function dateFilter(): Where {
  return {
    and: [
      { _status: { equals: 'published' } },
      { publishedAt: { less_than_equal: new Date().toISOString() } },
    ],
  }
}

export type GetPostsOpts = {
  limit?: number
  page?: number
  category?: PostCategory
  tag?: string
  featured?: boolean
}

/** Paginated list of posts. Featured-first ordering only when featured filter is set. */
export async function getPosts(opts: GetPostsOpts = {}): Promise<{
  docs: Post[]
  totalDocs: number
  totalPages: number
}> {
  const p = await payload()
  const conditions: Where[] = [dateFilter()]
  if (opts.category) conditions.push({ category: { equals: opts.category } })
  if (opts.tag) conditions.push({ 'tags.tag': { equals: opts.tag } })
  // Truthy-only guard: `featured: false` means "don't filter", not "non-featured".
  if (opts.featured) conditions.push({ featured: { equals: true } })

  const result = await p.find({
    collection: 'posts',
    where: { and: conditions },
    sort: '-publishedAt',
    limit: opts.limit ?? 12,
    page: opts.page ?? 1,
    depth: 1,
  })

  return {
    docs: (result.docs as unknown as Post[]).map(normalizeMediaUrls),
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
  }
}

/** Single post by slug. Returns null if not found or scheduled for the future. */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const p = await payload()
  const result = await p.find({
    collection: 'posts',
    where: { and: [{ slug: { equals: slug } }, dateFilter()] },
    limit: 1,
    depth: 1,
  })
  const doc = (result.docs[0] as unknown as Post) ?? null
  return doc ? normalizeMediaUrls(doc) : null
}

export async function getPostsByCategory(
  category: PostCategory,
  opts: { limit?: number } = {},
): Promise<Post[]> {
  const p = await payload()
  const result = await p.find({
    collection: 'posts',
    where: { and: [{ category: { equals: category } }, dateFilter()] },
    sort: '-publishedAt',
    limit: opts.limit ?? 24,
    depth: 1,
  })
  return (result.docs as unknown as Post[]).map(normalizeMediaUrls)
}

export async function getPostsByTag(
  tag: string,
  opts: { limit?: number } = {},
): Promise<Post[]> {
  const p = await payload()
  const result = await p.find({
    collection: 'posts',
    where: { and: [{ 'tags.tag': { equals: tag } }, dateFilter()] },
    sort: '-publishedAt',
    limit: opts.limit ?? 24,
    depth: 1,
  })
  return (result.docs as unknown as Post[]).map(normalizeMediaUrls)
}

/** Same-category posts, excluding the supplied post. Default 3. */
export async function getRelatedPosts(
  post: Pick<Post, 'id' | 'category'>,
  opts: { limit?: number } = {},
): Promise<Post[]> {
  const p = await payload()
  const result = await p.find({
    collection: 'posts',
    where: {
      and: [
        { category: { equals: post.category } },
        { id: { not_equals: post.id } },
        dateFilter(),
      ],
    },
    sort: '-publishedAt',
    limit: opts.limit ?? 3,
    depth: 1,
  })
  return (result.docs as unknown as Post[]).map(normalizeMediaUrls)
}

/** Counts per category + total. Powers the filter chips on /blog. */
export async function getPostCounts(): Promise<{
  all: number
  guides: number
  tech_insights: number
  company_news: number
  industry: number
}> {
  const p = await payload()
  const cats: PostCategory[] = ['guides', 'tech_insights', 'company_news', 'industry']
  // Sequential on purpose — the dev/prod DB sits behind a small shared
  // connection pool, and firing 5 count queries at once (on top of the page's
  // getPosts) has produced transient connection errors. Counts are tiny and
  // ISR-cached, so latency is a non-issue.
  const all = await p.find({ collection: 'posts', where: dateFilter(), limit: 0, depth: 0 })
  const byCat: number[] = []
  for (const c of cats) {
    const r = await p.find({
      collection: 'posts',
      where: { and: [{ category: { equals: c } }, dateFilter()] },
      limit: 0,
      depth: 0,
    })
    byCat.push(r.totalDocs)
  }
  const [guides, tech, news, industry] = byCat
  return {
    all: all.totalDocs,
    guides,
    tech_insights: tech,
    company_news: news,
    industry,
  }
}

/** All published slugs — feeds generateStaticParams on /blog/[slug]. */
export async function getAllSlugs(): Promise<string[]> {
  const p = await payload()
  const result = await p.find({
    collection: 'posts',
    where: dateFilter(),
    limit: 500,
    depth: 0,
  })
  return (result.docs as unknown as { slug: string }[]).map((d) => d.slug)
}
