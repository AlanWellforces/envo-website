'use client'

import { useState } from 'react'
import styles from './page.module.css'
import { HoneypotField } from '@/components/forms/HoneypotField'

export function ContactForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState('sending')
    const form = new FormData(e.currentTarget)
    form.set('type', 'contact')
    form.set('sourcePath', '/contact')
    try {
      const res = await fetch('/api/submissions', { method: 'POST', body: form })
      setState(res.ok ? 'sent' : 'error')
    } catch {
      setState('error')
    }
  }

  if (state === 'sent') {
    return (
      <div className={styles.sent}>
        Thanks — your message has been received. For anything urgent, reach us at{' '}
        <a href="mailto:contact@envolighting.com">contact@envolighting.com</a> or 888.228.9138.
      </div>
    )
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <HoneypotField />
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
      <button className={styles.submit} type="submit" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : 'Send message'}
      </button>
      {state === 'error' && (
        <p className={styles.note}>
          Something went wrong — please email{' '}
          <a href="mailto:contact@envolighting.com">contact@envolighting.com</a> directly.
        </p>
      )}
    </form>
  )
}
