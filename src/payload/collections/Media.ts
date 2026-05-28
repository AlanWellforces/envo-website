// Handles all image uploads for the Products collection and other content.
// Images are auto-resized to thumbnail, card, and detail sizes on upload.

import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'alt',
    group: 'Products',
    // filename must lead: Payload only makes the FIRST column link to the edit
    // view, and only for a real-field (default) cell — a custom ui Cell first
    // would leave the row with no way in. Thumbnail follows.
    defaultColumns: ['filename', 'preview', 'alt', 'url', 'createdAt', 'fileSize'],
    // Search box matches both the alt text and the filename (1000+ uploads).
    listSearchableFields: ['alt', 'filename'],
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
      // Image preview column for the list view (no stored data).
      name: 'preview',
      type: 'ui',
      label: 'Preview',
      admin: {
        components: {
          Cell: '/payload/components/MediaThumbnailCell#MediaThumbnailCell',
        },
      },
    },
    {
      // Human-readable file size (reads filesize bytes from the row).
      name: 'fileSize',
      type: 'ui',
      label: 'Size',
      admin: {
        components: {
          Cell: '/payload/components/MediaFileSizeCell#MediaFileSizeCell',
        },
      },
    },
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
