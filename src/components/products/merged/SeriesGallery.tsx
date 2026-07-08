'use client'

// Interactive series gallery (user request 2026-07-06): clicking a thumbnail
// swaps it into the stage; the stage zooms into a full-screen lightbox.
// Default stage = the combined collection view (all variants side by side);
// clicking the active thumb again returns to it.

import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

type Img = { src: string; local: boolean; alt: string }
export type GalleryStageItem = Img & { caption?: string }
export type GalleryThumb = Img & { cover?: boolean; label?: string }

// Everything in the gallery (stage + thumbs) sits above the fold — the stage
// is usually the page's LCP. All instances must be eager: Next tracks LCP
// candidates by src, and a lazy thumb of the same file would shadow the eager
// stage entry and re-trigger the dev LCP warning.
function Pic({ img, sizes }: { img: Img; sizes: string }) {
  return <Image src={img.src} alt={img.alt} width={300} height={220} sizes={sizes} loading="eager" />
}

const ZoomIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3M11 8v6M8 11h6" />
  </svg>
)

export function SeriesGallery({
  beadtag,
  stage,
  thumbs,
}: {
  beadtag?: string
  /** default combined view — every variant with its caption */
  stage: GalleryStageItem[]
  thumbs?: GalleryThumb[]
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const [lightbox, setLightbox] = useState(false)

  const current: GalleryStageItem | null =
    selected != null && thumbs?.[selected]
      ? { ...thumbs[selected], caption: thumbs[selected].label }
      : stage.length === 1
        ? stage[0]
        : null

  const close = useCallback(() => setLightbox(false), [])
  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [lightbox, close])

  // Lightbox shows the current single image, or the first variant in
  // combined mode (there is always at least one stage item).
  const zoomTarget = current ?? stage[0]

  return (
    <div className="gallery">
      <div className="gstage zoomable">
        {beadtag && <span className="beadtag">{beadtag}</span>}
        <button
          type="button"
          className="gzoom"
          aria-label="Enlarge image"
          onClick={() => setLightbox(true)}
        >
          <ZoomIcon />
        </button>
        {current ? (
          <button type="button" className="gsingle" onClick={() => setLightbox(true)} aria-label={`Enlarge ${current.alt}`}>
            <Pic img={current} sizes="480px" />
            {current.caption && <span className="gsingle-cap">{current.caption}</span>}
          </button>
        ) : (
          <div className="collset">
            {stage.map((s, i) => (
              <figure key={i}>
                <Pic img={s} sizes="120px" />
                {s.caption && <figcaption>{s.caption}</figcaption>}
              </figure>
            ))}
          </div>
        )}
      </div>

      {thumbs && thumbs.length > 0 && (
        <div className="thumbs">
          {/* first tile = the combined main view (user 2026-07-06) */}
          {stage.length > 1 && (
            <figure className="thumb-fig">
              <button
                type="button"
                className={`t all${selected === null ? ' on' : ''}`}
                aria-pressed={selected === null}
                aria-label="Show all models"
                onClick={() => setSelected(null)}
              >
                {stage.slice(0, 3).map((s, i) => (
                  <Pic key={i} img={s} sizes="40px" />
                ))}
              </button>
              <figcaption>All models</figcaption>
            </figure>
          )}
          {thumbs.map((t, i) => (
            <figure key={i} className="thumb-fig">
              <button
                type="button"
                className={`t${t.cover ? ' cover' : ''}${selected === i ? ' on' : ''}`}
                aria-pressed={selected === i}
                aria-label={`Show ${t.label ?? t.alt}`}
                onClick={() => setSelected(selected === i ? null : i)}
              >
                <Pic img={t} sizes="90px" />
              </button>
              {t.label && <figcaption>{t.label}</figcaption>}
            </figure>
          ))}
        </div>
      )}

      {/* Portaled to <body>: ancestors (sidebar layout, sticky gallery) create
          stacking contexts that would trap the overlay under the region
          banner (z-index 300) no matter how high its own z-index is. */}
      {lightbox &&
        createPortal(
          <div className="glightbox" role="dialog" aria-modal="true" aria-label={zoomTarget.alt} onClick={close}>
            <button type="button" className="glb-close" aria-label="Close" onClick={close}>
              ×
            </button>
            <div className="glb-body" onClick={(e) => e.stopPropagation()}>
              {/* plain <img>: source may be the non-whitelist-optimised S3 host,
                  and the lightbox wants the original at full size anyway */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={zoomTarget.src} alt={zoomTarget.alt} />
              {zoomTarget.caption && <div className="glb-cap">{zoomTarget.caption}</div>}
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
