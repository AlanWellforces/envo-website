// DRAFT — final location: src/payload/collections/ProductOverrides.ts
// Move here when Mackenzie's scaffold lands in Stage 2.
//
// This collection is the editorial overlay on top of Akeneo product data.
// Akeneo owns specs. This collection owns display, marketing, and ordering.
//
// Three-source rule:
//   Akeneo  → specs, images, price, datasheets
//   Payload → featured, badge, hidden, marketing note, display order
//   Git     → this file (schema + logic)

import type { CollectionConfig } from 'payload'

export const ProductOverrides: CollectionConfig = {
  slug: 'product-overrides',
  admin: {
    useAsTitle: 'sku',
    description:
      'Editorial controls for individual ENVO products. ' +
      'Akeneo owns specs — use this collection to control display, ordering, and marketing.',
    defaultColumns: ['sku', 'featured', 'badge', 'hidden', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  fields: [

    // --- Identity ---
    {
      name: 'sku',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Must match an Akeneo SKU exactly. e.g. SC-100-24',
      },
    },

    // --- Visibility ---
    {
      name: 'hidden',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Hide this product from the website without disabling it in Akeneo.',
      },
    },

    // --- Promotion ---
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Show this product in featured sections on category and homepage.',
      },
    },
    {
      name: 'badge',
      type: 'select',
      options: [
        { label: 'None',      value: ''          },
        { label: 'New',       value: 'new'       },
        { label: 'Popular',   value: 'popular'   },
        { label: 'Sale',      value: 'sale'      },
        { label: 'Clearance', value: 'clearance' },
      ],
      admin: {
        description: 'Optional badge shown on the product card.',
      },
    },

    // --- Ordering ---
    {
      name: 'display_order',
      type: 'number',
      admin: {
        description:
          'Controls sort position within a category or application page. ' +
          'Lower numbers appear first. Leave blank for default (alphabetical by SKU).',
      },
    },

    // --- Marketing copy ---
    {
      name: 'marketing_note',
      type: 'textarea',
      admin: {
        description:
          'Short note shown on the product page. ' +
          'e.g. "Popular choice for commercial signage installations."',
      },
    },

    // --- Application pages ---
    {
      name: 'applications',
      type: 'array',
      admin: {
        description:
          'Which application pages this product appears on. ' +
          'Pinned products appear at the top of the list.',
      },
      fields: [
        {
          name: 'application_slug',
          type: 'text',
          required: true,
          admin: {
            description: 'e.g. signage, cabinetry, residential, outdoor',
          },
        },
        {
          name: 'pinned',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Pin to top of this application page.',
          },
        },
      ],
    },

    // --- Related products ---
    {
      name: 'related_skus',
      type: 'array',
      admin: {
        description:
          'Manually curated related products shown at the bottom of the product page. ' +
          'If left empty, related products are auto-generated from the same series.',
      },
      fields: [
        {
          name: 'sku',
          type: 'text',
          required: true,
          admin: {
            description: 'e.g. SC-60-24',
          },
        },
      ],
    },

  ],
}
