import type { ReactNode } from 'react'
import Link from 'next/link'
import styles from './legal.module.css'
import { LegalTOC, type TocHeading } from './LegalTOC'

type Props = { title: string; updated: string; toc?: TocHeading[]; children: ReactNode }

export function LegalPage({ title, updated, toc, children }: Props) {
  // Only surface the side-nav when there are enough sections to be worth it.
  const showToc = (toc?.length ?? 0) > 1

  return (
    <div className="theme-light">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">›</span>
          <span>{title}</span>
        </div>

        <section className={styles.hero}>
          <span className={styles.eyebrow}>Legal</span>
          <h1 className={styles.title}>{title}</h1>
          {updated && <p className={styles.updated}>Last updated: {updated}</p>}
        </section>

        {showToc ? (
          <div className={styles.layout}>
            <LegalTOC headings={toc!} />
            <article className={styles.prose}>{children}</article>
          </div>
        ) : (
          <article className={styles.prose}>{children}</article>
        )}
      </div>
    </div>
  )
}
