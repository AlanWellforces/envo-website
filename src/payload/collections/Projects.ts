// Projects — editorial case-study content. See spec:
//   docs/superpowers/specs/2026-05-29-projects-collection-design.md
//
// Editor-style admin layout (mirrors the latest Posts.ts overhaul): main
// column holds the writing surface (title → facts row → excerpt → cover →
// body → gallery → products used → testimonial → SEO collapsible); the
// right sidebar holds publishing knobs (publishedAt, industry, featured,
// slug, tags). No tabs — the layout itself guides the author top-to-bottom.

import type { CollectionConfig } from 'payload'
import { lexicalEditor, FixedToolbarFeature, BlocksFeature } from '@payloadcms/richtext-lexical'
import { slugify } from '../../lib/slugify.ts'

export const Projects: CollectionConfig = {
  slug: 'projects',
  labels: {
    singular: 'Project',
    plural: 'Projects',
  },
  admin: {
    useAsTitle: 'title',
    // Cover leads the list (Shopify-style — same as Posts).
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
    // ===== Main column — the writing surface =====
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        placeholder: 'Project name — e.g. "LAX Terminal 7 Retail Signage"',
        // List-only: make the title text link into the edit view, since the
        // cover thumbnail is the first column.
        components: {
          Cell: '/payload/components/LinkedTextCell#LinkedTextCell',
        },
      },
    },

    // Project facts — compact 3-column row right after the title so the
    // case-study metadata (who/where/when) is captured up front.
    {
      type: 'row',
      fields: [
        {
          name: 'client',
          type: 'text',
          admin: {
            placeholder: 'e.g. LAX Properties',
            description: 'Client or building owner. Leave blank if under NDA.',
            width: '40%',
          },
        },
        {
          name: 'location',
          type: 'text',
          admin: {
            placeholder: 'Los Angeles, USA',
            description: 'City and country.',
            width: '40%',
          },
        },
        {
          name: 'completedYear',
          type: 'number',
          admin: {
            placeholder: '2025',
            description: 'Year completed.',
            width: '20%',
          },
        },
      ],
    },

    {
      name: 'excerpt',
      type: 'textarea',
      required: true,
      maxLength: 200,
      admin: {
        placeholder: 'One or two sentences shown on cards and in search results.',
        description: 'Shown on project cards and used as the meta-description fallback (max 200 characters).',
      },
    },

    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: { description: 'Cover image — used on list cards and as the detail-page hero.' },
    },

    {
      name: 'body',
      type: 'richText',
      required: true,
      label: 'Story',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          FixedToolbarFeature(),
          BlocksFeature({
            blocks: [
              {
                slug: 'html',
                labels: { singular: 'HTML', plural: 'HTML blocks' },
                fields: [
                  {
                    name: 'html',
                    type: 'code',
                    label: 'Raw HTML',
                    admin: {
                      language: 'html',
                      description: 'Custom HTML for special layouts. Rendered as-is on the published page.',
                    },
                  },
                ],
              },
            ],
          }),
        ],
      }),
    },

    {
      name: 'gallery',
      type: 'array',
      labels: { singular: 'Photo', plural: 'Photos' },
      admin: {
        description: 'Install photos. Caption is optional but boosts SEO + alt-text quality.',
        initCollapsed: true,
      },
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        {
          name: 'caption',
          type: 'text',
          admin: { placeholder: 'What this photo shows — e.g. "Detail of MiniLux installation behind translucent face panel"' },
        },
      ],
    },

    {
      name: 'productsUsed',
      type: 'array',
      labels: { singular: 'SKU', plural: 'SKUs' },
      admin: {
        description: 'ENVO SKU codes used in this install. Front-end resolves each via getProduct() at render time — type a real Akeneo SKU.',
        initCollapsed: true,
      },
      fields: [
        {
          name: 'sku',
          type: 'text',
          required: true,
          admin: { placeholder: 'EV-BLML01LBY-NW' },
        },
      ],
    },

    {
      name: 'testimonial',
      type: 'textarea',
      admin: {
        placeholder: 'Optional client quote — rendered as a pull-quote on the detail page.',
        description: 'Leave blank to hide the testimonial block.',
      },
    },

    // SEO & social — collapsible, kept out of the way until needed.
    {
      type: 'collapsible',
      label: 'SEO & social (optional)',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'seoTitle',
          type: 'text',
          label: 'SEO title',
          admin: { description: 'Optional. Falls back to the project title if empty.' },
        },
        {
          name: 'seoDescription',
          type: 'textarea',
          label: 'SEO description',
          admin: { description: 'Optional. Falls back to the excerpt if empty.' },
        },
        {
          name: 'ogImage',
          type: 'upload',
          relationTo: 'media',
          label: 'Social share image',
          admin: { description: 'Optional. Falls back to the cover image if empty.' },
        },
      ],
    },

    // List-only cover thumbnail (no stored data; reads the populated cover).
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

    // ===== Right sidebar — publishing knobs & taxonomy =====
    {
      name: 'publishedAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: {
        position: 'sidebar',
        description: 'When the project goes live. Set a future date/time to schedule it.',
        date: { displayFormat: 'dd/MM/yyyy HH:mm' },
      },
    },
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
      admin: {
        position: 'sidebar',
        description: 'Drives /projects/industry/[i] pages. Pick all that fit — a project can span sectors.',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Show in the Featured strip on /projects and the home page.',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
        description: 'Project URL: /projects/<slug>. Auto-filled from the title — edit only for a custom URL.',
      },
    },
    {
      name: 'tags',
      type: 'array',
      labels: { singular: 'Tag', plural: 'Tags' },
      fields: [{ name: 'tag', type: 'text', required: true }],
      admin: {
        position: 'sidebar',
        description: 'Free-form tags. Power the /projects/tag/[t] pages.',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        // Slug is editable: normalize whatever was typed so the URL stays
        // clean, and fall back to the title when left blank on create.
        if (data.slug) {
          data.slug = slugify(data.slug)
        } else if (operation === 'create' && data.title) {
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
