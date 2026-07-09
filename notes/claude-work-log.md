# Claude work log

Running log of infrastructure / backend work done by Claude sessions on Alan's
side. Newest entries first. Append a dated section per session; keep entries to
what was *changed* (not explored), with PR numbers and any manual state applied
outside git (DB, NAS, env files).

---

## 2026-07-08

- **RLS event trigger committed** — `scripts/enable-rls-event-trigger.sql` (PR #159).
  Morning session had re-applied RLS after the advisory recurred (10 post-#98
  tables from the solutions/projects migrations lacked it — now 68/68) and
  installed a DDL event trigger `trg_enable_rls_on_new_tables` on the dev DB
  that auto-enables RLS on any new public table. Trigger verified active.
  **At launch:** run this + `enable-rls-all-tables.sql` on the prod project.
- Verified NAS healthy on #155; today's merges (#156–#158) ride the next
  scheduled auto-deploy (~16:30).

## 2026-07-06

- **Merged Mackenzie's PRs #131** (honest input-voltage row + SAA/RCM cert
  names) **and #132** ("Pairs with" section on series pages). #132 was a
  *stacked* PR based on #131's branch — the first squash landed on that branch
  instead of dev; fixed by cherry-picking the squash onto dev as PR #135
  (authorship preserved). Lesson: check a PR's base branch before merging.
- **#120 (signage selector re-enable) left unmerged — it's a draft.**
- **NAS: added `S3_LEAD_FILES_BUCKET=lead-files`** to `.env.local` + restart,
  completing the private PII-sketch bucket wiring from #107 (bucket verified
  to exist, private, in the dev Supabase project). Also added to Alan's local
  `.env.local`.

## 2026-07-02

- **Applied RLS to all public tables** on the dev Supabase project (58/58 at
  the time) and committed `scripts/enable-rls-all-tables.sql` (PR #98).
- **Merged PR #97** (admin dashboard + data capture + Editorial Bold theme)
  after verification review; deployed to NAS.
- **Supabase Storage provisioned**: created the public `media` bucket
  (project had no buckets; Mackenzie's questions answered: public read ✓,
  endpoint `https://amqqqdgosgfmojjcuzcz.supabase.co/storage/v1/s3` ✓,
  region us-west-2 ✓). Alan generated the S3 key pair; keys E2E-verified
  (PutObject → public read → delete), then wired into NAS + local
  `.env.local` and Zoho Vault. Server restarted with S3 live.
- **Fixed the S3 importMap bug** (PR #101): admin logged `S3ClientUploadHandler
  not found in importMap` and media uploads would have failed — the import map
  had been generated with `S3_BUCKET` unset. Hot-fixed on NAS, committed.
  **Gotcha:** always run `npm run generate:importmap` with the S3 env vars set,
  or the storage-s3 client component silently drops out.
- **Product image previews in admin** (PR #102): click-to-enlarge lightbox for
  the Akeneo-hosted images in the product edit view (Media tab). Binaries stay
  on Akeneo S3.
- Discovered "Hermes" = `/app/envo-website/auto-deploy.sh` on the NAS
  (n8n/cron, daily ~16:30 NZT). Don't `git pull` on the NAS manually first —
  the script exits early if HEAD already matches origin/dev.
