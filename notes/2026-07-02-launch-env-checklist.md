# Production env checklist (Vercel launch)

Every env var production needs, what breaks without it, and where the value
comes from. Source of truth for the Vercel project settings at launch.
Compiled from the 2026-07-02 pre-launch audit.

Secrets live in **Zoho Vault** — never in git, never reused from dev.

## Hard rules

1. **`DATABASE_URL` must use the Transaction Pooler (port 6543), not the
   Session Pooler (5432).** The session pooler caps at 15 connections and we
   hit `EMAXCONNSESSION` in dev with a single polling browser tab. Vercel
   serverless opens connections per instance and will exhaust it immediately.
   ```
   postgresql://postgres.<project-ref>:<password>@aws-1-us-west-2.pooler.supabase.com:6543/postgres
   ```
   ⚠️ Transaction mode doesn't support session features (prepared statements
   etc.). **Smoke-test Payload + Drizzle against 6543 locally before launch**
   — one dev-server run on 6543 covering /products, /admin, a form POST.

2. **Production uses its own Supabase project** (Pro, region TBD — see
   CLAUDE.md), not the shared dev project. Fresh credentials for everything.

3. **Generate fresh secrets for prod** (`openssl rand -hex 32`). Do not copy
   dev values.

## Env vars

| Var | Required at launch | If missing | Value source | Owner |
|---|---|---|---|---|
| `DATABASE_URL` | ✅ | Site doesn't boot | Prod Supabase → Transaction Pooler (6543) | Alan |
| `PAYLOAD_SECRET` | ✅ | Admin auth broken | `openssl rand -hex 32`, fresh for prod | Alan |
| `NEXT_PUBLIC_SITE_URL` | ✅ | sitemap/SEO URLs point at localhost | The production domain, e.g. `https://envo-led.com` | deploy-time |
| `S3_ENDPOINT` / `S3_BUCKET` / `S3_REGION` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | ✅ | Editorial images 500; admin uploads don't persist across deploys (issue #24) | Prod Supabase → Storage → S3 connection | Alan |
| `REVALIDATE_SECRET` | ✅ | Publishing Posts/Projects never refreshes live pages (ISR stale forever) | `openssl rand -hex 32` | Alan (set), any (generate) |
| `RESEND_API_KEY` | ✅ for sales flow | Leads still stored, but **no email notification — sales never learns a lead came in** (silent) | Resend account + **verify envo-led.com sending domain (DNS records)** | needs owner — Resend account TBD |
| `ANALYTICS_SALT` | recommended | Falls back to `PAYLOAD_SECRET` (works, but rotating PAYLOAD_SECRET would reset visitor session hashes) | `openssl rand -hex 16` | any |
| `ANTHROPIC_API_KEY` | recommended | Find Your Match falls back to template explanation (graceful, degraded) | Anthropic console + billing | needs owner — account TBD |
| `AKENEO_*` (URL/CLIENT_ID/CLIENT_SECRET/USERNAME/PASSWORD) | ❌ on Vercel | Nothing at runtime — `akeneo-sync` is a manually-run script, not a route | Only needed wherever the sync script runs | Alan |
| `AKENEO_WEBHOOK_SECRET` | only if webhook sync ships | — | — | Alan |

## Related launch blockers (not env)

- `robots.txt` is 404 — needs to be added (and point at `/sitemap.xml`).
- Editorial media backfill: ~300 MB of existing binaries must be uploaded to
  the prod bucket (issue #24) — wiring the adapter only fixes *new* uploads.
- Dev-only status as of 2026-07-02: dev `.env.local` now has S3 + both
  secrets set; dev values are recorded in Zoho Vault.
