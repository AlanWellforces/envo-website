import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { metadataForRoute } from '@/lib/page-seo'
import Link from 'next/link'
import { Wizard } from './Wizard'
import styles from './page.module.css'

export async function generateMetadata(): Promise<Metadata> {
  return metadataForRoute('/find-your-match', {
    title: 'Find your match — ENVO',
    description:
      'Answer five quick questions and we suggest the right ENVO module, driver and control for your sign — a fast selection aid, no commitment.',
  })
}

export default function FindYourMatchPage() {
  // Hidden — planned rework into a dimension-input layout calculator. 404s
  // direct URLs meanwhile. Re-enable by removing this line and restoring the
  // entry points (sidebar, footer, /resources/tools, sitemap, site-pages,
  // product-families FAQ copy).
  notFound()

  return (
    <div className="theme-light">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">›</span>
          <span>Find your match</span>
        </div>

        <section className={styles.hero}>
          <span className={styles.eyebrow}>Find your match</span>
          <h1 className={styles.title}>Spec your setup in about a minute.</h1>
          <p className={styles.desc}>
            Five quick questions about your sign — we suggest the right module, driver and control
            from the ENVO range. A selection aid, not a quote.
          </p>
        </section>

        <div className={styles.wrap}>
          <Wizard />
        </div>
      </div>
    </div>
  )
}
