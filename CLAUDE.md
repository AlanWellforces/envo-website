# ENVO Website – Claude Code Context

## What this project is

A brand website and product catalogue for ENVO (electrical brand under Wellforces Ltd).
B2B lead generation site — no ecommerce checkout.

## Team

- **Alan** — backend, infrastructure, database, API routes, Akeneo sync
- **Mackenzie** — frontend, Next.js scaffold, component porting
- **Wei** — content, Payload CMS authoring, AI prompt direction

## Stack

```txt
Frontend:    Next.js 15 App Router + TypeScript
Styling:     Tailwind CSS v4 (CSS-first @theme in globals.css — NO v3 syntax)
UI:          shadcn/ui (New York, Slate)
CMS:         Payload CMS 3
Database:    PostgreSQL
ORM:         Drizzle ORM (product_* tables only)
Product src: Akeneo PIM
Hosting:     Vercel (later)
Prod DB:     Supabase (later)
Dev DB:      Docker local or NAS at 192.168.68.80
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

## Database

Always use `process.env.DATABASE_URL`. Never hardcode a hostname.

```txt
Local dev:       docker-compose up -d  (Docker Postgres)
Shared dev/stg:  NAS Postgres at 192.168.68.80
Production:      Supabase
```

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
