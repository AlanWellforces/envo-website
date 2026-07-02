// Payload accessors for the Solutions collection. Maps docs to the same
// `Solution` shape the /solutions pages have always consumed (previously the
// hardcoded src/data/solutions.ts, which is now only the seed source).
import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Solution as SolutionDoc, Media } from '@/payload-types'
import type { Solution, KitItem, GalleryImage } from '@/data/solutions'

export type { Solution, KitItem, GalleryImage }

/** Uploaded media URL if present, else the repo-asset path fallback. */
function resolveImg(upload: number | Media | null | undefined, path: string | null | undefined): string {
  if (upload && typeof upload === 'object' && upload.url) return upload.url
  return path ?? ''
}

function mapDoc(doc: SolutionDoc): Solution {
  return {
    slug: doc.slug,
    href: `/solutions/${doc.slug}`,
    name: doc.name,
    shortDesc: doc.shortDesc ?? '',
    longDesc: doc.longDesc ?? '',
    img: resolveImg(doc.image, doc.imagePath),
    eyebrow: doc.eyebrow ?? '',
    heroTitle: doc.heroTitle,
    heroDesc: doc.heroDesc ?? '',
    checklist: (doc.checklist ?? []).map((c) => c.text),
    gallery: (doc.gallery ?? []).map(
      (g): GalleryImage => ({ src: resolveImg(g.image, g.imagePath), alt: g.alt }),
    ),
    kitHeading: doc.kitHeading ?? '',
    kitLede: doc.kitLede ?? '',
    kit: (doc.kit ?? []).map(
      (k): KitItem => ({
        envo: k.envo ?? true,
        role: k.role,
        name: k.name,
        desc: k.desc ?? '',
        img: resolveImg(k.image, k.imagePath),
        spec: (k.specs ?? []).map((s): [string, string] => [s.label, s.value]),
        ...(k.href ? { href: k.href } : {}),
      }),
    ),
  }
}

/** All published solutions, in `order`. cache() dedupes the metadata+page double render. */
export const getSolutions = cache(async (): Promise<Solution[]> => {
  const payload = await getPayload({ config })
  const res = await payload.find({
    collection: 'solutions',
    where: { _status: { equals: 'published' } },
    sort: 'order',
    depth: 1,
    limit: 50,
  })
  return res.docs.map(mapDoc)
})

/** One published solution by slug, or null. */
export const getSolutionBySlug = cache(async (slug: string): Promise<Solution | null> => {
  const payload = await getPayload({ config })
  const res = await payload.find({
    collection: 'solutions',
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    depth: 1,
    limit: 1,
  })
  return res.docs[0] ? mapDoc(res.docs[0]) : null
})
