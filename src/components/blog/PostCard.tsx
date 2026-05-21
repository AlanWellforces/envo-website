// Placeholder layout — Mackenzie replaces with final design later.

import Link from 'next/link'
import type { Post } from '@/lib/posts'

const CATEGORY_LABEL: Record<string, string> = {
  guides: 'Guides',
  tech_insights: 'Tech Insights',
  company_news: 'Company News',
  industry: 'Industry',
}

function coverUrl(cover: Post['cover']): string | null {
  if (typeof cover === 'number') return null
  return cover?.url ?? null
}

export function PostCard({ post }: { post: Post }) {
  const img = coverUrl(post.cover)
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="block border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition"
    >
      {img && (
        <div className="aspect-[16/9] bg-slate-100 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4">
        <div className="text-xs uppercase tracking-wide text-slate-500">
          {CATEGORY_LABEL[post.category] ?? post.category}
        </div>
        <h3 className="mt-2 font-semibold text-lg leading-tight">{post.title}</h3>
        <p className="mt-2 text-sm text-slate-600 line-clamp-2">{post.excerpt}</p>
        <div className="mt-3 text-xs text-slate-500">
          {new Date(post.publishedAt).toLocaleDateString()} · {post.readingTime ?? 1} min read
        </div>
      </div>
    </Link>
  )
}
