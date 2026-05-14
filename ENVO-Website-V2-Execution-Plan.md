# ENVO Website – V2 Execution Plan for Claude Code / Codex

## Purpose

This document converts the original ENVO Website project plan into a lighter, more execution-friendly V2 plan.

The goal is to preserve the core architecture while reducing early-stage complexity.

Original direction to keep:

- Next.js 15 + TypeScript
- Payload CMS 3
- Drizzle ORM
- PostgreSQL
- Akeneo PIM as product data source of truth
- Payload CMS as editorial content source of truth
- Git as code and logic source of truth
- Vercel + Supabase for production later
- No Shopify integration
- No ecommerce checkout
- Brand website + product catalogue + lead-generation website

Main change:

> Keep the core architecture, but simplify the early execution plan.

---

# 1. High-Level Architecture Decision

## Keep the core stack

Use:

```txt
Frontend:        Next.js 15 App Router + TypeScript
Styling:         Tailwind CSS v4 + shadcn/ui
CMS:             Payload CMS 3
Database:        PostgreSQL
Product ORM:     Drizzle ORM for product_* tables only
Product Source:  Akeneo PIM
Hosting:         Vercel later
Production DB:   Supabase later
AI:              Server-side API routes, Anthropic later
Email/forms:     Resend later
```

## Keep the three-source rule

The project must follow this rule:

```txt
Akeneo PIM owns product data.
Payload CMS owns editorial content.
Git owns code and logic.
```

### Akeneo owns

```txt
SKU
model number
product name
family/category
wattage
voltage
IP rating
certifications
dimensions
product specifications
product images
datasheets
manuals
technical documents
```

### Payload owns

```txt
homepage copy
banners
navigation labels
application pages
solution pages
case studies
FAQs
blog/news posts
CTA copy
SEO fields
download page copy
customer journey content
supporting AI copy
fallback messages
tone settings
```

### Git owns

```txt
schemas
Drizzle migrations
API routes
sync scripts
React components
page templates
AI core prompts
AI prompt test cases
form handlers
business logic
deployment config
```

## Customer access patterns

```txt
Entry paths (many-to-one funnel):
  SEO landing on an application page  (e.g. /applications/signage)
  Direct visit to homepage
  Industry-show QR code → product detail page
  Partner referral with specific SKU → product detail page
  Akeneo-driven search → product page

Browse paths (high variance):
  Category pages (signage / drivers / control / accessories)
  Application pages (signage / cabinetry / residential / ...)
  Solutions / Industries
  Case studies / Projects
  Resources / Downloads

Conversion convergence points:
  A. Direct enquiry → /api/enquiry → Resend → sales inbox
  B. Where to Buy → regional partner site
  C. Datasheet download → PIM document URL
  D. Find Your Match → recommends 2-3 SKUs → user falls into A or B
  E. Bounce
```

Traffic shape and caching priorities:

```txt
HIGH-TRAFFIC, latency-sensitive → cache aggressively:
  Product detail pages
  Product category pages
  Application pages

MEDIUM-TRAFFIC → cache with reasonable TTL (15-60 minutes):
  Industries / Solutions pages
  Case studies / Projects
  Resources / Downloads page

LOW-TRAFFIC, cost-sensitive → no caching, but rate-limit:
  /api/find-your-match   (high Anthropic token cost per call)
  /api/enquiry           (reliability matters more than speed)
```

---

# 2. Key V2 Changes

## Change 1 – Database

Do not use MacBook Air as a required shared dev database.

```txt
Each developer runs local Postgres via docker-compose
+
NAS Postgres as shared dev/staging (already running at 192.168.68.80)
+
Supabase for production later
```

Always use:

```txt
process.env.DATABASE_URL
```

Never hardcode a hostname.

## Change 2 – Wei's role

Wei's primary role is content and customer experience, not infrastructure.

