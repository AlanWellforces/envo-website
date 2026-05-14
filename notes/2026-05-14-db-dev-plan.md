# Dev database plan — note to Alan

**Date:** 2026-05-14
**From:** Wei
**To:** Alan
**Status:** Draft (not yet sent)

## Why this note exists

During Stage 2 prep, we considered using the shared MacBook Air (24/7, on local network + Tailscale) as the dev database instead of the NAS. The V2 execution plan already addressed this and chose the NAS — sticking with that, but I want a few things confirmed before I start authoring real content in Payload at Stage 3, so my work is safe and the eventual Supabase migration stays straightforward.

## The note

---

Hey Alan,

Quick one before scaffold lands — wanted to check the dev database plan with you, since I'll start authoring real content in Payload at Stage 3 and want to make sure my work is safe.

Sounds like the V2 plan still stands and we're going with NAS Postgres at `100.101.113.67` over Tailscale rather than the MBA — happy with that, the MBA always made me a bit nervous as a 24/7 server.

A few things I want to make sure we have in place before I start typing real copy into Payload:

1. **Daily backup.** Ideally a nightly `pg_dump` that lands somewhere off the NAS itself, so one bad day on the NAS doesn't wipe out homepage copy / FAQs / case studies. What's the current backup story?

2. **Postgres version.** Could we run PG 16 on the NAS, since that's what Supabase runs? My understanding is that matching versions now keeps the eventual Supabase migration a near one-liner — version mismatch makes it painful.

3. **Tailscale reachability.** Can you confirm `100.101.113.67` works for all three of us (you, me, Mackenzie)? Better to find out now than mid-Stage 2.

4. **One dry-run migration mid-build.** Sometime in Stage 3 or early Stage 4, could you do a throwaway restore of the NAS dump into a free Supabase project? Just to surface any surprises while they're cheap to fix — I'd rather hit issues during dev than the week before launch.

None of this is urgent today — just want it on your radar so it's sorted before content authoring really kicks off. Let me know what makes sense.

— Wei

---

## Reasoning behind each ask (for my own reference)

- **Daily backup** — once I'm in Stage 3 authoring real homepage copy, navigation labels, FAQs, and case studies, that content only lives in Payload's Postgres tables. No backup = single point of failure for weeks of my work.
- **PG 16 on NAS to match Supabase** — Supabase runs specific Postgres major versions. If NAS runs a different major version, `pg_dump` → `pg_restore` to Supabase can fail or require downgrade work. Aligning now is free.
- **Tailscale reachability** — the NAS is remote; all access is via Tailscale. Worth confirming nobody is blocked before scaffold work depends on it.
- **Dry-run migration** — Supabase uses PgBouncer in transaction mode by default, which occasionally surprises ORMs (Drizzle handles it fine in practice, but worth checking). A throwaway restore mid-build surfaces this while it's cheap, not during launch week.

## Not in scope of this note

- Local Docker Postgres for individual dev machines — already in the V2 plan, no change needed.
- Production Supabase setup — Stage 4+ concern, not now.
- Choice of backup destination (S3, another NAS, etc.) — Alan's call, just want some destination.
