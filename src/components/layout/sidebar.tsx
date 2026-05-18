'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'envo-c-sidebar-collapsed'

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

const NAV = [
  {
    section: 'home',
    href: '/',
    label: 'Home',
    icon: (
      <svg className="sidebar-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 12l9-9 9 9" />
        <path d="M5 10v10h14V10" />
        <path d="M10 20v-6h4v6" />
      </svg>
    ),
  },
  {
    section: 'products',
    href: '/products',
    label: 'Product',
    icon: (
      <svg className="sidebar-icon" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
      </svg>
    ),
  },
  {
    section: 'solutions',
    href: '/solutions',
    label: 'Solutions',
    icon: (
      <svg className="sidebar-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M12 2a7 7 0 0 0-4 12.6A4.5 4.5 0 0 1 9 18h6a4.5 4.5 0 0 1 1-3.4A7 7 0 0 0 12 2z" />
      </svg>
    ),
  },
  {
    section: 'projects',
    href: '/projects',
    label: 'Project',
    icon: (
      <svg className="sidebar-icon" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    ),
  },
  {
    section: 'support',
    href: '/support',
    label: 'Support',
    icon: (
      <svg className="sidebar-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <path d="M21 19a2 2 0 0 1-2 2h-1v-6h3v4z" />
        <path d="M3 19a2 2 0 0 0 2 2h1v-6H3v4z" />
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
  const sidebarRef = useRef<HTMLElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    document.body.classList.toggle('sidebar-collapsed', collapsed)
    return () => document.body.classList.remove('sidebar-collapsed')
  }, [collapsed])

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
              src="/assets/images/logo-envo-darkbg.svg"
              alt="ENVO"
              width={108}
              height={20}
              priority
            />
          </Link>

          <nav className="sidebar-nav">
            <div className="sidebar-section">
              {NAV.map((item) => (
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
              ))}
            </div>
          </nav>

          <div className="sidebar-footer">
            <Link
              href="/find-your-match"
              className="sidebar-cta"
              aria-label="Find your match — product wizard"
              onClick={() => setOpen(false)}
            >
              <svg className="sidebar-cta-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3 L13.5 8 L18 9.5 L13.5 11 L12 16 L10.5 11 L6 9.5 L10.5 8 Z" />
                <path d="M19 14 L19.7 16 L21.5 16.7 L19.7 17.4 L19 19.5 L18.3 17.4 L16.5 16.7 L18.3 16 Z" />
                <path d="M5 16 L5.5 17.5 L7 18 L5.5 18.5 L5 20 L4.5 18.5 L3 18 L4.5 17.5 Z" />
              </svg>
              <span className="sidebar-cta-label">Find your match</span>
              <span className="sidebar-cta-sub">60-sec wizard</span>
            </Link>

            <button
              type="button"
              className="sidebar-region"
              aria-label="Region: US Global (region selector coming soon)"
              disabled
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
              </svg>
              <span className="sidebar-region-label">US · Global</span>
              <svg className="sidebar-region-caret" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

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
