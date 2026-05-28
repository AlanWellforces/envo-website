'use client'

// Renders a small image preview in the Media list view.
// Used by the `preview` ui field in collections/Media.ts.
//
// When this is the FIRST (linked) column, Payload sets `link: true` but does
// NOT wrap a custom Cell in a link — so we render the link ourselves, keeping
// the thumbnail-first layout while staying clickable into the edit view.

import React from 'react'
import { Link, useConfig } from '@payloadcms/ui'
import type { DefaultCellComponentProps } from 'payload'

const THUMB_STYLE: React.CSSProperties = {
  width: 36,
  height: 36,
  objectFit: 'cover',
  borderRadius: 6,
  display: 'block',
  background: 'var(--theme-elevation-100)',
  border: '1px solid var(--theme-elevation-150)',
}

export const MediaThumbnailCell: React.FC<DefaultCellComponentProps> = ({ rowData, collectionSlug, link }) => {
  const { config } = useConfig()

  const data = rowData as
    | { id?: string | number; url?: string; thumbnailURL?: string; alt?: string; sizes?: { thumbnail?: { url?: string } } }
    | undefined

  const src = data?.sizes?.thumbnail?.url ?? data?.thumbnailURL ?? data?.url

  if (!src) {
    return <span style={{ color: 'var(--theme-elevation-400)' }}>—</span>
  }

  // eslint-disable-next-line @next/next/no-img-element
  const img = <img src={src} alt={data?.alt ?? ''} style={THUMB_STYLE} />

  if (link && data?.id != null) {
    const href = `${config.routes.admin}/collections/${collectionSlug}/${encodeURIComponent(String(data.id))}`
    return <Link href={href}>{img}</Link>
  }

  return img
}

export default MediaThumbnailCell
