import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Adds Submissions.notify — the sales-email notification outcome stamped by
// /api/submissions (sent / failed / skipped). HAND-AUTHORED and guarded:
// this is the repo's first migration and prod's schema already exists, so an
// auto-generated (full-baseline) migration would try to re-create every
// table. Future one-field changes can follow this same targeted pattern.
// Existing rows stay NULL = "recorded before tracking existed".

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_submissions_notify" AS ENUM('sent', 'failed', 'skipped');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `)
  await db.execute(sql`
    ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "notify" "public"."enum_submissions_notify";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "submissions" DROP COLUMN IF EXISTS "notify";`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum_submissions_notify";`)
}
