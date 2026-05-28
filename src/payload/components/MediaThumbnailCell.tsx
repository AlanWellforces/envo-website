'use client'

// Renders a small image preview in the Media list view.
// Used by the `preview` ui field in collections/Media.ts.

import React from 'react'
import type { DefaultCellComponentProps } from 'payload'

export const MediaThumbnailCell: React.FC<DefaultCellComponentProps> = ({ rowData }) => {
  const data = rowData as
    | { url?: string; thumbnailURL?: string; alt?: string; sizes?: { thumbnail?: { url?: string } } }
    | undefined

  const src = data?.sizes?.thumbnail?.url ?? data?.thumbnailURL ?? data?.url

  if (!src) {
    return <span style={{ color: 'var(--theme-elevation-400)' }}>—</span>
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={data?.alt ?? ''}
      style={{
        width: 36,
        height: 36,
        objectFit: 'cover',
        borderRadius: 6,
        display: 'block',
        background: 'var(--theme-elevation-100)',
        border: '1px solid var(--theme-elevation-150)',
      }}
    />
  )
}

export default MediaThumbnailCell
