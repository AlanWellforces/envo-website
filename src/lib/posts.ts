// Server-only — never import this from a client component.
// All functions use the Payload local API (no HTTP, no auth required).
// Every read goes through this module so the publishedAt <= now filter is
// applied centrally. Route handlers and components must NOT call
// payload.find({ collection: 'posts' }) directly.

import { getPayload } from 'payload'
import config from '@/payload.config'

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
 * Date filter applied to every public read. Future-dated posts (publishedAt in
 * the future) do not appear on the public site even when their _status is
 * 'published'. Payload's drafts behavior already hides _status='draft' from
 * default reads, so we don't add an explicit _status filter here.
 */
function dateFilter(): object {
  return { publishedAt: { less_than_equal: new Date().toISOString() } }
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
  const conditions: object[] = [dateFilter()]
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
    docs: result.docs as unknown as Post[],
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
  return (result.docs[0] as unknown as Post) ?? null
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
  return result.docs as unknown as Post[]
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
  return result.docs as unknown as Post[]
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
  return result.docs as unknown as Post[]
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
