import type { Metadata } from 'next'
import Link from 'next/link'
import { getFaqs } from '@/lib/faqs'
import { RichTextRenderer } from '@/components/blog/RichTextRenderer'
import styles from './page.module.css'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'FAQ — ENVO',
  description: 'Answers on ordering, product compatibility, installation and warranty for ENVO LED signage.',
}

export default async function FaqPage() {
  const groups = await getFaqs()

  return (
    <div className="theme-light">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">›</span>
          <Link href="/resources">Resources</Link>
          <span className="sep">›</span>
          <span>FAQ</span>
        </div>
        <section className={styles.head}>
          <span className={styles.eyebrow}>Resources · FAQ</span>
          <h1 className={styles.title}>Frequently asked questions</h1>
        </section>

        {groups.length === 0 ? (
          <p className={styles.empty}>No questions published yet — check back soon.</p>
        ) : (
          groups.map((group) => (
            <div key={group.key} className={styles.group}>
              <h2 className={styles.groupTitle}>{group.label}</h2>
              <div className={styles.list}>
                {group.items.map((item) => (
                  <details key={item.id} className={styles.item}>
                    <summary className={styles.q}>{item.question}</summary>
                    <div className={styles.a}>
                      <RichTextRenderer doc={item.answer} />
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
