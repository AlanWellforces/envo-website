// Compact brand mark (admin.components.graphics.Icon) — shown in the admin
// header / loading states where the full wordmark doesn't fit.
import React from 'react'

export const BrandIcon: React.FC = () => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src="/assets/images/favicon.svg" alt="" style={{ width: 26, height: 26 }} />
)

export default BrandIcon
