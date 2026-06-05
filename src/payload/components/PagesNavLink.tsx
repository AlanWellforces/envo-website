'use client'

import React from 'react'
import { Link } from '@payloadcms/ui'

// Sidebar entry that opens the custom Pages overview view.
export function PagesNavLink() {
  return (
    <Link href="/admin/pages-overview" className="nav__link">
      Pages
    </Link>
  )
}

export default PagesNavLink
