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
          <p className={styles.notice}>
            <strong>Draft — pending review.</strong> This page is a working draft tailored to how
            this site operates (enquiry forms only; product purchases are handled by our regional
            distributors). It has not yet been reviewed or approved by ENVO and is
            not yet legal advice. Final wording and the operating legal entity are to be confirmed.
          </p>
        </section>

        <div className={styles.prose}>{children}</div>
      </div>
    </div>
  )
}
