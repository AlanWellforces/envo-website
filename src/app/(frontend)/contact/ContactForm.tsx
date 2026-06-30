'use client'

import { useState } from 'react'
import styles from './page.module.css'

// Demo-only form — no backend yet. Real submission (Resend) is a follow-up;
// it currently shows a confirmation and does not send. Actionable contact
// details (phone/email) live alongside in the page panel.
export function ContactForm() {
  const [sent, setSent] = useState(false)

  if (sent) {
    return (
      <div className={styles.sent}>
        Thanks — your message is noted. (This form is a demo; for now please reach us directly at{' '}
        <a href="mailto:contact@envo-led.com">contact@envo-led.com</a> or 888.228.9138.)
      </div>
    )
  }

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault()
        setSent(true)
      }}
    >
      <div className={styles.row2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="cf-name">Name</label>
          <input className={styles.input} id="cf-name" name="name" required />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="cf-company">Company</label>
          <input className={styles.input} id="cf-company" name="company" />
        </div>
      </div>
      <div className={styles.row2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="cf-email">Email</label>
          <input className={styles.input} id="cf-email" name="email" type="email" required />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="cf-phone">Phone</label>
          <input className={styles.input} id="cf-phone" name="phone" type="tel" />
        </div>
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="cf-message">Message</label>
        <textarea className={styles.textarea} id="cf-message" name="message" required />
      </div>
      <button className={styles.submit} type="submit">Send message</button>
      <p className={styles.note}>We usually reply within one business day.</p>
    </form>
  )
}
