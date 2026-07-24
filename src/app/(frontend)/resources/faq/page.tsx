import type { Metadata } from 'next'
import Link from 'next/link'
import { getFaqs } from '@/lib/faqs'
import { RichTextRenderer } from '@/components/blog/RichTextRenderer'
import { lexicalToText, type LexicalNode } from '@/lib/lexical-text'
import { faqPageLd } from '@/lib/structured-data'
import { JsonLd } from '@/components/seo/JsonLd'
import styles from './page.module.css'

export const revalidate = 3600

export const metadata: Metadata = {
  alternates: { canonical: '/resources/faq' },
  title: 'FAQ — ENVO',
  description: 'Answers on ordering, product compatibility, installation and warranty for ENVO LED signage.',
}

export default async function FaqPage() {
  const groups = await getFaqs()

  // FAQPage rich-result markup, flattening each answer's richText to plain text.
  const faqItems = groups
    .flatMap((g) => g.items)
    .map((it) => ({ question: it.question, answer: lexicalToText(it.answer as LexicalNode).trim() }))
    .filter((it) => it.question && it.answer)

  return (
    <div className="theme-light">
      {faqItems.length > 0 && <JsonLd data={faqPageLd(faqItems)} />}
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
