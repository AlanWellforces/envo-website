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
import { isAdmin } from '../access/is-admin'
import { slugify } from '../../lib/slugify.ts'
import { publishedOrAuthed } from '@/payload/access/public-read'

export const Solutions: CollectionConfig = {
  slug: 'solutions',
  labels: { singular: 'Solution', plural: 'Solutions' },
  admin: {
    useAsTitle: 'name',
    // Thumbnail leads the list (same convention as Posts/Projects).
    defaultColumns: ['thumb', 'name', '_status', 'updatedAt'],
    description:
      'Application solutions shown at /solutions — hero copy, gallery and the recommended kit. Publish to make one visible.',
    group: 'Content',
  },
  access: {
    delete: isAdmin,
    read: publishedOrAuthed,
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
    // ===== Main column — the writing surface (name → hero → media → kit) =====
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        placeholder: 'e.g. Signage Lighting',
        components: { Cell: '/payload/components/LinkedTextCell#LinkedTextCell' },
      },
    },
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
      name: 'useCases',
      type: 'array',
      labels: { singular: 'Use case', plural: 'Use cases' },
      admin: {
        description: 'Scenario chips on the /solutions card (e.g. Channel letters, Light boxes).',
      },
      fields: [{ name: 'label', type: 'text', required: true }],
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

    // ===== Detail-page sections (Best for → considerations → series) =====
    {
      name: 'bestFor',
      type: 'array',
      labels: { singular: 'Application', plural: 'Applications' },
      admin: { description: '"Best for" cards — the concrete applications this solution suits.' },
      fields: [
        { name: 'scenario', type: 'text', required: true },
        { name: 'note', type: 'textarea' },
      ],
    },
    {
      name: 'considerations',
      type: 'array',
      labels: { singular: 'Consideration', plural: 'Considerations' },
      admin: {
        description: 'Design considerations — what gets checked before speccing this build.',
      },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'text', type: 'textarea' },
      ],
    },
    {
      name: 'series',
      type: 'array',
      labels: { singular: 'Series', plural: 'Series' },
      admin: { description: 'Recommended ENVO series — cards linking to series pages.' },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'blurb', type: 'textarea' },
        {
          name: 'href',
          type: 'text',
          required: true,
          admin: { description: 'Series page, e.g. /products/led-signage-modules/envo-minilux' },
        },
        {
          type: 'row',
          fields: [
            { name: 'image', type: 'upload', relationTo: 'media', admin: { width: '50%' } },
            { name: 'imagePath', type: 'text', admin: { description: 'Fallback asset path.', width: '50%' } },
          ],
        },
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

    // ===== When to choose alternatives =====
    {
      name: 'alternatives',
      type: 'array',
      labels: { singular: 'Alternative', plural: 'Alternatives' },
      admin: {
        description:
          '"When to choose alternatives" rows — honest routing when another series or solution fits better.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'when', type: 'text', required: true, admin: { placeholder: 'If the faces need…', width: '50%' } },
            { name: 'choose', type: 'text', required: true, admin: { placeholder: 'ChromaFlux RGBW modules', width: '50%' } },
          ],
        },
        { name: 'href', type: 'text', admin: { description: 'Optional link for the suggestion.' } },
      ],
    },

    // SEO & summaries — collapsed out of the writing flow (these do NOT
    // render on the page; they only feed the meta description and off-page
    // card blurbs).
    {
      type: 'collapsible',
      label: 'SEO & summaries',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'longDesc',
          type: 'textarea',
          label: 'Meta description',
          admin: { description: 'Used as <meta name="description">. Falls back to the short blurb, then the hero description. Aim ≤ 155 characters.' },
        },
        {
          name: 'shortDesc',
          type: 'textarea',
          label: 'Short blurb',
          admin: { description: 'Fallback summary for other pages linking here. Not shown on /solutions itself.' },
        },
      ],
    },

    // List-only thumbnail (no stored data; shows upload or imagePath).
    {
      name: 'thumb',
      type: 'ui',
      label: 'Image',
      admin: {
        components: { Cell: '/payload/components/SolutionThumbCell#SolutionThumbCell' },
      },
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
