'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { cn } from '@/lib/utils'
import { PURCHASE_CHANNELS, type PurchaseChannel } from '@/data/purchase-channels'

const STORAGE_KEY = 'envo-c-sidebar-collapsed'
const REGION_STORAGE_KEY = 'envo-region'
const REGION_DEFAULT: PurchaseChannel['id'] = 'nz-ap'

// Short display labels for the sidebar foot — purchase-channels.ts holds long
// regionLabel strings that don't fit the narrow row.
const REGION_LABELS: Record<PurchaseChannel['id'], { short: string; meta: string }> = {
  'nz-ap': {
    short: 'Oceania',
    meta: 'NZ · Australia · Pacific Islands · via wellforces.co.nz',
  },
  'us-global': {
    short: 'International',
    meta: 'US · Americas · EMEA · Asia · via powersupplymall.com',
  },
}

const subscribeCollapsed = (cb: () => void) => {
  window.addEventListener('envo-sidebar-change', cb)
  window.addEventListener('storage', cb)
  return () => {
    window.removeEventListener('envo-sidebar-change', cb)
    window.removeEventListener('storage', cb)
  }
}
const getCollapsedSnapshot = () => window.localStorage.getItem(STORAGE_KEY) === '1'
const getCollapsedServerSnapshot = () => false

type NavItem = {
  section: string
  href: string
  label: string
  icon: React.ReactNode
}

const NAVIGATE: NavItem[] = [
  {
    section: 'home',
    href: '/',
    label: 'Home',
    icon: (
      <svg className="sidebar-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 12l9-9 9 9" />
        <path d="M5 10v10h14V10" />
      </svg>
    ),
  },
  {
    section: 'products',
    href: '/products',
    label: 'Products',
    icon: (
      <svg className="sidebar-icon" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    section: 'solutions',
    href: '/solutions',
    label: 'Solutions',
    icon: (
      <svg className="sidebar-icon" viewBox="0 0 24 24" aria-hidden="true">
        <polygon points="12,2 22,8 12,14 2,8" />
        <polyline points="2,14 12,20 22,14" />
      </svg>
    ),
  },
  {
    section: 'projects',
    href: '/projects',
    label: 'Projects',
    icon: (
      <svg className="sidebar-icon" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="7" width="18" height="14" rx="2" />
        <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
      </svg>
    ),
  },
  {
    section: 'blog',
    href: '/blog',
    label: 'Blog',
    icon: (
      <svg className="sidebar-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 19V5a2 2 0 0 1 2-2h11l3 3v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </svg>
    ),
  },
  {
    section: 'resources',
    href: '/resources',
    label: 'Resources',
    icon: (
      <svg className="sidebar-icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9a2.5 2.5 0 015 0c0 2-2.5 2-2.5 4" />
        <circle cx="12" cy="17" r="0.5" />
      </svg>
    ),
  },
]

const TOOLS: NavItem[] = [
  {
    section: 'find-your-match',
    href: '/find-your-match',
    label: 'Find your match',
    icon: (
      <svg className="sidebar-icon" viewBox="0 0 24 24" aria-hidden="true">
        <polygon points="13,2 4,14 12,14 11,22 20,10 12,10 13,2" />
      </svg>
    ),
  },
  {
    section: 'free-layout-design',
    href: '/free-layout-design',
    label: 'Free layout design',
    icon: (
      <svg className="sidebar-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 19l7-7 3 3-7 7-3-3z" />
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      </svg>
    ),
  },
]

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(href + '/')
}

