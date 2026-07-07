import Link from 'next/link'
import type { PostCategory } from '@/lib/posts'

type Chip = {
  label: string
  href: string
  value: PostCategory | 'all'
  count: number
}

export function FilterChips({
  counts,
  active = 'all',
}: {
  counts: { all: number; guides: number; tech_insights: number; company_news: number; industry: number }
  active?: PostCategory | 'all'
}) {
  const chips: Chip[] = [
    { label: 'All',           href: '/blog',                        value: 'all',           count: counts.all },
    { label: 'Guides',        href: '/blog/category/guides',        value: 'guides',        count: counts.guides },
    { label: 'Tech Insights', href: '/blog/category/tech_insights', value: 'tech_insights', count: counts.tech_insights },
    { label: 'Company News',  href: '/blog/category/company_news',  value: 'company_news',  count: counts.company_news },
    { label: 'Industry',      href: '/blog/category/industry',      value: 'industry',      count: counts.industry },
  ]

  return (
    <nav
      aria-label="Filter by category"
      style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '0 0 24px' }}
    >
      {chips.map((chip) => {
        const isActive = chip.value === active
        return (
          <Link
            key={chip.value}
            href={chip.href}
            className="font-medium"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '9px 18px',
              borderRadius: '999px',
              fontSize: '13.5px',
              letterSpacing: '-0.005em',
              transition: 'all 0.15s',
              background: isActive ? '#0071bc' : '#ffffff',
              color: isActive ? '#ffffff' : '#4a5568',
              border: isActive ? '1px solid #0071bc' : '1px solid #e2e5ea',
            }}
          >
            {chip.label}
            <span
              style={{
                marginLeft: '8px',
                opacity: 0.55,
                fontVariantNumeric: 'tabular-nums',
                fontSize: '12px',
              }}
            >
              {chip.count}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
