# ENVO Website — Wei's Brief

## What this project is

Brand website and product catalogue for ENVO (electrical brand under Wellforces Ltd).
B2B lead generation — no ecommerce checkout. No Shopify.

## Your role

You are the **content strategist and CMS author**. You own all editorial content,
the customer journey, and AI prompt direction.
Alan owns the database and backend. Mackenzie owns the frontend components.

---

## Your Stage 2 tasks (run in parallel with Mackenzie's scaffold)

```txt
1. Draft the Find Your Match question tree
     What questions does the tool ask?
     What answers lead to which product types?

2. Draft application page structure
     Suggested first page: Signage
     What sections does each application page need?
     What products appear on each page?

3. Draft homepage copy
     Hero headline + subheading
     CTA wording
     Section copy

4. Draft navigation labels
     Final wording for all nav items

5. Draft AI content (for Payload later)
     Find Your Match fallback message (when no match found)
     Find Your Match intro text
     Tone guidance (how should the AI sound?)
     CTA copy on recommendations

6. Pair with Alan on Payload collection field design
     What fields does each collection need?
     Flag any missing fields back to Alan

7. Co-write the Akeneo / Payload grey-area guide with Alan
     You contribute: real authoring scenarios you expect to encounter
     Alan contributes: technical placement reasoning
     Goes into CLAUDE.md once agreed
```

---

## Your Stage 3 tasks (once Alan sets up Payload CMS)

```txt
1. Log into Payload admin — Alan will give you the URL and credentials
2. Enter homepage hero copy (real, not placeholder)
3. Enter navigation labels (final wording)
4. Create first application page: Signage
5. Create one case study (even rough draft)
6. Enter 5-10 FAQs
7. Enter AI fallback copy, tone settings, CTA copy
8. Flag any missing fields or broken layouts back to Alan/Mackenzie
```

---

## Three-source rule — what you own

```txt
Akeneo PIM   →  product data (NOT yours — Alan syncs this)
Payload CMS  →  editorial content (THIS IS YOURS)
Git          →  code and logic (NOT yours — Alan and Mackenzie own this)
```

**You author in Payload CMS. You do not edit code files.**

### What lives in Payload (your content)

```txt
Homepage copy and hero sections
Navigation labels
Application pages (Signage, Cabinetry, Residential, ...)
Solution pages and Industries
Case studies and Projects
FAQs
Blog / news posts
CTA copy
SEO fields (page titles, meta descriptions)
Resources / Downloads page copy
AI supporting copy:
  - Find Your Match intro text
  - CTA wording on recommendations
  - Fallback message (no match found)
  - Tone setting
  - Feature enabled/disabled flag
  - AI prompt draft field (see below)
```

### What does NOT live in Payload (do not try to add these)

```txt
Product SKUs, specs, images, datasheets  →  Akeneo owns these
Core AI recommendation logic             →  Git owns this
Page templates and components            →  Mackenzie owns these
```

---

## AI prompt workflow

The core "Find Your Match" AI prompt lives in Git (code), not Payload.
But you own the prompt direction and iterate on it.

Your workflow:
```txt
1. Payload has an "AI Prompts" section with a draft text field
2. Write and iterate your prompt drafts there
3. When a draft is ready, ping Alan
4. Alan reviews it, copies it into the Git source file, and opens a PR
5. After the PR merges, the live site uses your new prompt
```

You do not need to use git or write code for this.

---

## Content to prepare before Stage 3

These drafts can be in Google Docs, Notion, or anywhere — they just need to exist
before Alan opens the Payload admin for you.

```txt
Priority 1 (needed at Stage 3 start):
  Homepage hero copy
  Navigation labels

Priority 2 (first week of Stage 3):
  One full application page — Signage recommended
  5-10 FAQs
  AI fallback text and tone guidance

Priority 3 (Stage 3 ongoing):
  One case study
  More application pages
  CTA copy variations
```

---

## Git workflow

You do use git — for PRs and doc contributions. Follow this flow:

```bash
# Start work
git fetch origin
git checkout dev
git pull origin dev
git checkout -b feature/your-branch-name

# After making changes
git add .
git commit -m "your message"
git push origin feature/your-branch-name

# Then open a PR against dev (not main) on GitHub
```

**Always PR into `dev`, not `main`.** Main is production — nothing goes there directly.

---

## Key contacts

- **Alan** — Payload CMS setup, missing fields, technical questions
- **Mackenzie** — frontend layout questions, component behaviour
- **Full plan** — see `ENVO-Website-V2-Execution-Plan.md` in this repo
