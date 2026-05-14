// Handles all image uploads for the Products collection and other content.
// Images are auto-resized to thumbnail, card, and detail sizes on upload.

import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'alt',
    group: 'Products',
  },
  access: {
    read: () => true,
  },
  upload: {
    staticDir: 'media',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 200,
        height: 200,
        crop: 'center',
      },
      {
        name: 'card',
        width: 480,
        height: 480,
        crop: 'center',
      },
      {
        name: 'detail',
        width: 900,
        height: 900,
        crop: 'center',
      },
    ],
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description: 'Describe the image for accessibility and SEO. e.g. "SC-100-24 LED Driver front view"',
      },
    },
  ],
}
