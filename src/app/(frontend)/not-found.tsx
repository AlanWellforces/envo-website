import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './not-found.module.css'

export const metadata: Metadata = {
  title: 'Page not found — ENVO',
  // notFound() responses are 404s; robots is belt-and-braces for any edge
  // that renders this without the status.
  robots: { index: false },
}

// Recovery paths (audit item 11) — the six destinations a lost visitor is
// actually looking for, per the site's structure.
const PATHS = [
  {
    href: '/products',
    title: 'Product catalogue',
    desc: 'Browse every ENVO module, driver and controller.',
  },
  {
    href: '/products?search=1',
    title: 'Product search',
    desc: 'Find a product by SKU or name.',
  },
  {
    href: '/resources/tools/signage-selector',
    title: 'Module selector',
    desc: 'Match modules to your sign type and depth.',
  },
  {
    href: '/resources',
    title: 'Resources',
    desc: 'Datasheets, downloads and tools.',
  },
  {
    href: '/contact',
    title: 'Contact',
    desc: 'Ask our engineers — product or project questions.',
  },
  {
    href: '/free-layout-design',
    title: 'Free layout design',
    desc: 'Send your sign dimensions, get a module layout back.',
  },
]

export default function NotFound() {
  return (
    <div className="theme-light">
      <div className="container">
        <section className={styles.hero}>
          <span className={styles.eyebrow}>404</span>
          <h1 className={styles.title}>This page doesn&apos;t exist.</h1>
          <p className={styles.desc}>
            The link may be outdated or mistyped. Head <Link href="/">back home</Link>, or
            jump straight to what you were looking for:
          </p>
        </section>

        <nav className={styles.grid} aria-label="Suggested destinations">
          {PATHS.map((p) => (
            <Link key={p.href} href={p.href} className={styles.card}>
              <span className={styles.cardTitle}>{p.title}</span>
              <span className={styles.cardDesc}>{p.desc}</span>
              <span className={styles.cardArrow} aria-hidden="true">→</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
