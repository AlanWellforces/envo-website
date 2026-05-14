// DRAFT — final location: src/lib/db/schema.ts
// Move here when Mackenzie's scaffold lands in Stage 2.

import {
  pgTable,
  varchar,
  text,
  boolean,
  integer,
  numeric,
  doublePrecision,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core'

// ---------------------------------------------------------------------------
// products
// Source of truth: Akeneo PIM (synced via scripts/akeneo-sync.ts)
// Do not manually edit rows — run the sync script instead.
// ---------------------------------------------------------------------------

export const products = pgTable('products', {

  // --- Identity ---
  sku:                      varchar('sku', { length: 100 }).primaryKey(),
  family:                   varchar('family', { length: 100 }),    // psu_led_cv / psu_led_cc / psu_led_cv_cc / etc
  categories:               text('categories').array(),            // all Akeneo category codes
  series:                   varchar('series', { length: 100 }),    // sc_envo / etc
  brand:                    varchar('brand', { length: 50 }).default('envo'),
  enabled:                  boolean('enabled').default(true),

  // --- Display ---
  name:                     text('name'),                          // product_name, scope: envo_nz
  subtitle:                 text('subtitle'),                      // subtitle, scope: envo_nz
  short_description:        text('short_description'),
  description:              text('description'),                   // HTML

  // --- Electrical specs ---
  power_w:                  doublePrecision('power_w'),            // watts
  output_voltage_v:         doublePrecision('output_voltage_v'),   // volts
  input_voltage_min_v:      doublePrecision('input_voltage_min_v'),
  input_voltage_max_v:      doublePrecision('input_voltage_max_v'),
  rated_current_a:          doublePrecision('rated_current_a'),    // amps
  operation_mode:           varchar('operation_mode', { length: 20 }),  // cv / cc / cv_cc
  dimming_control:          text('dimming_control').array(),       // [none] / [dali] / [0_10v] / [pwm] etc
  number_of_outputs:        integer('number_of_outputs'),

  // --- Physical specs ---
  width_mm:                 doublePrecision('width_mm'),
  height_mm:                doublePrecision('height_mm'),
  length_mm:                doublePrecision('length_mm'),
  weight_kg:                doublePrecision('weight_kg'),
  waterproof:               varchar('waterproof', { length: 30 }),  // non_waterproof / ip20 / ip65 / ip67 / ip68
  temp_min_c:               doublePrecision('temp_min_c'),
  temp_max_c:               doublePrecision('temp_max_c'),

  // --- Compliance & warranty ---
  standards_met:            text('standards_met').array(),         // [c_ce, c_saa, c_tuv] etc
  warranty_years:           doublePrecision('warranty_years'),

  // --- Pricing & logistics ---
  price_nzd:                numeric('price_nzd', { precision: 10, scale: 2 }),  // exact decimal for money
  inventory_type:           varchar('inventory_type', { length: 30 }),  // stocked / on_demand
  pack_qty:                 integer('pack_qty'),                   // units per carton
  shipping_lead_days:       integer('shipping_lead_days'),
  manufacturing_lead_days:  integer('manufacturing_lead_days'),

  // --- Media (AWS S3 URLs — public, no auth required) ---
  image_url:                text('image_url'),                     // product_image.aws
  clean_image_url:          text('clean_image_url'),               // clean_image.aws
  spec_sheet_url:           text('spec_sheet_url'),                // spec_sheet.aws

  // --- SEO ---
  seo_title:                text('seo_title'),
  seo_description:          text('seo_description'),

  // --- FAQ ---
  faq_json:                 text('faq_json'),                      // JSON string — parse on read

  // --- Raw Akeneo payload (for debugging and future attributes) ---
  raw_akeneo:               jsonb('raw_akeneo'),

  // --- Sync metadata ---
  synced_at:                timestamp('synced_at', { withTimezone: true }).defaultNow(),
})

export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
