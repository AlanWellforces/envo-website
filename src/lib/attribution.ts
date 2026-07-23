// First-party lead attribution — cookieless, client-side only.
//
// Captured once per tab session (landing page, referrer, UTM params) and once
// ever (first-touch source), in Web Storage — no cookie, no cross-site id, in
// keeping with the site's privacy-light analytics. The values ride along ONLY
// when a visitor voluntarily submits a lead form (see attachAttribution), so
// nothing is collected passively beyond the existing pageview beacon.

const SESSION_KEY = 'envo_attr_session'
const FIRST_KEY = 'envo_attr_first'

export type LeadAttribution = {
  landingPage: string
  referrer: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
  firstTouchSource: string
}

const CAP = 512

function externalReferrer(): string {
  const ref = document.referrer
  if (!ref) return ''
  try {
    return new URL(ref).origin === window.location.origin ? '' : ref
  } catch {
    return ''
  }
}

function referrerHost(): string {
  const ref = externalReferrer()
  if (!ref) return ''
  try {
    return new URL(ref).hostname
  } catch {
    return ''
  }
}

/** Run once per page load; only writes on the first page of a session / first-ever visit. */
export function captureAttribution(): void {
  if (typeof window === 'undefined') return
  try {
    if (!sessionStorage.getItem(SESSION_KEY)) {
      const p = new URLSearchParams(window.location.search)
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          landingPage: (window.location.pathname + window.location.search).slice(0, CAP),
          referrer: externalReferrer().slice(0, CAP),
          utmSource: (p.get('utm_source') ?? '').slice(0, CAP),
          utmMedium: (p.get('utm_medium') ?? '').slice(0, CAP),
          utmCampaign: (p.get('utm_campaign') ?? '').slice(0, CAP),
        }),
      )
    }
    if (!localStorage.getItem(FIRST_KEY)) {
      const p = new URLSearchParams(window.location.search)
      const source = (p.get('utm_source') || referrerHost() || 'direct').slice(0, CAP)
      localStorage.setItem(FIRST_KEY, JSON.stringify({ source }))
    }
  } catch {
    // Storage blocked (private mode / disabled) — attribution simply stays empty.
  }
}

/** The attribution to submit with a lead. Empty strings when nothing was captured. */
export function getAttribution(): LeadAttribution {
  const empty: LeadAttribution = {
    landingPage: '',
    referrer: '',
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
    firstTouchSource: '',
  }
  if (typeof window === 'undefined') return empty
  try {
    const sess = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? '{}')
    const first = JSON.parse(localStorage.getItem(FIRST_KEY) ?? '{}')
    return {
      landingPage: sess.landingPage ?? '',
      referrer: sess.referrer ?? '',
      utmSource: sess.utmSource ?? '',
      utmMedium: sess.utmMedium ?? '',
      utmCampaign: sess.utmCampaign ?? '',
      firstTouchSource: first.source ?? '',
    }
  } catch {
    return empty
  }
}

/** Append the captured attribution onto an outgoing lead FormData. */
export function attachAttribution(form: FormData): void {
  const a = getAttribution()
  for (const [k, v] of Object.entries(a)) if (v) form.set(k, v)
}
