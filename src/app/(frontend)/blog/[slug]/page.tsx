import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPostBySlug, getAllSlugs, getRelatedPosts, type Post } from '@/lib/posts'
import { PostHeader } from '@/components/blog/PostHeader'
import { PostCard } from '@/components/blog/PostCard'
import { RichTextRenderer } from '@/components/blog/RichTextRenderer'
import { SITE_URL } from '@/lib/site-url'

export const revalidate = 3600

const CATEGORY_LABEL: Record<string, string> = {
  guides: 'Guides',
  tech_insights: 'Tech Insights',
  company_news: 'Company News',
  industry: 'Industry',
}

function coverData(cover: Post['cover']): { url: string; alt?: string } | null {
  if (typeof cover === 'number' || !cover?.url) return null
  return { url: cover.url, alt: cover.alt }
}

/** Article (BlogPosting) JSON-LD. Media URLs are relative in the app
 *  (media-url.ts strips the origin for next/image) — schema.org requires
 *  absolute, so everything is re-anchored on SITE_URL here. Posts have no
 *  personal byline, so author = publisher = the ENVO organisation. */
function articleJsonLd(post: Post, slug: string): string {
  const abs = (u: string) => (u.startsWith('http') ? u : `${SITE_URL}${u}`)
  const cover = coverData(post.cover)
  const og = typeof post.ogImage === 'object' && post.ogImage?.url ? post.ogImage.url : null
  const image = og ?? cover?.url ?? null
  const org = { '@type': 'Organization', name: 'ENVO', url: SITE_URL }
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    ...(image ? { image: [abs(image)] } : {}),
    author: org,
    publisher: {
      ...org,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/assets/images/logo-envo.png` },
    },
    datePublished: post.publishedAt,
    // dateModified must never precede datePublished (scheduled posts are
    // saved, then publish later without another edit).
    dateModified: post.updatedAt > post.publishedAt ? post.updatedAt : post.publishedAt,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${slug}` },
  }
  // <-escape so a "</script>" inside content can't break out of the tag.
  return JSON.stringify(jsonLd).replace(/</g, '\\u003c')
}

export async function generateStaticParams() {
  const slugs = await getAllSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return {}
  const ogImg =
    typeof post.ogImage === 'object' && post.ogImage?.url
      ? post.ogImage.url
      : typeof post.cover === 'object'
        ? post.cover?.url
        : undefined
  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    openGraph: ogImg ? { images: [{ url: ogImg }] } : undefined,
    alternates: { canonical: `/blog/${slug}` },
  }
}

export default async function PostDetailPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const related = await getRelatedPosts(post)
  const cover = coverData(post.cover)
  const categoryLabel = CATEGORY_LABEL[post.category] ?? post.category

  return (
    <div className="theme-light" style={{ minHeight: '100vh', background: '#f4f5f7', color: '#1a2332' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: articleJsonLd(post, slug) }}
      />
      {/* Sticky subnav */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '0 56px',
          borderBottom: '1px solid #e2e5ea',
          backdropFilter: 'blur(20px)',
          background: 'rgba(244,245,247,0.92)',
          fontSize: '13px',
        }}
      >
        <Link href="/" style={{ color: '#6a7a8a', fontWeight: 500, textDecoration: 'none' }}>ENVO</Link>
        <span style={{ color: '#6a7a8a', opacity: 0.4 }}>/</span>
        <Link href="/blog" style={{ color: '#6a7a8a', fontWeight: 500, textDecoration: 'none' }}>Blog</Link>
        <span style={{ color: '#6a7a8a', opacity: 0.4 }}>/</span>
        <span
          style={{
            color: '#1a2332',
            fontWeight: 600,
            maxWidth: '360px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {post.title}
        </span>
      </div>

      {/* Back link */}
      <div style={{ padding: '40px 56px 0' }}>
        <Link
          href="/blog"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            color: '#0071bc',
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          ← All articles
        </Link>
      </div>

      <PostHeader post={post} />

      {/* Cover image */}
      {cover && (
        <div style={{ margin: '0 0 48px', padding: '0 56px' }}>
          <div
            style={{
              position: 'relative',
              borderRadius: '18px',
              overflow: 'hidden',
              aspectRatio: '16 / 8',
              background: '#e8ecf2',
            }}
          >
            <Image
              src={cover.url}
              alt={cover.alt || post.title}
              fill
              priority
              sizes="(min-width: 1100px) 900px, 100vw"
              style={{ objectFit: 'cover' }}
            />
          </div>
        </div>
      )}

      {/* Article body — prose styles in envo.css */}
      <article className="blog-article-body">
        <RichTextRenderer doc={post.body} />
      </article>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div
          style={{
            maxWidth: '820px',
            margin: '16px auto 0',
            padding: '24px 56px 32px',
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            borderTop: '1px solid #e2e5ea',
          }}
        >
          {post.tags.map((t, i) => (
            <Link
              key={i}
              href={`/blog/tag/${t.tag}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '6px 14px',
                background: '#ffffff',
                border: '1px solid #e2e5ea',
                borderRadius: '999px',
                fontSize: '12.5px',
                color: '#4a5568',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ color: '#6a7a8a', marginRight: '3px' }}>#</span>
              {t.tag}
            </Link>
          ))}
        </div>
      )}

      {/* Related posts */}
      {related.length > 0 && (
        <section
          style={{
            margin: '24px 0 0',
            padding: '56px 56px 64px',
            borderTop: '1px solid #e2e5ea',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              padding: '0',
              marginBottom: '24px',
            }}
          >
            <h2
              className="font-bold"
              style={{ fontSize: '24px', letterSpacing: '-0.015em', margin: 0 }}
            >
              More from {categoryLabel}
            </h2>
            <Link
              href={`/blog/category/${post.category}`}
              style={{ fontSize: '13px', color: '#0071bc', fontWeight: 500, textDecoration: 'none' }}
            >
              View all {categoryLabel} →
            </Link>
          </div>
          <div className="bi-grid">
            {related.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
