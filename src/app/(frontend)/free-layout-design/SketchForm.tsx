'use client'

import { useState } from 'react'
import styles from './page.module.css'

export function SketchForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [serverError, setServerError] = useState<string | null>(null)

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
      <label className={`${styles.field} ${styles.fieldWide}`}>
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
        <span>Sign dimensions (mm) *</span>
        <input type="text" name="dimensions" required placeholder="H × W × Depth, e.g. 600 × 1800 × 100" />
      </label>
      <label className={styles.field}>
        <span>Install location</span>
        <input type="text" name="location" placeholder="Indoor / Outdoor / Coastal / Tropical" />
      </label>
      <label className={`${styles.field} ${styles.fieldWide}`}>
        <span>Notes</span>
        <textarea name="notes" rows={3} placeholder="Brand colours, viewing distance, control / dimming requirements, deadline..." />
      </label>
      <label className={`${styles.field} ${styles.fieldWide}`}>
        <span>Upload sketch / drawing (optional)</span>
        <input type="file" name="sketch" accept="image/*,.pdf,.dwg,.svg" aria-describedby="sketch-hint" />
        <small id="sketch-hint">JPG · PNG · PDF · DWG · SVG up to 20 MB</small>
      </label>

      <div className={`${styles.fieldWide} ${styles.formActions}`}>
        <button type="submit" className="btn btn-primary" disabled={state === 'sending' || state === 'sent'}>
          {state === 'sending' ? 'Sending…' : 'Submit My Project'}
          <span className="btn-arrow">→</span>
        </button>
        <small>
          Or email <a href="mailto:contact@envo-led.com">contact@envo-led.com</a> directly.
        </small>
      </div>

      {state === 'sent' && (
        <div className={`${styles.fieldWide} ${styles.thanks}`} role="status">
          <strong>✓ Got it.</strong> We&apos;ll review your project and get back to you.
          For anything urgent, email <a href="mailto:contact@envo-led.com">contact@envo-led.com</a>.
        </div>
      )}
      {state === 'error' && (
        <div className={`${styles.fieldWide} ${styles.thanks}`} role="alert">
          <strong>Something went wrong.</strong> {serverError ? `${serverError}. ` : ''}Please try
          again, or email <a href="mailto:contact@envo-led.com">contact@envo-led.com</a>.
        </div>
      )}
    </form>
  )
}
