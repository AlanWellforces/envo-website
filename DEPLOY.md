# Deployment & data sync — ENVO Website

How code and data move between your laptop, GitHub, and production. This complements
[`git-workflow.md`](git-workflow.md) (branching, PRs, reviews) — that doc covers how
code gets *reviewed and merged*; this one covers what happens *after* a merge and how
data flows between prod and your machine.

## The model in one paragraph

**Code flows up. Content flows down. They never cross.**

- **Code** goes *up*: laptop → GitHub → PR → `dev` → `main` → the box **auto-deploys**.
- **Content** (products, editorial copy, media) goes *down*: authored in the production
  `/admin`, pulled to your laptop with a refresh script when you want real data locally.
- Product/editorial content is **never** committed to git; code is **never** authored in
  the CMS. (See the three-source rule in [`CLAUDE.md`](CLAUDE.md).)

Supabase and Akeneo are retired — production is now the single source of truth for data.

## Where things run

| Piece | Where |
|---|---|
| Server | Hostinger VPS, reached over Tailscale (`100.106.130.54`). SSH is Tailscale-only — public port 22 is closed. |
| Public URL | `https://envolighting.com` via Cloudflare Tunnel (outbound only, no inbound ports). |
| Stack | Docker Compose at `/opt/envo`: `envo-postgres` (prod DB) · `envo-website` (Next.js) · `envo-cloudflared` (tunnel). |
| Prod DB | `envo_prod` inside the `envo-postgres` container. |
| Media / lead-files | Box Docker volumes (`envo_media`, `envo_leadfiles`), served from local disk. |
| Backups | Nightly `pg_dump` pushed to the NAS (`/volume2/@home/lennypeng/backups/envo`) over Tailscale. |
| Secrets | `/opt/envo/.env` on the box (TUNNEL_TOKEN, POSTGRES_PASSWORD, MAILGUN_API_KEY, …). Not in git — back up to Zoho Vault. |

## Shipping code (auto-deploy)

Merging to `main` is the deploy. No manual step.

1. Ship as usual (see `git-workflow.md`): `feature/*` → PR → `dev`, then `dev` → `main`.
2. The box polls `main` on a timer (`envo-deploy.timer`, every ~3 min, plus 2 min after boot).
3. On a new commit it: `git reset --hard origin/main` → **rebuilds the image** → swaps the container.
4. **Build-fail-safe:** if the build fails, the box keeps the current live image. A broken
   commit can't take the site down.

Watch a deploy: `ssh root@100.106.130.54 'tail -f /opt/envo/deploy.log'` (over Tailscale).

> **Note on static pages.** Product/series pages are baked at build time (`generateStaticParams`
> + `dynamicParams=false`). A rebuild republishes them automatically — so a *content* change in
> prod `/admin` only shows on the live static pages after the next deploy (or a manual
> `--no-cache` rebuild on the box). Do **not** use `revalidatePath` on these routes — it 404s them.

## Getting prod data onto your laptop

Local dev uses an **isolated** local Postgres (Docker container `envo-pg-local`, port 5433) —
not the prod DB. To load a fresh copy of real prod content:

```bash
./scripts/db-refresh-from-prod.sh              # database only
./scripts/db-refresh-from-prod.sh --with-media # also copy media so images render locally
```

One-way only (prod → local). It **overwrites** your local DB — any un-pushed local data is
lost. Requires Tailscale up and your SSH key authorized on the box.

## Schema changes (the one deliberate step)

Everything above is automatic. Schema changes (adding a Payload field/collection, changing a
column) are the exception: they are **not** auto-applied to prod, on purpose.

Why not just auto-push? The postgres adapter only runs `db.push` when `NODE_ENV != production`
(`connect.js`), so `PAYLOAD_DB_PUSH` is **ignored on the box** — setting it `true` there does
nothing. And silent push can *drop columns* on a rename/type change. Prod uses migrations, which
are reviewable and safe.

**Workflow:**

1. **Edit** the collection/field in code (`src/payload/...`).
2. **Iterate locally** — with `PAYLOAD_DB_PUSH=true` in your `.env.local` (default in
   `.env.example`), `next dev` syncs the change straight to your local DB. No migration needed
   while you're still shaping it.
3. **Generate a migration** once the shape is settled, and commit it with the code:
   ```bash
   npm run payload migrate:create <short-name>   # writes src/migrations/*.ts
   git add src/migrations && git commit -m "Migration: <what>"
   ```
4. **Merge** as normal — the code (and the migration file) auto-deploy.
5. **Apply to prod deliberately** — from a dev machine, point Payload at the prod DB over a
   Tailscale SSH tunnel and run the migration:
   ```bash
   # tunnel prod Postgres to localhost:5462, then:
   DATABASE_URL='postgresql://envo:<prod-pw>@localhost:5462/envo_prod' npm run payload migrate
   ```
   (The nightly NAS backup is the safety net. Ask Lenny for a one-command helper if this comes up
   often — it mirrors `scripts/db-refresh-from-prod.sh`.)

## Access a teammate needs

- **Tailscale** on the tailnet (ask Lenny) — required for `db-refresh-from-prod.sh` and prod migrations.
- **GitHub** push access — see `git-workflow.md`.
- Box SSH / the deploy key are held by Lenny + the box only; you don't need them for day-to-day work.
