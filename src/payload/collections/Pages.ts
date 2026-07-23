// src/payload/collections/Pages.ts
// Standalone rich-text pages (policy pages, and any future plain-content page),
// Shopify-style. Bodies live here (not Git). drafts: published = Visible,
// draft = Hidden. Routing: policy slugs render at root; everything else at
// /pages/<slug> — see src/lib/cms-pages.ts.
import type { CollectionConfig } from 'payload'
import { lexicalEditor, FixedToolbarFeature, BlocksFeature } from '@payloadcms/richtext-lexical'
import { slugify } from '../../lib/slugify.ts'
import { publishedOrAuthed } from '@/payload/access/public-read'

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Page', plural: 'Pages' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', '_status', 'slug', 'updatedAt'],
    group: 'Content',
    description: 'Standalone rich-text pages. Publish to make a page Visible on the website.',
  },
  access: { read: publishedOrAuthed },
  versions: { drafts: true },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: { placeholder: 'Page title' },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      label: 'Content',
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
                    admin: { language: 'html', description: 'Custom HTML, rendered as-is on the published page.' },
                  },
                ],
              },
            ],
          }),
        ],
      }),
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'URL slug. Policy pages render at /<slug>; other pages at /pages/<slug>.',
      },
    },
    {
      name: 'showInFooter',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Show this page in the footer legal links.' },
    },
    {
      name: 'seoTitle',
      type: 'text',
      label: 'SEO title',
      admin: { position: 'sidebar', description: 'Optional. Falls back to the page title.' },
    },
    {
      name: 'metaDescription',
      type: 'textarea',
      admin: { position: 'sidebar', description: 'Meta description (aim ≤ 155 chars).' },
    },
    {
      name: 'lastUpdated',
      type: 'date',
      admin: {
        position: 'sidebar',
        description: 'The "Last updated" date shown on the page. Set this manually; it does NOT auto-change on save.',
        date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' },
      },
    },
    {
      name: 'ogImage',
      type: 'upload',
      relationTo: 'media',
      admin: { position: 'sidebar', description: 'Optional social share image.' },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (data.slug) data.slug = slugify(data.slug)
        else if (operation === 'create' && data.title) data.slug = slugify(data.title)
        return data
      },
    ],
  },
}
