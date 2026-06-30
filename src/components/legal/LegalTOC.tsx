'use client'

import { useEffect, useState } from 'react'
import styles from './legal.module.css'

export type TocHeading = { id: string; text: string; level: number }

/**
 * Sticky "On this page" table of contents for legal/CMS pages. Highlights the
 * section nearest the top of the viewport via IntersectionObserver. Anchor ids
 * are produced by collectHeadings() + the renderer's heading ids (both slugify).
 */
export function LegalTOC({ headings }: { headings: TocHeading[] }) {
  const [active, setActive] = useState<string>(headings[0]?.id ?? '')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive((entry.target as HTMLElement).id)
        }
      },
      // Trigger when a heading sits in the top ~30% band of the viewport.
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 },
    )
    for (const h of headings) {
      const el = document.getElementById(h.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [headings])

  return (
    <aside className={styles.tocWrap}>
      <nav className={styles.toc} aria-label="On this page">
        <p className={styles.tocTitle}>On this page</p>
        <ul className={styles.tocList}>
          {headings.map((h) => (
            <li key={h.id} className={h.level === 3 ? styles.tocSub : undefined}>
              <a href={`#${h.id}`} className={active === h.id ? styles.tocActive : undefined}>
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
