-- Auto-enable RLS on newly created public tables (DDL event trigger)
--
-- Companion to enable-rls-all-tables.sql: that script fixes existing tables;
-- this trigger keeps the Supabase "rls_disabled_in_public" advisory from
-- recurring when Payload migrations add new tables.
--
-- Payload connects as the table owner, which bypasses RLS, so this has no
-- effect on the app — it only blocks direct PostgREST (anon/authenticated)
-- access to new tables, same as the existing ones.
--
-- Run in: Supabase dashboard → SQL Editor → New query → paste → Run
-- Applied to envo-website-dev on 2026-07-08. Re-run on the prod project at
-- launch (see docs launch checklist).

CREATE OR REPLACE FUNCTION public.enable_rls_on_new_tables()
RETURNS event_trigger LANGUAGE plpgsql AS $fn$
DECLARE obj record;
BEGIN
  FOR obj IN
    SELECT * FROM pg_event_trigger_ddl_commands()
    WHERE command_tag = 'CREATE TABLE' AND schema_name = 'public'
  LOOP
    EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', obj.object_identity);
  END LOOP;
END $fn$;

DROP EVENT TRIGGER IF EXISTS trg_enable_rls_on_new_tables;
CREATE EVENT TRIGGER trg_enable_rls_on_new_tables
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE')
  EXECUTE FUNCTION public.enable_rls_on_new_tables();
