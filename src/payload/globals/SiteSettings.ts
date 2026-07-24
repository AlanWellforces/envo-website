import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access/is-admin'

// Only fields that the site actually renders live here — anything not wired
// yet says so in its label. Deliberately NOT here: primary navigation (the
// sidebar's routes/icons are structural and code-owned) and business hours
// (we don't publish response-time or availability promises).

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  admin: {
    group: 'Settings',
    description: 'Global site configuration — footer text, contact details, SEO defaults.',
  },
  access: {
    read: () => true,
    // Site-wide settings are admin-only to write (P0 2026-07-24).
    update: isAdmin,
  },
  hooks: {
    afterChange: [
      async ({ doc }) => {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
        const secret = process.env.REVALIDATE_SECRET
        if (!siteUrl || !secret) return doc // env not configured (CI, fresh checkout)
        try {
          // /__site-settings clears the in-memory cache and revalidates the
          // root layout (footer/contact render on every page).
          await fetch(`${siteUrl}/api/revalidate?paths=/__site-settings,/contact`, {
            method: 'POST',
            headers: { 'x-revalidate-secret': secret },
          })
        } catch (err) {
          console.error('[SiteSettings.afterChange] revalidate fetch failed:', err)
        }
        return doc
      },
    ],
  },
  fields: [
    // ─── Announcement Banner ────────────────────────────────────────────────
    {
      name: 'banner',
      type: 'group',
      label: 'Announcement Banner (not wired yet)',
      admin: { description: 'Designed for the top of every page but not rendered by the site yet — editing has no effect until the banner component ships.' },
      fields: [
        { name: 'enabled',     type: 'checkbox', label: 'Show banner',    defaultValue: false },
        { name: 'message',     type: 'text',     label: 'Message' },
        { name: 'link_label',  type: 'text',     label: 'Link label (optional)' },
        { name: 'link_url',    type: 'text',     label: 'Link URL (optional)' },
        {
          name: 'style',
          type: 'select',
          label: 'Style',
          defaultValue: 'info',
          options: [
            { label: 'Info (blue)',    value: 'info'    },
            { label: 'Success (green)', value: 'success' },
            { label: 'Warning (amber)', value: 'warning' },
            { label: 'Promo (brand)',  value: 'promo'   },
          ],
        },
      ],
    },

    // ─── Footer ──────────────────────────────────────────────────────────────
    {
      name: 'footer',
      type: 'group',
      label: 'Footer',
      fields: [
        {
          name: 'tagline', type: 'text', label: 'Tagline under logo',
          admin: { description: 'Default: "Engineered illumination to elevate performance."' },
        },
        {
          name: 'legal_text', type: 'text', label: 'Legal / copyright line',
          admin: { description: 'Default: "© <year> Envo — Engineered Illumination". The year updates automatically in the default.' },
        },
        {
          name: 'social_links',
          type: 'array',
          label: 'Social links',
          admin: { description: 'Shown in the footer bottom row next to the legal links.' },
          fields: [
            {
              name: 'platform',
              type: 'select',
              options: [
                { label: 'LinkedIn',  value: 'linkedin'  },
                { label: 'Instagram', value: 'instagram' },
                { label: 'Facebook',  value: 'facebook'  },
                { label: 'YouTube',   value: 'youtube'   },
                { label: 'X / Twitter', value: 'twitter' },
              ],
            },
            { name: 'url', type: 'text', required: true },
          ],
        },
        {
          name: 'link_columns',
          type: 'array',
          label: 'Link columns (not wired yet)',
          maxRows: 4,
          admin: { description: 'Not rendered — the footer columns are code-owned; the Solutions column follows the Solutions collection automatically.' },
          fields: [
            { name: 'heading', type: 'text', required: true },
            {
              name: 'links',
              type: 'array',
              fields: [
                { name: 'label', type: 'text', required: true },
                { name: 'url',   type: 'text', required: true },
              ],
            },
          ],
        },
      ],
    },

    // ─── Contact ─────────────────────────────────────────────────────────────
    {
      name: 'contact',
      type: 'group',
      label: 'Contact Details',
      admin: { description: 'Shown on /contact ("Reach us directly" rail) and in the footer. ENVO\'s own contact only — never distributor phone numbers.' },
      fields: [
        {
          name: 'email', type: 'email', label: 'General enquiries email',
          admin: { description: 'Default: contact@envolighting.com.' },
        },
        {
          name: 'phones',
          type: 'array',
          label: 'Phone numbers',
          admin: { description: 'ENVO\'s own numbers, one per region. Label = short region tag shown before the number, e.g. "US".' },
          fields: [
            { name: 'label',  type: 'text', required: true, admin: { description: 'e.g. "US"' } },
            { name: 'number', type: 'text', required: true, admin: { description: 'Display format, e.g. "888.228.9138" or "+44 20 3398 6515"' } },
          ],
        },
        {
          name: 'address', type: 'textarea', label: 'Physical address',
          admin: { description: 'Line breaks respected. Default: 409 Canton Street, Unit 5 / Stoughton, MA 02072 · USA.' },
        },
      ],
    },

    // ─── SEO Defaults ────────────────────────────────────────────────────────
    {
      name: 'seo',
      type: 'group',
      label: 'SEO Defaults (not wired yet)',
      admin: { description: 'Not rendered yet — per-page SEO lives in the Page SEO collection. These site-wide defaults and the analytics IDs hook up in a later pass.' },
      fields: [
        {
          name: 'site_name', type: 'text', label: 'Site name',
          defaultValue: 'ENVO',
          admin: { description: 'Used in title tags: "Product Name | ENVO"' },
        },
        {
          name: 'title_separator', type: 'text', label: 'Title separator',
          defaultValue: '|',
        },
        {
          name: 'default_description', type: 'textarea', label: 'Default meta description',
          admin: { description: 'Fallback if a page has no specific description.' },
        },
        {
          name: 'default_og_image', type: 'upload', label: 'Default OG image',
          relationTo: 'media',
          admin: { description: 'Fallback Open Graph image for social sharing (1200×630px recommended).' },
        },
        {
          name: 'google_analytics_id', type: 'text', label: 'Google Analytics ID',
          admin: { description: 'e.g. G-XXXXXXXXXX' },
        },
        {
          name: 'google_tag_manager_id', type: 'text', label: 'Google Tag Manager ID',
          admin: { description: 'e.g. GTM-XXXXXXX' },
        },
      ],
    },
  ],
}
