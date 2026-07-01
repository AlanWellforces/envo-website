// src/payload/collections/Submissions.ts
// Lead submissions from the public site (Free Layout form, Find Your Match,
// contact). PII — readable only by authenticated admins. Rows are created by
// the public /api/submissions route via the Local API.
import type { CollectionConfig } from 'payload'

export const Submissions: CollectionConfig = {
  slug: 'submissions',
  labels: { singular: 'Lead', plural: 'Leads' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'type', 'company', 'status', 'createdAt'],
    group: 'Sales',
    description: 'Enquiries captured from the website. Newest first.',
    pagination: { defaultLimit: 50 },
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: () => true, // public site posts via /api/submissions
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'type',
      type: 'select',
      required: true,
      admin: { position: 'sidebar' },
      options: [
        { label: 'Free Layout Design', value: 'free-layout' },
        { label: 'Find Your Match', value: 'find-your-match' },
        { label: 'Contact', value: 'contact' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      admin: { position: 'sidebar' },
      options: [
        { label: 'New', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    { name: 'name', type: 'text' },
    { name: 'email', type: 'email' },
    { name: 'company', type: 'text' },
    { name: 'phone', type: 'text' },
    { name: 'sourcePath', type: 'text', admin: { description: 'Page the lead came from.' } },
    { name: 'sketch', type: 'upload', relationTo: 'media', admin: { description: 'Uploaded sketch / drawing (Free Layout).' } },
    { name: 'data', type: 'json', admin: { description: 'Raw form fields / wizard answers.' } },
  ],
}
