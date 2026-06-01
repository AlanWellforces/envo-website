import Image from 'next/image'
import type { ProjectGalleryItem } from '@/lib/projects'

type Props = { items: ProjectGalleryItem[] }

export function ProjectGallery({ items }: Props) {
  if (items.length === 0) return null

  return (
    <section className="project-gallery">
      <div className="project-gallery-grid">
        {items.map((it, idx) => {
          const url = typeof it.image === 'string' ? it.image : it.image?.url
          const altFromImage =
            typeof it.image === 'object' && it.image?.alt ? it.image.alt : undefined
          const alt = it.caption ?? altFromImage ?? `Project photo ${idx + 1}`
          if (!url) return null
          return (
            <figure key={idx} className="project-gallery-figure">
              <Image
                src={url}
                alt={alt}
                width={1200}
                height={800}
                sizes="(min-width: 900px) 50vw, 100vw"
              />
              {it.caption && (
                <figcaption className="project-gallery-caption">{it.caption}</figcaption>
              )}
            </figure>
          )
        })}
      </div>
    </section>
  )
}