export function Sidebar() {
  const pathname = usePathname()
  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    getCollapsedSnapshot,
    getCollapsedServerSnapshot,
  )
  const [open, setOpen] = useState(false)
  const [region, setRegion] = useState<PurchaseChannel['id']>(REGION_DEFAULT)
  const [regionOpen, setRegionOpen] = useState(false)
  const sidebarRef = useRef<HTMLElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const regionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.body.classList.toggle('sidebar-collapsed', collapsed)
    return () => document.body.classList.remove('sidebar-collapsed')
  }, [collapsed])

  // Hydrate region from localStorage after mount (avoids SSR mismatch).
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(REGION_STORAGE_KEY)
      if (saved === 'nz-ap' || saved === 'us-global') {
        setRegion(saved)
      }
    } catch {}
  }, [])

  // Close the region dropdown when clicking outside it.
  useEffect(() => {
    if (!regionOpen) return
    const onDocClick = (e: MouseEvent) => {
      if (regionRef.current && !regionRef.current.contains(e.target as Node)) {
        setRegionOpen(false)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [regionOpen])

  const pickRegion = useCallback((id: PurchaseChannel['id']) => {
    setRegion(id)
    setRegionOpen(false)
    try {
      window.localStorage.setItem(REGION_STORAGE_KEY, id)
    } catch {}
  }, [])

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(target) &&
        toggleRef.current &&
        !toggleRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [open])

  const toggleCollapsed = useCallback(() => {
    const next = !getCollapsedSnapshot()
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
    } catch {}
    window.dispatchEvent(new Event('envo-sidebar-change'))
  }, [])

  const renderItems = (items: NavItem[]) =>
    items.map((item) => (
      <Link
        key={item.section}
        href={item.href}
        className={cn('sidebar-link', isActive(pathname, item.href) && 'active')}
        data-section={item.section}
        onClick={() => setOpen(false)}
      >
        {item.icon}
        <span className="sidebar-label">{item.label}</span>
      </Link>
    ))

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        className="mobile-menu-toggle"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-controls="sidebar"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <aside
        ref={sidebarRef}
        id="sidebar"
        className={cn('sidebar', open && 'open')}
        aria-label="Primary navigation"
      >
        <div className="sidebar-inner">
          <Link href="/" className="sidebar-logo" aria-label="ENVO home" onClick={() => setOpen(false)}>
            <Image
              className="logo-full"
              src="/assets/images/logo-envo-darkbg.svg"
              alt="ENVO"
              width={108}
              height={20}
              priority
            />
            <Image
              className="logo-mark"
              src="/assets/images/favicon.svg"
              alt=""
              width={36}
              height={36}
              priority
              aria-hidden
            />
          </Link>

          <nav className="sidebar-nav">
            <div className="sidebar-section">
              {renderItems(NAVIGATE)}
            </div>
            <div className="sidebar-section">
              <div className="sidebar-section-title">Tools</div>
              {renderItems(TOOLS)}
            </div>
          </nav>

          <div className="sidebar-footer">
            <div
              ref={regionRef}
              className={cn('sidebar-region-wrap', regionOpen && 'open')}
            >
              <button
                type="button"
                className="sidebar-region"
                aria-haspopup="listbox"
                aria-expanded={regionOpen}
                aria-label={`Region: ${REGION_LABELS[region].short}. Click to change.`}
                onClick={(e) => {
                  e.stopPropagation()
                  setRegionOpen((o) => !o)
                }}
              >
                <span className="sidebar-region-flag" aria-hidden="true">
                  {PURCHASE_CHANNELS.find((c) => c.id === region)?.flag}
                </span>
                <span className="sidebar-region-label">{REGION_LABELS[region].short}</span>
                <svg
                  className={cn('sidebar-region-caret', regionOpen && 'flip')}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {regionOpen && (
                <div className="sidebar-region-dropdown" role="listbox">
                  <div className="sidebar-region-dropdown-head">Shipping region</div>
                  {PURCHASE_CHANNELS.map((channel) => {
                    const active = channel.id === region
                    const labels = REGION_LABELS[channel.id]
                    return (
                      <button
                        key={channel.id}
                        type="button"
                        role="option"
                        aria-selected={active}
                        className={cn('sidebar-region-option', active && 'active')}
                        onClick={() => pickRegion(channel.id)}
                      >
                        <span className="sidebar-region-option-flag" aria-hidden="true">
                          {channel.flag}
                        </span>
                        <span className="sidebar-region-option-body">
                          <span className="sidebar-region-option-name">{labels.short}</span>
                          <span className="sidebar-region-option-meta">{labels.meta}</span>
                        </span>
                        {active && (
                          <span className="sidebar-region-option-check" aria-hidden="true">✓</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              className="sidebar-collapse-btn"
              aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
              aria-pressed={collapsed}
              onClick={toggleCollapsed}
            >
              <svg className="sidebar-collapse-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 6l-6 6 6 6" />
              </svg>
              <span className="sidebar-collapse-label">Collapse</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
