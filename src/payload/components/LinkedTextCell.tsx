'use client'

// Renders a field's text value as a link into the edit view — so the title
// (or any text column) is clickable even when it isn't the first column.
// Attach via a field's admin.components.Cell.

import React from 'react'
import type { DefaultCellComponentProps } from 'payload'
import { EditLink } from './EditLink.tsx'

export const LinkedTextCell: React.FC<DefaultCellComponentProps> = ({ cellData, rowData, collectionSlug }) => {
  const text = cellData == null || cellData === '' ? '—' : String(cellData)
  const id = (rowData as { id?: string | number } | undefined)?.id

  return (
    <EditLink collectionSlug={collectionSlug} id={id}>
      {text}
    </EditLink>
  )
}

export default LinkedTextCell
