// Delete-protection for Media: refuse to remove a file that live content
// still references, and say exactly where it's used, instead of silently
// breaking images on the public site.
//
// Discovery is schema-driven — every FK column that points at media.id is
// found via information_schema at delete time, so new upload fields are
// covered automatically without editing this file. RichText bodies embed
// media as lexical upload nodes (plain JSON, no FK), so the three richtext
// columns are scanned separately.
import { sql } from '@payloadcms/db-postgres/drizzle'
import type { Payload } from 'payload'

type Rows = { rows: Record<string, unknown>[] }
type Drizzle = { execute: (query: unknown) => Promise<Rows> }

// table prefixes that reference media for bookkeeping, not content
const IGNORED_TABLE_PREFIXES = ['payload_', '_'] // payload internals + version tables

const RICHTEXT_COLUMNS: [table: string, column: string, label: string][] = [
  ['posts', 'body', 'post body'],
  ['pages', 'content', 'page content'],
  ['projects', 'body', 'project story'],
]

/** Human-readable list of places a media doc is referenced, empty = safe to delete. */
export async function findMediaUsage(payload: Payload, id: number | string): Promise<string[]> {
  const db = (payload.db as unknown as { drizzle: Drizzle }).drizzle
  const uses: string[] = []

  const fks = await db.execute(sql`
    select tc.table_name, kcu.column_name
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu on kcu.constraint_name = tc.constraint_name
    join information_schema.constraint_column_usage ccu on ccu.constraint_name = tc.constraint_name
    where tc.constraint_type = 'FOREIGN KEY'
      and ccu.table_name = 'media' and ccu.column_name = 'id'`)

  for (const row of fks.rows) {
    const table = String(row.table_name)
    const column = String(row.column_name)
    if (IGNORED_TABLE_PREFIXES.some((p) => table.startsWith(p))) continue
    if (table === 'media') continue // self-references (size variants)
    const count = await db.execute(
      sql`select count(*)::int as n from ${sql.identifier(table)} where ${sql.identifier(table)}.${sql.identifier(column)} = ${id}`,
    )
    const n = Number(count.rows[0]?.n ?? 0)
    if (n > 0) uses.push(`${table}.${column.replace(/_id$/, '')} ×${n}`)
  }

  // Lexical upload nodes store the media id as {"type":"upload",...,"value":<id>}.
  for (const [table, column, label] of RICHTEXT_COLUMNS) {
    const hits = await db.execute(sql`
      select count(*)::int as n from ${sql.identifier(table)}
      where ${sql.identifier(table)}.${sql.identifier(column)}::text ~ ${'"value": ?' + String(id) + '[,}]'}`)
    const n = Number(hits.rows[0]?.n ?? 0)
    if (n > 0) uses.push(`${label} ×${n}`)
  }

  return uses
}
