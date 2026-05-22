# Sidebar IA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the sidebar IA decisions from the spec — Blog gets a nav entry, Contact engineering is removed from Tools, footer News (disabled) becomes a live Blog link.

**Architecture:** Three small edits across two files. Pure presentation/structural change; no new routes, no new data fetching. The just-shipped Blog routes (`/blog`, `/blog/[slug]`, `/blog/category/[c]`, `/blog/tag/[t]`) handle all linking targets.

**Tech Stack:** Next.js 16 App Router, Tailwind v4, existing sidebar `NavItem` type and `renderItems()` renderer.

---

## Source-of-truth references

- Spec: `docs/superpowers/specs/2026-05-22-sidebar-ia-design.md`
- Files to modify:
  - `src/components/layout/sidebar.tsx` — `NAVIGATE` and `TOOLS` arrays
  - `src/components/layout/footer.tsx` — line 54, Company column

The existing `NavItem` type, `isActive(pathname, href)` helper, and
`renderItems(items)` renderer all work without modification — they handle
any new item that conforms to the `NavItem` shape.

**TopSubnav check (pre-confirmed):** `src/components/layout/top-subnav.tsx`
gates its rendering on `pathname.startsWith('/products')`, so adding the
new `blog` section to `NAVIGATE` requires no TopSubnav config change.
The spec's "Risks / open questions" note about TopSubnav is therefore
already resolved — no action needed.

---

## Task 1: Add Blog to NAVIGATE

**Files:**
- Modify: `src/components/layout/sidebar.tsx`

Insert a `Blog` entry between `Projects` and `Support` in the `NAVIGATE`
array. The existing `isActive()` matcher already handles `/blog/*`
sub-paths via `pathname.startsWith(href + '/')`, so the new item will
correctly highlight on detail and category pages.

- [ ] **Step 1: Read the file to locate the Projects → Support boundary**

```bash
grep -n "section: 'projects'\|section: 'support'" src/components/layout/sidebar.tsx
```

Expected: two matches, the `Projects` block ending just before the
`Support` block begins.

- [ ] **Step 2: Insert the Blog entry**

In `src/components/layout/sidebar.tsx`, find the `Projects` entry's
closing `},` and insert this new block immediately after it (before
`Support`):

```tsx
  {
    section: 'blog',
    href: '/blog',
    label: 'Blog',
    icon: (
      <svg className="sidebar-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 19V5a2 2 0 0 1 2-2h11l3 3v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </svg>
    ),
  },
```

- [ ] **Step 3: Verify the order**

```bash
grep -E "^    section: '" src/components/layout/sidebar.tsx | head -8
```

Expected (in this order):

```
    section: 'home',
    section: 'products',
    section: 'solutions',
    section: 'projects',
    section: 'blog',
    section: 'support',
    section: 'find-your-match',
    section: 'free-layout-design',
```

- [ ] **Step 4: Typecheck the file**

```bash
npm run typecheck 2>&1 | grep sidebar.tsx
```

Expected: no output (no new errors in sidebar.tsx).

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/sidebar.tsx
git commit -m "feat(sidebar): add Blog to Navigate group

