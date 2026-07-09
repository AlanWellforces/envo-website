// Login-page logo (admin.components.graphics.Logo). Payload renders this
// above the login form in place of its default wordmark.
import React from 'react'

export const BrandLogo: React.FC = () => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src="/assets/images/logo-envo.svg" alt="ENVO" style={{ width: 148, height: 'auto' }} />
)

export default BrandLogo
