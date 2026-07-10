# Admin Dashboard — Website Data Capture (Phase 1)

**Date:** 2026-07-01
**Status:** Design — awaiting review
**Relates to:** custom Payload Dashboard (direction 3 "Editorial Bold"), `project_admin-ux-refresh-dashboard`

## Goal

Surface real website data on the custom Payload admin Dashboard. Build the
**full capture pipeline now** ("dig the holes") so that the moment the site
goes live on Vercel, traffic and usage data flow into our own admin with **zero
launch-day setup**. Pre-launch there are no real visitors — the plumbing is
live, the numbers are simply zero until launch.

Three data classes, one shared Postgres + Payload foundation:

1. **Leads** — form submissions (currently the Free Layout Design form throws
   the data away; this is the most urgent hole to plug).
2. **AI tool usage** — every Find Your Match run.
3. **Traffic** — first-party, cookieless page-view analytics.

All three land in Postgres via Payload collections and are read back by a custom
Dashboard server component. No external analytics provider — full control, data
lives in our own admin.

## Current state (verified)

- `SketchForm.tsx` `onSubmit` only calls `setSent(true)` — **nothing is
  persisted or emailed**. Fields: name*, company, email*, phone, sign type*,
  dimensions*, location, notes, sketch file (optional).
- `/api/find-your-match/route.ts` is hit on **every** wizard run
  (`Wizard.tsx:47`) and currently persists nothing — ideal server-side log point.
- `google_analytics_id` exists in `SiteSettings` but is **never rendered** — no
  analytics runs anywhere today. (Leave the field; it is out of scope here.)
- Payload collections registered in `src/payload.config.ts`: Products, Media,
  Posts, Projects, Faqs, PageSeo, Pages, Users. Admin uses a custom `providers`
  (AdminStyles) and `afterNavLinks` (PagesNavLink). **No custom Dashboard view yet.**
- DB is the shared Supabase dev instance via `process.env.DATABASE_URL`.

## Architecture

### New collections

Both modelled as standard Payload collections (same Postgres, schema managed by
Payload like every other collection — Drizzle stays `product_*` only per the
three-source rule). Operational data is a third category, owned by Git-defined
Payload schema.

**`submissions`** — leads, contains PII, team-managed.

| field        | type                                   | notes |
|--------------|----------------------------------------|-------|
| `type`       | select: free-layout / find-your-match / contact | required |
| `name`       | text                                   | |
| `email`      | email                                  | |
| `company`    | text                                   | |
| `phone`      | text                                   | |
| `sourcePath` | text                                   | which page it came from |
| `data`       | json                                   | raw form fields / wizard answers |
| `sketch`     | upload (relation → Media)              | optional, Free Layout only |
| `status`     | select: new / contacted / archived (default new) | sidebar |
| `createdAt`  | auto                                   | Payload default |

- Admin: `useAsTitle: 'email'`, group **"Leads"**,
  `defaultColumns: ['email','type','company','status','createdAt']`,
  sorted newest-first. No drafts/versions.
- Access: `read` — authenticated admins only (PII). `create` — public (the
  public API route creates rows server-side; see note on access below).

**`events`** — anonymous analytics, high-frequency, read-only in admin.

| field         | type                                  | notes |
|---------------|---------------------------------------|-------|
| `kind`        | select: pageview / find-your-match    | required, indexed |
| `path`        | text                                  | pageview path |
| `referrer`    | text                                  | nullable |
| `sessionHash` | text                                  | cookieless daily hash, indexed |
| `data`        | json                                  | e.g. matched series + answers for FYM |
| `createdAt`   | auto                                  | |

- Admin: **hidden from the nav** (`admin.hidden: true`, decided) — the raw event
  log is never browsed directly; the Dashboard shows the computed numbers and
  charts. No drafts/versions. `read` — admins only. (Trivial to un-hide later.)
- Indexes on `kind`, `createdAt`, `sessionHash` for fast Dashboard aggregation.

### API routes

**`POST /api/submissions`** — lead capture.
- Validates required fields (name, email, type), creates a `submissions` row via
  the Payload Local API (`payload.create`).
- **Resend notification (decided: yes).** On every new lead, send a Resend email
  to sales (`contact@envolighting.com`) so the 24h-reply promise isn't missed. Kept
  behind a presence-check on `RESEND_API_KEY`, mirroring how the AI route guards
  on `ANTHROPIC_API_KEY`. Email failure never fails the submission (best-effort).
- File upload (`sketch`): upload to Media first, relate by id. See Media storage
  below — bytes go to Supabase Storage, not the DB.

