# Dev database — Supabase (current architecture)

**Date:** 2026-05-15
**Status:** Live
**Supersedes the architecture in:** [`notes/2026-05-14-db-dev-plan.md`](2026-05-14-db-dev-plan.md) (NAS → MBA → Supabase pivot)

## TL;DR

The team's dev Postgres lives on **Supabase free tier in `us-west-2` (Oregon)**. The team MBA runs a nightly `pg_dump` against Supabase, keeping a 14-day rolling archive of backups locally. Connect via the **Session Pooler** — connection string is in **Zoho Vault under "ENVO Dev Database — Supabase"**.

## Architecture

```
Supabase free (project envo-website-dev, us-west-2)
        │
        │   primary dev DB
        │   ↑ team connects via Session Pooler (IPv4-proxied, port 5432)
        │
        │   nightly pg_dump at 02:00 NZT
        ▼
MBA (saless-macbook-air.local)
    ~/envo-services/backups/supabase-envo-<timestamp>.sql.gz
    14-day rolling retention
```

## How to connect (Alan + Mackenzie onboarding)

1. **Find the secret in Zoho Vault** titled `ENVO Dev Database — Supabase`. If you don't see it, ping Wei to share.
2. **Copy the Session Pooler connection string** (port 5432 — *not* port 6543).
3. **Paste into `.env.local`** as `DATABASE_URL` (see `.env.example` for the slot).
4. **Run `npm run dev`** — Payload + Next.js will pick it up automatically.

For ad-hoc SQL access from your terminal:
```bash
psql "postgresql://postgres.<project-ref>:<password>@aws-1-us-west-2.pooler.supabase.com:5432/postgres"
```

When to use which pooler:
- **Session Pooler (port 5432)** — default for everything: Payload, Drizzle, psql, long-running servers.
- **Transaction Pooler (port 6543)** — for Vercel serverless functions later. Each invocation borrows a connection per transaction.
- **Direct connection (`db.*.supabase.co`)** — IPv6-only on free tier, **do not use** unless you've enabled the IPv4 add-on (paid).

## Supabase dashboard access

Wei created the project under the **WellforcesNZ org** on her `@wellforces.com` Google login. For dashboard access (logs, schema visualizer, SQL editor, password reset, etc.), Wei needs to invite teammates:

- **Org admin (Wei):** dashboard → org dropdown (top-left) → Organization Settings → Members → Invite member → enter `@wellforces.com` email → role: Developer
- **Invitees (Alan, Mackenzie):** accept the invite from email, sign in with `@wellforces.com` Google account

Connection-string-only access works without dashboard membership — but the dashboard is useful for debugging, looking at logs, running ad-hoc queries via the SQL editor, etc.

## Backups (automated)

- **Schedule:** nightly at 02:00 NZT via macOS `launchd` on the MBA (`com.envo.db-backup`)
- **Output:** `~/envo-services/backups/supabase-envo-<YYYY-MM-DD-HHMMSS>.sql.gz`
- **Retention:** 14 days (older files auto-deleted by the script)
- **Method:** `pg_dump --no-owner --no-acl` via a transient `postgres:17` Docker container on the MBA
- **Logs:** `~/envo-services/backup.log` (stdout) and `~/envo-services/backup.err` (stderr)
- **Manual trigger:** `~/envo-services/backup.sh` (over SSH as `sales@saless-macbook-air.local`)

Restoring a backup:
```bash
gunzip -c supabase-envo-<timestamp>.sql.gz | psql "<connection-string>"
```

The dump is portable across Postgres 17 instances. For restoring back into Supabase, point at a fresh Supabase project's connection string. For restoring to a local Postgres, point at any PG 17 instance.

## Outstanding / open items

1. **Off-machine backup destination** — currently backups only live on the MBA. Pick iCloud Drive or Cloudflare R2 within the first week of real content authoring. Commented-out destination lines are in `~/envo-services/backup.sh`.
2. **Supabase auto-pause** — free tier pauses projects after 7 days of inactivity. First request after pause has a ~30 s cold-start. As long as the team touches the DB weekly we're fine. If we go quiet for a stretch, set up a tiny ping cron.
3. **Supabase org membership** — invite Alan and Mackenzie to the WellforcesNZ Supabase org so they have dashboard access.
4. **MBA SSH access for other team members** — Alan and Mackenzie's SSH public keys should be added to the MBA's `sales` user `~/.ssh/authorized_keys` if they want to retrieve backup files directly. Optional — only matters in disaster scenarios.

## Why we landed here

- V2 execution plan originally pointed at NAS Postgres at `192.168.68.80`.
- Alan reported access issues with the NAS (couldn't reach it from his machine).
- Team pivoted to a dedicated MBA (`saless-macbook-air`) running Docker Postgres — `notes/2026-05-14-db-dev-plan.md` documented the asks and the original NAS plan.
- After the MBA setup landed, Wei decided cloud-based dev is preferable (no LAN dependency, easier remote work later, free during dev, same architecture as production).
- Supabase free tier in `us-west-2` was chosen so dev runs in the same region production likely will (NZ + US audience compromise — Oregon is the geographic midpoint).
- MBA was repurposed from "primary dev DB" to "nightly off-site backup destination." Its Docker Postgres still runs idle as a potential hot-standby but isn't actively used.

The Supabase → production migration story is now trivial: same vanilla PostgreSQL 17, same `pg_dump`/`pg_restore` toolchain, separate Supabase project for prod when Stage 4 ships.

## Quick reference

| What | Where |
|---|---|
| Connection string | Zoho Vault → "ENVO Dev Database — Supabase" |
| Supabase project | https://supabase.com/dashboard → WellforcesNZ → envo-website-dev |
| Region | us-west-2 (Oregon) |
| Postgres version | 17.6 (Supabase) / 17.10 (MBA backup container) |
| MBA backup dir | `sales@saless-macbook-air.local:~/envo-services/backups/` |
| MBA backup logs | `sales@saless-macbook-air.local:~/envo-services/backup.{log,err}` |
| Off-machine backup | TODO — iCloud Drive or R2 |
