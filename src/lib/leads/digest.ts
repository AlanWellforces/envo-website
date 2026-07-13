// Daily "unhandled leads" reminder (audit item 5, 2026-07-13). Pure text
// assembly — the /api/leads-digest route queries and sends.

export type DigestLead = {
  id: number | string
  name?: string | null
  email?: string | null
  type?: string | null
  sourcePath?: string | null
  createdAt?: string | null
  notify?: string | null
}

export function buildDigestEmail(
  leads: DigestLead[],
  siteUrl: string,
): { subject: string; text: string } {
  const n = leads.length
  const subject = `ENVO leads reminder — ${n} lead${n === 1 ? '' : 's'} still marked New after 24 h`
  const lines = leads.map((l) => {
    const when = l.createdAt ? new Date(l.createdAt).toISOString().slice(0, 16).replace('T', ' ') : '—'
    const flag = l.notify === 'failed' ? ' ⚠ email notification had FAILED' : ''
    return `- ${when} · ${l.name ?? '—'} <${l.email ?? '—'}> · ${l.type ?? '—'}${l.sourcePath ? ` · from ${l.sourcePath}` : ''}${flag}`
  })
  const text = [
    `${n} lead${n === 1 ? '' : 's'} submitted more than 24 hours ago ${n === 1 ? 'is' : 'are'} still marked "New":`,
    '',
    ...lines,
    '',
    `Review and update them here: ${siteUrl}/admin/collections/submissions`,
    `(Mark handled leads as Contacted or Archived to clear them from this reminder.)`,
  ].join('\n')
  return { subject, text }
}
