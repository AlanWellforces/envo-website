import React from 'react'
import { groupedSitePages } from '@/data/site-pages'

// Custom Payload admin view at /admin/pages-overview. Server Component.
export function PagesOverview() {
  const groups = groupedSitePages()
  return (
    <div style={{ padding: '2rem', maxWidth: 1000 }}>
      <h1 style={{ marginBottom: 4 }}>Pages</h1>
      <p style={{ opacity: 0.7, marginBottom: 24 }}>
        Every site page and where it&apos;s edited. Page bodies live in code; SEO is editable per row.
      </p>
      {groups.map((g) => (
        <section key={g.section} style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.6, marginBottom: 8 }}>
            {g.section}
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--theme-elevation-150)' }}>
                <th style={{ padding: '6px 8px' }}>Page</th>
                <th style={{ padding: '6px 8px' }}>Route</th>
                <th style={{ padding: '6px 8px' }}>Type</th>
                <th style={{ padding: '6px 8px' }}>Edit</th>
              </tr>
            </thead>
            <tbody>
              {g.pages.map((p) => (
                <tr key={p.route} style={{ borderBottom: '1px solid var(--theme-elevation-100)' }}>
                  <td style={{ padding: '6px 8px' }}>{p.label}</td>
                  <td style={{ padding: '6px 8px' }}>
                    <a href={p.route} target="_blank" rel="noopener noreferrer">{p.route} ↗</a>
                  </td>
                  <td style={{ padding: '6px 8px' }}>{p.source === 'cms' ? '🟢 CMS' : '⚪ Code'}</td>
                  <td style={{ padding: '6px 8px' }}>
                    {p.editHref ? <a href={p.editHref}>{p.source === 'cms' ? 'Edit content' : 'Edit SEO'} ✎</a> : 'Git'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  )
}

export default PagesOverview
