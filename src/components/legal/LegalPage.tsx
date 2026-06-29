import type { ReactNode } from 'react'
import Link from 'next/link'
import styles from './legal.module.css'

type Props = { title: string; updated: string; children: ReactNode }

export function LegalPage({ title, updated, children }: Props) {
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
          <p className={styles.updated}>Last updated: {updated}</p>
        </section>

        <div className={styles.prose}>{children}</div>
      </div>
    </div>
  )
}
