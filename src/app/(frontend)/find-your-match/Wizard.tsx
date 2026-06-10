'use client'

import { useState } from 'react'
import Link from 'next/link'
import { EnvoButton } from '@/components/ui/envo-button'
import { FYM_QUESTIONS } from '@/lib/find-your-match/copy'
import { dbFamilyToMarketing, seriesSlug } from '@/data/family-map'
import type { FymResult } from '@/lib/find-your-match/types'
import type { Product } from '@/lib/products'
import styles from './page.module.css'

function productHref(p: Product): string {
  const m = dbFamilyToMarketing(p.family ?? '')
  if (!m) return '/products'
  const base = `/products/${m.slug}/${seriesSlug(p.series)}`
  // Signage has no per-SKU page — link to the series template instead.
  return p.family === 'led_module' ? base : `${base}/${p.sku}`
}

function ResultCard({ role, name, reason, href }: { role: string; name: string; reason: string; href?: string }) {
  return (
    <div className={styles.resultCard}>
      <div>
        <p className={styles.resultRole}>{role}</p>
        <p className={styles.resultName}>{name}</p>
        <p className={styles.resultReason}>{reason}</p>
        {href && <Link className={styles.resultLink} href={href}>View product →</Link>}
      </div>
    </div>
  )
}

export function Wizard() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<FymResult | null>(null)
  const [loading, setLoading] = useState(false)

  async function choose(key: string, value: string) {
    const next = { ...answers, [key]: value }
    setAnswers(next)
    if (step < FYM_QUESTIONS.length - 1) {
      setStep(step + 1)
      return
    }
    setLoading(true)
    const res = await fetch('/api/find-your-match', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(next),
    })
    setResult(await res.json())
    setLoading(false)
  }

  function restart() {
    setStep(0); setAnswers({}); setResult(null)
  }

  if (loading) return <div className={styles.loading}>Finding your match…</div>

  if (result) {
    return (
      <div>
        {result.module && (
          <ResultCard role="Module" name={result.module.product.name} reason={result.module.reason} href={productHref(result.module.product)} />
        )}
        {result.driver.kind === 'product'
          ? <ResultCard role="Driver" name={result.driver.product.name} reason={result.driver.reason} href={productHref(result.driver.product)} />
          : <ResultCard role="Driver" name={`~${result.driver.spec.powerW} W · ${result.driver.spec.voltageV} V driver`} reason={result.driver.reason} />}
        {result.control?.kind === 'product' && (
          <ResultCard role="Control" name={result.control.product.name} reason={result.control.reason} href={productHref(result.control.product)} />
        )}
        {result.control?.kind === 'note' && <ResultCard role="Control" name="Control gear" reason={result.control.reason} />}

        <p className={styles.rationale}>{result.explanation}</p>

        <div className={styles.ctaRow}>
          <EnvoButton href="/free-layout-design" variant="primary" arrow>Confirm with a free layout</EnvoButton>
          <EnvoButton href="/products" variant="ghost">Browse the range</EnvoButton>
          <button className={styles.back} onClick={restart}>Start over</button>
        </div>
      </div>
    )
  }

  const q = FYM_QUESTIONS[step]
  return (
    <div>
      <p className={styles.progress}>Step {step + 1} of {FYM_QUESTIONS.length}</p>
      <h2 className={styles.q}>{q.label}</h2>
      <div className={styles.opts}>
        {q.options.map((o) => (
          <button key={o.value} className={styles.opt} onClick={() => choose(q.key, o.value)}>{o.label}</button>
        ))}
      </div>
      {step > 0 && <button className={styles.back} onClick={() => setStep(step - 1)}>← Back</button>}
    </div>
  )
}