```txt
Wei owns:
  Content strategy, homepage copy, navigation labels
  Application page structure, solution pages, case studies, FAQs
  Payload CMS authoring
  Customer journey design
  AI prompt direction, tone, CTA, fallback copy

Alan owns:
  Database setup, schema design, Drizzle migrations
  Payload technical setup
  Akeneo sync
  API routes
  Environment variables
  Deployment and infrastructure escalation
```

## Change 3 – AI prompts live in Git

Core AI prompts live in Git, not only in Payload.

```txt
Core prompt:   src/lib/ai/prompts/find-your-match.ts
Prompt tests:  src/lib/ai/prompts/find-your-match.test-cases.ts
```

Payload stores supporting content only:

```txt
CTA wording, fallback text, tone label, feature enabled/disabled
```

Wei iterates prompts in Payload draft field. Alan promotes accepted versions to Git via PR.

## Change 4 – No direct legacy file copy

Do not copy legacy files into the new repo.

```txt
Preferred:   keep archive repo as external reference only
Acceptable:  git submodule
Avoid:       direct cp -r into the new repo
```

If legacy/ exists, it is read-only reference. Never import from it.

## Change 5 – Tailwind v4 locked

Use Tailwind CSS v4 only. CSS-first theme config via globals.css @theme.

---

# 3. Execution Stages

## Stage 1 – Foundation ready

**Owner:** Alan

```txt
1. Update publish.sh to point at renamed archive repo
2. Rename old repo to marketing-cyber/envo-website-preview-archive (if applicable)
3. ~~Create new repo marketing-cyber/envo-website~~ — repo exists at AlanWellforces/envo-website
4. Set branch protection on main (PR + 1 approval)
5. Create dev branch
6. Decide legacy reference method (preferred: archive repo only)
7. Provision Supabase dev/staging project (or use NAS Postgres)
8. Add shared values to 1Password:
     DATABASE_URL_DEV
     DATABASE_URL_STAGING
     PAYLOAD_SECRET
9. Confirm Q1 (multi-brand), Q3 (Supabase plan), Q8 (Wei's prompt workflow), Q9 (publish.sh)
```

**Exit criteria:**

```txt
New repo exists with dev branch
Branch protection enabled on main
DATABASE_URL_DEV reachable from all three developers' machines
Legacy reference method decided
Tailwind v4 confirmed
Marketing's preview workflow continues to function
```

---

## Stage 2 – Scaffold lands

**Owners:** Mackenzie (primary), Alan + Wei (parallel)

### Phase 2a – Scaffold (no design spec needed)

```txt
Next.js 15 scaffold
Tailwind v4 with CSS-first @theme block
shadcn/ui setup (New York, Slate)
Payload CMS install pointing at DATABASE_URL
docker-compose.yml for local Postgres
Folder skeleton: src/components, src/lib, src/payload, scripts, public
CLAUDE.md, README.md, .env.example, .prettierrc, drizzle.config.ts
Layout components: Header, Footer, MainNav, MobileNav, Container
Placeholder homepage that builds and typechecks
```

### Phase 2b – Homepage port (design spec required)

```txt
Port homepage from /design-spec/ (curated by Marketing)
NOT from c-version mockups directly
Build and typecheck still pass
```

### Alan – parallel

```txt
Confirm Akeneo API credentials work
Draft Akeneo attribute mapping (markdown doc)
Draft Drizzle product schema in feature branch (do not merge yet)
Draft Payload collection list with Wei
Co-write v0.1 Akeneo/Payload grey-area judgment guide with Wei
```

### Wei – parallel

```txt
Draft Find Your Match question tree
Draft application page structure and homepage copy
Draft AI fallback messages, tone guidance, CTA copy
Pair with Alan on Payload collection field design
Co-write v0.1 grey-area judgment guide with Alan
```

**Exit criteria:**

```txt
PR feature/nextjs-scaffold opens against dev
Build passes, typecheck passes
Curated design spec committed to /design-spec/
Homepage matches the curated design spec
Payload admin route reachable
PR merged to dev
```

---

## Stage 3 – Foundation features ship

**Trigger:** Stage 2 scaffold PR merged to dev.

### Alan – PR order

