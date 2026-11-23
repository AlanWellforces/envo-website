import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Adds the new-PIM cert codes c_ukca / c_weee / c_ccc to the Products
// `standards_met` select (hasMany → enum_products_standards_met). Without them
// the Akeneo sync logs "unknown cert code" and drops the certs. HAND-AUTHORED
// and IF-NOT-EXISTS guarded, like the other migrations here: prod's schema
// already exists, so an auto-generated (full-baseline) migration would try to
// re-create every table.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`ALTER TYPE "public"."enum_products_standards_met" ADD VALUE IF NOT EXISTS 'c_ukca';`)
  await db.execute(sql`ALTER TYPE "public"."enum_products_standards_met" ADD VALUE IF NOT EXISTS 'c_weee';`)
  await db.execute(sql`ALTER TYPE "public"."enum_products_standards_met" ADD VALUE IF NOT EXISTS 'c_ccc';`)
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Postgres cannot drop a value from an enum. Rolling back means removing the
  // options in src/lib/cert-codes.ts; the extra enum values are harmless.
}
