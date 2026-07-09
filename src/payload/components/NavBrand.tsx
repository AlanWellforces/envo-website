// Top of the admin nav — ENVO logo + a Dashboard link, matching the
// Editorial Bold mockup. Wired as admin.components.beforeNavLinks so it
// renders above the collection groups inside Payload's default Nav.
import React from 'react'
import Link from 'next/link'

export const NavBrand: React.FC = () => (
  <div className="nav-brand">
    <Link href="/admin" className="nav-brand__logo">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/images/logo-envo.svg" alt="ENVO" />
    </Link>
    <Link href="/admin" className="nav__link" id="nav-dashboard">
      <span className="nav__link-label">Dashboard</span>
    </Link>
  </div>
)

export default NavBrand
