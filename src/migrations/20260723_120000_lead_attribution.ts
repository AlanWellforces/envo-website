import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Adds the first-party attribution columns to Submissions (landing page,
// referrer, UTM source/medium/campaign, first-touch source). HAND-AUTHORED and
// IF-NOT-EXISTS guarded, matching 20260713_180000_lead_notify_status — prod's
// schema already exists, so an auto-generated (full-baseline) migration would
// try to re-create every table. Existing rows keep NULLs (captured before
// attribution shipped). Payload maps camelCase fields → snake_case columns.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "submissions"
      ADD COLUMN IF NOT EXISTS "landing_page"       varchar,
      ADD COLUMN IF NOT EXISTS "referrer"           varchar,
      ADD COLUMN IF NOT EXISTS "utm_source"         varchar,
      ADD COLUMN IF NOT EXISTS "utm_medium"         varchar,
      ADD COLUMN IF NOT EXISTS "utm_campaign"       varchar,
      ADD COLUMN IF NOT EXISTS "first_touch_source" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "submissions"
      DROP COLUMN IF EXISTS "landing_page",
      DROP COLUMN IF EXISTS "referrer",
      DROP COLUMN IF EXISTS "utm_source",
      DROP COLUMN IF EXISTS "utm_medium",
      DROP COLUMN IF EXISTS "utm_campaign",
      DROP COLUMN IF EXISTS "first_touch_source";
  `)
}
