import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { metadataForRoute } from '@/lib/page-seo'
import Link from 'next/link'
import styles from './page.module.css'

export async function generateMetadata(): Promise<Metadata> {
  return metadataForRoute('/resources/tools', {
    title: 'Tools — ENVO',
    description:
      'ENVO sizing and selection tools — get a free layout design from a sketch.',
  })
}

const TOOLS = [
  // Gated (hidden-features registry): 'Find your match' (2026-07-08) and the
  // 'Product selector' / signage-selector (2026-07-24, data/links not ready).
  // Only Free layout design is live here for now.
  {
    name: 'Free layout design',
    desc: 'Send an elevation or sign face and our engineers return a buildable module, driver and wiring layout — free.',
    cta: 'Send a sketch →',
    href: '/free-layout-design',
  },
]

export default function ToolsPage() {
  // Hidden 2026-07-24: both tools that lived here are gated (Find Your Match,
  // Signage selector), leaving only Free layout design — which has its own
  // /free-layout-design page. With no inbound links, this hub was an orphan
  // indexable page, so it 404s. Re-enable when a real tool returns here.
  notFound()

  return (
    <div className="theme-light">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">›</span>
          <Link href="/resources">Resources</Link>
          <span className="sep">›</span>
          <span>Tools</span>
        </div>

        <section className={styles.hero}>
          <span className={styles.eyebrow}>Resources · Tools</span>
          <h1 className={styles.title}>Spec the right setup, faster.</h1>
          <p className={styles.desc}>
            Sizing and selection tools to match the right ENVO modules, drivers and control to your
            project.
          </p>
        </section>

        <div className={styles.grid}>
          {TOOLS.map((t) => (
            <Link key={t.href} href={t.href} className={styles.card}>
              <h2 className={styles.cardName}>{t.name}</h2>
              <p className={styles.cardDesc}>{t.desc}</p>
              <span className={styles.cardCta}>{t.cta}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
