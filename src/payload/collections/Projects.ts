// Projects — editorial case-study content. See spec:
//   docs/superpowers/specs/2026-05-29-projects-collection-design.md
//
// Mirrors Posts.ts: tabbed admin UI, autoSlug + revalidate hooks,
// drafts/versions enabled. The "Project Details" tab adds structured
// case-study metadata (client, location, year, gallery, productsUsed).

import type { CollectionConfig } from 'payload'
import { slugify } from '../../lib/slugify.ts'

export const Projects: CollectionConfig = {
  slug: 'projects',
  labels: {
    singular: 'Project',
    plural: 'Projects',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['coverPreview', 'title', '_status', 'industry', 'completedYear', 'publishedAt'],
    description: 'Real-world ENVO LED installations. Publish to make a case study visible on the website.',
    group: 'Editorial',
  },
  access: {
    read: () => true,
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        // ----- Tab 1: Content -----
        {
          label: 'Content',
          fields: [
            { name: 'title', type: 'text', required: true },
            {
              name: 'slug',
              type: 'text',
              required: true,
              unique: true,
              admin: {
                readOnly: true,
                description: 'Auto-generated from title. Edit in the database if you must change it.',
              },
            },
            {
              name: 'excerpt',
              type: 'textarea',
              required: true,
              maxLength: 200,
              admin: { description: 'Shown on cards and as the meta-description fallback. 200 chars max.' },
            },
            {
              name: 'cover',
              type: 'upload',
              relationTo: 'media',
              required: true,
              admin: { description: 'Cover image. Used on list cards and the detail page hero.' },
            },
            { name: 'body', type: 'richText', required: true },
          ],
        },

        // ----- Tab 2: Project Details (Projects-specific structured meta) -----
        {
          label: 'Project Details',
          fields: [
            {
              name: 'client',
              type: 'text',
              admin: { description: 'Client / building owner. Leave blank if under NDA.' },
            },
            {
              name: 'location',
              type: 'text',
              admin: { description: 'e.g. "Los Angeles, USA".' },
            },
            {
              name: 'completedYear',
              type: 'number',
              admin: { description: 'Year the install was completed.' },
            },
            {
              name: 'gallery',
              type: 'array',
              admin: { description: 'Install photos. Caption is optional but boosts SEO + alt-text.' },
              fields: [
                { name: 'image', type: 'upload', relationTo: 'media', required: true },
                { name: 'caption', type: 'text' },
              ],
            },
            {
              name: 'productsUsed',
              type: 'array',
              admin: { description: 'ENVO SKU codes used in this install. Front-end resolves each via getProduct().' },
              fields: [{ name: 'sku', type: 'text', required: true }],
            },
            {
              name: 'testimonial',
              type: 'textarea',
              admin: { description: 'Optional client quote, shown as a pull-quote block.' },
            },
          ],
        },

        // ----- Tab 3: Taxonomy -----
        {
          label: 'Taxonomy',
          fields: [
            {
              name: 'industry',
              type: 'select',
              hasMany: true,
              required: true,
              options: [
                { label: 'Retail', value: 'retail' },
                { label: 'Hotel & Hospitality', value: 'hotel' },
                { label: 'Storefront', value: 'storefront' },
                { label: 'Architectural Facade', value: 'architectural' },
                { label: 'Canopy', value: 'canopy' },
                { label: 'Other', value: 'other' },
              ],
            },
            {
              name: 'tags',
              type: 'array',
              fields: [{ name: 'tag', type: 'text', required: true }],
              admin: { description: 'Free-form tags. Powers /projects/tag/[t] pages.' },
            },
          ],
        },

        // ----- Tab 4: Publishing -----
        {
          label: 'Publishing',
          fields: [
            {
              name: 'publishedAt',
              type: 'date',
              required: true,
              admin: {
                description: 'When this project becomes visible. Future dates work as scheduled publishing.',
                date: { displayFormat: 'dd/MM/yyyy HH:mm' },
              },
            },
            {
              name: 'featured',
              type: 'checkbox',
              defaultValue: false,
              admin: { description: 'Show in the featured strip on /projects.' },
            },
          ],
        },

        // ----- Tab 5: SEO -----
        {
          label: 'SEO',
          fields: [
            { name: 'seoTitle', type: 'text', admin: { description: 'Optional. Falls back to title.' } },
            { name: 'seoDescription', type: 'textarea', admin: { description: 'Optional. Falls back to excerpt.' } },
            { name: 'ogImage', type: 'upload', relationTo: 'media', admin: { description: 'Optional. Falls back to cover.' } },
          ],
        },
      ],
    },

    // List-only cover thumbnail (reuses Blog's PostCoverCell pattern).
    {
      name: 'coverPreview',
      type: 'ui',
      label: 'Cover',
      admin: {
        components: {
          Cell: '/payload/components/PostCoverCell#PostCoverCell',
        },
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation === 'create' && !data.slug && data.title) {
          data.slug = slugify(data.title)
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc }) => {
        const wasPublic = previousDoc?._status === 'published'
        const isPublic = doc._status === 'published'
        if (!wasPublic && !isPublic) return doc

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
        const secret = process.env.REVALIDATE_SECRET
        if (!siteUrl || !secret) return doc

        const paths = new Set<string>(['/projects'])
        if (doc.slug) paths.add(`/projects/${doc.slug}`)

        // Industry list pages — current + removed (industry is multi-select).
        const currentInd: string[] = Array.isArray(doc.industry) ? doc.industry : []
        const prevInd: string[] = Array.isArray(previousDoc?.industry) ? previousDoc.industry : []
        for (const i of new Set([...currentInd, ...prevInd])) {
          paths.add(`/projects/industry/${i}`)
        }

        // Tag pages — current + removed.
        const currentTags: string[] = (doc.tags ?? []).map((t: { tag: string }) => t.tag).filter(Boolean)
        const prevTags: string[] = (previousDoc?.tags ?? []).map((t: { tag: string }) => t.tag).filter(Boolean)
        for (const t of new Set([...currentTags, ...prevTags])) {
          paths.add(`/projects/tag/${t}`)
        }

        // Old slug — clear the stale static page.
        if (previousDoc?.slug && previousDoc.slug !== doc.slug) {
          paths.add(`/projects/${previousDoc.slug}`)
        }

        try {
          await fetch(
            `${siteUrl}/api/revalidate?paths=${Array.from(paths).join(',')}`,
            { method: 'POST', headers: { 'x-revalidate-secret': secret } },
          )
        } catch (err) {
          console.error('[Projects.afterChange] revalidate fetch failed:', err)
        }
        return doc
      },
    ],
  },
}
