'use client'

// Formats the upload's byte count as human-readable KB/MB (Shopify-style).
// Used by the `fileSize` ui field in collections/Media.ts.

import React from 'react'
import type { DefaultCellComponentProps } from 'payload'

const formatBytes = (bytes?: number): string => {
  if (typeof bytes !== 'number' || Number.isNaN(bytes)) return '—'
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${bytes} B`
}

export const MediaFileSizeCell: React.FC<DefaultCellComponentProps> = ({ rowData }) => {
  const data = rowData as { filesize?: number } | undefined
  return <span>{formatBytes(data?.filesize)}</span>
}

export default MediaFileSizeCell
