# Turbopack + Payload admin — dev server wedges, /admin white-screens

**Date:** 2026-05-15
**Branch:** `feature/design-iteration` (merged to `dev` in `711b776`)
**Reporter:** Mackenzie (via Claude Code session)
**Status:** ✅ **RESOLVED** — see Resolution below. Everything past TL;DR is kept as historical record of the (mis-)diagnosis.

---

## Resolution

Not a Turbopack bug, not a Payload+Next 16 problem, not a Supabase pooler quirk, not a Node 24 incompatibility. All four hypotheses in the original writeup were red herrings.

**Root cause:** `npm install` running on **npm 11** (the npm that ships with Node 24) silently strips `"peer": true` flags from entries like `@types/node` and `babel-plugin-macros` in `package-lock.json`. The resulting `node_modules` is subtly inconsistent with what teammates on npm 10 (Node 22) have, which manifests at runtime as `@payloadcms/ui` client-side fetches failing → `/admin` renders white → dev server eventually wedges.

**Smoking gun:** `git status` after the symptoms appeared showed an uncommitted `package-lock.json` diff stripping `"peer": true` from two dev deps. That diff is the fingerprint.

**Fix:**
```bash
git checkout package-lock.json     # drop the npm-11 drift
rm -rf node_modules .next          # wipe corrupted install + Turbopack cache
npm ci                             # strict install from committed lockfile
npm run dev                        # /admin now renders cleanly
```

Verified working on **Node 24.13.0 / npm 11.6.2** — Node version was not the cause; the fix is npm-command discipline.

**Going forward:** default to `npm ci` for syncing this repo, never casual `npm install`. Only run `npm install` when intentionally adding/upgrading a package, and verify the resulting lockfile diff is *just* the new package — if unrelated peer-flag changes appear, drop them before committing.

A `.nvmrc` pinning Node 22 was also added for team consistency, but is not load-bearing for this fix.

---

## TL;DR

Running `npm run dev` (Next.js 16.2.6 with Turbopack) against the new Supabase dev DB:

- **Server side works fine** — Supabase connects, Payload pulls the schema, `GET /admin` returns 200 with the full admin HTML.
- **Client side breaks** — the Payload admin page renders white, browser DevTools shows `TypeError: Failed to fetch` originating from `@payloadcms/ui` and Next.js's own `fetchServerResponse`.
- **Dev server wedges** — after a handful of requests (or after editing a CSS / TSX file), the entire dev server stops responding to HTTP. `curl localhost:3000/` times out indefinitely. Only `pkill -9` on all `next dev` / `postcss.js` / `next-server` processes plus `rm -rf .next` recovers it. This has happened ~6 times in one working session.

