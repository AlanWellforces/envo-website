// Handles all image uploads for the Products collection and other content.
// Images are auto-resized to thumbnail, card, and detail sizes on upload.

import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { findMediaUsage } from '../hooks/media-in-use'
import { isAdmin } from '../access/is-admin'

export const Media: CollectionConfig = {
  slug: 'media',
  hooks: {
    // Refuse to delete a file that content still references — deleting it
    // would silently break images on the live site. The error lists where
    // it's used so the editor can swap those first.
    beforeDelete: [
      async ({ req, id }) => {
        const uses = await findMediaUsage(req.payload, id)
        if (uses.length > 0) {
          throw new APIError(
            `This file is still in use — remove it from: ${uses.join(', ')} first.`,
            400,
          )
        }
      },
    ],
  },
  admin: {
    useAsTitle: 'alt',
    group: 'Catalogue',
    // Thumbnail leads (Shopify-style). Payload only links the FIRST column, and
    // a custom ui Cell isn't auto-wrapped — so MediaThumbnailCell renders its
    // own link to the edit view when it's the linked column.
    defaultColumns: ['preview', 'filename', 'alt', 'url', 'createdAt', 'fileSize'],
    // Search box matches both the alt text and the filename (1000+ uploads).
    listSearchableFields: ['alt', 'filename'],
  },
  access: {
    read: () => true,
    // Writes are admin-only (P0 2026-07-24): a non-admin login token must not
    // be able to replace or delete site imagery via REST.
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  upload: {
    staticDir: 'media',
    // Cap the SAVED original at 2400px on the long edge. Team uploads arrived
    // as 3+ MB 4000px camera exports; the original is what the lightbox zoom
    // serves raw and what the image optimizer transcodes on first view, so an
    // uncapped source costs real load time (and disk/backup weight). 2400px
    // comfortably covers every rendered size incl. retina zoom. A weekly
    // sweeper on the box (envo-media-shrink.timer) catches anything that
    // bypasses this hook (e.g. direct volume copies).
    resizeOptions: {
      width: 2400,
      height: 2400,
      fit: 'inside',
      withoutEnlargement: true,
    },
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
