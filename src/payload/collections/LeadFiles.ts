// Lead attachments (Free Layout sketches / drawings). Separate from `media`
// on purpose: media is the PUBLIC site asset library (blog covers, project
// photos — read: everyone), while these files are customer-submitted PII
// (site plans, shop drawings) and must only be readable by signed-in staff.
// Rows are created exclusively by /api/submissions via the Local API — the
// route enforces the extension allowlist and the 20 MB cap.
import type { CollectionConfig } from 'payload'

export const LeadFiles: CollectionConfig = {
  slug: 'lead-files',
  labels: { singular: 'Lead file', plural: 'Lead files' },
  upload: true,
  admin: {
    hidden: true, // reached through the lead's `sketch` field, not the nav
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: () => false, // Local API only (bypasses access control)
    update: () => false,
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [{ name: 'alt', type: 'text' }],
}
