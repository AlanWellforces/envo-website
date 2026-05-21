// Placeholder layout — Mackenzie replaces with final design later.

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

export function PostHeader({ post }: { post: Post }) {
  const img = coverUrl(post.cover)
  return (
    <header className="mb-8">
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {CATEGORY_LABEL[post.category] ?? post.category}
      </div>
      <h1 className="mt-2 text-3xl md:text-4xl font-bold leading-tight">{post.title}</h1>
      <p className="mt-3 text-lg text-slate-600">{post.excerpt}</p>
      <div className="mt-4 text-sm text-slate-500">
        ENVO Team · {new Date(post.publishedAt).toLocaleDateString()} · {post.readingTime ?? 1} min read
      </div>
      {img && (
        <div className="mt-6 aspect-[2/1] bg-slate-100 overflow-hidden rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt="" className="w-full h-full object-cover" />
        </div>
      )}
    </header>
  )
}
