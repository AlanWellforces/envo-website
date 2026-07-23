// src/payload/collections/PageSeo.ts
// Per-route SEO overrides for code-built pages (about, contact, solutions, …).
// Page bodies stay in Git; only the <title>/<meta>/OG text lives here, read by
// getPageSeo() with fallback to each page's in-code defaults. CMS pages
// (Posts/Projects/Products/Faqs) manage their own SEO and are NOT listed here.
import type { CollectionConfig } from 'payload'
import { revalidatePaths } from '@/lib/revalidate'

export const PageSeo: CollectionConfig = {
  slug: 'page-seo',
  labels: { singular: 'Page SEO', plural: 'Page SEO' },
  admin: {
    useAsTitle: 'route',
    defaultColumns: ['route', 'seoTitle', 'updatedAt'],
    group: 'Website',
    description: 'SEO title / description / share image for code-built pages, keyed by route. Empty fields fall back to the page’s in-code defaults.',
  },
  access: { read: () => true },
  fields: [
    {
      name: 'route',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: 'Exact route path, e.g. /about or /solutions/signage-lighting' },
    },
    { name: 'label', type: 'text', admin: { description: 'Optional friendly name shown in the admin list.' } },
    { name: 'seoTitle', type: 'text', admin: { description: 'Overrides the <title>. Leave blank to keep the page default.' } },
    {
      name: 'metaDescription',
      type: 'textarea',
      admin: { description: 'Overrides <meta name="description">. Aim ≤ 155 characters.' },
    },
    { name: 'ogImage', type: 'upload', relationTo: 'media', admin: { description: 'Optional social share image.' } },
  ],
  hooks: {
    // SEO overrides are read into <head> at build time. Revalidate the exact
    // route the record targets so a title/description edit shows without a
    // deploy; on rename, clear the old route too.
    afterChange: [
      async ({ doc, previousDoc }) => {
        const routes = [doc.route, previousDoc?.route].filter(Boolean) as string[]
        await revalidatePaths([...routes, '/sitemap.xml'], 'PageSeo.afterChange')
        return doc
      },
    ],
    afterDelete: [
      async ({ doc }) => {
        await revalidatePaths([doc.route, '/sitemap.xml'].filter(Boolean) as string[], 'PageSeo.afterDelete')
        return doc
      },
    ],
  },
}
