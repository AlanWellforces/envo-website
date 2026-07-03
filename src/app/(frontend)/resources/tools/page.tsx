import type { Metadata } from 'next'
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
  {
    name: 'Free layout design',
    desc: 'Send an elevation or sign face and our engineers return a buildable module, driver and wiring layout — free.',
    cta: 'Send a sketch →',
    href: '/free-layout-design',
  },
]

export default function ToolsPage() {
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
