// Posts — editorial content (blog). See spec:
//   docs/superpowers/specs/2026-05-22-blog-collection-design.md
//
// Hooks (autoSlug, calcReadingTime, revalidate) are added in later tasks.

import type { CollectionConfig } from 'payload'
import { lexicalEditor, FixedToolbarFeature, BlocksFeature } from '@payloadcms/richtext-lexical'
import { slugify } from '../../lib/slugify.ts'
import { lexicalToText, readingTimeMinutes } from '../../lib/lexical-text.ts'

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: {
    singular: 'Blog Post',
    plural: 'Blog Posts',
  },
  admin: {
    useAsTitle: 'title',
    // Cover leads (Shopify-style). Payload only links the FIRST column, and a
    // custom ui Cell isn't auto-wrapped — so PostCoverCell renders its own link
    // to the edit view when it's the linked column. Title is not clickable here.
    defaultColumns: ['coverPreview', 'title', '_status', 'category', 'updatedAt', 'publishedAt'],
    description: 'ENVO editorial content. Publish to make a post visible on the website.',
    group: 'Content',
  },
  access: {
    read: () => true,
  },
  versions: {
    drafts: true,
  },
  // Editor-style layout: the main column is for writing (title, excerpt,
  // cover, body); everything else (publishing knobs, taxonomy, SEO) lives in
  // the right sidebar or a collapsed section, so the writing surface stays
  // front-and-centre — like WordPress / Ghost.
  fields: [
    // ===== Main column — the writing surface =====
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        placeholder: 'Post headline',
        // Make the title text link into the edit view even though the cover
        // thumbnail is the first list column. List-only; no form effect.
        components: {
          Cell: '/payload/components/LinkedTextCell#LinkedTextCell',
        },
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      required: true,
      maxLength: 200,
      admin: {
        placeholder: 'One or two sentences shown on cards and in search results.',
        description: 'Shown on blog cards and used as the meta-description fallback (max 200 characters).',
      },
    },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: { description: 'Cover image — used on list cards and as the detail-page header.' },
    },
    {
      name: 'body',
      type: 'richText',
      required: true,
      label: 'Content',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          // Always-visible formatting toolbar (headings, bold/italic, lists,
          // links, quote… all already in defaultFeatures).
          FixedToolbarFeature(),
          // Escape hatch for custom layout: insert a raw-HTML block anywhere in
          // the content. Rendered verbatim on the published page.
          BlocksFeature({
            blocks: [
              {
                slug: 'html',
                labels: { singular: 'HTML', plural: 'HTML blocks' },
                fields: [
                  {
                    name: 'html',
                    type: 'code',
                    label: 'Raw HTML',
                    admin: {
                      language: 'html',
                      description: 'Custom HTML for special layouts. Rendered as-is on the published page.',
                    },
                  },
                ],
              },
            ],
          }),
        ],
      }),
    },

    // SEO & social — flat fields right below the content (no collapsible).
    {
      name: 'seoTitle',
      type: 'text',
      label: 'SEO title',
      admin: { description: 'Optional. Falls back to the post title if empty.' },
    },
    {
      name: 'seoDescription',
      type: 'textarea',
      label: 'SEO description',
      admin: { description: 'Optional. Falls back to the excerpt if empty.' },
    },
    {
      name: 'ogImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Social share image',
      admin: { description: 'Optional. Falls back to the cover image if empty.' },
    },

    // List-only cover thumbnail (no stored data; reads the populated cover relationship).
    {
      name: 'coverPreview',
      type: 'ui',
      label: 'Cover',
      admin: {
        components: {
          Cell: '/payload/components/PostCoverCell#PostCoverCell',
        },
      },
    },

    // ===== Right sidebar — publishing knobs & metadata =====
    {
      name: 'publishedAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: {
        position: 'sidebar',
        description: 'When the post goes live. Set a future date/time to schedule it.',
        date: { displayFormat: 'dd/MM/yyyy HH:mm' },
      },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Guides', value: 'guides' },
        { label: 'Tech Insights', value: 'tech_insights' },
        { label: 'Company News', value: 'company_news' },
        { label: 'Industry', value: 'industry' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Primary section. Drives the /blog/category pages.',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Show in featured spots on /blog and the home page.',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
        description: 'Post URL: /blog/<slug>. Auto-filled from the title — edit only for a custom URL.',
      },
    },
    {
      name: 'tags',
      type: 'array',
      fields: [{ name: 'tag', type: 'text', required: true }],
      admin: {
        position: 'sidebar',
        description: 'Free-form tags. Power the /blog/tag pages.',
      },
    },
    {
      name: 'readingTime',
      type: 'number',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Estimated minutes to read. Calculated on save.',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        // Slug is now editable: normalize whatever was typed so the URL stays
        // clean, and fall back to the title when left blank on create.
        if (data.slug) {
          data.slug = slugify(data.slug)
        } else if (operation === 'create' && data.title) {
          data.slug = slugify(data.title)
        }
        return data
      },
      ({ data }) => {
        // Calculate readingTime from body. Re-runs on every save.
        if (data.body) {
          const text = lexicalToText(data.body)
          data.readingTime = readingTimeMinutes(text)
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc }) => {
        // Revalidate Next.js ISR cache when public state changes.
        // Skip silently when this is a draft→draft change (nothing public moved).
        const wasPublic = previousDoc?._status === 'published'
        const isPublic = doc._status === 'published'
        if (!wasPublic && !isPublic) return doc

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
        const secret = process.env.REVALIDATE_SECRET
        if (!siteUrl || !secret) {
          // Env not configured (CI, fresh checkout). Don't fail the save.
          return doc
        }

        const paths = new Set<string>(['/blog'])
        if (doc.slug) paths.add(`/blog/${doc.slug}`)
        if (doc.category) paths.add(`/blog/category/${doc.category}`)
        // Old slug: revalidate too, so a rename clears the old static page.
        if (previousDoc?.slug && previousDoc.slug !== doc.slug) {
          paths.add(`/blog/${previousDoc.slug}`)
        }

        try {
          await fetch(
            `${siteUrl}/api/revalidate?paths=${Array.from(paths).join(',')}`,
            { method: 'POST', headers: { 'x-revalidate-secret': secret } },
          )
        } catch (err) {
          console.error('[Posts.afterChange] revalidate fetch failed:', err)
        }

        return doc
      },
    ],
  },
}
