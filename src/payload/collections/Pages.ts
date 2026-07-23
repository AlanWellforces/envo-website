// src/payload/collections/Pages.ts
// Standalone rich-text pages (policy pages, and any future plain-content page),
// Shopify-style. Bodies live here (not Git). drafts: published = Visible,
// draft = Hidden. Routing: policy slugs render at root; everything else at
// /pages/<slug> — see src/lib/cms-pages.ts.
import type { CollectionConfig } from 'payload'
import { lexicalEditor, FixedToolbarFeature, BlocksFeature } from '@payloadcms/richtext-lexical'
import { slugify } from '../../lib/slugify.ts'
import { publishedOrAuthed } from '@/payload/access/public-read'
import { revalidatePaths } from '@/lib/revalidate'

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
  // Soft delete: deleted docs land in the admin Trash (restorable).
  trash: true,
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
                    admin: { language: 'html', description: 'Custom HTML for special layouts. Sanitized on render: layout tags/classes/styles keep working; scripts, iframes, forms and event handlers are stripped.' },
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
    // CMS pages render statically. A page's content appears at /pages/<slug>
    // and, for the legal set, also at the root route /<slug> (dedicated route
    // files call getPageBySlug). Revalidate both, plus the old slug on rename.
    afterChange: [
      async ({ doc, previousDoc }) => {
        const slugs = [doc.slug, previousDoc?.slug].filter(Boolean) as string[]
        const paths = new Set<string>(['/sitemap.xml'])
        for (const s of slugs) {
          paths.add(`/pages/${s}`)
          paths.add(`/${s}`)
        }
        await revalidatePaths(paths, 'Pages.afterChange')
        return doc
      },
    ],
    afterDelete: [
      async ({ doc }) => {
        const paths = ['/sitemap.xml']
        if (doc.slug) paths.push(`/pages/${doc.slug}`, `/${doc.slug}`)
        await revalidatePaths(paths, 'Pages.afterDelete')
        return doc
      },
    ],
  },
}