**`POST /api/track`** — page-view beacon.
- Body: `{ path, referrer }`. Server computes `sessionHash` from
  `sha256(ip + userAgent + UTC-date + SALT)` truncated — **no cookie, no stored
  IP**. Filters known bots by User-Agent before insert. Creates `events` row.
- Designed to be cheap and fire-and-forget; returns `204`.

**Find Your Match logging** — no new route. Inside the existing
`/api/find-your-match/route.ts`, after `recommend()`, write one
`events{ kind:'find-your-match', data:{ series: rec…, answers } }`. Best-effort;
a logging failure must never break the recommendation response.

### Client beacon

A small client component mounted in the frontend root layout that POSTs to
`/api/track` on initial load and on App Router route change
(`usePathname` effect). Cookieless, ~15 lines, no third-party script.

### Media storage (Supabase Storage — decided)

File uploads (lead sketches, and Media generally) must survive launch and not
bloat the DB. **The file record/metadata lives in Postgres** (so it's covered by
the nightly `pg_dump` backup, CLAUDE.md), **the binary lives in Supabase
Storage** via a storage adapter — NOT as `bytea` in a Postgres row.

- Wire `@payloadcms/storage-s3` against Supabase Storage's S3-compatible endpoint
  (same Supabase project already used for the DB). New env vars:
  `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`,
  `S3_REGION` (documented in `.env.example`; secrets in Zoho Vault).
- This also resolves the pre-existing local-only media bug
  (`project_payload-media-local-only-500`) — a deliberate, in-scope side benefit.
- Note: the Akeneo→DB daily sync covers **product data only**; it does not back
  up `submissions` or uploaded sketches. Their durability comes from the nightly
  DB dump (records) + Supabase Storage (binaries).

### Privacy

Cookieless by construction — aligns with the existing cookie policy and avoids a
consent banner. No PII in `events`. Leads (`submissions`) hold PII but live
behind admin auth and the existing privacy policy already covers enquiry data.

### Dashboard (direction 3 — Editorial Bold)

Custom Dashboard via `admin.components.views.dashboard` in `payload.config.ts`
— a server component that aggregates with `payload.count` / `payload.find` and
renders the Editorial Bold layout (light base, blue→lime gradient hero,
two-colour stat tiles) per the agreed mockup. Cards:

- **Leads** — new this week (count) + most-recent 5 (email · type · time), link
  to the Submissions list.
- **Find Your Match** — total runs + runs this week + top matched series.
- **Traffic** — page views + estimated unique visitors (distinct `sessionHash`)
  + top pages + top referrers, over a 7-day window. Zero until launch by design.
- Existing agreed content blocks (welcome header, content stat cards for
  Products/Pages/Posts/Projects/FAQs, quick actions) remain per the prior
  Dashboard brainstorm — this spec adds the three data cards to that layout.

**Charts (decided: in Phase 1).** Beyond the headline numbers, the Dashboard
shows a small visual report: a 7-day traffic trend (PV per day) and a top-pages
bar. Rendered as **lightweight inline SVG** (sparkline/bars) — no heavy charting
dependency (per the leaner-abstractions preference). Find Your Match gets a
simple top-series bar.

## Out of scope (Phase 1)

- External analytics providers (Vercel Analytics / Plausible) — not used; the GA
  field stays dormant.
- Wiring the `/contact` form and Find-Your-Match "email me this" capture — the
  `submissions` schema supports them (`type`), but only the Free Layout form is
  wired in this phase.
- Bot filtering beyond a User-Agent denylist; advanced unique-visitor modelling.
- Later admin-refresh phases (Products list/editor polish, full dark theming).

## Build order

1. Supabase Storage adapter for Media (`@payloadcms/storage-s3` + env vars);
   verify upload/serve round-trips (also fixes the existing media-500 bug).
2. `submissions` + `events` collections, register in `payload.config.ts`, push schema.
3. `POST /api/submissions` (incl. Resend notify); wire `SketchForm` (real fetch +
   error/success states, file upload).
4. Find Your Match server-side event logging.
5. `POST /api/track` + cookieless client beacon in frontend root layout.
6. Custom Dashboard view (Editorial Bold) — numbers + inline-SVG charts,
   aggregating all three + existing content blocks.

## Decisions (resolved in review)

- **Resend lead notification** — yes, in Phase 1 (best-effort, never blocks save).
- **Sketch file storage** — Supabase Storage adapter; record in DB, binary in
  Storage. Not stored as bytes in Postgres.
- **`events` visibility** — hidden from admin nav; Dashboard surfaces the
  computed numbers + charts.