```txt
1. feature/drizzle-product-schema
     schema.ts, client.ts, migration runner, initial migration
     real Product TypeScript type, real product accessors

2. feature/payload-collections-v1
     Pages, Homepage (global), Navigation (global), Media,
     Case Studies, FAQs, AI Prompts (supporting copy only)

3. feature/seed-script
     fake products in product_* tables
     Payload admin user for Wei
     starter homepage content

4. feature/akeneo-sync-prototype
     pull 10-20 real SKUs from Akeneo
     normalise, upsert, log, idempotent
```

### Wei – parallel

```txt
Log into Payload admin once collections exist
Enter homepage hero copy (real)
Enter navigation labels (final wording)
Create first application page (suggested: signage)
Create one case study
Enter 5-10 FAQs
Enter AI fallback copy and tone settings
```

### Mackenzie – parallel

```txt
Port About and Contact pages
Port Industries and Solutions shells
Port Resources page
Build product card and product detail UI shells with placeholder data
```

**Exit criteria:**

```txt
Schema migrated and visible in db:studio
Wei has Payload admin access and entered real homepage copy
At least 10 real Akeneo products visible in the database
Mackenzie's product detail page renders one real product
Grey-area judgment guide refined to v1.0 in CLAUDE.md
```

---

## Stage 4 – Customer-facing capabilities

**Trigger:** Stage 3 exit criteria met.

### Alan – PR order

```txt
1. feature/enquiry-form-api
     /api/enquiry route with Zod validation
     Resend integration, email lands in sales inbox

2. feature/r2-image-sync
     extend PIM sync to download images, resize, upload to R2
     store R2 URLs in product_images

3. feature/find-your-match-api
     /api/find-your-match route
     load core prompt from Git
     load product catalogue via accessors
     load supporting copy from Payload
     call Anthropic API, return recommendations

4. feature/pim-webhook
     /api/webhooks/pim with signature validation
     incremental sync on product change
```

### Mackenzie – parallel

```txt
Build enquiry form against Alan's API
Build Find Your Match interactive flow
Wire product detail page to real schema and R2 URLs
```

### Wei – parallel

```txt
Iterate Find Your Match prompt based on real usage
Add more application pages, case studies, FAQs
Refine AI tone and fallback copy
```

**Exit criteria:**

```txt
Enquiry form works end-to-end
Find Your Match returns sensible recommendations
Product images load from R2
Akeneo webhook triggers automatic sync
Production readiness: Supabase migration tested, Vercel project linked
```

---

# 4. Open Questions

| # | Question | Recommended path | Timing |
|---|---|---|---|
| Q1 | Multi-brand strategy | Option A + brand-ready foundations | Stage 1 |
| Q2 | Akeneo/Payload grey-area guide | Alan + Wei co-write | Stage 2 v0.1, Stage 3 v1.0 |
| Q3 | Supabase plan | Free + stage-gated capacity checks | Stage 1 |
| Q4 | Local Postgres | docker-compose.yml mandatory | Stage 2 scaffold |
| Q5 | AI prompt test runner | Spike after find-your-match API | Stage 4 |
| Q6 | Wei's growth path | One-on-one conversation | Ongoing |
| Q7 | Curated design spec | Marketing produces before homepage port | Before Stage 2b |
| Q8 | Wei's git write path | Payload draft → Alan promotes to Git | Stage 3 impl |
| Q9 | publish.sh migration | Update target now, Vercel later | Stage 1 |

---

# 5. Three-Source Rule Reference

| Content | Source |
|---|---|
| SKU, specs, images, datasheets | Akeneo PIM |
| Homepage copy, navigation, FAQs, case studies | Payload CMS |
| Core AI prompt | Git |
| Prompt test cases | Git |
| AI route logic | Git |
| CTA wording, fallback text, tone | Payload CMS |
| Drizzle schema, migrations | Git |
| API routes, sync scripts | Git |

---

# 6. V2 Principle

```txt
Keep the architecture strong.
Make the first week light.
Reduce infrastructure friction.
Let each person start producing real project value quickly.
```
