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
   **Pre-release link check** (before merging dev → main): crawl a local instance —
   it has the DB, so this covers every dynamically generated page, not just source links.
   ```bash
   npm run dev                                     # or a production build + npm start
   npm run check:links                             # defaults to --base http://localhost:3000
   ```
   Checks: sitemap URLs all 200, internal links/media/PDFs resolve, canonicals 200,
   no localhost refs, legacy series slugs 308 correctly (expectations come from
   `src/data/series-registry.ts`). CI (`.github/workflows/link-check.yml`) also crawls
   the **live** site on dev→main PRs, daily, and ~7 min after each push to `main`
   (post-deploy verification) — but CI can't reach the DB, so the local run above is
   the only true pre-release check of the candidate build.
2. The box polls `main` on a timer (`envo-deploy.timer`, every ~3 min, plus 2 min after boot).
3. On a new commit it: `git reset --hard origin/main` → **rebuilds the image** → swaps the container.
4. **Build-fail-safe:** if the build fails, the box keeps the current live image. A broken
   commit can't take the site down.

Watch a deploy: `ssh root@100.106.130.54 'tail -f /opt/envo/deploy.log'` (over Tailscale).

> **Note on static pages.** Product/series pages are baked at build time (`generateStaticParams`
> + `dynamicParams=false`). A rebuild republishes them automatically — so a *content* change in
> prod `/admin` only shows on the live static pages after the next deploy (or a manual
> `--no-cache` rebuild on the box). Do **not** use `revalidatePath` on these routes — it 404s them.

## First-time setup (new teammate)

Everything about the **structure** ships in the repo — you do **not** need the box's
`/opt/envo/.env`. From a clean checkout:

```bash
git pull
cp .env.example .env.local        # DATABASE_URL is pre-filled for local Docker Postgres
                                  # → set your own PAYLOAD_SECRET (any long random string)
docker compose up -d              # creates envo-pg-local on port 5433
npm install
```

At this point you can develop, but the DB is **empty**. Two ways to get a schema:

- **Structure only, no access needed** — with `PAYLOAD_DB_PUSH=true` in `.env.local`
  (the default in `.env.example`), `npm run dev` makes Payload auto-create the full schema
  on boot. Good for building features; no real content.
- **Real content** — run the refresh script below. This needs box access (next section).

> **Doing this with an AI agent?** Open Claude Code in the repo and paste one of these:
> - *No box access yet:* "Read CLAUDE.md and DEPLOY.md, then set up my local dev environment:
>   `.env.local` (generate a PAYLOAD_SECRET), bring up the local Docker Postgres, `npm install`,
>   and start dev so Payload auto-creates the schema via PAYLOAD_DB_PUSH. I don't have Tailscale
>   or a box SSH key yet."
> - *With Tailscale + your key on the box:* "Read CLAUDE.md and DEPLOY.md, then set up local dev
>   and run `scripts/db-refresh-from-prod.sh --with-media` to pull real prod data. My key is at
>   `~/.ssh/envo_box` — use ENVO_BOX_KEY."
>
> **Nothing about local setup happens via a `git push`.** The GitHub → box auto-deploy updates
> the *live production site's code* only; it never touches your laptop's DB. Content is pulled
> down separately (above), never committed to git.

## Getting prod data onto your laptop

Local dev uses an **isolated** local Postgres (Docker container `envo-pg-local`, port 5433) —
not the prod DB. To load a fresh copy of real prod content:

```bash
./scripts/db-refresh-from-prod.sh              # database only
./scripts/db-refresh-from-prod.sh --with-media # also copy media so images render locally
```

One-way only (prod → local). It **overwrites** your local DB — any un-pushed local data is
lost. It never reads `/opt/envo/.env` — it dumps using the prod Postgres container's own
internal creds over an SSH tunnel. It needs two things that are **not** in the repo:

1. **Tailscale on the tailnet** — the box (`100.106.130.54`) has no public SSH; ask Lenny for an invite.
2. **Your own SSH key authorized on the box** (see below).

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

## Form anti-abuse (Cloudflare side)

The code ships three in-process guards on `/api/submissions` (honeypot, 5-per-10-min
IP rate limit, short-term duplicate drop — `src/lib/leads/abuse-guard.ts`). Two
pieces live in the Cloudflare dashboard and are **not yet configured**:

1. **Turnstile** (bot check on the Free Layout upload form): create a widget under
   Cloudflare → Turnstile for envolighting.com, then set `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
   + `TURNSTILE_SECRET_KEY` in the box's `.env` and restart. Blank keys = feature off,
   forms work as before.
2. **Edge rate limiting** (backstop if a bot outruns the in-process limiter): Cloudflare
   → Security → WAF → Rate limiting rules — e.g. `http.request.uri.path eq "/api/submissions"`,
   10 requests / 10 minutes per IP, block. Free plan includes one rule.

## Lead notifications & the daily digest

Every stored lead triggers a Mailgun email to sales (retried ×3; the outcome is
stamped on the lead — the admin Leads list has an "Email notification" column, and
terminal failures land in the container log). Two ops pieces:

1. **Daily unhandled-leads reminder**: `GET /api/leads-digest` (header
   `Authorization: Bearer $LEADS_DIGEST_SECRET`) emails sales a list of leads still
   marked *New* after 24 h — quiet days send nothing. Set `LEADS_DIGEST_SECRET` in
   `/opt/envo/.env`, then add a timer on the box, e.g. a systemd unit alongside
   `envo-deploy.timer`:
   ```
   # envo-leads-digest.service (Type=oneshot)
   ExecStart=/usr/bin/curl -sf -H "Authorization: Bearer <secret>" http://localhost:3000/api/leads-digest
   # envo-leads-digest.timer
   OnCalendar=*-*-* 09:00:00   # NZ morning; timezone per the box
   ```
2. **One-time migration** (adds the `notify` column): run the standard
   prod-migration step from "Schema changes" above **before** (or immediately
   after) the release that carries this code lands on `main`. Adding the column
   ahead of the code is harmless; the other way round, the admin **Leads list
   errors until the migration runs** (the public site and lead capture are
   unaffected either way).

## Access a teammate needs

- **GitHub** push access — see `git-workflow.md`. (Enough on its own for feature work with
  a `PAYLOAD_DB_PUSH` schema — no box access required.)
- **Tailscale** on the tailnet (ask Lenny) — required for `db-refresh-from-prod.sh` and prod migrations.
- **Your own SSH key on the box** — only if you want to pull real prod data.

### Getting your SSH key onto the box

**Never share a private key.** Generate your own and send only the public half.

1. **Teammate** creates a keypair (skip if you already have one you want to use):
   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/envo_box -C "yourname@envo"
   ```
   This writes `~/.ssh/envo_box` (private — keep secret) and `~/.ssh/envo_box.pub` (public).
   Send Lenny the **`.pub`** file's one line.
2. **Lenny** appends that line to the box's `~/.ssh/authorized_keys` (over Tailscale):
   ```bash
   echo 'ssh-ed25519 AAAA…theirline… yourname@envo' | \
     ssh root@100.106.130.54 'cat >> ~/.ssh/authorized_keys'
   ```
   Revoke later by deleting that one line — no re-keying anyone else.
3. **Teammate** points the refresh script at their key (the path is overridable, so no code edit):
   ```bash
   ENVO_BOX_KEY=~/.ssh/envo_box ./scripts/db-refresh-from-prod.sh --with-media
   ```
   (Or name your key `~/.ssh/envo_deploy_ed25519` to use the default and skip the env var.)
