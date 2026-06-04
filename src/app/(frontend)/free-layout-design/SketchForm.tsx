'use client'

import { useState } from 'react'
import styles from './page.module.css'

export function SketchForm() {
  const [sent, setSent] = useState(false)

  return (
    <form
      className={styles.formGrid}
      onSubmit={(e) => {
        e.preventDefault()
        setSent(true)
      }}
    >
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
        <select name="type" required defaultValue="">
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
        <button type="submit" className="btn btn-primary" disabled={sent}>
          Submit My Project
          <span className="btn-arrow">→</span>
        </button>
        <small>
          Or email <a href="mailto:contact@envo.com">contact@envo.com</a> directly.
        </small>
      </div>

      {sent && (
        <div className={`${styles.fieldWide} ${styles.thanks}`} role="status">
          <strong>✓ Got it.</strong> We&apos;ll review your project and reply within 24 hours.
          For anything urgent, email <a href="mailto:contact@envo.com">contact@envo.com</a>.
        </div>
      )}
    </form>
  )
}
