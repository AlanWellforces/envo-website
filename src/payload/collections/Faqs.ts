// src/payload/collections/Faqs.ts
// FAQ entries for /resources/faq. Editorial content (Wei's domain) — now the
// source of truth (the src/data/resource-faqs.ts stopgap has been retired).
// `group` stores the short key; the human label lives in src/lib/faqs.ts
// (FAQ_GROUP_LABELS).
import type { CollectionConfig } from 'payload'
import { lexicalEditor, FixedToolbarFeature } from '@payloadcms/richtext-lexical'

export const Faqs: CollectionConfig = {
  slug: 'faqs',
  labels: { singular: 'FAQ', plural: 'FAQs' },
  admin: {
    useAsTitle: 'question',
    defaultColumns: ['question', 'group', 'order', '_status'],
    group: 'Editorial',
    description: 'Questions answered on /resources/faq. Publish to make one visible.',
  },
  access: { read: () => true },
  versions: { drafts: true },
  fields: [
    { name: 'question', type: 'text', required: true, admin: { placeholder: 'The question, as a customer would ask it.' } },
    {
      name: 'answer',
      type: 'richText',
      required: true,
      editor: lexicalEditor({ features: ({ defaultFeatures }) => [...defaultFeatures, FixedToolbarFeature()] }),
    },
    {
      name: 'group',
      type: 'select',
      required: true,
      admin: { position: 'sidebar', description: 'Which FAQ section this appears under.' },
      options: [
        { label: 'Ordering & availability', value: 'ordering' },
        { label: 'Products & compatibility', value: 'products' },
        { label: 'Installation & technical', value: 'installation' },
        { label: 'Warranty & after-sales', value: 'warranty' },
      ],
    },
    {
      name: 'order',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Sort order within the group (low → high).' },
    },
  ],
}
