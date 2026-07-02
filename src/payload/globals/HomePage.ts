import type { GlobalConfig } from 'payload'

export const HomePage: GlobalConfig = {
  slug: 'home-page',
  label: 'Homepage',
  admin: {
    group: 'Website',
    description: 'Content for each homepage section. Changes take effect on next publish.',
  },
  access: {
    read: () => true,
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
              defaultValue: 'Engineered Illumination',
              admin: { description: 'Small label above the headline.' },
            },
            {
              name: 'hero_headline',
              type: 'text',
              defaultValue: 'Light that performs.',
              admin: { description: 'Main H1. Use a period at the end.' },
            },
            {
              name: 'hero_subheading',
              type: 'textarea',
              defaultValue: 'ENVO designs and manufactures professional grade LED lighting systems that power signage and architectural illumination worldwide.',
            },
            {
              name: 'hero_video_url',
              type: 'text',
              defaultValue: '/assets/videos/hero-led-night.mp4',
              admin: { description: 'Path to background video. Leave as-is unless you upload a new one.' },
            },
            {
              name: 'hero_features',
              type: 'array',
              maxRows: 3,
              admin: { description: '3 feature bullets shown under the headline. Leave empty to use defaults.' },
              fields: [
                { name: 'label', type: 'text', required: true },
                { name: 'desc',  type: 'text', required: true },
              ],
            },
          ],
        },

        // ─── Stats (Impact section) ────────────────────────────────────────────
        {
          label: 'Stats',
          fields: [
            {
              name: 'stats_heading',
              type: 'text',
              defaultValue: 'Lighting systems engineered for impact.',
            },
            {
              name: 'stats_description',
              type: 'textarea',
              defaultValue: 'From concept to installation, ENVO delivers high-performance LED solutions with expert support at every stage.',
            },
            {
              name: 'stats_cta_label',
              type: 'text',
              defaultValue: 'Discover our solutions',
            },
            {
              name: 'stats_cta_url',
              type: 'text',
              defaultValue: '/solutions',
            },
            {
              name: 'stats_items',
              type: 'array',
              maxRows: 4,
              admin: { description: '4 stat cards. Icons are fixed — only text is editable here.' },
              fields: [
                { name: 'label', type: 'text', required: true },
                { name: 'desc',  type: 'text', required: true },
              ],
            },
          ],
        },

        // ─── Quote ────────────────────────────────────────────────────────────
        {
          label: 'Quote',
          fields: [
            {
              name: 'quote_text',
              type: 'textarea',
              defaultValue: 'Same colour binning across two phases of the same facade — that\'s spec\'d quality.',
              admin: { description: 'Testimonial quote. No quotation marks needed — they are added automatically.' },
            },
            {
              name: 'quote_author_role',
              type: 'text',
              defaultValue: 'Lead Architect',
            },
            {
              name: 'quote_author_location',
              type: 'text',
              defaultValue: 'Auckland CBD installation',
            },
          ],
        },

        // ─── Process ──────────────────────────────────────────────────────────
        {
          label: 'Process',
          fields: [
            {
              name: 'process_heading',
              type: 'text',
              defaultValue: 'Free Layout Design & Expert Support',
            },
            {
              name: 'process_cta_label',
              type: 'text',
              defaultValue: 'Get free layout design',
            },
            {
              name: 'process_cta_url',
              type: 'text',
              defaultValue: '/free-layout-design',
            },
            {
              name: 'process_steps',
              type: 'array',
              maxRows: 4,
              admin: { description: '4 process steps. Step numbers and icons are fixed.' },
              fields: [
                { name: 'name', type: 'text', required: true },
                { name: 'desc', type: 'text', required: true },
              ],
            },
          ],
        },

        // ─── Final CTA ────────────────────────────────────────────────────────
        {
          label: 'Final CTA',
          fields: [
            {
              name: 'cta_heading',
              type: 'text',
              defaultValue: 'Ready to engineer your next project?',
            },
            {
              name: 'cta_body',
              type: 'text',
              defaultValue: 'Find your match in 60 seconds, or talk to an engineer.',
            },
            {
              name: 'cta_primary_label',
              type: 'text',
              defaultValue: 'Find your match',
            },
            {
              name: 'cta_primary_url',
              type: 'text',
              defaultValue: '/find-your-match',
            },
            {
              name: 'cta_secondary_label',
              type: 'text',
              defaultValue: 'Contact engineering',
            },
            {
              name: 'cta_secondary_url',
              type: 'text',
              defaultValue: '/contact',
            },
          ],
        },

      ],
    },
  ],
}
