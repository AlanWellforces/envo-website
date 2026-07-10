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
| `RESEND_API_KEY` | ✅ for sales flow | Leads still stored, but **no email notification — sales never learns a lead came in** (silent) | Resend account + **verify envo-led.com sending domain (DNS records)** | **Alan** (user 2026-07-09) — acceptance = the real test submission in Post-deploy verification below |
| `ANALYTICS_SALT` | recommended | Falls back to `PAYLOAD_SECRET` (works, but rotating PAYLOAD_SECRET would reset visitor session hashes) | `openssl rand -hex 16` | any |
| `ANTHROPIC_API_KEY` | recommended | Find Your Match falls back to template explanation (graceful, degraded) | Anthropic console + billing | needs owner — account TBD |
| `AKENEO_*` (URL/CLIENT_ID/CLIENT_SECRET/USERNAME/PASSWORD) | ❌ on Vercel | Nothing at runtime — `akeneo-sync` is a manually-run script, not a route | Only needed wherever the sync script runs | Alan |
| `AKENEO_WEBHOOK_SECRET` | only if webhook sync ships | — | — | Alan |

## Related launch blockers (not env)

- ~~`robots.txt` is 404~~ — **done in #172** (`src/app/robots.ts`, sitemap URL
  derives from `NEXT_PUBLIC_SITE_URL`; sitemap covers per-SKU pages + blog
  categories, deliberately excludes `/datasheets/*` and `/blog/tag/*`).
- Editorial media backfill: ~300 MB of existing binaries must be uploaded to
  the prod bucket (issue #24) — wiring the adapter only fixes *new* uploads.
- Dev-only status as of 2026-07-02: dev `.env.local` now has S3 + both
  secrets set; dev values are recorded in Zoho Vault.

## PROD data replay — run in order at launch (compiled 2026-07-09)

Every fix below was applied to the **DEV DB only**; the fresh prod Supabase
project needs each one re-run. Prereq: Payload schema push against the prod
DB first (`PAYLOAD_DB_PUSH=true` — the select-prompt needs a real tty and
`\r`; read the data-loss list before answering), with `DATABASE_URL`
pointing at the prod project.

1. **Product sync** — populates `product_*`:
   `yes | PAYLOAD_DB_PUSH=true npx tsx --tsconfig tsconfig.json scripts/akeneo-sync.ts`
   (Akeneo credentials: `Desktop/wellforces_automation/_shared/.env`).
2. **Channel-copy 2-table fix** (#148/#162 — body copy says *global
   authorised channels*, never NZ/Oceania):
   `npx tsx --tsconfig tsconfig.json scripts/fix-solution-channel-copy.mts`
3. **Clean-image backfill** (#155: 96 products via rembg, then #167: 16
   sibling-borrows; ENC-20×4 + ENC-REMOTE stay imageless — known-unfixable):
   `BACKFILL_DIR=<abs cache dir> npx tsx --tsconfig tsconfig.json scripts/backfill-clean-images.mts`
   then
   `npx tsx --tsconfig tsconfig.json scripts/backfill-sibling-clean-images.mts`
4. **Blank clean images** (u2net erases white-on-white product shots — hit
   EV-BLEG02LBY *and* EV-BLEG03LBY on dev). Scripted + idempotent:
   `npx tsx --tsconfig tsconfig.json scripts/fix-blank-clean-images.mts`
   — sweeps every visible product's clean image, measures visible pixels,
   recrops the raw Akeneo photo for any blank one and repoints the CCT
   variants. `MEDIA_BASE` must point at a server that serves `/api/media`
   against the prod DB (or run after media URLs are absolute). Sanity-check:
   `DRY_RUN=1` first; expect ~2 blanks on a fresh prod sync.
5. **Solutions seed** — `npx tsx --tsconfig tsconfig.json scripts/seed-solutions.mts`,
   then hit `/api/revalidate` (solutions pages are ISR 3600).
6. **CMS pages seed** — `npx tsx --tsconfig tsconfig.json scripts/seed-cms-pages.mts`
   (legal 4-page set etc.), then review in admin.
7. **Editorial media backfill** — the ~300 MB item above.

## Post-deploy verification

- `curl https://<domain>/robots.txt` → 200, sitemap line shows the prod
  domain; `/sitemap.xml` → ~106 URLs incl. per-SKU product pages (signage at
  the model grain — zero `-WW/-NW/-CW` URLs; no `/blog`, `/products/accessories`
  or `…/other` until those are opened up — see src/app/sitemap.ts).
- One SKU page + `/contact`: `og:title` / `og:image` present with absolute
  prod URLs (og:image on SKU pages = the product's own clean image).
- Real test submission on `/contact` **and** `/free-layout-design` (with a
  sketch attachment) → row in Payload → Submissions **and** a Resend email
  to contact@envolighting.com. No `RESEND_API_KEY` = silent no-email (leads
  still stored).
- `/blog` loads repeatedly without `EMAXCONNSESSION` (transaction pooler).
- 375px-wide viewport: `window.innerWidth === 375` (intrinsic-width zoom-out
  regression check).
- Region banner geo-IP default (AP list → nz-ap, else us-global) — inert in
  dev, first verifiable in prod.
