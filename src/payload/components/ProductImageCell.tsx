'use client'

import React from 'react'
import type { DefaultCellComponentProps } from 'payload'
import { EditLink } from './EditLink.tsx'

const THUMB_STYLE: React.CSSProperties = {
  width: 36,
  height: 36,
  objectFit: 'contain',
  borderRadius: 6,
  display: 'block',
  background: 'var(--theme-elevation-100)',
  border: '1px solid var(--theme-elevation-150)',
}

export const ProductImageCell: React.FC<DefaultCellComponentProps> = ({ rowData, collectionSlug }) => {
  const data = rowData as
    | { id?: string | number; clean_image_url_fallback?: string | null; image_url_fallback?: string | null; name?: string }
    | undefined

  const src = data?.clean_image_url_fallback ?? data?.image_url_fallback

  if (!src) {
    return <span style={{ color: 'var(--theme-elevation-400)' }}>—</span>
  }

  return (
    <EditLink collectionSlug={collectionSlug} id={data?.id}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={data?.name ?? ''} style={THUMB_STYLE} />
    </EditLink>
  )
}

export default ProductImageCell
