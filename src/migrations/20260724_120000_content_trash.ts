import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// trash: true on Posts / Pages / Projects (soft delete → admin Trash).
// Payload adds a deletedAt field to each collection and its versions table.
// HAND-AUTHORED and IF-NOT-EXISTS guarded (same reasoning as
// 20260713_180000 / 20260723_120000): prod's schema already exists, so an
// auto-generated migration would try to re-create every table. Column names
// and indexes verified against a local dev push on 2026-07-24.

const TABLES = ['posts', 'pages', 'projects'] as const

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const t of TABLES) {
    await db.execute(sql.raw(`
      ALTER TABLE "${t}" ADD COLUMN IF NOT EXISTS "deleted_at" timestamptz;
      CREATE INDEX IF NOT EXISTS "${t}_deleted_at_idx" ON "${t}" ("deleted_at");
      ALTER TABLE "_${t}_v" ADD COLUMN IF NOT EXISTS "version_deleted_at" timestamptz;
      CREATE INDEX IF NOT EXISTS "_${t}_v_version_version_deleted_at_idx" ON "_${t}_v" ("version_deleted_at");
    `))
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const t of TABLES) {
    await db.execute(sql.raw(`
      DROP INDEX IF EXISTS "${t}_deleted_at_idx";
      ALTER TABLE "${t}" DROP COLUMN IF EXISTS "deleted_at";
      DROP INDEX IF EXISTS "_${t}_v_version_version_deleted_at_idx";
      ALTER TABLE "_${t}_v" DROP COLUMN IF EXISTS "version_deleted_at";
    `))
  }
}
