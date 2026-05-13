# ENVO Website — Mackenzie's Brief

## What this project is

Brand website and product catalogue for ENVO (electrical brand under Wellforces Ltd).
B2B lead generation — no ecommerce checkout. No Shopify.

## Your role

You are the **frontend developer**. You build the Next.js scaffold, layout components, and page shells.
Alan owns the database and backend. Wei owns content and CMS authoring.

---

## Your Stage 2 tasks

### Phase 2a — Scaffold (start immediately, no design spec needed)

```txt
1. Next.js 15 App Router + TypeScript scaffold
2. Tailwind CSS v4 setup — CSS-first @theme block in globals.css (see rules below)
3. shadcn/ui setup — New York style, Slate base colour
4. Payload CMS 3 install — pointing at process.env.DATABASE_URL
5. docker-compose.yml is already in the repo — do not modify it
6. Folder structure:
     src/
       app/
       components/
       lib/
       payload/
     scripts/
     public/
     design-spec/      (design reference only — see rules below)
7. Config files: README.md, .env.example (already exists), .prettierrc, drizzle.config.ts
8. Layout components: Header, Footer, MainNav, MobileNav, Container
9. Placeholder homepage — must build and typecheck cleanly
```

### Phase 2b — Homepage port (wait for design spec)

```txt
Marketing will commit the curated design spec to /design-spec/ before this step.
Port the homepage from /design-spec/ — NOT from any mockup files directly.
Build and typecheck must still pass.
```

Do not implement in Stage 2:
```txt
Full site port
Forms or API calls
AI routes
Akeneo sync
R2 images
Shopify anything
```

---

## Stack

```txt
Framework:   Next.js 15 App Router + TypeScript
Styling:     Tailwind CSS v4 — CSS-first config (globals.css @theme)
UI:          shadcn/ui (New York, Slate)
CMS:         Payload CMS 3
Database:    PostgreSQL via process.env.DATABASE_URL
```

---

## Rules — read these carefully

### Tailwind v4 only

Use Tailwind CSS v4 with CSS-first configuration.

```css
/* globals.css — correct */
@import "tailwindcss";

@theme {
  --color-brand: #your-colour;
  --font-sans: "Inter", sans-serif;
}
```

Do NOT write a `tailwind.config.js` with a `theme.extend` block — that is v3 syntax.

### Database

Always use `process.env.DATABASE_URL`. Never hardcode a hostname or password.

Local dev setup:
```bash
docker compose up -d   # starts Postgres on localhost:5432
cp .env.example .env.local
# DATABASE_URL is already pre-filled in .env.example for local Docker
```

### /design-spec/ is reference only

```txt
DO:   open files in /design-spec/, read layout intent, match visual design
DO:   rebuild as clean React components in src/components/
DON'T: import anything from /design-spec/
DON'T: copy files from /design-spec/ into src/
DON'T: treat /design-spec/ as production code
```

### No legacy files

If a `legacy/` folder exists, it is read-only reference. Never import from it.

### Branch workflow

```txt
main   — protected, production-ready only
dev    — integration branch, all PRs merge here first

Your flow:
  git checkout dev
  git checkout -b feature/nextjs-scaffold
  ... do work ...
  open PR against dev (not main)
```

---

## How to get set up

```bash
# 1. Clone the repo
git clone https://github.com/AlanWellforces/envo-website.git
cd envo-website

# 2. Copy env template
cp .env.example .env.local

# 3. Start local Postgres
docker compose up -d

# 4. Install dependencies (once Next.js scaffold exists)
npm install

# 5. Run dev server
npm run dev
```

---

## Three-source rule (important context)

The project follows a strict rule about where data lives:

```txt
Akeneo PIM   →  all product data (SKU, specs, images, datasheets)
Payload CMS  →  all editorial content (copy, navigation, FAQs)
Git          →  all code, components, logic, AI prompts
```

As the frontend developer: your components fetch product data via accessors Alan builds
(`src/lib/products.ts`), and editorial content via Payload's local API.
Never hardcode product names, prices, or specs as strings in components.

---

## Key contacts

- **Alan** — backend questions, database issues, Akeneo, API routes
- **Wei** — content questions, design intent, copy wording
- **Full plan** — see `ENVO-Website-V2-Execution-Plan.md` in this repo