Working around the wedge by switching `package.json` `dev` to `next dev --webpack` (no Turbopack). Webpack startup is slower (first `/admin` compile is ~30-60s vs Turbopack's ~9s) but doesn't appear to wedge.

Pushing this up because:
1. The wedge problem is reproducible enough that the team needs a stable answer before we're all in.
2. The Payload-admin white screen may or may not be the *same* underlying problem as the wedge, since both surface as "Failed to fetch" — unclear if webpack actually fixes both.

---

## Environment

| Thing | Version |
|---|---|
| Node | 24.13.0 |
| Next.js | 16.2.6 |
| Payload | 3.84.1 |
| `@payloadcms/db-postgres` | 3.84.1 |
| `@payloadcms/next` | 3.84.1 |
| React | 19.2.4 |
| tsx | 4.21.0 |
| OS | macOS Darwin 24.5.0 (M-series Mac mini) |
| DB | Supabase free, `us-west-2`, Session Pooler (port 5432) |
| Project | branch `feature/design-iteration`, ~30 commits ahead of `dev` |

`.env.local` has `DATABASE_URL=postgresql://postgres.<ref>:<pw>@aws-1-us-west-2.pooler.supabase.com:5432/postgres` and a 32-char `PAYLOAD_SECRET`.

---

## What works

- Frontend pages: `/`, `/products`, `/about`, all 15 stub routes — all return **HTTP 200** with the expected HTML.
- Supabase connection: Payload runs `[✓] Pulling schema from database...` successfully on first request to `/admin`. Connection string is valid (verified via `psql` separately — `\l` works).
- Payload server-side render: `GET /admin` returns full HTML containing `<html data-theme="light">` and the admin chunk script tags. **200 in 9.2s** on first hit (cold compile), **40-65ms** on subsequent hits.
- Schema pull from Supabase is clean — no errors, no migrations pending.
- `npx tsc --noEmit` clean. `npm run lint` clean except for 9 `<img>` warnings (intentional, will swap to `next/image` per-page).

## What doesn't work

### 1. Client-side white screen on `/admin`

Browser DevTools Console on `/admin`:

```
TypeError: Failed to fetch
  at createFetch (...node_modules_next_dist_client_0fhqo1d._.js:8107:21)
  at async fetchServerResponse (...node_modules_next_dist_client_0fhqo1d._.js:7951:21)
  at async navigateToUnknownRoute (...node_modules_next_dist_client_0fhqo1d._.js:10121:20)

TypeError: Failed to fetch
  at Object.get (...node_modules_%40payloadcms_ui_dist_exports_client_index_061gfsg.js:5243:14)
  at <unknown> (...node_modules_%40payloadcms_ui_dist_exports_client_index_061gfsg.js:6683:34)
  ...React commit / passive effect mount stack...
```

DevTools Network tab on `/admin`:
- `admin` document request: `(cancelled)` × 3
- `login` document: `(cancelled)`
- `__nextjs_original-stack-frames` (Next.js's own error overlay endpoint): `(cancelled)` × 2
- One pending `admin` request never resolves

So the JS bundle loaded fine, React mounted, then `@payloadcms/ui` made fetch calls that timed out / got cancelled. This **coincides** with the dev server wedging (#2 below), so it may be a single root cause.

### 2. Dev server wedges after a few requests

Pattern observed ~6 times:

1. `npm run dev` starts cleanly. `✓ Ready in ~230ms`.
2. First few `GET /` requests log normally, return 200.
3. Make a file edit (TSX or CSS), or hit a fresh route, or just wait some minutes.
4. Server stops responding. Dev log writes no new lines. `curl http://localhost:3000/` times out indefinitely.
5. Only recovery: `pkill -9 -f "next dev"` AND `pkill -9 -f "postcss.js"` AND `pkill -9 -f "next-server"` (just `kill <pid>` isn't enough — child workers stay), then `rm -rf .next`, then `npm run dev`.

The dev log shows no error before the wedge — server just stops responding. This is on plain `next dev` (Turbopack default in Next 16).

When this happens, both `/` and `/admin` become unreachable from the browser → matches the "Failed to fetch" symptom (#1).

### 3. `payload generate:importmap` CLI broken on Node 24 + tsx 4.21

Separate issue but worth flagging: `npx payload generate:importmap` (and `payload --use-swc generate:importmap`) fail with:

```
Error [ERR_MODULE_NOT_FOUND]:
  Cannot find module '/.../src/payload/collections/Products'
  imported from /.../src/payload.config.ts
```

tsx's `tsImport()` (used by Payload's CLI) doesn't resolve extensionless TS imports the same way the `tsx` CLI does, and adding `.js` extensions to the imports also doesn't help (tried both). This is a [known incompatibility](https://github.com/payloadcms/payload/issues) between Payload's CLI and Node 24's ESM loader.

**Workaround in place:** I committed a stub `src/app/(payload)/admin/importMap.js` that exports `{ importMap: {} }`. This was supposed to get auto-regenerated by the `withPayload` Next plugin on first `next dev` / `next build`. **Empirically it does NOT regenerate.** So the import map is permanently empty in dev. May or may not be related to the white screen — Payload UI's default views *shouldn't* need entries in the import map for non-custom field types (Products and Media use only built-in field types).

---

## What we tried

| Try | Result |
|---|---|
| Restart dev server (`pkill -9` + `rm -rf .next`) | Recovers temporarily; wedges again within ~5-20 min of normal work |
| `payload generate:importmap` CLI | Errors with `ERR_MODULE_NOT_FOUND` (Node 24 + tsx issue) |
| `payload --use-swc generate:importmap` | Same error — fallback to swc also fails |
| Adding `.js` extensions to imports in `payload.config.ts` | tsx still can't resolve them; doesn't fix CLI |
| Switching to `next dev --webpack` | **In progress.** Boot OK, schema pull OK, /admin first compile takes ~60s+ (vs Turbopack ~9s). Not yet verified whether the wedge / white screen recurs under webpack. |

---

## Hypotheses (in order of probability)

1. **Turbopack instability with Payload's HMR.** Payload 3 sets up file watchers and a server-only Postgres connection pool. The combination of Payload's pool + Turbopack's worker model + a slow Supabase pooler latency (us-west-2 from NZ adds ~150ms RTT) may be causing connections to back up until the dev server wedges. Webpack might tolerate this better.

2. **Node 24 + Turbopack edge case.** Next.js 16.2.x officially supports Node 24, but Turbopack is newer and may have unaddressed issues. Multiple reports online of Turbopack wedging in dev on Node 24 specifically.

3. **Supabase free tier session pooler quirk.** The pooler closes idle connections aggressively. If Payload's pool holds onto a closed connection and tries to query → throws → the dev server's error overlay tries to fetch error details → that fetch hits the wedged server → cascade.

4. **Empty import map causing client-side hydration mismatch.** Less likely (server returns HTML successfully and the UI chunks load), but worth ruling out.

---

## Open questions for Wei + Alan

1. **Is webpack mode acceptable as the team standard for now?** If yes, I'll bake it into `package.json` and commit. Loss is ~30-50% slower compile in dev. Gain is stability. Production builds via `next build` are unaffected (they always use webpack-or-Turbopack-by-config, doesn't change runtime).

2. **Has either of you seen `Failed to fetch` against `/admin` on your own machines?** If you're seeing the same symptom from your laptops, it's a Payload + Next 16 + Supabase combination problem (not just my machine). If not, it might be Mackenzie-machine-specific (LAN latency, OS network state, antivirus interference).

3. **Should we pin Node to 22 LTS to dodge the Node 24 issues?** Easy via `.nvmrc` + maybe a CI check. Payload officially supports Node 22. Tradeoff: every contributor needs nvm or fnm.

4. **Wei — for Supabase, would it make sense to add a `pgbouncer` config tweak** (e.g. `?pgbouncer=true&connection_limit=1` query params on the connection string for Payload's pool)? Drizzle docs recommend this for Supabase Session Pooler.

5. **Alan — once the dev server is stable, do you want me to take a swing at fixing `payload generate:importmap` for Node 24, or just accept that we never run it manually and let `withPayload` regenerate on `next build`?** I can verify `next build` actually does regenerate it.

---

## How to reproduce on your machine (Alan / Wei)

```bash
git checkout dev
git pull origin dev
# (or git checkout feature/design-iteration once it's pushed — same scaffold,
# just with my homepage / products / stub route work on top)

npm install

# Set up .env.local per Wei's email — Supabase Session Pooler conn string
# + 32-char PAYLOAD_SECRET

npm run dev
# Visit http://localhost:3000 → should work
# Visit http://localhost:3000/admin → first hit may take 9-60s,
#                                     should show Payload "create first admin" form
```

If `/admin` is white, open DevTools → Console → look for `Failed to fetch`. If you see it, we have the same problem on your side.

If `/admin` works for you, the difference is interesting — let's compare Node versions and any OS-level network tooling (proxies, VPN, etc).

---

## Update — 2026-05-15 (post-merge)

Merged `feature/design-iteration` → `dev` (commit `711b776`) and pushed. **Wei pulled `dev` and verified both `/` and `/admin` render cleanly on Wei's machine** — no white screen, no `Failed to fetch`, no wedge.

This narrows the diagnosis: the issue is **local to Mackenzie's machine**, not a Payload + Next 16 + Supabase combination problem. Rules out hypotheses 1, 3, 4. Hypothesis 2 (Node 24 + Turbopack edge case on this specific machine) and machine-environment causes (network state, antivirus, local Turbopack cache, OS-level interference) are now the leading candidates.

**Next steps on Mackenzie's side:**
- Try `.nvmrc` pinned to Node 22 LTS, fresh `npm ci`, fresh `.next` directory.
- If still wedging, compare Node version with Wei's.
- Webpack-mode workaround stays in place locally for productivity, but **does not** need to become the team default — that would slow everyone else down for a one-machine problem.

Reopening the diagnosis only if Alan also reproduces.

---

## Mackenzie's current state

- Branch `feature/design-iteration` is local-only, ~30 commits ahead of `dev`. Includes the full homepage port from the source mockup, /products catalog page, 15 stub routes, and a route-group refactor that puts the main site into `(frontend)/` so it doesn't share root layout with `(payload)/` (the Wei-flagged nested-html-body fix).
- Will push and open PR once the dev wedge issue is settled — don't want to ship work on a branch that breaks `/admin` for other people too.
- Frontend port is unblocked: I can keep porting catalog pages (Drivers / Control / Accessories / Solutions / etc.) without touching `/admin` at all. The wedge issue only bites when I open `/admin` in the browser.

---

Yell if either of you wants to pair on this. Otherwise, I'll continue porting pages on webpack mode and revisit the wedge if it recurs.

— Mackenzie (via Claude Code, 2026-05-15)
