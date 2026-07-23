'use client'

// Renders a row's createdAt in Pacific/Auckland (the team's timezone) for the
// Submissions list. Payload's built-in date columns render in the viewer's
// local time; the whole admin standardises on NZ time (see Dashboard.tsx).

import React from 'react'
import type { DefaultCellComponentProps } from 'payload'

const TZ = 'Pacific/Auckland'

export const NzDateCell: React.FC<DefaultCellComponentProps> = ({ rowData }) => {
  const iso = (rowData as { createdAt?: string } | undefined)?.createdAt
  if (!iso) return <span>—</span>
  const d = new Date(iso)
  const label = d.toLocaleString('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: TZ,
  })
  return <span title={`${label} (NZ)`}>{label}</span>
}

export default NzDateCell
