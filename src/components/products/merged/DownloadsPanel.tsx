'use client'

// Downloads tab (2026-07-13 redesign) — THIS product's files only, one card
// per document with a type kicker (DATASHEET today; INSTALLATION GUIDE /
// PRODUCT CATALOGUE / COMPLIANCE cards slot in as those files land). Below,
// SKU pages carry an inline "Need other files?" request form instead of the
// old /contact jump — the request posts into the existing submissions
// pipeline (Payload lead + Mailgun notify) with the SKU attached.
import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { HoneypotField } from '@/components/forms/HoneypotField'
import { getAttribution } from '@/lib/attribution'

export type DownloadFile = {
  /** type kicker, e.g. "Datasheet" — falls back to "Document" */
  kind?: string
  name: string
  /** one-line contents note, e.g. "PDF · specifications, dimensions & wiring" */
  meta?: string
  href?: string
}

// The file types a visitor can ask for. Types already downloadable as cards
// are filtered out per page, so the dropdown only offers what's missing.
const REQUEST_TYPES = [
  'Installation guide',
  'Dimensional drawings',
  'Compliance certificates',
  'Product catalogue',
  'Other',
] as const

function RequestForm({ sku, options }: { sku: string; options: string[] }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fields = Object.fromEntries(new FormData(form).entries()) as Record<string, string>
    setState('sending')
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'contact',
          name: fields.name,
          email: fields.email,
          message: fields.message || undefined,
          sourcePath: window.location.pathname,
          // land in the lead's "Request details" + notification email
          requestedFile: fields.requestedFile,
          model: sku,
          // honeypot — forwarded so the API can drop bot fills
          website: fields.website || undefined,
          ...getAttribution(),
        }),
      })
      setState(res.ok ? 'sent' : 'error')
    } catch {
      setState('error')
    }
  }

  if (state === 'sent') {
    return (
      <div className="reqform">
        <p className="rf-title" role="status" aria-live="polite">
          Request received — thanks. Our engineers will send the files to your email.
        </p>
      </div>
    )
  }

  return (
    // method/action are the no-JS fallback: without them a submit defaults to
    // GET and would put name/email/message in the URL, history and referrer.
    <form className="reqform" method="post" action="/api/submissions" onSubmit={handleSubmit}>
      <HoneypotField />
      <p className="rf-title">
        Need other files for <span className="rf-sku">{sku}</span>?
      </p>
      <div className="rf-fields">
        <select name="requestedFile" aria-label="File needed" required defaultValue="">
          <option value="" disabled>
            File needed…
          </option>
          {options.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input type="text" name="name" placeholder="Name" aria-label="Name" required />
        <input type="email" name="email" placeholder="Work email" aria-label="Work email" required />
        <textarea
          name="message"
          aria-label="Message"
          placeholder="Message (optional) — anything else we should know about your project?"
        />
      </div>
      <div className="rf-send">
        <p className="rf-fine">
          Our engineers will send the files to your email. Prefer to write?{' '}
          <a href="mailto:contact@envolighting.com">contact@envolighting.com</a>
        </p>
        <button type="submit" disabled={state === 'sending'}>
          {state === 'sending' ? 'Sending…' : 'Send request'}
        </button>
      </div>
      {state === 'error' && (
        <p className="rf-error" role="alert">
          Something went wrong — please try again, or email contact@envolighting.com.
        </p>
      )}
    </form>
  )
}

export function DownloadsPanel({ files, requestSku }: { files: DownloadFile[]; requestSku?: string }) {
  return (
    <div className="downloads">
      {files.length > 0 && (
        <div className="file-cards">
          {files.map((f) => (
            <a
              key={f.name}
              className="fcard"
              href={f.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg className="pdf-ico" viewBox="0 0 24 24" aria-hidden>
                <path
                  d="M6 2h8.5L20 7.5V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
                  fill="none"
                  stroke="#e5252a"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
                <path d="M14.5 2v5.5H20" fill="none" stroke="#e5252a" strokeWidth="1.7" strokeLinejoin="round" />
                <text x="12" y="17.5" textAnchor="middle" fontSize="6.5" fontWeight="800" fill="#e5252a">
                  PDF
                </text>
              </svg>
              <span className="fc-bd">
                <span className="fc-kick">{f.kind ?? 'Document'}</span>
                <span className="fc-nm">{f.name}</span>
                {f.meta && <span className="fc-mt">{f.meta}</span>}
              </span>
              <span className="fc-dl" aria-hidden>
                ↓
              </span>
            </a>
          ))}
        </div>
      )}
      {requestSku ? (
        <RequestForm
          sku={requestSku}
          // only offer types the page can't already serve as a download card
          options={REQUEST_TYPES.filter((t) => !files.some((f) => f.kind === t))}
        />
      ) : (
        // series pages keep the classic contact line under the cards
        <p className="dl-contact">
          Need installation guides, drawings or compliance certificates?{' '}
          <Link href="/contact">Request files →</Link>
        </p>
      )}
    </div>
  )
}
