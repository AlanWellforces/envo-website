-- Enable RLS on all public tables
--
-- Payload CMS connects via postgres/service_role which bypasses RLS, so this
-- has no effect on Payload. It blocks direct PostgREST (anon/authenticated)
-- access to all tables — which is correct since the DB is backend-only.
--
-- Run in: Supabase dashboard → SQL Editor → New query → paste → Run

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
    RAISE NOTICE 'Enabled RLS on public.%', r.tablename;
  END LOOP;
END $$;
