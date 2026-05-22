import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  admin: {
    group: 'Settings',
    description: 'Global site configuration — nav, footer, contact, SEO, and announcement banner.',
  },
  access: {
    read: () => true,
  },
  fields: [
    // ─── Announcement Banner ────────────────────────────────────────────────
    {
      name: 'banner',
      type: 'group',
      label: 'Announcement Banner',
      admin: { description: 'Shown at the very top of every page. Leave message blank to hide.' },
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

    // ─── Navigation ──────────────────────────────────────────────────────────
    {
      name: 'nav',
      type: 'group',
      label: 'Navigation',
      fields: [
        {
          name: 'primary_links',
          type: 'array',
          label: 'Primary nav links',
          admin: { description: 'Main links shown in the sidebar / top nav.' },
          fields: [
            { name: 'label', type: 'text',     required: true },
            { name: 'url',   type: 'text',     required: true },
            { name: 'icon',  type: 'text',     label: 'Lucide icon name (optional)', admin: { description: 'e.g. "Zap", "Package", "BookOpen"' } },
            { name: 'open_in_new_tab', type: 'checkbox', label: 'Open in new tab', defaultValue: false },
          ],
        },
        {
          name: 'cta_label', type: 'text', label: 'Header CTA button label',
          defaultValue: 'Get a Quote',
        },
        {
          name: 'cta_url',   type: 'text', label: 'Header CTA button URL',
          defaultValue: '/contact',
        },
      ],
    },

    // ─── Footer ──────────────────────────────────────────────────────────────
    {
      name: 'footer',
      type: 'group',
      label: 'Footer',
      fields: [
        { name: 'tagline', type: 'text', label: 'Tagline under logo' },
        {
          name: 'link_columns',
          type: 'array',
          label: 'Link columns',
          maxRows: 4,
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
        { name: 'legal_text', type: 'text', label: 'Legal / copyright line', admin: { description: 'e.g. "© 2026 Wellforces Ltd. All rights reserved."' } },
        {
          name: 'social_links',
          type: 'array',
          label: 'Social links',
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
      ],
    },

    // ─── Contact ─────────────────────────────────────────────────────────────
    {
      name: 'contact',
      type: 'group',
      label: 'Contact Details',
      fields: [
        { name: 'email',   type: 'email', label: 'General enquiries email' },
        { name: 'phone',   type: 'text',  label: 'Phone number' },
        { name: 'address', type: 'textarea', label: 'Physical address' },
        { name: 'hours',   type: 'text',  label: 'Business hours', admin: { description: 'e.g. "Mon–Fri 8am–5pm NZST"' } },
      ],
    },

    // ─── SEO Defaults ────────────────────────────────────────────────────────
    {
      name: 'seo',
      type: 'group',
      label: 'SEO Defaults',
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
