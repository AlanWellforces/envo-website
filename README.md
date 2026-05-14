# ENVO Website

Brand website and product catalogue for ENVO (electrical brand under Wellforces Ltd). Built with Next.js 15, Payload CMS, and Akeneo PIM. B2B lead generation — no ecommerce checkout.

## Local Setup

```bash
# 1. Clone the repo
git clone https://github.com/AlanWellforces/envo-website.git
cd envo-website

# 2. Copy env template and fill in your values
cp .env.example .env.local

# 3. Start local Postgres
docker compose up -d

# 4. Install dependencies
npm install

# 5. Run dev server
npm run dev
```

## Branch Workflow

```
main   — production-ready only, PRs required
dev    — integration branch, all feature PRs merge here

git checkout dev
git checkout -b feature/your-feature
# ... do work ...
# open PR against dev
```

## Pointers

| Role | Start here |
|---|---|
| Frontend dev (Mackenzie) | [MACKENZIE.md](MACKENZIE.md) |
| Content / CMS (Wei) | [WEI.md](WEI.md) |
| Backend / infra (Alan) | [CLAUDE.md](CLAUDE.md) |
| Full architecture & stage plan | [ENVO-Website-V2-Execution-Plan.md](ENVO-Website-V2-Execution-Plan.md) |
| Akeneo attribute mapping | [akeneo-attribute-mapping.md](akeneo-attribute-mapping.md) |

## Stack

```
Next.js 15 App Router + TypeScript
Tailwind CSS v4
shadcn/ui
Payload CMS 3
PostgreSQL + Drizzle ORM
Akeneo PIM (product data source)
Vercel (hosting, later)
Supabase (production DB, later)
```
