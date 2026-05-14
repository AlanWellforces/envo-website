// DRAFT — final location: src/payload/collections/Products.ts
// Move here when Mackenzie's scaffold lands in Stage 2.
//
// This replaces both schema.ts and ProductOverrides.collection.ts.
// Payload IS the product database. Akeneo sync writes into this collection.
// Editors can change anything from the Payload admin.
//
// Sync behaviour:
//   - sync_locked = false (default): Akeneo sync updates all spec fields on each run
//   - sync_locked = true: sync skips this product entirely — editor owns it fully

import type { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['sku', 'name', 'family', 'price_nzd', 'enabled', 'featured'],
    description: 'ENVO product catalogue. Synced from Akeneo — edit freely. Enable sync_locked to prevent Akeneo from overwriting your changes.',
    group: 'Products',
  },
  access: {
    read: () => true,
  },
  fields: [
    // -------------------------------------------------------------------------
    // TABS
    // -------------------------------------------------------------------------
    {
      type: 'tabs',
      tabs: [

        // -----------------------------------------------------------------------
        // TAB 1: Overview
        // -----------------------------------------------------------------------
        {
          label: 'Overview',
          fields: [
            {
              name: 'name',
              type: 'text',
              required: true,
              admin: { description: 'Synced from Akeneo. Edit freely.' },
            },
            {
              name: 'subtitle',
              type: 'text',
              admin: { description: 'Short tagline shown under the product name.' },
            },
            {
              name: 'short_description',
              type: 'textarea',
              admin: { description: 'One-line summary used in search results and meta tags.' },
            },
            {
              name: 'description',
              type: 'textarea',
              admin: {
                description: 'Full product description. Accepts HTML. Synced from Akeneo — edit to override.',
                rows: 8,
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'enabled',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: {
                    description: 'Show on website.',
                    width: '50%',
                  },
                },
                {
                  name: 'hidden',
                  type: 'checkbox',
                  defaultValue: false,
                  admin: {
                    description: 'Hide without disabling in Akeneo.',
                    width: '50%',
                  },
                },
              ],
            },
          ],
        },

        // -----------------------------------------------------------------------
        // TAB 2: Media
        // -----------------------------------------------------------------------
        {
          label: 'Media',
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: 'Primary product image. Upload to replace the Akeneo image.',
              },
            },
            {
              name: 'clean_image',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: 'Clean product image on white background. Used for category cards.',
              },
            },
            {
              name: 'image_url_fallback',
              type: 'text',
              admin: {
                description: 'Akeneo S3 image URL — used automatically if no image is uploaded above. Do not edit.',
                readOnly: true,
              },
            },
            {
              name: 'clean_image_url_fallback',
              type: 'text',
              admin: {
                description: 'Akeneo S3 clean image URL — fallback if no clean image uploaded. Do not edit.',
                readOnly: true,
              },
            },
            {
              name: 'spec_sheet_url',
              type: 'text',
              admin: {
                description: 'Link to the spec sheet PDF. Can be an Akeneo URL or any external link.',
              },
            },
          ],
        },

        // -----------------------------------------------------------------------
        // TAB 3: Specs
        // -----------------------------------------------------------------------
        {
          label: 'Specs',
          fields: [
            {
              type: 'collapsible',
              label: 'Electrical',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'power_w',           type: 'number', label: 'Power (W)',           admin: { width: '25%' } },
                    { name: 'output_voltage_v',  type: 'number', label: 'Output Voltage (V)',  admin: { width: '25%' } },
                    { name: 'input_voltage_min_v', type: 'number', label: 'Input Min (V)',     admin: { width: '25%' } },
                    { name: 'input_voltage_max_v', type: 'number', label: 'Input Max (V)',     admin: { width: '25%' } },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'rated_current_a',   type: 'number', label: 'Rated Current (A)',  admin: { width: '25%' } },
                    { name: 'number_of_outputs', type: 'number', label: 'No. of Outputs',     admin: { width: '25%' } },
                    {
                      name: 'operation_mode',
                      type: 'select',
                      label: 'Operation Mode',
                      options: [
                        { label: 'Constant Voltage (CV)',    value: 'cv'    },
                        { label: 'Constant Current (CC)',    value: 'cc'    },
                        { label: 'CV + CC',                  value: 'cv_cc' },
                      ],
                      admin: { width: '50%' },
                    },
                  ],
                },
                {
                  name: 'dimming_control',
                  type: 'select',
                  hasMany: true,
                  label: 'Dimming Control',
                  options: [
                    { label: 'None',        value: 'none'    },
                    { label: 'DALI / DALI2',value: 'dali'    },
                    { label: '0/1-10V',     value: '0_10v'   },
                    { label: 'PWM',         value: 'pwm'     },
                    { label: 'Triac',       value: 'triac'   },
                    { label: 'Casambi',     value: 'casambi' },
                    { label: 'DMX',         value: 'dmx'     },
                    { label: 'KNX',         value: 'knx'     },
                    { label: 'Matter',      value: 'matter'  },
                    { label: 'Zigbee',      value: 'zigbee'  },
                  ],
                },
              ],
            },
            {
              type: 'collapsible',
              label: 'Physical',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'length_mm', type: 'number', label: 'Length (mm)', admin: { width: '25%' } },
                    { name: 'width_mm',  type: 'number', label: 'Width (mm)',  admin: { width: '25%' } },
                    { name: 'height_mm', type: 'number', label: 'Height (mm)', admin: { width: '25%' } },
                    { name: 'weight_kg', type: 'number', label: 'Weight (kg)', admin: { width: '25%' } },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'waterproof',
                      type: 'select',
                      label: 'IP Rating',
                      options: [
                        { label: 'Non-Waterproof', value: 'non_waterproof' },
                        { label: 'IP20',           value: 'ip20'           },
                        { label: 'IP44',           value: 'ip44'           },
                        { label: 'IP65',           value: 'ip65'           },
                        { label: 'IP67',           value: 'ip67'           },
                        { label: 'IP68',           value: 'ip68'           },
                      ],
                      admin: { width: '33%' },
                    },
                    { name: 'temp_min_c', type: 'number', label: 'Temp Min (°C)', admin: { width: '33%' } },
                    { name: 'temp_max_c', type: 'number', label: 'Temp Max (°C)', admin: { width: '33%' } },
                  ],
                },
              ],
            },
            {
              type: 'collapsible',
              label: 'Compliance & Warranty',
              fields: [
                {
                  name: 'standards_met',
                  type: 'select',
                  hasMany: true,
                  label: 'Certifications',
                  options: [
                    { label: 'CE',       value: 'c_ce'   },
                    { label: 'SAA',      value: 'c_saa'  },
                    { label: 'TUV',      value: 'c_tuv'  },
                    { label: 'UL',       value: 'c_ul'   },
                    { label: 'RCM',      value: 'c_rcm'  },
                    { label: 'FCC',      value: 'c_fcc'  },
                    { label: 'RoHS',     value: 'c_rohs' },
                    { label: 'ENEC',     value: 'c_enec' },
                  ],
                },
                {
                  name: 'warranty_years',
                  type: 'number',
                  label: 'Warranty (years)',
                },
              ],
            },
          ],
        },

        // -----------------------------------------------------------------------
        // TAB 4: Pricing & Availability
        // -----------------------------------------------------------------------
        {
          label: 'Pricing',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'price_nzd',
                  type: 'number',
                  label: 'Price (NZD)',
                  admin: { width: '33%', description: 'Retail price ex-GST.' },
                },
                {
                  name: 'inventory_type',
                  type: 'select',
                  label: 'Availability',
                  options: [
                    { label: 'In Stock',    value: 'stocked'   },
                    { label: 'On Demand',   value: 'on_demand' },
                  ],
                  admin: { width: '33%' },
                },
                {
                  name: 'pack_qty',
                  type: 'number',
                  label: 'Pack Qty',
                  admin: { width: '33%', description: 'Units per carton.' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'shipping_lead_days',
                  type: 'number',
                  label: 'Shipping Lead (days)',
                  admin: { width: '50%' },
                },
                {
                  name: 'manufacturing_lead_days',
                  type: 'number',
                  label: 'Manufacturing Lead (days)',
                  admin: { width: '50%' },
                },
              ],
            },
          ],
        },

        // -----------------------------------------------------------------------
        // TAB 5: Marketing
        // -----------------------------------------------------------------------
        {
          label: 'Marketing',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'featured',
                  type: 'checkbox',
                  defaultValue: false,
                  admin: { description: 'Show in featured sections.', width: '33%' },
                },
                {
                  name: 'badge',
                  type: 'select',
                  options: [
                    { label: 'None',      value: ''          },
                    { label: 'New',       value: 'new'       },
                    { label: 'Popular',   value: 'popular'   },
                    { label: 'Sale',      value: 'sale'      },
                    { label: 'Clearance', value: 'clearance' },
                  ],
                  admin: { width: '33%' },
                },
                {
                  name: 'display_order',
                  type: 'number',
                  admin: { description: 'Lower = appears first.', width: '33%' },
                },
              ],
            },
            {
              name: 'marketing_note',
              type: 'textarea',
              admin: { description: 'Short note on the product page. e.g. "Popular for commercial signage."' },
            },
            {
              name: 'applications',
              type: 'array',
              label: 'Application Pages',
              admin: { description: 'Which application pages feature this product.' },
              fields: [
                {
                  name: 'application_slug',
                  type: 'text',
                  required: true,
                  admin: { description: 'e.g. signage, cabinetry, residential, outdoor' },
                },
                {
                  name: 'pinned',
                  type: 'checkbox',
                  defaultValue: false,
                  admin: { description: 'Pin to top of this application page.' },
                },
              ],
            },
            {
              name: 'related_skus',
              type: 'array',
              label: 'Related Products',
              admin: { description: 'Manually curated. Leave empty to auto-generate from same series.' },
              fields: [
                {
                  name: 'sku',
                  type: 'text',
                  required: true,
                  admin: { description: 'e.g. SC-60-24' },
                },
              ],
            },
          ],
        },

        // -----------------------------------------------------------------------
        // TAB 6: SEO & FAQ
        // -----------------------------------------------------------------------
        {
          label: 'SEO & FAQ',
          fields: [
            {
              name: 'seo_title',
              type: 'text',
              admin: { description: 'Page title tag. Synced from Akeneo.' },
            },
            {
              name: 'seo_description',
              type: 'textarea',
              admin: { description: 'Meta description. Synced from Akeneo.' },
            },
            {
              name: 'faq',
              type: 'array',
              label: 'FAQ',
              admin: { description: 'Questions and answers shown on the product page. Synced from Akeneo — edit freely.' },
              fields: [
                {
                  name: 'question',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'answer',
                  type: 'textarea',
                  required: true,
                },
                {
                  name: 'category',
                  type: 'select',
                  options: [
                    { label: 'Specs',       value: 'Specs'       },
                    { label: 'Application', value: 'Application' },
                    { label: 'Compatibility', value: 'Compatibility' },
                    { label: 'Environment', value: 'Environment' },
                    { label: 'Comparison',  value: 'Comparison'  },
                  ],
                },
              ],
            },
          ],
        },

        // -----------------------------------------------------------------------
        // TAB 7: Sync Info
        // -----------------------------------------------------------------------
        {
          label: 'Sync',
          fields: [
            {
              name: 'sync_locked',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description:
                  'When enabled, Akeneo sync will skip this product entirely. ' +
                  'Use when you have manually customised this product and do not want it overwritten.',
              },
            },
            {
              name: 'sku',
              type: 'text',
              required: true,
              unique: true,
              admin: {
                description: 'Akeneo SKU — do not edit.',
                readOnly: false,
              },
            },
            {
              type: 'row',
              fields: [
                { name: 'family',  type: 'text', admin: { width: '33%', readOnly: true } },
                { name: 'series',  type: 'text', admin: { width: '33%', readOnly: true } },
                { name: 'brand',   type: 'text', admin: { width: '33%', readOnly: true } },
              ],
            },
            {
              name: 'categories',
              type: 'array',
              admin: { readOnly: true, description: 'Akeneo category codes.' },
              fields: [
                { name: 'code', type: 'text' },
              ],
            },
            {
              name: 'akeneo_synced_at',
              type: 'date',
              admin: {
                readOnly: true,
                description: 'Last time this product was updated from Akeneo.',
                date: { displayFormat: 'dd/MM/yyyy HH:mm' },
              },
            },
          ],
        },

      ],
    },
  ],
}
