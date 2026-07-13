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
    defaultColumns: ['email', 'type', 'company', 'status', 'notify', 'createdAt'],
    group: 'Sales',
    description: 'Enquiries captured from the website. Newest first.',
    pagination: { defaultLimit: 50 },
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    // The public site posts via /api/submissions (Local API, bypasses access
    // control) — Payload's own REST/GraphQL create stays CLOSED so spam can't
    // skip normalizeSubmission or set internal fields like status/sketch.
    create: () => false,
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
    {
      // Sales-email notification outcome, written by /api/submissions after
      // the (retried) Mailgun send — "Failed" rows need a manual follow-up.
      name: 'notify',
      label: 'Email notification',
      type: 'select',
      admin: { position: 'sidebar', readOnly: true },
      options: [
        { label: 'Sent', value: 'sent' },
        { label: 'Failed', value: 'failed' },
        { label: 'Off (no Mailgun keys)', value: 'skipped' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', label: 'Name' },
        { name: 'email', type: 'email', label: 'Email' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'company', type: 'text', label: 'Company' },
        { name: 'phone', type: 'text', label: 'Phone' },
      ],
    },
    {
      name: 'message',
      type: 'textarea',
      label: 'Message',
      admin: { description: 'What the customer wrote in the form.' },
    },
    {
      name: 'details',
      type: 'textarea',
      label: 'Request details',
      admin: {
        description: 'Extra form answers (sign type, dimensions, location…), one per line.',
        condition: (data) => Boolean(data?.details),
      },
    },
    {
      name: 'sketch',
      type: 'upload',
      relationTo: 'lead-files',
      label: 'Attached sketch / drawing',
      admin: { condition: (data) => Boolean(data?.sketch) },
    },
    {
      name: 'sourcePath',
      type: 'text',
      label: 'Submitted from page',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      // Raw capture kept for the record; hidden so the editing view stays
      // non-technical — everything a human needs is in message/details above.
      name: 'data',
      type: 'json',
      admin: { hidden: true },
    },
  ],
}
