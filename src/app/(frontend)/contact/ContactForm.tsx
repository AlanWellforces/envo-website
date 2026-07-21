'use client'

import Script from 'next/script'
import { useState } from 'react'
import styles from './page.module.css'
import { HoneypotField } from '@/components/forms/HoneypotField'

// Same guard as the Free Layout form: Turnstile protects upload-bearing forms,
// renders nothing (and the API skips verification) until the key is configured.
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

// API error strings are lowercase fragments ("attached file must be…") —
// capitalise when rendering them as a sentence of their own.
const sentenceCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export function ContactForm({ phone }: { phone?: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [serverError, setServerError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState('sending')
    setServerError(null)
    const form = new FormData(e.currentTarget)
    form.set('type', 'contact')
    form.set('sourcePath', '/contact')
    try {
      const res = await fetch('/api/submissions', { method: 'POST', body: form })
      if (res.ok) {
        setState('sent')
      } else {
        // Surface the API's reason (e.g. a rejected/oversized file) so the
        // user can fix it instead of guessing.
        const body = (await res.json().catch(() => null)) as { errors?: string[] } | null
        setServerError(body?.errors?.[0] ?? null)
        setState('error')
      }
    } catch {
      setState('error')
    }
  }

  if (state === 'sent') {
    return (
      <div className={styles.sent}>
        Thanks — your message has been received. For anything urgent, reach us at{' '}
        <a href="mailto:contact@envolighting.com">contact@envolighting.com</a>
        {phone ? ` or ${phone}` : ''}.
      </div>
    )
  }

  return (
    // method="post": JS always intercepts the submit, but if hydration ever
    // fails the browser's native fallback must not GET the field values into
    // the URL / access logs (external audit 2026-07-21).
    <form className={styles.form} method="post" onSubmit={handleSubmit}>
      <HoneypotField />
      <div className={styles.row2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="cf-name">Name</label>
          <input className={styles.input} id="cf-name" name="name" autoComplete="name" required />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="cf-company">Company</label>
          <input className={styles.input} id="cf-company" name="company" autoComplete="organization" />
        </div>
      </div>
      <div className={styles.row2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="cf-email">Email</label>
          <input className={styles.input} id="cf-email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="cf-phone">Phone</label>
          <input className={styles.input} id="cf-phone" name="phone" type="tel" autoComplete="tel" />
        </div>
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="cf-message">Message</label>
        <textarea className={styles.textarea} id="cf-message" name="message" required />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="cf-attachment">
          Attach drawings or photos (optional)
        </label>
        <span className={styles.dropZone}>
          <input
            type="file"
            id="cf-attachment"
            name="attachment"
            accept="image/*,.pdf,.dwg,.svg"
            aria-describedby="cf-attachment-hint"
            className={styles.dropInput}
            onChange={(e) => setFileName(e.currentTarget.files?.[0]?.name ?? null)}
          />
          <span className={styles.dropText}>
            {fileName ?? 'Drop a drawing, photo or dimension sheet'}
          </span>
          <small id="cf-attachment-hint" className={styles.dropHint}>
            JPG · PNG · PDF · DWG · SVG · up to 20 MB
          </small>
        </span>
      </div>

      {TURNSTILE_SITE_KEY && (
        <div>
          {/* the widget injects a hidden cf-turnstile-response input into the form */}
          <div className="cf-turnstile" data-sitekey={TURNSTILE_SITE_KEY} data-appearance="interaction-only" />
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
        </div>
      )}

      <button className={styles.submit} type="submit" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : 'Send message'}
      </button>
      {state === 'error' && (
        <p className={styles.note} role="alert">
          {serverError ? sentenceCase(serverError) : 'Something went wrong'} — please try again, or email{' '}
          <a href="mailto:contact@envolighting.com">contact@envolighting.com</a> directly.
        </p>
      )}
    </form>
  )
}
