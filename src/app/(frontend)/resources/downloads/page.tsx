import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { metadataForRoute } from '@/lib/page-seo'
import Link from 'next/link'
import { RESOURCES } from '@/data/resources'
import styles from './page.module.css'

export async function generateMetadata(): Promise<Metadata> {
  return metadataForRoute('/resources/downloads', {
    title: 'Downloads — ENVO',
    description:
      'ENVO technical library — product catalogue, specification sheets, IES photometric files and installation guides.',
  })
}

// Where each library item resolves today. Per-product datasheets already live
// on each product page (Akeneo spec_sheet_url); bundled docs are available on
// request until the file library is published (follow-up).
const DEST: Record<string, { href: string; cta: string }> = {
  catalog: { href: '/products', cta: 'Browse the catalogue →' },
  'spec-sheets': { href: '/products', cta: 'Find a product datasheet →' },
  'install-guides': { href: '/contact', cta: 'Request a guide →' },
  'ies-files': { href: '/contact', cta: 'Request IES files →' },
}

export default function DownloadsPage() {
  // Hidden (user 2026-07-24): the download library isn't finished — cards only
  // route out to product/contact pages, no real bundled files yet. 404s direct
  // URLs; entry points removed (resources hub, sitemap, site-pages). Re-enable
  // by removing this line and restoring those entries.
  notFound()

  return (
    <div className="theme-light">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">›</span>
          <Link href="/resources">Resources</Link>
          <span className="sep">›</span>
          <span>Downloads</span>
        </div>

        <section className={styles.hero}>
          <span className={styles.eyebrow}>Resources · Downloads</span>
          <h1 className={styles.title}>Catalogues, datasheets, IES files.</h1>
          <p className={styles.desc}>
            The ENVO technical library. Every product page carries its own datasheet; for bundled
            catalogues and photometric files, use the links below to the product ranges or request
            them from our team.
          </p>
        </section>

        <div className={styles.grid}>
          {RESOURCES.map((r) => {
            const dest = DEST[r.slug] ?? { href: '/contact', cta: 'Request →' }
            return (
              <Link key={r.slug} href={dest.href} className={styles.card}>
                <span className={styles.icon}>{r.icon}</span>
                <span>
                  <span className={styles.cardName}>{r.name}</span>
                  <p className={styles.cardDesc}>{r.desc}</p>
                  <span className={styles.cardCta}>{dest.cta}</span>
                </span>
              </Link>
            )
          })}
        </div>

        <section className={styles.note}>
          <div className={styles.noteBox}>
            Looking for a specific product datasheet? Each model lists its own PDF on its{' '}
            <Link href="/products">product page</Link>. For a full catalogue or IES pack,{' '}
            {/* {' '} is load-bearing: SWC drops a plain same-line space when the
                following text node contains an entity (rendered "teamand" live) */}
            <Link href="/contact">contact our team</Link>{' '}and we&apos;ll send it over.
          </div>
        </section>
      </div>
    </div>
  )
}
