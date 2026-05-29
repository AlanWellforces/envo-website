'use client'

// Renders the post's cover image as a small thumbnail in the Posts list view.
// Used by the `coverPreview` ui field in collections/Posts.ts.
// `cover` is an upload relationship, so in list rows it arrives populated as a
// media doc (or null for an unsaved draft).
//
// When this is the FIRST (linked) column, Payload sets `link: true` but does
// NOT wrap a custom Cell in a link — so we render the link ourselves, keeping
// the thumbnail-first layout while staying clickable into the edit view.

import React from 'react'
import type { DefaultCellComponentProps } from 'payload'
import { EditLink } from './EditLink.tsx'

const THUMB_STYLE: React.CSSProperties = {
  width: 48,
  height: 32,
  objectFit: 'cover',
  borderRadius: 6,
  display: 'block',
  background: 'var(--theme-elevation-100)',
  border: '1px solid var(--theme-elevation-150)',
}

export const PostCoverCell: React.FC<DefaultCellComponentProps> = ({ rowData, collectionSlug }) => {
  const cover = (rowData as { cover?: unknown } | undefined)?.cover
  const media =
    cover && typeof cover === 'object'
      ? (cover as { url?: string; thumbnailURL?: string; sizes?: { thumbnail?: { url?: string } } })
      : undefined

  const src = media?.sizes?.thumbnail?.url ?? media?.thumbnailURL ?? media?.url

  if (!src) {
    return <span style={{ color: 'var(--theme-elevation-400)' }}>—</span>
  }

  const id = (rowData as { id?: string | number } | undefined)?.id

  return (
    <EditLink collectionSlug={collectionSlug} id={id}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" style={THUMB_STYLE} />
    </EditLink>
  )
}

export default PostCoverCell
