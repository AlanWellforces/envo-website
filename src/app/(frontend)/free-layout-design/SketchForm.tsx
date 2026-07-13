'use client'

import Script from 'next/script'
import { useState } from 'react'
import styles from './page.module.css'
import { HoneypotField } from '@/components/forms/HoneypotField'

// Turnstile guards this upload-bearing form only when the site key is
// configured — locally (and until the key lands on the VPS) nothing renders
// and the API skips verification.
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

export function SketchForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [serverError, setServerError] = useState<string | null>(null)
  const [sketchName, setSketchName] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState('sending')
    setServerError(null)
    const form = new FormData(e.currentTarget)
    form.set('type', 'free-layout')
    form.set('sourcePath', '/free-layout-design')
    try {
      const res = await fetch('/api/submissions', { method: 'POST', body: form })
      if (res.ok) {
        setState('sent')
      } else {
        // Surface the API's reason (e.g. a rejected/oversized sketch) so the
        // user can fix it instead of guessing.
        const body = (await res.json().catch(() => null)) as { errors?: string[] } | null
        setServerError(body?.errors?.[0] ?? null)
        setState('error')
      }
    } catch {
      setState('error')
    }
  }

  return (
    <form className={styles.formGrid} onSubmit={handleSubmit}>
      <label className={styles.field}>
        <span>Your name *</span>
        <input type="text" name="name" required placeholder="Jane Smith" />
      </label>
      <label className={styles.field}>
        <span>Company</span>
        <input type="text" name="company" placeholder="Acme Signs" />
      </label>
      <label className={styles.field}>
        <span>Email *</span>
        <input type="email" name="email" required placeholder="jane@acmesigns.com" />
      </label>
      <label className={styles.field}>
        <span>Phone</span>
        <input type="tel" name="phone" placeholder="+64 21 123 4567" />
      </label>
      <label className={styles.field}>
        <span>Sign type *</span>
        <select name="signType" required defaultValue="">
          <option value="" disabled>
            Choose...
          </option>
          <option value="channel-letters">Channel Letters</option>
          <option value="lightbox">Lightbox</option>
          <option value="facade-backlit">Facade / Backlit Panel</option>
          <option value="cove-strip">Cove / Strip Lighting</option>
          <option value="other">Other</option>
        </select>
      </label>
      <label className={styles.field}>
        <span>Sign dimensions *</span>
        <input type="text" name="dimensions" required placeholder="e.g. 4.0 m × 0.8 m, 150 mm deep" />
      </label>
      <label className={styles.field}>
        <span>Viewing distance</span>
        <input type="text" name="viewingDistance" placeholder="e.g. street level, 30 m" />
      </label>
      <label className={styles.field}>
        <span>Install location</span>
        <input type="text" name="location" placeholder="Indoor / Outdoor / Coastal / Tropical" />
      </label>
      <label className={`${styles.field} ${styles.fieldWide}`}>
        <span>Upload sketch / drawing (optional)</span>
        <span className={styles.dropZone}>
          <input
            type="file"
            name="sketch"
            accept="image/*,.pdf,.dwg,.svg"
            aria-describedby="sketch-hint"
            className={styles.dropInput}
            onChange={(e) => setSketchName(e.currentTarget.files?.[0]?.name ?? null)}
          />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
          <span className={styles.dropText}>
            {sketchName ?? 'Drop a photo, drawing or vector file'}
          </span>
          <small id="sketch-hint">JPG · PNG · PDF · DWG · SVG · up to 20 MB</small>
        </span>
      </label>
      <label className={`${styles.field} ${styles.fieldWide}`}>
        <span>Notes</span>
        <textarea name="notes" rows={3} placeholder="Brand colours, control / dimming requirements, deadline..." />
      </label>

      <HoneypotField />

      {TURNSTILE_SITE_KEY && (
        <div className={styles.fieldWide}>
          {/* the widget injects a hidden cf-turnstile-response input into the form */}
          <div className="cf-turnstile" data-sitekey={TURNSTILE_SITE_KEY} data-appearance="interaction-only" />
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
        </div>
      )}

      <div className={`${styles.fieldWide} ${styles.formActions}`}>
        <button type="submit" className="btn btn-primary" disabled={state === 'sending' || state === 'sent'}>
          {state === 'sending' ? 'Sending…' : 'Submit My Project'}
          <span className="btn-arrow">→</span>
        </button>
        <small>
          Or email <a href="mailto:contact@envolighting.com">contact@envolighting.com</a> directly.
        </small>
      </div>

      {state === 'sent' && (
        <div className={`${styles.fieldWide} ${styles.thanks}`} role="status">
          <strong>✓ Got it.</strong> We&apos;ll review your project and get back to you.
          For anything urgent, email <a href="mailto:contact@envolighting.com">contact@envolighting.com</a>.
        </div>
      )}
      {state === 'error' && (
        <div className={`${styles.fieldWide} ${styles.thanks}`} role="alert">
          <strong>Something went wrong.</strong> {serverError ? `${serverError}. ` : ''}Please try
          again, or email <a href="mailto:contact@envolighting.com">contact@envolighting.com</a>.
        </div>
      )}
    </form>
  )
}
