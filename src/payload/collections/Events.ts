// src/payload/collections/Events.ts
// Anonymous analytics events: pageviews (first-party, cookieless) and Find Your
// Match runs. Hidden from the admin nav — the Dashboard surfaces the computed
// numbers/charts. No cookie, no raw IP: visitors are a daily sessionHash only.
import type { CollectionConfig } from 'payload'

export const Events: CollectionConfig = {
  slug: 'events',
  admin: { hidden: true, useAsTitle: 'kind' },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: () => true, // public beacon / API routes
    update: () => false,
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'kind',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'Page view', value: 'pageview' },
        { label: 'Find Your Match', value: 'find-your-match' },
      ],
    },
    { name: 'path', type: 'text' },
    { name: 'referrer', type: 'text' },
    { name: 'sessionHash', type: 'text', index: true },
    { name: 'data', type: 'json' },
  ],
}
