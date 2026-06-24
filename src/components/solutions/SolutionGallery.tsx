'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { GalleryImage } from '@/data/solutions'

/** Main image + thumbnail strip; clicking a thumb swaps the main image. */
export function SolutionGallery({ images }: { images: GalleryImage[] }) {
  const [active, setActive] = useState(0)
  if (images.length === 0) return null
  const main = images[active] ?? images[0]

  return (
    <div className="sd-gallery">
      <div className="sd-gal-main">
        <Image src={main.src} alt={main.alt} fill sizes="(min-width: 900px) 50vw, 100vw" />
      </div>
      {images.length > 1 && (
        <div className="sd-gal-thumbs">
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              className={i === active ? 'sd-thumb is-active' : 'sd-thumb'}
              onClick={() => setActive(i)}
              aria-label={`Show: ${img.alt}`}
            >
              <Image src={img.src} alt="" width={160} height={100} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
