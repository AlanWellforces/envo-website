# Next.js 15 vs 16 — decision note for ENVO V2

Scaffold (Phase 2a) was generated with `create-next-app@latest`, which currently
ships **Next.js 16.2.6**. The project docs (CLAUDE.md, MACKENZIE.md, the V2
execution plan) all say "Next.js 15". This note exists to compare the two so we
can decide whether to keep 16 or downgrade to 15, and to update docs accordingly.

Not meant to be merged into the repo permanently — delete or move once Alan
signs off on a version.

---

## Key differences

| Area | Next 15 | Next 16 |
|---|---|---|
| Default bundler | Turbopack in dev (stable); webpack in prod | Turbopack in **dev + prod** by default; `--webpack` flag to opt out |
| React Compiler | Experimental, opt-in via `next.config.ts` | **Default on**; auto-memoization reduces need for `useMemo` / `useCallback` |
| Cache Components / PPR | Experimental (`experimental.ppr`) | Stable API; config semantics changed slightly |
| Async params / searchParams in dynamic routes | Warning only — sync access still works | **Hard requirement** — `params` is a `Promise`, must `await` |
| Minimum Node.js | 18+ | **20+** (we are on 24.13.0, no issue) |
| React version | 19 canonical | 19.x (patch updates) |
| `<Image>` component | Standard | Smarter placeholder + lazy-load defaults |
| Removed APIs | Some deprecated still present | `next/router` in app-router context removed; a few old caching flags removed |

---

## Impact on ENVO V2 by stage

| Stage | Difference in practice |
|---|---|
| Phase 2a (current scaffold) | None. Header / Footer / static `page.tsx` identical across versions. |
| Phase 2b (homepage port from c-version) | None. Static / RSC content only. |
| Stage 3 (product detail dynamic routes `[slug]`) | Matters. Must write `async function Page({ params }: { params: Promise<{ slug: string }> })` and `await params` — Next 15 still accepts sync access; Next 16 errors. |
| Stage 4 (API routes, Find Your Match, enquiry form) | Minor. Caching defaults more aggressive; Route Handlers default to uncached. Worth re-reading the caching section of Next 16 release notes before writing route handlers. |

---

## Recommendation: keep Next 16

Reasons:

1. `create-next-app@latest` ships 16 by default — downgrading to 15 means manual
   pinning that future devs will undo without thinking.
2. Mackenzie would have to upgrade to 16 within ~6 months anyway. Doing it
   greenfield now is cheaper than migrating later.
3. Turbopack default + React Compiler default — performance wins from day one,
   no flags to remember.
4. Next 16 is stable as of 2026-Q1, multiple patch releases out.
5. No business code written yet, so version-specific quirks have nothing to
   break.

Cost: update 3–4 occurrences of "Next.js 15" in:

- `CLAUDE.md` — Stack section
- `MACKENZIE.md` — Stack section + intro
- `ENVO-Website-V2-Execution-Plan.md` — section 1 "Keep the core stack"
- (any other doc mentioning Next.js by version)

---

## Recommendation: stay on Next 15 (only if)

- Alan has already written code (Payload route handlers / API routes) that
  depends on Next 15 caching semantics. Checked `drafts/` — only Payload
  collection configs (`Media.collection.ts`, `Products.collection.ts`), nothing
  Next-version-specific. So no blocker here.
- There is some compliance / vendor reason to lock to 15.x for now.

If neither applies, downgrade has no upside.

---

## If we go with 15: how to downgrade

```bash
cd ~/Desktop/envo-website-v2
npm install next@15 eslint-config-next@15
# Verify no 16-only flags in next.config.ts (currently none — config is empty)
npm run build
```

The current `next.config.ts` is empty so nothing to migrate. Layout / page code
already written is compatible with both versions.

---

## Status

- Scaffold uses Next 16.2.6.
- Build + typecheck + dev server all green.
- Awaiting decision before pushing PR.
