// Posts — editorial content (blog). See spec:
//   docs/superpowers/specs/2026-05-22-blog-collection-design.md
//
// Hooks (autoSlug, calcReadingTime, revalidate) are added in later tasks.

import type { CollectionConfig } from 'payload'
import { slugify } from '../../lib/slugify'
import { lexicalToText, readingTimeMinutes } from '../../lib/lexical-text'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'publishedAt', 'featured', '_status'],
    description: 'ENVO editorial content. Publish to make a post visible on the website.',
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
              admin: { description: 'Cover image. Used on list cards and the detail page header.' },
            },
            { name: 'body', type: 'richText', required: true },
          ],
        },

        // ----- Tab 2: Taxonomy -----
        {
          label: 'Taxonomy',
          fields: [
            {
              name: 'category',
              type: 'select',
              required: true,
              options: [
                { label: 'Guides', value: 'guides' },
                { label: 'Tech Insights', value: 'tech_insights' },
                { label: 'Company News', value: 'company_news' },
                { label: 'Industry', value: 'industry' },
              ],
            },
            {
              name: 'tags',
              type: 'array',
              fields: [{ name: 'tag', type: 'text', required: true }],
              admin: { description: 'Free-form tags. Used for /blog/tag/[t] pages.' },
            },
          ],
        },

        // ----- Tab 3: Publishing -----
        {
          label: 'Publishing',
          fields: [
            {
              name: 'publishedAt',
              type: 'date',
              required: true,
              admin: {
                description: 'When this post becomes visible. Future dates work as scheduled publishing.',
                date: { displayFormat: 'dd/MM/yyyy HH:mm' },
              },
            },
            {
              name: 'featured',
              type: 'checkbox',
              defaultValue: false,
              admin: { description: 'Show in featured spots on /blog and home.' },
            },
          ],
        },

        // ----- Tab 4: SEO -----
        {
          label: 'SEO',
          fields: [
            {
              name: 'seoTitle',
              type: 'text',
              admin: { description: 'Optional. Falls back to title if empty.' },
            },
            {
              name: 'seoDescription',
              type: 'textarea',
              admin: { description: 'Optional. Falls back to excerpt if empty.' },
            },
            {
              name: 'ogImage',
              type: 'upload',
              relationTo: 'media',
              admin: { description: 'Optional. Falls back to cover if empty.' },
            },
          ],
        },
      ],
    },

    // Hook-managed, admin-readonly. Lives outside the tabs so it's compact.
    {
      name: 'readingTime',
      type: 'number',
      admin: {
        readOnly: true,
        description: 'Estimated minutes to read. Calculated on save.',
        position: 'sidebar',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        // Auto-fill slug from title on create, only if slug is blank.
        if (operation === 'create' && !data.slug && data.title) {
          data.slug = slugify(data.title)
        }
        return data
      },
      ({ data }) => {
        // Calculate readingTime from body. Re-runs on every save.
        if (data.body) {
          const text = lexicalToText(data.body)
          data.readingTime = readingTimeMinutes(text)
        }
        return data
      },
    ],
  },
}
