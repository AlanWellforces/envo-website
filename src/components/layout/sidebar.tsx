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
  /** When set, the item is rendered with a caret toggle + inline child list. */
  children?: { slug: string; href: string; label: string }[]
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
    children: [
      { slug: 'led-signage-modules', href: '/products/led-signage-modules', label: 'Signage Modules' },
      { slug: 'led-drivers', href: '/products/led-drivers', label: 'LED Drivers' },
      { slug: 'control-gear', href: '/products/control-gear', label: 'Control Gear' },
      { slug: 'accessories', href: '/products/accessories', label: 'Accessories' },
    ],
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
  // Projects hidden until we have real installs to show (only seeded demos exist).
  // Route + data + Payload collection remain intact — restore this entry to re-expose.
  // {
  //   section: 'projects',
  //   href: '/projects',
  //   label: 'Projects',
  //   icon: (
  //     <svg className="sidebar-icon" viewBox="0 0 24 24" aria-hidden="true">
  //       <rect x="3" y="7" width="18" height="14" rx="2" />
  //       <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
  //     </svg>
  //   ),
  // },
  {
    section: 'resources',
    href: '/resources',
    label: 'Resources',
    icon: (
      <svg className="sidebar-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 7v14" />
        <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
      </svg>
    ),
  },
  {
    section: 'contact',
    href: '/contact',
    label: 'Contact',
    icon: (
      <svg className="sidebar-icon" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M2 7l10 6 10-6" />
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
    section: 'product-selector',
    href: '/resources/tools/signage-selector',
    label: 'Product selector',
    icon: (
      <svg className="sidebar-icon" viewBox="0 0 24 24" aria-hidden="true">
        <line x1="4" y1="8" x2="20" y2="8" />
        <circle cx="9" cy="8" r="2" />
        <line x1="4" y1="16" x2="20" y2="16" />
        <circle cx="15" cy="16" r="2" />
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
  // Track which parent groups are user-expanded. Parent groups start expanded
  // so their sub-categories are always surfaced in the sidebar; the active
  // route still auto-expands its group, and users can manually toggle any.
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(NAVIGATE.filter((i) => i.children).map((i) => i.section)),
  )
  const sidebarRef = useRef<HTMLElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const regionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.body.classList.toggle('sidebar-collapsed', collapsed)
    return () => document.body.classList.remove('sidebar-collapsed')
  }, [collapsed])

  // Auto-expand any parent group whose route the user is currently inside.
  useEffect(() => {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      let changed = false
      for (const item of NAVIGATE) {
        if (item.children && isActive(pathname, item.href) && !next.has(item.section)) {
          next.add(item.section)
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [pathname])

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

  const toggleGroup = (section: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(section)) next.delete(section)
      else next.add(section)
      return next
    })

  // After click navigation, blur the link so the collapsed-mode flyout's
  // `:focus-within` doesn't keep it open when the mouse leaves.
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    setOpen(false)
    e.currentTarget.blur()
  }

  const renderItems = (items: NavItem[]) =>
    items.map((item) => {
      // Leaf — no children. `data-tooltip` powers the collapsed-sidebar
      // hover label (CSS-only ::after). Parent group links skip this since
      // they have a richer flyout that already names the category.
      if (!item.children) {
        return (
          <Link
            key={item.section}
            href={item.href}
            className={cn('sidebar-link', isActive(pathname, item.href) && 'active')}
            data-section={item.section}
            data-tooltip={item.label}
            onClick={handleNavClick}
          >
            {item.icon}
            <span className="sidebar-label">{item.label}</span>
          </Link>
        )
      }

      // Parent group — link to the overview page + separate caret toggle.
      // Parent row is "active" only when the user is on the exact /products
      // catalog page; child links handle deeper /products/<family> highlights.
      const groupOpen = openGroups.has(item.section)
      const parentActive = pathname === item.href
      return (
        <div
          key={item.section}
          className={cn('sidebar-group', groupOpen && 'open')}
        >
          <div className="sidebar-group-row">
            <Link
              href={item.href}
              className={cn('sidebar-link', parentActive && 'active')}
              data-section={item.section}
              onClick={handleNavClick}
            >
              {item.icon}
              <span className="sidebar-label">{item.label}</span>
            </Link>
            <button
              type="button"
              className="sidebar-group-caret-btn"
              aria-label={groupOpen ? `Collapse ${item.label}` : `Expand ${item.label}`}
              aria-expanded={groupOpen}
              onClick={() => toggleGroup(item.section)}
            >
              <svg className="sidebar-caret" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </div>
          <ul
            className="sidebar-sub"
            role="list"
            data-parent-label={item.label}
          >
            {item.children.map((c) => (
              <li key={c.slug}>
                <Link
                  href={c.href}
                  className={cn('sidebar-sublink', isActive(pathname, c.href) && 'active')}
                  onClick={handleNavClick}
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )
    })

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
