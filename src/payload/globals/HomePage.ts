import type { GlobalConfig } from 'payload'

// Fields mirror the live v4 homepage sections (src/components/home/*). Sections
// with no fields here (Value Props, Shop by Category, Signage Range) are
// product/structure-driven and stay code-owned. Every field falls back to the
// current hardcoded copy when left empty, so a blank global renders the site
// exactly as designed.

export const HomePage: GlobalConfig = {
  slug: 'home-page',
  label: 'Homepage',
  admin: {
    group: 'Website',
    description:
      'Text for the homepage Hero, Why ENVO and Free Layout Design sections. Leave a field empty to keep the built-in copy. Saving publishes immediately.',
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [
      async ({ doc }) => {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
        const secret = process.env.REVALIDATE_SECRET
        if (!siteUrl || !secret) return doc // env not configured (CI, fresh checkout)
        try {
          await fetch(`${siteUrl}/api/revalidate?paths=/`, {
            method: 'POST',
            headers: { 'x-revalidate-secret': secret },
          })
        } catch (err) {
          console.error('[HomePage.afterChange] revalidate fetch failed:', err)
        }
        return doc
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [

        // ─── Hero ─────────────────────────────────────────────────────────────
        {
          label: 'Hero',
          fields: [
            {
              name: 'hero_eyebrow',
              type: 'text',
              admin: { description: 'Small label above the headline. Default: "High-Quality LED Signage Components".' },
            },
            {
              name: 'hero_headline',
              type: 'textarea',
              admin: { description: 'Main H1. A line break here becomes a line break on the page. Default: "Innovative signage / for the digital age."' },
            },
            {
              name: 'hero_lead',
              type: 'textarea',
              admin: { description: 'Paragraph under the headline. Plain text — the built-in default keeps its bold styling until you override it.' },
            },
            {
              name: 'hero_primary_label',
              type: 'text',
              admin: { description: 'Primary button. Default: "Explore signage modules" → /products.' },
            },
            { name: 'hero_primary_url', type: 'text' },
            {
              name: 'hero_ghost_label',
              type: 'text',
              admin: { description: 'Secondary button. Default: "Get free layout design" → /free-layout-design.' },
            },
            { name: 'hero_ghost_url', type: 'text' },
          ],
        },

        // ─── Why ENVO ─────────────────────────────────────────────────────────
        {
          label: 'Why ENVO',
          fields: [
            {
              name: 'why_eyebrow',
              type: 'text',
              admin: { description: 'Default: "Why ENVO".' },
            },
            {
              name: 'why_heading',
              type: 'textarea',
              admin: { description: 'Section heading; line breaks respected. Default: "Engineered, certified, / supported."' },
            },
            {
              name: 'why_pillars',
              type: 'array',
              maxRows: 3,
              admin: { description: '3 pillar cards. Icons are fixed in code — only text is editable. Leave empty for defaults.' },
              fields: [
                { name: 'title', type: 'text', required: true },
                { name: 'desc', type: 'textarea', required: true },
              ],
            },
            {
              name: 'why_stats',
              type: 'array',
              maxRows: 4,
              admin: {
                description:
                  'Proof numbers. Built-in defaults (200+ SKUs, 7yr module warranty, 4 families, CE·UL·TÜV) were verified against the product data on 2026-07-03. Keep any replacement verifiable — no response-time promises.',
              },
              fields: [
                { name: 'value', type: 'text', required: true, admin: { description: 'e.g. "10+"' } },
                { name: 'label', type: 'text', required: true, admin: { description: 'e.g. "years manufacturing"' } },
                { name: 'lime', type: 'checkbox', defaultValue: false, admin: { description: 'Highlight this number in brand lime.' } },
              ],
            },
          ],
        },

        // ─── Free Layout CTA ──────────────────────────────────────────────────
        {
          label: 'Free Layout CTA',
          fields: [
            {
              name: 'fl_eyebrow',
              type: 'text',
              admin: { description: 'Default: "Free service". No response-time promises.' },
            },
            {
              name: 'fl_heading',
              type: 'text',
              admin: { description: 'Default: "Get a free layout design for your next project."' },
            },
            {
              name: 'fl_body',
              type: 'textarea',
              admin: { description: 'Paragraph inside the panel.' },
            },
            {
              name: 'fl_primary_label',
              type: 'text',
              admin: { description: 'Lime button. Default: "Get free layout design" → /free-layout-design.' },
            },
            { name: 'fl_primary_url', type: 'text' },
            {
              name: 'fl_ghost_label',
              type: 'text',
              admin: { description: 'Ghost button. Default: "Browse catalogue" → /products.' },
            },
            { name: 'fl_ghost_url', type: 'text' },
          ],
        },

      ],
    },
  ],
}
