'use client'

// Visual preview of the Akeneo-hosted product images in the product edit
// view. The binaries stay on Akeneo's S3 — this only renders the existing
// image_url_fallback / clean_image_url_fallback URLs, with a click-to-enlarge
// lightbox (Esc or click to close).

import React, { useCallback, useEffect, useState } from 'react'
import { useFormFields } from '@payloadcms/ui'

const CARD_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}

const IMG_STYLE: React.CSSProperties = {
  width: 180,
  height: 180,
  objectFit: 'contain',
  borderRadius: 8,
  background: 'var(--theme-elevation-50)',
  border: '1px solid var(--theme-elevation-150)',
  cursor: 'zoom-in',
  display: 'block',
}

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--theme-elevation-500)',
}

const OVERLAY_STYLE: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 200,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0, 0, 0, 0.75)',
  cursor: 'zoom-out',
}

const OVERLAY_IMG_STYLE: React.CSSProperties = {
  maxWidth: '90vw',
  maxHeight: '90vh',
  objectFit: 'contain',
  background: '#fff',
  borderRadius: 8,
}

export const ProductImagePreview: React.FC = () => {
  const imageUrl = useFormFields(([fields]) => fields.image_url_fallback?.value as string | undefined)
  const cleanImageUrl = useFormFields(
    ([fields]) => fields.clean_image_url_fallback?.value as string | undefined,
  )
  const [enlarged, setEnlarged] = useState<string | null>(null)

  const close = useCallback(() => setEnlarged(null), [])

  useEffect(() => {
    if (!enlarged) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [enlarged, close])

  const previews = [
    { label: 'Akeneo image', src: imageUrl },
    { label: 'Akeneo clean image', src: cleanImageUrl },
  ].filter((p): p is { label: string; src: string } => Boolean(p.src))

  if (previews.length === 0) {
    return <span style={LABEL_STYLE}>No Akeneo images for this product.</span>
  }

  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
      {previews.map(({ label, src }) => (
        <div key={label} style={CARD_STYLE}>
          <span style={LABEL_STYLE}>{label}</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={label} style={IMG_STYLE} onClick={() => setEnlarged(src)} />
        </div>
      ))}
      {enlarged && (
        <div style={OVERLAY_STYLE} onClick={close} role="dialog" aria-label="Image preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={enlarged} alt="" style={OVERLAY_IMG_STYLE} />
        </div>
      )}
    </div>
  )
}

export default ProductImagePreview