Inserted between Projects and Support per IA spec. Uses the existing
NavItem shape and renderItems pipeline; isActive() already matches
/blog/* sub-paths via startsWith."
```

---

## Task 2: Remove Contact engineering from TOOLS

**Files:**
- Modify: `src/components/layout/sidebar.tsx`

Drop the `Contact engineering` entry from `TOOLS`. Spec rationale: it's a
shortcut to `/contact`, already reachable via Support and the footer
"Contact Us" link.

Per the spec's "Risks" section, we first grep to make sure nothing
external references the entry by its `data-section="contact"` selector.

- [ ] **Step 1: Confirm no orphan references**

```bash
grep -rn 'data-section="contact"\|"Contact engineering"' src/ 2>&1 | head
```

Expected: only the two matches inside `sidebar.tsx` itself (the entry
we're about to delete). If anything else appears, stop and investigate
before continuing.

- [ ] **Step 2: Delete the Contact engineering block**

In `src/components/layout/sidebar.tsx`, remove the entire block (around
lines 128–138):

```tsx
  {
    section: 'contact',
    href: '/contact',
    label: 'Contact engineering',
    icon: (
      <svg className="sidebar-icon" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 6 9-6" />
      </svg>
    ),
  },
```

The existing array uses trailing commas — removing the entire 11-line
block (including its closing `},`) leaves the array properly formed.

- [ ] **Step 3: Verify TOOLS now has exactly 2 entries**

```bash
awk '/^const TOOLS:/,/^]/' src/components/layout/sidebar.tsx | grep -c "section: '"
```

Expected: `2`

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck 2>&1 | grep sidebar.tsx
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/sidebar.tsx
git commit -m "feat(sidebar): remove Contact engineering from Tools group

Redundant entry — /contact is reachable via Support hub and footer
Contact Us link. Removing it from Tools per IA spec; no functionality
lost."
```

---

## Task 3: Footer News (disabled) → Blog (live link)

**Files:**
- Modify: `src/components/layout/footer.tsx:54`

Replace the disabled `News` span in the Company column with a live `Blog`
link pointing at `/blog`.

- [ ] **Step 1: Locate the exact line**

```bash
grep -n 'aria-disabled="true">News' src/components/layout/footer.tsx
```

Expected: a single match at line 54.

- [ ] **Step 2: Replace the span with a Link**

In `src/components/layout/footer.tsx`, change:

```tsx
              <li><span aria-disabled="true">News</span></li>
```

to:

```tsx
              <li><Link href="/blog">Blog</Link></li>
```

`Link` is already imported at the top of `footer.tsx` (used by the
other footer items like "About ENVO").

- [ ] **Step 3: Verify the rendered footer Company column**

```bash
grep -A 6 'h5>Company</h5' src/components/layout/footer.tsx
```

Expected (post-edit):

```
              <h5>Company</h5>
              <ul>
                <li><Link href="/about">About ENVO</Link></li>
                <li><Link href="/blog">Blog</Link></li>
                <li><span aria-disabled="true">Careers</span></li>
              </ul>
```

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck 2>&1 | grep footer.tsx
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/footer.tsx
git commit -m "feat(footer): News (disabled) → Blog live link

Company column now has Blog pointing at /blog. News stays as a Blog
category (/blog/category/company_news) — not exposed as a separate
nav item per IA spec."
```

---

## Task 4: Smoke verification

**Files:** none modified.

Manual walk-through per the spec's "Verification" section. No automated
tests for this PR — UI smoke is the right validation tool for a
3-edit presentational change in a repo with no E2E framework.

- [ ] **Step 1: Restart dev (cold start to clear any cached chunks)**

```bash
kill "$(cat /tmp/envo-dev.pid)" 2>/dev/null; rm -rf .next
nohup npm run dev > /tmp/envo-dev.log 2>&1 & echo $! > /tmp/envo-dev.pid
until grep -q "Ready" /tmp/envo-dev.log; do sleep 2; done
echo "Dev ready"
```

- [ ] **Step 2: Verify the sidebar on / (home)**

Open `http://localhost:3000/` in browser. The sidebar Navigate group
should show, in order: Home, Products, Solutions, Projects, **Blog**,
Support. Tools group should show only Find your match + Free layout
design. Foot region row + status pill unchanged.

- [ ] **Step 3: Verify Blog active state**

Visit `http://localhost:3000/blog`. The Blog sidebar item should have
the active treatment (lime left bar + lighter colour). Visit
`http://localhost:3000/blog/category/guides` — Blog should still be
active (because `isActive` uses `startsWith`).

- [ ] **Step 4: Verify the removed Contact engineering**

Confirm Tools group on `/` shows only 2 items. Try `/contact` directly
in the URL — should still load via the route (we only removed the
sidebar entry, not the route).

- [ ] **Step 5: Verify the footer Company column**

Scroll to footer. Company column should show: About ENVO → **Blog** (live
link) → Careers (still disabled). Click `Blog` — should navigate to
`/blog`.

- [ ] **Step 6: Verify mobile drawer**

Resize browser narrow (or use mobile emulation). Open the hamburger
menu. Sidebar drawer should show the same Navigate + Tools structure
with the new item count.

- [ ] **Step 7: Verify nothing else regressed**

Click each Navigate item once to confirm routing still works:
- `/` (Home)
- `/products`
- `/solutions`
- `/projects`
- `/blog` (new)
- `/support`

Each should load without console errors.

---

## After tasks complete

1. Rebase `feature/sidebar-ia-2026-05-22` on `origin/dev` (should be
   clean — no overlap with anything else in flight).
2. Push `-u origin feature/sidebar-ia-2026-05-22`.
3. Open PR against `dev` with the spec + plan + the four feat commits
   listed in the body.
4. Squash-merge per the standard team workflow.

## Out-of-scope reminders

Do NOT in this PR:

- Touch `CaseStudies` (separate brainstorm + PR)
- Promote Resources to top-level nav
- Subdivide the footer Support column
- Rebuild mobile drawer
- Change Projects → Case Studies label (spec keeps "Projects")
- Add a sidebar `Soon` / disabled item for future Case Studies (the spec
  removed Case Studies from sidebar entirely — it's covered by `Projects`)
