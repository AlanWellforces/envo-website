'use client'

// Thumbnail-first column for the Solutions list view (same convention as
// Posts/Projects cover cells). A solution's card image is either a Media
// upload OR a repo-asset path fallback (`imagePath`) — show whichever wins,
// matching the frontend's resolution order. Renders its own EditLink because
// Payload doesn't wrap custom Cells in the first-column link.

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

export const SolutionThumbCell: React.FC<DefaultCellComponentProps> = ({ rowData, collectionSlug }) => {
  const row = rowData as
    | { id?: string | number; image?: unknown; imagePath?: string | null }
    | undefined
  const media =
    row?.image && typeof row.image === 'object'
      ? (row.image as { url?: string; thumbnailURL?: string; sizes?: { thumbnail?: { url?: string } } })
      : undefined

  const src = media?.sizes?.thumbnail?.url ?? media?.thumbnailURL ?? media?.url ?? row?.imagePath

  if (!src) {
    return <span style={{ color: 'var(--theme-elevation-400)' }}>—</span>
  }

  return (
    <EditLink collectionSlug={collectionSlug} id={row?.id}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" style={THUMB_STYLE} />
    </EditLink>
  )
}

export default SolutionThumbCell
