# ENVO Website — Production Deployment Design

**Date:** 2026-07-09
**Status:** Draft for review
**Owner:** Lenny (with Claude executing the build)
**Supersedes for hosting:** the Vercel assumptions in `notes/2026-07-02-launch-env-checklist.md` (env-var requirements from that doc still apply; only the *host* changes).

## 1. Goal

Ship the ENVO website (Next.js 16 + Payload CMS 3) to a production host that is:

- **Fully self-controlled** — root access, no managed-platform lock-in.
- **Cost-effective** — target ≈ $8/mo all-in for compute.
- **Secure** — minimal attack surface, no open inbound ports, hardened SSH.
- **Agent-operable** — provisioned and managed through a first-class API/CLI so Claude can build and maintain it end-to-end.

This is a deliberate pivot away from the team's earlier Vercel + prod-Supabase plan. Self-hosting a single long-running container also removes the serverless connection-pool problems that dominate the old launch checklist (the `EMAXCONNSESSION` / transaction-pooler hard rules become moot — we own the database and use a normal connection pool).

## 2. Decisions (locked)

| Area | Decision | Rationale |
|---|---|---|
| Host | **Hetzner Cloud CPX21** (3 vCPU / 4 GB / 80 GB), US-East (Ashburn, `ash`), ≈ $8/mo | Cheapest for the specs (DO equivalent ≈ $24/mo); excellent `hcloud` CLI + REST API + Terraform for agent operation; US-based per requirement. |
| Orchestration | **Docker Compose** on the box | Repo already ships a production `Dockerfile` + `docker-compose.nas.yml`; least-friction path. |
| Database | **Self-hosted Postgres 17** in Docker (`pgdata` volume) | Full control, $0, no third-party dependency. Single app → normal pool, no pooler needed. |
| Media | **Local persistent volume** (`/app/media`), Payload switched to local storage | Volume persists across deploys on a real disk; drops the Supabase-S3 dependency. Matches `docker-compose.nas.yml` intent. |
| Ingress | **Cloudflare Tunnel** (`cloudflared`) | Zero open inbound ports; free TLS, DDoS, WAF, caching; hides origin IP. Matches existing `chat.lennypeng.com` pattern. |
| Domain | **`envolighting.com`** canonical (site + email); **`envo.lighting`** and existing **`envo-led.com`** 301-redirect to it | `.com` for B2B trust + email deliverability (the site is a lead-gen funnel whose payoff is a Resend email landing in a buyer's inbox); `.lighting` owned as the brand redirect. |
| Backups | Nightly `pg_dump` + media tarball → **NAS over Tailscale**, 14-day retention | Off-box, free, reuses existing Tailscale + NAS backup pattern (per CLAUDE.md). |
| Deploys | **Build-on-box**: `git pull && docker compose up -d --build` behind a script | Simple, fully controlled. GHCR image builds are an easy later upgrade to take build load off the box. |

## 3. Architecture

```
Internet ──► Cloudflare (TLS · DDoS · WAF · cache)
                │  Cloudflare Tunnel (outbound-only; NO open inbound ports)
                ▼
        ┌──────────────── Hetzner VPS (Ashburn, US-East) ───────────────┐
        │  cloudflared ──► envo-website  (Next.js standalone, :3000)     │
        │                       │                                        │
        │                  postgres:17  ──vol──► pgdata                  │
        │                  media        ──vol──► /app/media              │
        │                                                                │
        │  Tailscale iface (SSH + backup egress only)                    │
        └────────────────────────────────────────────────────────────────┘
                │ nightly: pg_dump + tar(/app/media)
                ▼  (over Tailscale)
          NAS  (14-day retention — existing)
```

### Components (each independently understandable)

- **`envo-website`** — the Next.js 16 app built from the repo `Dockerfile` (multi-stage, Node 22 alpine, non-root uid 1001). Reads env from a root-only `.env`. Depends on: `postgres`, the `/app/media` volume. Exposes :3000 to the Docker network only (never to the host/public).
- **`postgres:17`** — production database. Data on the `pgdata` named volume. Reachable only on the internal Docker network as host `postgres`. Not published to the host.
- **`cloudflared`** — the Cloudflare Tunnel connector. Routes `envolighting.com` → `http://envo-website:3000`. Outbound-only; this is the *sole* path public traffic reaches the app.

### Network / security posture

- **No public inbound ports.** Cloudflare Tunnel dials out. Hetzner Cloud Firewall + host `ufw` deny all inbound except what Tailscale needs.
- **SSH** is key-only, root password login disabled, and restricted to the **Tailscale interface** (no public SSH). The box joins the existing tailnet.
- **Cloudflare**: proxied DNS, TLS mode Full(strict) via the tunnel, WAF on, sensible rate-limiting on `/admin` and `/api/*`.
- **Containers**: app runs non-root; Postgres not exposed beyond the compose network; secrets in a `chmod 600` root-owned `.env`.
- **Build headroom**: add a 2–4 GB swapfile so `next build` on the 4 GB box never OOMs.

## 4. Domains & email

- Register **`envolighting.com`** and **`envo.lighting`** (Cloudflare Registrar preferred so DNS + tunnel + email records are all in one account).
- `envolighting.com` = canonical. `envo.lighting` and `envo-led.com` → **301** to `https://envolighting.com` (Cloudflare Bulk Redirects / Redirect Rules — no origin work).
- `NEXT_PUBLIC_SITE_URL` and `PAYLOAD_SERVER_URL` = `https://envolighting.com` (drives sitemap, canonical tags, OpenGraph, admin absolute URLs).
- **Email (Resend)**: verify `envolighting.com` as the sending domain — add SPF, DKIM, DMARC records in Cloudflare DNS. Lead-notification emails send from e.g. `contact@envolighting.com`. This deliverability work is the reason `.com` is canonical.

## 5. Data & media migration

**Database seed** — the team's real content already lives in the current (shared dev) Supabase; there is no separate "prod content." So:

1. `pg_dump` the Supabase `public` schema (same method already used for the local copy — 68 tables, ~5.2k rows, includes all already-applied content fixes from the launch runbook).
2. Restore into the self-hosted prod Postgres (`envo_prod` DB) via a version-matched Postgres 17 client.
3. Because prod runs the same codebase as the schema was built from, **no Payload schema push is needed** (`PAYLOAD_DB_PUSH` stays `false`); the restored schema already matches.
4. Generate a **fresh local admin user** on prod (reuse `scripts/seed-local-admin.mts` pattern) — do not carry dev passwords.
5. Optional post-launch: run `scripts/akeneo-sync.ts` on the box for fresher product data than the snapshot.

**Editorial media binaries** (Payload uploads — blog covers, project photos, ~135 MB) — ✅ **DONE 2026-07-09.** No code change was needed: the S3 storage plugin is env-gated (`...(process.env.S3_BUCKET ? [s3Storage] : [])`), so with `S3_*` unset the app already uses local disk, and `media.url` already stores relative `/api/media/file/…` paths. Procedure used:

1. Downloaded both Supabase Storage buckets Mac-side (`scripts/pull-supabase-media.mjs`, keeps dev keys off the box) — 536 media objects (138 rows × original+thumbnail/card/detail) + 2 lead files; verified 536 DB-referenced filenames == 536 downloaded.
2. Transferred via tar-over-ssh; placed on the box volumes; `chown 1001:1001`.
3. **staticDir footgun (fixed):** in Next standalone mode Payload resolves the relative `upload.staticDir:'media'` against the bundle dir → `/app/.next/standalone/media`, NOT `/app/media`. Compose now mounts `media:/app/.next/standalone/media` and adds `leadfiles:/app/.next/standalone/lead-files` (LeadFiles is customer PII and had no volume → would have been ephemeral). Repo follow-up: make `staticDir` absolute/env-driven.
4. Verified: originals + all 3 variant sizes serve 200; a real blog cover renders; broken-media sweep clean.

**Product images (Akeneo independence)** — the site should not fetch product images from Akeneo PIM at request time either (user, 2026-07-09). Only **73 of 313** products still resolve to a remote Akeneo URL (tier 2 `clean_image_url_fallback` / tier 4 `image_url_fallback` in `resolveProductImage`); the other 240 are already local uploads or bundled series fallbacks. Prepared: **`scripts/localize-akeneo-images.mts`** — for each remote-serving product it downloads the Akeneo image, imports it as a Payload media upload, and links it as `clean_image`/`image` (uploads are editorial overrides that survive `akeneo-sync`, which only rewrites the fallback columns). Validated via read-only DRY_RUN against the box DB (finds exactly 73; Akeneo bucket confirmed publicly fetchable). **Deferred to go-live** because the box DB is a staging snapshot slated for a fresh re-dump — localizing it now would be wiped, and those 73 images still load from Akeneo's public S3 meanwhile.

**Go-live procedure for the Akeneo localization** (run *after* the final fresh DB re-dump):

1. Open a short-lived SSH tunnel from the Mac to the box Postgres (it isn't published): `ssh -f -N -L 5459:<envo-postgres container IP>:5432 root@<box>`.
2. Run against the final box DB (creates media rows in the box DB, writes files + variants to the Mac's local Payload media dir): `DATABASE_URL=postgresql://envo:<pw>@localhost:5459/envo_prod npx tsx --tsconfig tsconfig.json scripts/localize-akeneo-images.mts` (DRY_RUN=1 first to preview).
3. Copy the freshly-created media files onto the box `envo_media` volume (same tar-over-ssh step as the editorial migration), `chown 1001:1001`.
4. Verify a sample localized product page serves its image from `/api/media/file/…` (not `wellforces-akeneo-pim.s3…`). Optionally then drop the Akeneo host from `next.config.ts` `remotePatterns` (repo change) once nothing references it.

## 6. Environment variables (prod, self-host)

Fresh secrets generated with `openssl rand`; stored in Zoho Vault; placed in a root-only `.env` on the box. Adapted from `notes/2026-07-02-launch-env-checklist.md`:

| Var | Value / source | Notes vs. checklist |
|---|---|---|
| `DATABASE_URL` | `postgresql://envo:<pw>@postgres:5432/envo_prod` | Internal Docker host; **no pooler** (we own the DB). Supersedes the 6543 transaction-pooler hard rule. |
| `PAYLOAD_SECRET` | `openssl rand -hex 32`, fresh | |
| `PAYLOAD_SERVER_URL` / `NEXT_PUBLIC_SITE_URL` | `https://envolighting.com` | |
| `REVALIDATE_SECRET` | `openssl rand -hex 32` | ISR revalidation webhook |
| `RESEND_API_KEY` | Resend account (domain-verified) | Without it, leads still store but no email — **needs a Resend account owner** |
| `ANALYTICS_SALT` | `openssl rand -hex 16` | Falls back to `PAYLOAD_SECRET` if unset |
| `ANTHROPIC_API_KEY` | Anthropic console | "Find Your Match" degrades gracefully without it |
| `AKENEO_*` | Only where the sync script runs (the box) | Not needed at request time |
| `S3_*` | **Dropped** | Replaced by local media storage |

## 7. Responsibilities

**Lenny (prerequisites — can't be done by the agent):**
- Create Hetzner account + a read/write `hcloud` API token.
- Register `envolighting.com` + `envo.lighting` (Cloudflare Registrar); confirm both + `envo-led.com` are in the Cloudflare account.
- Provide a Cloudflare API token (or create the Tunnel and share its token).
- Provide/authorize Resend + Anthropic accounts/keys for those features.
- Approve the ≈ $8/mo Hetzner spend before the server is created (billed resource).

**Claude (everything on/around the box):**
- Provision the CPX21 via `hcloud`; attach to Tailscale; harden SSH + firewall; install Docker.
- Author the prod `docker-compose.yml` (+ `.env`), bring up Postgres / app / cloudflared.
- Configure Cloudflare: DNS, Tunnel route, TLS, WAF, redirects, email DNS records.
- Run the DB seed + media migration; create the prod admin user.
- Set up nightly backups to the NAS over Tailscale; add an uptime check.
- Verify against the launch checklist's post-deploy section; hand back a go-live report.

## 8. Rollout phases (detail belongs in the implementation plan)

1. Provision + harden the VPS (hcloud, Tailscale, SSH, firewall, Docker, swapfile).
2. Cloudflare: domains, Tunnel, DNS, TLS, redirects.
3. Bring up the Compose stack with prod `.env`.
4. Data seed (Supabase dump → prod PG) + media migration + prod admin user.
5. Email: Resend domain verification + SPF/DKIM/DMARC.
6. Verification (launch-checklist post-deploy: robots/sitemap, OG tags, real form submission → Submission row + Resend email, mobile viewport, region banner).
7. Backups (cron to NAS) + uptime monitoring.
8. Go-live: confirm redirects, final smoke test.

## 9. Risks & open items

- **Media storage switch** — confirm whether moving Payload from S3 to local storage is a config toggle or needs a small code change; plan the ~300 MB binary copy.
- **Single point of failure** — one box, no HA. Acceptable for a low-traffic B2B brochure/lead-gen site; mitigated by off-box backups + fast reprovision (the whole box is reproducible from the compose files + dump). Revisit only if uptime requirements rise.
- **Build memory** — `next build` on 4 GB; mitigated by swapfile, or move to GHCR image builds if it's tight.
- **Resend / Anthropic owners** — accounts still "TBD" in the launch checklist; features degrade gracefully if absent at launch.
- **`envo.com`** — dormant (registered, no live site). Out of scope now; optionally valuate for future brokered acquisition.

## 10. Out of scope

Multi-region / HA, a full CI/CD pipeline beyond build-on-box, Akeneo webhook automation, acquiring `envo.com`, and any redesign work (the site is launch-ready per the existing checklist).
