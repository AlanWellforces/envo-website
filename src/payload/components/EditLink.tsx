'use client'

// Wraps list-cell content in a link to the document's edit view.
// Payload only auto-links the first column's *default* cell, so custom Cells
// (thumbnails, linked text) render their own link via this helper to stay
// clickable regardless of column position.

import React from 'react'
import { Link, useConfig } from '@payloadcms/ui'

export const EditLink: React.FC<{
  collectionSlug: string
  id: string | number | undefined
  children: React.ReactNode
}> = ({ collectionSlug, id, children }) => {
  const { config } = useConfig()

  if (id == null) return <>{children}</>

  const href = `${config.routes.admin}/collections/${collectionSlug}/${encodeURIComponent(String(id))}`
  return <Link href={href}>{children}</Link>
}

export default EditLink
