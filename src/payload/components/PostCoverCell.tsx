'use client'

// Renders the post's cover image as a small thumbnail in the Posts list view.
// Used by the `coverPreview` ui field in collections/Posts.ts.
//
// Payload 3 hands list cells their rowData UNPOPULATED (depth 0 regardless of
// the page URL's depth param), so `cover` arrives as a media ID — the cell
// fetches the media doc itself over the authenticated admin REST API. A
// populated object is still handled first in case a future Payload version
// populates list rows again.
//
// When this is the FIRST (linked) column, Payload sets `link: true` but does
// NOT wrap a custom Cell in a link — so we render the link ourselves, keeping
// the thumbnail-first layout while staying clickable into the edit view.

import React, { useEffect, useState } from 'react'
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

type MediaLike = { url?: string; thumbnailURL?: string; sizes?: { thumbnail?: { url?: string } } }

// One list render fires a cell per row — cache media lookups per session so
// paging back and forth doesn't refetch the same covers.
const mediaCache = new Map<string | number, Promise<MediaLike | null>>()

function fetchMedia(id: string | number): Promise<MediaLike | null> {
  let p = mediaCache.get(id)
  if (!p) {
    p = fetch(`/api/media/${id}?depth=0`, { credentials: 'include' })
      .then((r) => (r.ok ? (r.json() as Promise<MediaLike>) : null))
      .catch(() => null)
    mediaCache.set(id, p)
  }
  return p
}

export const PostCoverCell: React.FC<DefaultCellComponentProps> = ({ rowData, collectionSlug }) => {
  const cover = (rowData as { cover?: unknown } | undefined)?.cover
  const populated = cover && typeof cover === 'object' ? (cover as MediaLike) : undefined
  const coverId =
    typeof cover === 'number' || (typeof cover === 'string' && cover) ? (cover as string | number) : undefined

  const [fetched, setFetched] = useState<MediaLike | null>(null)
  useEffect(() => {
    if (populated || coverId === undefined) return
    let live = true
    fetchMedia(coverId).then((m) => {
      if (live) setFetched(m)
    })
    return () => {
      live = false
    }
  }, [populated, coverId])

  const media = populated ?? fetched ?? undefined
  const src = media?.sizes?.thumbnail?.url ?? media?.thumbnailURL ?? media?.url
  const id = (rowData as { id?: string | number } | undefined)?.id

  if (!src) {
    // No cover on the post at all → quiet dash; cover still loading → keep the
    // cell shape stable with an empty placeholder box.
    if (coverId === undefined && !populated) {
      return <span style={{ color: 'var(--theme-elevation-400)' }}>—</span>
    }
    return (
      <EditLink collectionSlug={collectionSlug} id={id}>
        <span style={THUMB_STYLE} />
      </EditLink>
    )
  }

  return (
    <EditLink collectionSlug={collectionSlug} id={id}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" style={THUMB_STYLE} />
    </EditLink>
  )
}

export default PostCoverCell
