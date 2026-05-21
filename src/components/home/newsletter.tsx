'use client'

import { useRef, useState } from 'react'

export function Newsletter() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState('')

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const input = inputRef.current
    if (!input || !input.value) return
    input.value = ''
    setStatus("Thanks — we'll be in touch!")
    setTimeout(() => setStatus(''), 3000)
  }

  return (
    <section className="news-section">
      <div className="news-inner">
        <h2 className="news-heading">Stay informed</h2>
        <p className="news-desc">
          Subscribe for product updates, new solutions, and industry insights.
        </p>
        <form className="news-form" onSubmit={onSubmit}>
          <input
            ref={inputRef}
            type="email"
            placeholder="Enter your email address"
            aria-label="Email address"
            required
          />
          <button type="submit">Subscribe</button>
        </form>
        <p className="news-status" role="status" aria-live="polite">
          {status}
        </p>
      </div>
    </section>
  )
}
