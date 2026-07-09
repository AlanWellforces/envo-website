'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { cn } from '@/lib/utils'
import { PURCHASE_CHANNELS, type PurchaseChannel } from '@/data/purchase-channels'
import { useRegion } from '@/components/region/RegionProvider'

const STORAGE_KEY = 'envo-c-sidebar-collapsed'

// Bottom "Find local distributor" region selector is hidden for now. All its
// markup + logic below is intact — flip this to `true` to bring it back.
const SHOW_SUPPLY_CHANNEL = false

// Category submenus (disclosure caret + series children + View all).
// Children mirror each family page's Series FILTER options and deep-link to
// the pre-filtered "collection" view (?series=<option> — CatalogueFilter
// reads it). Update children when the filter options change (range gating).
const SHOW_NAV_SUBMENUS = true

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
  // Product categories expand into the SAME options their family page's
  // Series filter shows, deep-linking to the pre-filtered collection view
  // (?series=<exact filter value>). Keep labels/values in lockstep with
  // the filter (family-map SIGNAGE_SERIES_CATEGORY / series-catalogue-meta
  // titles, minus range-gated series) — a mismatched value simply doesn't
  // pre-select anything. Control Gear has a single visible series after
  // range gating, so it stays a direct link for now; Accessories has no
  // live products at all (see docs/superpowers/plans/2026-07-08-hidden-features.md).
  {
    section: 'signage-modules',
    href: '/products/led-signage-modules',
    label: 'Signage Modules',
    icon: (
      <svg className="sidebar-icon" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
    children: [
      { slug: 'mini', href: '/products/led-signage-modules?series=Mini%20Series', label: 'Mini Series' },
      { slug: 'eco', href: '/products/led-signage-modules?series=Eco%20Series', label: 'Eco Series' },
      { slug: 'pro', href: '/products/led-signage-modules?series=Pro%20Series', label: 'Pro Series' },
      { slug: 'rgb', href: '/products/led-signage-modules?series=RGB%20Series', label: 'RGB Series' },
      { slug: '24v', href: '/products/led-signage-modules?series=24V%20Series', label: '24V Series' },
      { slug: 'sidelit', href: '/products/led-signage-modules?series=Sidelit', label: 'Sidelit' },
    ],
  },
  {
    section: 'led-drivers',
    href: '/products/led-drivers',
    label: 'LED Drivers',
    icon: (
      <svg className="sidebar-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
      </svg>
    ),
    // Old-menu TYPE categories (driverCategories in family-map): SP belongs
    // to BOTH Screw Terminal and Triac Dimmable — ticking either shows it.
    children: [
      { slug: 'screw-terminal', href: '/products/led-drivers?series=Screw%20Terminal', label: 'Screw Terminal' },
      { slug: 'linear', href: '/products/led-drivers?series=Linear', label: 'Linear' },
      { slug: 'triac', href: '/products/led-drivers?series=Triac%20Dimmable', label: 'Triac Dimmable' },
    ],
  },
  {
    section: 'control-gear',
    href: '/products/control-gear',
    label: 'Control Gear',
    icon: (
      <svg className="sidebar-icon" viewBox="0 0 24 24" aria-hidden="true">
        <line x1="4" y1="7" x2="20" y2="7" />
        <circle cx="9" cy="7" r="2" />
        <line x1="4" y1="12" x2="20" y2="12" />
        <circle cx="15" cy="12" r="2" />
        <line x1="4" y1="17" x2="20" y2="17" />
        <circle cx="9" cy="17" r="2" />
      </svg>
    ),
    // Old-menu categories (controlGearCategories in family-map): three
    // FUNCTION splits + "Zigbee & Smart" = the whole zigbee range (the old
    // site's zigbee-controller collection), which every zigbee product
    // carries in addition to its function category.
    children: [
      { slug: 'remote', href: '/products/control-gear?series=Remote%20%26%20Receiver', label: 'Remote & Receiver' },
      { slug: 'converter', href: '/products/control-gear?series=Signal%20Converter', label: 'Signal Converter' },
      { slug: 'sensor', href: '/products/control-gear?series=Sensor', label: 'Sensor' },
      { slug: 'zigbee', href: '/products/control-gear?series=Zigbee%20%26%20Smart', label: 'Zigbee & Smart' },
    ],
  },
  {
    section: 'accessories',
    href: '/products/accessories',
    label: 'Accessories',
    icon: (
      <svg className="sidebar-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 2v6" />
        <path d="M15 2v6" />
        <path d="M6 8h12v3a6 6 0 0 1-12 0z" />
        <path d="M12 17v5" />
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

// Nav is split into zones: Home sits alone at the top, the browse-the-offer
// links sit under a "Products" eyebrow (four catalogue families = browse by
// type, plus Solutions = browse by application), and the support links are
// pinned to the bottom (above the CTA) so product vs. support read as
// distinct types.
const SUPPORT_SECTIONS = new Set(['resources', 'contact'])
// Hidden for now (user 2026-07-08): the DB has no live accessory products, so
// the family page is an empty state. Remove from this set to restore the link
// once accessories are stocked/synced. All hidden features are tracked in
// docs/superpowers/plans/2026-07-08-hidden-features.md.
const HIDDEN_SECTIONS = new Set(['accessories'])
const HOME_ITEM = NAVIGATE.find((i) => i.section === 'home')!
const PRODUCT_NAV = NAVIGATE.filter(
  (i) =>
    i.section !== 'home' &&
    !SUPPORT_SECTIONS.has(i.section) &&
    !HIDDEN_SECTIONS.has(i.section),
)
const SUPPORT_NAV = NAVIGATE.filter((i) => SUPPORT_SECTIONS.has(i.section))

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  // Blog has no sidebar entry of its own (nav-hidden until the content library
  // launches) — the Insights hub lives under the Resources umbrella, so the
  // Resources item lights up while reading it.
  if (href === '/resources' && (pathname === '/blog' || pathname.startsWith('/blog/'))) return true
  return pathname === href || pathname.startsWith(href + '/')
}

/** Canonical form of a query string (sorted keys, uniform encoding) so href
 *  authoring differences ('%20' vs '+', param order) can't break a match. */
const canonicalQuery = (qs: string) => {
  const sp = new URLSearchParams(qs)
  sp.sort()
  return sp.toString()
}

type SubLinksProps = {
  item: NavItem
  pathname: string
  /** Current query string; '' in the static shell / Suspense fallback. */
  search: string
  onNavClick: (e: React.MouseEvent<HTMLAnchorElement>) => void
}

/** A group's collection child links + "View all". Presentational — the live
 *  query string arrives as a prop so the Suspense fallback can render the
 *  identical markup before the client query is known. A link is active when
 *  both the path and the full query match it exactly. */
function SidebarSubLinks({ item, pathname, search, onNavClick }: SubLinksProps) {
  const current = canonicalQuery(search)
  const collectionActive = (href: string) => {
    const q = href.indexOf('?')
    const base = q === -1 ? href : href.slice(0, q)
    return pathname === base && current === canonicalQuery(q === -1 ? '' : href.slice(q + 1))
  }
  return (
    <>
      {(item.children ?? []).map((c) => (
        <li key={c.slug}>
          <Link
            href={c.href}
            className={cn('sidebar-sublink', collectionActive(c.href) && 'active')}
            onClick={onNavClick}
          >
            {c.label}
          </Link>
        </li>
      ))}
      <li>
        <Link
          href={item.href}
          className={cn('sidebar-sublink', collectionActive(item.href) && 'active')}
          onClick={onNavClick}
        >
          View all
        </Link>
      </li>
    </>
  )
}

/** useSearchParams is reactive to every query navigation — same-path
 *  collection clicks included — so the highlight tracks the URL with no
 *  synced state. */
function SidebarSubLinksLive(props: Omit<SubLinksProps, 'search'>) {
  const search = useSearchParams().toString()
  return <SidebarSubLinks {...props} search={search} />
}

export function Sidebar() {
  const pathname = usePathname()
  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    getCollapsedSnapshot,
    getCollapsedServerSnapshot,
  )
  const [open, setOpen] = useState(false)
  // Region switcher (localStorage-backed, broadcasts in-tab). Picking a region
  // here sets the shared context so the PRODUCT-page "Find local distributor"
  // button routes to the matching distributor site. This selector does not open
  // an external site itself — it only sets which channel is "yours".
  const { region, setRegion } = useRegion()
  const currentChannel =
    PURCHASE_CHANNELS.find((c) => c.id === region) ?? PURCHASE_CHANNELS[0]
  const [regionOpen, setRegionOpen] = useState(false)
  // Track which parent groups are expanded. A group starts expanded only when
  // the current route is inside it — so Products is expanded on product pages
  // but stays collapsed on content pages, keeping the nav quiet there. The
  // active route still auto-expands its group on navigation (below), and users
  // can manually toggle any group.
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () =>
      new Set(
        NAVIGATE.filter((i) => i.children && isActive(pathname, i.href)).map(
          (i) => i.section,
        ),
      ),
  )
  const sidebarRef = useRef<HTMLElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const regionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.body.classList.toggle('sidebar-collapsed', collapsed)
    return () => document.body.classList.remove('sidebar-collapsed')
  }, [collapsed])

  // Auto-expand any parent group whose route the user is currently inside.
  // Adjust-state-during-render (not an effect) so React re-renders in place
  // without flashing the collapsed state first.
  const [expandedForPath, setExpandedForPath] = useState(pathname)
  if (expandedForPath !== pathname) {
    setExpandedForPath(pathname)
    const next = new Set(openGroups)
    let changed = false
    for (const item of NAVIGATE) {
      if (item.children && isActive(pathname, item.href) && !next.has(item.section)) {
        next.add(item.section)
        changed = true
      }
    }
    if (changed) setOpenGroups(next)
  }

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

  const pickRegion = useCallback(
    (id: PurchaseChannel['id']) => {
      setRegion(id)
      setRegionOpen(false)
    },
    [setRegion],
  )

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

  const toggleCollapsed = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    // Blur so the global :focus-visible ring doesn't linger on the control.
    e.currentTarget.blur()
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
      // Leaf — no children (or submenus globally hidden). `data-tooltip`
      // powers the collapsed-sidebar hover label (CSS-only ::after). Parent
      // group links skip this since their flyout already names the category.
      if (!item.children || !SHOW_NAV_SUBMENUS) {
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

      // Parent group — the whole row is a disclosure toggle (no direct link;
      // the overview page is reachable via the "View all" child). Row shows
      // "active" while the user is anywhere inside the group's routes.
      const groupOpen = openGroups.has(item.section)
      const parentActive = pathname === item.href
      return (
        <div
          key={item.section}
          className={cn('sidebar-group', groupOpen && 'open')}
        >
          <button
            type="button"
            className={cn('sidebar-link', 'sidebar-link--parent', parentActive && 'active')}
            data-section={item.section}
            aria-expanded={groupOpen}
            onClick={(e) => {
              e.currentTarget.blur()
              toggleGroup(item.section)
            }}
          >
            {item.icon}
            <span className="sidebar-label">{item.label}</span>
            <svg className="sidebar-caret" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
          <ul
            className="sidebar-sub"
            role="list"
            data-parent-label={item.label}
          >
            {/* Query-aware child links need useSearchParams, which must sit
                under its own <Suspense> for statically prerendered pages.
                The fallback is the identical list with an empty query — the
                same HTML the pre-hydration shell always had. */}
            <Suspense
              fallback={
                <SidebarSubLinks item={item} pathname={pathname} search="" onNavClick={handleNavClick} />
              }
            >
              <SidebarSubLinksLive item={item} pathname={pathname} onNavClick={handleNavClick} />
            </Suspense>
          </ul>
        </div>
      )
    })

  return (
    <>
      {/* Mobile-only fixed header: menu toggle + brand + catalogue search.
          Desktop (≥981px) hides the whole bar — the sidebar owns the logo there. */}
      <div className="mobile-header">
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
            {open ? (
              <>
                <line x1="5" y1="5" x2="19" y2="19" />
                <line x1="19" y1="5" x2="5" y2="19" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
        <Link href="/" className="mobile-header-logo" aria-label="ENVO home" onClick={handleNavClick}>
          <Image
            src="/assets/images/logo-envo-darkbg.svg"
            alt="ENVO"
            width={92}
            height={17}
            priority
          />
        </Link>
        <Link
          href="/products?search=1"
          className="mobile-header-search"
          aria-label="Search the catalogue"
          onClick={handleNavClick}
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
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
        </Link>
      </div>

      <aside
        ref={sidebarRef}
        id="sidebar"
        className={cn('sidebar', open && 'open')}
        aria-label="Primary navigation"
      >
        <div className="sidebar-inner">
          <Link href="/" className="sidebar-logo" aria-label="ENVO home" onClick={handleNavClick}>
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
              {renderItems([HOME_ITEM])}
            </div>
            <div className="sidebar-section">
              <div className="sidebar-section-title">Products</div>
              {renderItems(PRODUCT_NAV)}
            </div>
          </nav>

          <div className="sidebar-support">
            <div className="sidebar-section-title">Support</div>
            {renderItems(SUPPORT_NAV)}
          </div>

          <Link
            href="/free-layout-design"
            className="sidebar-cta-card"
            data-tooltip="Free Layout Design"
            onClick={handleNavClick}
          >
            <span className="sidebar-cta-card-title">Need help specifying?</span>
            <span className="sidebar-cta-btn">
              <svg className="sidebar-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 19l7-7 3 3-7 7-3-3z" />
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              </svg>
              <span className="sidebar-cta-btn-label">Free Layout Design</span>
            </span>
          </Link>

          <div className="sidebar-footer">
            {SHOW_SUPPLY_CHANNEL && (
            <div className="sidebar-channel">
              <span className="sidebar-channel-title">Find local distributor</span>
              <div
                ref={regionRef}
                className={cn('sidebar-region-wrap', regionOpen && 'open')}
              >
              <button
                type="button"
                className="sidebar-region"
                aria-haspopup="listbox"
                aria-expanded={regionOpen}
                aria-label={`Supply channel: ${currentChannel.regionLabel}. Click to change.`}
                onClick={(e) => {
                  e.stopPropagation()
                  setRegionOpen((o) => !o)
                }}
              >
                <svg className="sidebar-region-glyph" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 22s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12z" />
                  <circle cx="12" cy="10" r="2.6" />
                </svg>
                <span className="sidebar-region-body">
                  <span className="sidebar-region-value">{currentChannel.regionLabel}</span>
                </span>
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
                  <div className="sidebar-region-dropdown-head">Sold through authorised distributors</div>
                  {PURCHASE_CHANNELS.map((channel) => {
                    const active = channel.id === region
                    return (
                      <button
                        key={channel.id}
                        type="button"
                        role="option"
                        aria-selected={active}
                        className={cn('sidebar-region-option', active && 'active')}
                        onClick={() => pickRegion(channel.id)}
                      >
                        <span className="sidebar-region-option-body">
                          <span className="sidebar-region-option-name">{channel.regionLabel}</span>
                        </span>
                        {active && (
                          <svg className="sidebar-region-option-check" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
              </div>
            </div>
            )}

            <button
              type="button"
              className="sidebar-collapse-btn"
              aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
              aria-pressed={collapsed}
              title={collapsed ? 'Expand menu' : 'Collapse menu'}
              onClick={toggleCollapsed}
            >
              <svg className="sidebar-collapse-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
