'use client'

// Renders the post's cover image as a small thumbnail in the Posts list view.
// Used by the `coverPreview` ui field in collections/Posts.ts.
// `cover` is an upload relationship, so in list rows it arrives populated as a
// media doc (or null for an unsaved draft).

import React from 'react'
import type { DefaultCellComponentProps } from 'payload'

export const PostCoverCell: React.FC<DefaultCellComponentProps> = ({ rowData }) => {
  const cover = (rowData as { cover?: unknown } | undefined)?.cover
  const media =
    cover && typeof cover === 'object'
      ? (cover as { url?: string; thumbnailURL?: string; sizes?: { thumbnail?: { url?: string } } })
      : undefined

  const src = media?.sizes?.thumbnail?.url ?? media?.thumbnailURL ?? media?.url

  if (!src) {
    return <span style={{ color: 'var(--theme-elevation-400)' }}>—</span>
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      style={{
        width: 48,
        height: 32,
        objectFit: 'cover',
        borderRadius: 6,
        display: 'block',
        background: 'var(--theme-elevation-100)',
        border: '1px solid var(--theme-elevation-150)',
      }}
    />
  )
}

export default PostCoverCell
