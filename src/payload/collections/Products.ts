// Payload IS the product database. Akeneo sync writes into this collection.
// Editors can change anything from the Payload admin.
//
// Sync behaviour:
//   - sync_locked = false (default): Akeneo sync updates all spec fields on each run
//   - sync_locked = true: sync skips this product entirely — editor owns it fully

import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/is-admin'
import { CERT_OPTIONS } from '@/lib/cert-codes'
import { visibleProductOrAuthed, authedFieldRead } from '@/payload/access/public-read'
import { revalidatePaths } from '@/lib/revalidate'
import { productPaths } from '@/lib/product-paths'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['thumbnail', 'sku', 'name', 'family', 'enabled', 'featured'],
    description: 'ENVO product catalogue. ⚠️ The nightly Akeneo sync OVERWRITES every "Synced from Akeneo" field — turn on Sync locked (sidebar) before hand-editing a product, or your changes disappear on the next sync. Payload-only fields (uploads, subtitle, pricing) are always safe.',
    group: 'Catalogue',
    // Hide un-enriched Akeneo shells (no family — never categorisable on the
    // frontend) from the default list. Clear the Filters panel to see them.
    baseListFilter: () => ({ family: { exists: true } }),
  },
  access: {
    delete: isAdmin,
    // Anonymous public API sees only live catalogue rows; SSR uses the Local
    // API (overrideAccess) so it still sees everything. Internal fields below
    // carry their own field-level read gate.
    read: visibleProductOrAuthed,
  },
  fields: [
    {
      name: 'thumbnail',
      type: 'ui',
      label: 'Photo',
      admin: {
        components: {
          Cell: '/payload/components/ProductImageCell#ProductImageCell',
        },
      },
    },
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
              admin: { description: 'Synced from Akeneo — the nightly sync overwrites edits unless Sync locked is on.' },
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
                description: 'Full product description. Accepts HTML. Synced from Akeneo — the nightly sync overwrites edits unless Sync locked is on.',
                rows: 8,
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'enabled',
                  access: { read: authedFieldRead },
                  type: 'checkbox',
                  defaultValue: true,
                  admin: {
                    description: 'Show on website.',
                    width: '50%',
                  },
                },
                {
                  name: 'hidden',
                  access: { read: authedFieldRead },
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
              name: 'image_preview',
              type: 'ui',
              label: 'Akeneo images',
              admin: {
                components: {
                  Field: '/payload/components/ProductImagePreview#ProductImagePreview',
                },
              },
            },
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
                {
                  type: 'row',
                  fields: [
                    { name: 'cc_region_min', type: 'number', label: 'Min Output Voltage (V)', admin: { width: '50%' } },
                    { name: 'cc_region_max', type: 'number', label: 'Max Output Voltage (V)', admin: { width: '50%' } },
                  ],
                },
              ],
            },
            {
              type: 'collapsible',
              label: 'Driver / Controller',
              admin: { description: 'Applies to PSU controllers and switch modules. Leave blank for other families.' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'controller_type',
                      type: 'json',
                      label: 'Controller Type',
                      admin: { description: 'Raw array from Akeneo. e.g. ["push_dim","rf"]', width: '50%' },
                    },
                    {
                      name: 'output_channel',
                      type: 'text',
                      label: 'Output Channel',
                      admin: { width: '50%', description: 'e.g. 1ch, rgb, rgbw, cct' },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'output_type',
                      type: 'text',
                      label: 'Output Type',
                      admin: { width: '33%', description: 'e.g. cv, cc, pwm' },
                    },
                    { name: 'module_size',      type: 'number', label: 'Module Size',            admin: { width: '33%' } },
                    { name: 'switch_no_module', type: 'number', label: 'No. of Switch Modules',  admin: { width: '33%' } },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'switch_operation_method',
                      type: 'text',
                      label: 'Switch Operation',
                      admin: { width: '33%', description: 'e.g. push, touch, rotary' },
                    },
                    {
                      name: 'mounting_info',
                      type: 'text',
                      label: 'Mounting',
                      admin: { width: '33%', description: 'e.g. surface, recessed, din_rail, in_wall' },
                    },
                    {
                      name: 'switch_back_light',
                      type: 'checkbox',
                      label: 'Switch Backlight',
                      defaultValue: false,
                      admin: { width: '33%' },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'finish_colour',
                      type: 'text',
                      label: 'Finish Colour',
                      admin: { width: '50%', description: 'e.g. white, black, silver' },
                    },
                    {
                      name: 'material',
                      type: 'text',
                      label: 'Material',
                      admin: { width: '50%', description: 'e.g. aluminum, plastic, steel' },
                    },
                  ],
                },
              ],
            },
            {
              type: 'collapsible',
              label: 'LED / Light Output',
              admin: { description: 'Applies to LED modules, strips, and light sources. Leave blank for drivers and controllers.' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'brightness_lm',    type: 'number', label: 'Brightness (lm)',   admin: { width: '25%' } },
                    { name: 'efficacy_lm_w',    type: 'number', label: 'Efficacy (lm/W)',   admin: { width: '25%' } },
                    { name: 'cct_k',            type: 'number', label: 'Colour Temp (K)',   admin: { width: '25%' } },
                    { name: 'cri',              type: 'number', label: 'CRI',               admin: { width: '25%' } },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'beam_angle_deg',   type: 'number', label: 'Beam Angle (°)',    admin: { width: '25%' } },
                    { name: 'lifetime_hrs',     type: 'number', label: 'Lifetime (hrs)',    admin: { width: '25%' } },
                    { name: 'max_in_series',    type: 'number', label: 'Max in Series',     admin: { width: '25%' } },
                    {
                      name: 'led_chip_colour',
                      type: 'select',
                      label: 'Chip Colour',
                      options: [
                        { label: 'Warm White (2700–3000K)',  value: 'warm_white'    },
                        { label: 'Natural White (4000K)',    value: 'natural_white' },
                        { label: 'Cool White (6000–7000K)',  value: 'cool_white'    },
                        { label: 'RGB',                      value: 'rgb'           },
                        { label: 'RGBW',                     value: 'rgbw'          },
                        { label: 'Tunable White',            value: 'tunable_white' },
                      ],
                      admin: { width: '25%' },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'led_pitch', type: 'number', label: 'LED Pitch (mm)', admin: { width: '50%' } },
                    {
                      name: 'led_light_power_input',
                      type: 'json',
                      label: 'LED Light Power Input',
                      admin: { description: 'Raw array from Akeneo.', width: '50%' },
                    },
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
                        { label: 'IP66',           value: 'ip66'           },
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
              label: 'Sensor',
              admin: { description: 'Applies to sensor products only. Leave blank for other families.' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'sensor_type',
                      type: 'select',
                      label: 'Sensor Type',
                      options: [
                        { label: 'PIR',                  value: 'pir'       },
                        { label: 'Microwave',            value: 'microwave' },
                        { label: 'Daylight',             value: 'daylight'  },
                        { label: 'Dual (PIR+Microwave)', value: 'dual'      },
                      ],
                      admin: { width: '33%' },
                    },
                    {
                      name: 'technology',
                      type: 'text',
                      label: 'Technology',
                      admin: { width: '33%', description: 'e.g. pir, microwave, infrared' },
                    },
                    {
                      name: 'maximum_detection_range',
                      type: 'text',
                      label: 'Max Detection Range',
                      admin: { width: '33%', description: 'e.g. 12m, 6m radius' },
                    },
                  ],
                },
                {
                  name: 'multiway',
                  type: 'checkbox',
                  label: 'Multiway Compatible',
                  defaultValue: false,
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
                  // Shared with the Akeneo sync (src/lib/cert-codes.ts) so the
                  // option set can't drift from what the sync keeps.
                  options: CERT_OPTIONS.map((o) => ({ ...o })),
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
          label: 'Pricing (internal)',
          description: 'Internal reference only — the brand site is lead-gen and NEVER shows prices, stock or pack quantities. Fulfilment lives with the regional distributors.',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'price_nzd',
                  access: { read: authedFieldRead },
                  type: 'number',
                  label: 'Price (NZD)',
                  admin: { width: '33%', description: 'Retail price ex-GST. Internal — never rendered on the site.' },
                },
                {
                  name: 'inventory_type',
                  access: { read: authedFieldRead },
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
                  access: { read: authedFieldRead },
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
                  access: { read: authedFieldRead },
                  type: 'number',
                  label: 'Shipping Lead (days)',
                  admin: { width: '50%' },
                },
                {
                  name: 'manufacturing_lead_days',
                  access: { read: authedFieldRead },
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
              access: { read: authedFieldRead },
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
              admin: { description: 'Page title tag. Synced from Akeneo — overwritten on sync unless Sync locked is on.' },
            },
            {
              name: 'seo_description',
              type: 'textarea',
              admin: { description: 'Meta description. Synced from Akeneo — overwritten on sync unless Sync locked is on.' },
            },
            {
              name: 'faq',
              type: 'array',
              label: 'FAQ',
              admin: { description: 'Questions and answers shown on the product page. Synced from Akeneo — overwritten on sync unless Sync locked is on.' },
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
              access: { read: authedFieldRead },
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
  hooks: {
    // Product pages are fully static (generateStaticParams, no ISR fallback),
    // so an edit/sync/delete was invisible on the live site until the next
    // deploy. Invalidate every page the SKU appears on — plus the previous
    // family/series paths when those change, so the SKU leaves its old pages.
    afterChange: [
      async ({ doc, previousDoc }) => {
        const paths = new Set([...productPaths(doc), ...(previousDoc ? productPaths(previousDoc) : [])])
        await revalidatePaths(paths, 'Products.afterChange')
        return doc
      },
    ],
    afterDelete: [
      async ({ doc }) => {
        await revalidatePaths(productPaths(doc), 'Products.afterDelete')
        return doc
      },
    ],
  },
}
