'use client'

// Shopify-style "File name" cell: filename on top, file format below in muted text.
// Used by the `fileName` ui field in collections/Media.ts.

import React from 'react'
import type { DefaultCellComponentProps } from 'payload'

const formatLabel = (mimeType?: string, filename?: string): string => {
  const sub = mimeType?.includes('/') ? mimeType.split('/')[1] : undefined
  if (sub) return sub === 'jpeg' ? 'JPG' : sub.toUpperCase()
  const ext = filename?.includes('.') ? filename.split('.').pop() : undefined
  return ext ? ext.toUpperCase() : ''
}

export const MediaFileNameCell: React.FC<DefaultCellComponentProps> = ({ rowData }) => {
  const data = rowData as { filename?: string; mimeType?: string } | undefined
  const label = formatLabel(data?.mimeType, data?.filename)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, lineHeight: 1.3 }}>
      <span style={{ fontWeight: 500 }}>{data?.filename ?? '—'}</span>
      {label && (
        <span style={{ fontSize: 11, letterSpacing: '0.04em', color: 'var(--theme-elevation-400)' }}>
          {label}
        </span>
      )}
    </div>
  )
}

export default MediaFileNameCell
