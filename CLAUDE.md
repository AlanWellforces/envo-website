# ENVO Website – Claude Code Context

## What this project is

A brand website and product catalogue for ENVO (electrical brand under Wellforces Ltd).
B2B lead generation site — no ecommerce checkout.

## Team

- **Alan** — backend, infrastructure, database, API routes, Akeneo sync
- **Mackenzie** — frontend, Next.js scaffold, component porting
- **Wei** — content, Payload CMS authoring, AI prompt direction

## Branch workflow

```
main   — production-ready only. Never commit directly.
dev    — integration branch. All PRs merge here first.
feature/* — where all work happens.
```

Always work like this — no exceptions:
```bash
git fetch origin
git checkout dev
git pull origin dev
git checkout -b feature/your-feature-name
# ... do work ...
# rebase on latest dev before pushing:
git fetch origin && git rebase origin/dev
# push (first time: -u; after rebase: --force-with-lease)
git push -u origin feature/your-feature-name
# open PR against dev, not main
```

dev → main only via PR when dev is stable and ready to ship.

See [`git-workflow.md`](git-workflow.md) for the full reference — rebase flow, conflict handling, `--force-with-lease` safety, the "when unsure, ask" rule, and the team cheat sheet.

## Stack

```txt
Frontend:    Next.js 16 App Router + TypeScript
Styling:     Tailwind CSS v4 (CSS-first @theme in globals.css — NO v3 syntax)
UI:          shadcn/ui (New York, Slate)
CMS:         Payload CMS 3
Database:    PostgreSQL
ORM:         Drizzle ORM (product_* tables only)
Product src: Akeneo PIM
Hosting:     Vercel (later)
Prod DB:     Supabase (later)
Dev DB:      Supabase free (us-west-2) — see notes/2026-05-15-dev-db-supabase.md
AI:          Anthropic API (server-side only)
Email:       Resend
```

## Three-source rule — ALWAYS follow this

```txt
Akeneo PIM   →  owns all product data (SKU, specs, images, datasheets)
Payload CMS  →  owns all editorial content (copy, navigation, FAQs, case studies)
Git          →  owns all code and logic (schema, API routes, AI prompts, components)
```

Never put product data in Payload. Never put editorial copy in Git as hardcoded strings.
Never put core AI prompt logic only in Payload.

## Copy rules — site-wide

Enforceable wording constraints for ALL customer-facing copy — whether it lives
in code, Payload, or anywhere else. These override any draft copy.

- **No online chat.** ENVO has no live-chat / chatbot / "start a chat" feature.
  Never write "chat", "live chat", "start a chat", or use a chat-bubble CTA.
  Support is via the contact form and email — route to `/contact` with wording
  like "Contact us" / "Ask our engineers".
- **No prices.** Lead-generation site, no ecommerce. Never surface a price (incl.
  `price_nzd`). Talk lead-time and channel routing instead.
- **No response-time promises.** Never promise a numeric turnaround ("within 24h",
  "same-day reply"). Vague qualitative wording is fine.
- **ENVO-only branding.** Brand as ENVO only; legal entity Envo; contact email
  `contact@envo-led.com`. Never use legacy brand names (e.g. Power Supply Mall).

## Database

Always use `process.env.DATABASE_URL`. Never hardcode a hostname.

```txt
Team dev:        Supabase free (us-west-2)     →  Session Pooler, details in Zoho Vault
Local dev (opt): docker-compose up -d           (individual offline Postgres on your laptop)
Off-site backup: MBA saless-macbook-air.local   (nightly pg_dump from Supabase, 14-day retention)
Production:      Supabase Pro (separate project, region TBD at launch)
```

Onboarding + full architecture details in [`notes/2026-05-15-dev-db-supabase.md`](notes/2026-05-15-dev-db-supabase.md).
Connection string lives in Zoho Vault under **"ENVO Dev Database — Supabase"**.

## AI prompts

Core prompt lives in Git:

```txt
src/lib/ai/prompts/find-your-match.ts
src/lib/ai/prompts/find-your-match.test-cases.ts
```

Payload stores supporting copy only (CTA, fallback text, tone, enabled/disabled flag).
Wei drafts prompt iterations in Payload. Alan promotes accepted versions to Git via PR.

## Design spec rule

```txt
/design-spec/   →  design reference only, NOT production code
src/            →  all production code lives here
```

Never import from /design-spec/. Rebuild as clean React components under src/components/.

The current c-version design (dark theme, sidebar layout) is a newer iteration but **not the final design**. Use it as visual reference only during Phase 2b — a final design spec is still coming. Do not treat any c-version detail as locked. Visual decisions remain open until the final spec lands.

## Legacy files rule

If a legacy/ folder exists, it is read-only reference. Never import from it. Never modify it.

## Tailwind v4 rule

Use Tailwind CSS v4 only. CSS-first configuration via globals.css @theme block.
Do not write v3-style tailwind.config.js theme extensions.

## Current stage

See [ENVO-Website-V2-Execution-Plan.md](ENVO-Website-V2-Execution-Plan.md) for full stage details.

## Akeneo / Payload grey-area judgment guide

*(To be filled in during Stage 2 co-write by Alan + Wei. Add real scenarios here as they come up.)*

### Template for each entry

```
Scenario:    [describe the ambiguous content]
Owner:       [Akeneo | Payload | Git]
Reasoning:   [why]
```

---

## Key files (once repo exists)

```txt
src/lib/products.ts                          product accessors (hottest code path)
src/lib/ai/prompts/find-your-match.ts        core AI prompt
src/payload/collections/                     Payload collection configs
drizzle/schema.ts                            Drizzle product schema
scripts/akeneo-sync.ts                       Akeneo sync script
docker-compose.yml                           local Postgres
.env.example                                 required env vars
```
