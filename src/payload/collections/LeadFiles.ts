// Lead attachments (Free Layout sketches / drawings). Separate from `media`
// on purpose: media is the PUBLIC site asset library (blog covers, project
// photos — read: everyone), while these files are customer-submitted PII
// (site plans, shop drawings) and must only be readable by signed-in staff.
// Rows are created exclusively by /api/submissions via the Local API — the
// route enforces the extension allowlist and the 20 MB cap.
import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/is-admin'

export const LeadFiles: CollectionConfig = {
  slug: 'lead-files',
  labels: { singular: 'Lead file', plural: 'Lead files' },
  upload: {
    // Customer-uploaded files must never render inline in a staff browser
    // (a booby-trapped file opening same-origin in the admin). Force download
    // and stop MIME sniffing — defence in depth on top of the upload-time
    // signature check.
    modifyResponseHeaders: ({ headers }) => {
      headers.set('Content-Disposition', 'attachment')
      headers.set('X-Content-Type-Options', 'nosniff')
      return headers
    },
  },
  admin: {
    hidden: true, // reached through the lead's `sketch` field, not the nav
  },
  access: {
    // Customer-submitted PII — admin role only, matching Submissions. (Any
    // logged-in user was too broad now that non-admins can hold API tokens.)
    read: isAdmin,
    create: () => false, // Local API only (bypasses access control)
    update: () => false,
    delete: isAdmin,
  },
  fields: [{ name: 'alt', type: 'text' }],
}
