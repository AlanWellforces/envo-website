// Solutions — editorial "by application" content (/solutions and
// /solutions/[slug]): hero copy, checklist, gallery and the recommended kit.
// Replaces the hardcoded src/data/solutions.ts (which stays as the seed
// source — see scripts/seed-solutions.mts).
//
// Images follow the Products convention: optional Media upload that
// OVERRIDES a text path fallback (repo asset under /public). Path fallbacks
// work on every machine today; uploads become fully portable once Supabase
// Storage creds land.
import type { CollectionConfig } from 'payload'
import { slugify } from '../../lib/slugify.ts'

export const Solutions: CollectionConfig = {
  slug: 'solutions',
  labels: { singular: 'Solution', plural: 'Solutions' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', '_status', 'updatedAt'],
    description:
      'Application solutions shown at /solutions — hero copy, gallery and the recommended kit. Publish to make one visible.',
    group: 'Content',
  },
  access: {
    read: () => true,
  },
  versions: {
    drafts: true,
  },
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        // Keep /solutions/<slug> URLs safe — same normalization as Pages/Posts.
        if (data.slug) data.slug = slugify(data.slug)
        else if (operation === 'create' && data.name) data.slug = slugify(data.name)
        return data
      },
    ],
  },
  fields: [
    // ===== Main column =====
    { name: 'name', type: 'text', required: true, admin: { placeholder: 'e.g. Signage Lighting' } },
    {
      name: 'eyebrow',
      type: 'text',
      admin: { placeholder: 'Signage · channel letters & light boxes', description: 'Small tag above the title.' },
    },
    { name: 'heroTitle', type: 'text', required: true, admin: { placeholder: 'Storefront & channel letters' } },
    {
      name: 'heroDesc',
      type: 'textarea',
      admin: { description: 'One–two sentences under the title, on the list row and the detail hero.' },
    },
    {
      name: 'shortDesc',
      type: 'textarea',
      admin: { description: 'Short card blurb (used by other pages linking here).' },
    },
    {
      name: 'longDesc',
      type: 'textarea',
      admin: { description: 'Longer summary — also the default meta description.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          admin: { description: 'Card/hero image. Overrides the path below.', width: '50%' },
        },
        {
          name: 'imagePath',
          type: 'text',
          admin: {
            description: 'Fallback repo asset path, e.g. /assets/images/app-mini-channel-letters.jpg',
            width: '50%',
          },
        },
      ],
    },
    {
      name: 'checklist',
      type: 'array',
      labels: { singular: 'Point', plural: 'Points' },
      admin: { description: 'Three short selling points shown as ticks.' },
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    {
      name: 'gallery',
      type: 'array',
      labels: { singular: 'Image', plural: 'Images' },
      admin: { description: 'Detail-page gallery (first image leads).' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'image', type: 'upload', relationTo: 'media', admin: { width: '50%' } },
            { name: 'imagePath', type: 'text', admin: { description: 'Fallback asset path.', width: '50%' } },
          ],
        },
        { name: 'alt', type: 'text', required: true },
      ],
    },

    // ===== Recommended kit =====
    { name: 'kitHeading', type: 'text', admin: { description: 'Kit section heading.' } },
    { name: 'kitLede', type: 'textarea', admin: { description: 'Kit section intro sentence.' } },
    {
      name: 'kit',
      type: 'array',
      labels: { singular: 'Kit item', plural: 'Kit items' },
      admin: {
        description:
          'The matched parts for this build. Non-ENVO items render as "compatible" (dashed card, no product link).',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'envo',
              type: 'checkbox',
              defaultValue: true,
              admin: { description: 'ENVO-branded product (links to a product page).', width: '30%' },
            },
            {
              name: 'role',
              type: 'text',
              required: true,
              admin: { placeholder: 'LED module / Driver / Also needed', width: '30%' },
            },
            {
              name: 'href',
              type: 'text',
              admin: { description: 'Product page link — ENVO items only.', width: '40%' },
            },
          ],
        },
        { name: 'name', type: 'text', required: true },
        { name: 'desc', type: 'textarea' },
        {
          type: 'row',
          fields: [
            { name: 'image', type: 'upload', relationTo: 'media', admin: { width: '50%' } },
            { name: 'imagePath', type: 'text', admin: { description: 'Fallback asset path.', width: '50%' } },
          ],
        },
        {
          name: 'specs',
          type: 'array',
          labels: { singular: 'Spec', plural: 'Specs' },
          admin: { description: 'Three short spec rows on the card.' },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'label', type: 'text', required: true, admin: { width: '50%' } },
                { name: 'value', type: 'text', required: true, admin: { width: '50%' } },
              ],
            },
          ],
        },
      ],
    },

    // ===== Sidebar =====
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { position: 'sidebar', description: 'URL: /solutions/<slug>' },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'List position — lower shows first.' },
    },
  ],
}
