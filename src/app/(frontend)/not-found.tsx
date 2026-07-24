import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './not-found.module.css'

export const metadata: Metadata = {
  title: 'Page not found — ENVO',
  description: 'This page doesn’t exist. Browse ENVO products, solutions and resources instead.',
  // notFound() responses are 404s; robots is belt-and-braces for any edge
  // that renders this without the status.
  robots: { index: false },
  // Override the root layout's site-wide openGraph so a shared 404 link
  // doesn't preview as the homepage.
  openGraph: {
    title: 'Page not found — ENVO',
    description: 'This page doesn’t exist.',
    type: 'website',
    siteName: 'ENVO',
  },
}

export default function NotFound() {
  return (
    <div className="theme-light">
      <div className="container">
        <section className={styles.hero}>
          <span className={styles.eyebrow}>404</span>
          <h1 className={styles.title}>This page doesn&apos;t exist.</h1>
          <p className={styles.desc}>The link may be outdated or mistyped.</p>
          <Link href="/" className={styles.home}>
            Return to homepage
          </Link>
        </section>
      </div>
    </div>
  )
}
