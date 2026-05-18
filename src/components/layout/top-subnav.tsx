'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { PRODUCT_FAMILIES } from '@/data/product-families'
import { cn } from '@/lib/utils'

/**
 * Section-aware top bar.
 * - On /products/* — shows the 4 product categories as a sub menu.
 * - Elsewhere — slides out of view (CSS .top-subnav.hidden).
 * Body gets .has-topsubnav while visible so the 43 px header reserve
 * doesn't leak onto pages without a sub menu.
 */
export function TopSubnav() {
  const pathname = usePathname()
  const visible = pathname.startsWith('/products')

  useEffect(() => {
    document.body.classList.toggle('has-topsubnav', visible)
    return () => document.body.classList.remove('has-topsubnav')
  }, [visible])

  return (
    <div className={cn('top-subnav', !visible && 'hidden')} aria-hidden={!visible}>
      <div className="top-subnav-inner">
        <div className="top-subnav-primary">
          <span className="top-subnav-eyebrow">Categories</span>
          <ul className="top-subnav-list">
            {PRODUCT_FAMILIES.map((f) => {
              const active = pathname === f.href || pathname.startsWith(f.href + '/')
              return (
                <li key={f.slug}>
                  <Link
                    href={f.href}
                    className={cn('top-subnav-link', active && 'active')}
                    aria-current={active ? 'page' : undefined}
                  >
                    {f.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}
