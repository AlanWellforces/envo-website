'use client'

import React from 'react'
import { Link } from '@payloadcms/ui'

// Sidebar entry that opens the custom Pages overview view (read-only table of
// every site route + its SEO status). Named "Site Overview" to avoid clashing
// with the Content → Pages collection. The id keys its nav icon (AdminStyles).
export function PagesNavLink() {
  return (
    <Link href="/admin/pages-overview" className="nav__link" id="nav-pages-overview">
      <span className="nav__link-label">Site Overview</span>
    </Link>
  )
}

export default PagesNavLink
