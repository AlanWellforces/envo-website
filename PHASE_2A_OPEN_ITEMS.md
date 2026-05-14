# Phase 2a — open items and questions for Alan

Status of Phase 2a scaffold (built locally, not pushed) and what still needs
Alan's input before opening the PR.

Branch: `feature/nextjs-scaffold` (local only, branched from `main`).

---

## A. What's done

- Next.js 16.2.6 App Router + TypeScript scaffold
- Tailwind CSS v4 (CSS-first `@theme` in `globals.css`)
- shadcn/ui installed (defaults preset — base color is neutral, not Slate)
- Layout components: `Container`, `Header`, `Footer`, `MainNav`, `MobileNav` (all under `src/components/layout/`)
- Placeholder homepage at `src/app/page.tsx`
- `tsconfig.json` excludes `drafts/` and `design-spec/`
- `.gitignore` extended with `tsconfig.tsbuildinfo`
- Build, typecheck, lint, and `npm run dev` all pass

---

## B. What's not done

### Alan's message explicitly listed these

| Item | Status | Notes |
|---|---|---|
| Payload CMS install | Not done | Deferred — chose "scaffold three-piece first" to reduce risk. Needs to be a separate follow-up commit. |
| Open PR against `dev` | Not done | Holding until branch convention is confirmed (see Q1 below). |

### MACKENZIE.md lists these, Alan's message omitted them

| Item | Recommendation |
|---|---|
| `src/payload/` folder | Create when Payload install happens. Empty folder now adds no value. |
| `scripts/` folder | Leave for Alan (his Akeneo sync work). |
| `design-spec/` folder | Create when c-version snapshot is pushed in. Empty now is misleading. |
| `.prettierrc` | Add — 30 seconds. Worth doing before PR. |
| `drizzle.config.ts` | Leave for Alan (his Stage 3 work on `feature/drizzle-product-schema`). |

---

## C. Questions for Alan (in priority order)

### Q1 (high) — Branch workflow

`dev` is 9 commits behind `main`. Alan has been committing his Stage 1 cleanup,
Wei brief, Akeneo doc, and Stage 3 drafts directly to `main`. Wei opened PR #1
against `dev` per MACKENZIE.md and hit the same divergence.

Options:
- (a) Sync `dev` with `main` now, keep "PR to dev" as the convention.
- (b) Update MACKENZIE.md + the V2 plan to "PR to main" and drop `dev`.

Either is fine for me — just need it consistent before I push the scaffold PR.

### Q2 (high) — Next.js 15 vs 16

`create-next-app@latest` ships Next.js 16. The project docs say Next.js 15.
Detailed comparison in `NEXT_15_VS_16.md`. Recommendation: keep 16, update docs
to match (3–4 occurrences across CLAUDE.md / MACKENZIE.md / V2 plan).

### Q3 (medium) — Is the c-version the final design?

The V2 plan currently assumes c-version is an early mockup and a "curated design
spec" will be produced before Phase 2b. In practice the c-version may end up
being the final design, with no separate curated spec coming.

This changes:
- Phase 2b workload (port for visual reference vs. pixel-perfect 1:1 rewrite)
- Semantics of the `design-spec/` folder (reference vs. spec-of-record)
- Who owns visual decisions during Phase 2b

Needs clarification before Phase 2b kicks off; not blocking for Phase 2a.

### Q4 (medium) — Payload CMS install approach

Payload 3 + Next 16 + Drizzle has a few adapter choices. Before I install:
- Adapter: `@payloadcms/db-postgres` or `@payloadcms/db-drizzle`?
- Collection file location: `src/payload/collections/*.collection.ts` or somewhere else?
- Should the existing `drafts/Media.collection.ts` and `drafts/Products.collection.ts` move into `src/payload/` as part of this install, or stay drafts until Alan reviews them?

### Q5 (low) — shadcn base color

`shadcn@latest init --defaults` no longer accepts `--base-color`. Got neutral
base instead of Slate. Tokens are editable in `globals.css`. Phase 2b will swap
in the ENVO brand palette anyway, so this is cosmetic.

### Q6 (low) — shadcn extras

shadcn's `--defaults` preset added two imports we didn't explicitly request:

```css
@import "tw-animate-css";
@import "shadcn/tailwind.css";
```

Plus `@custom-variant dark` and the full theme token block. Not in
MACKENZIE.md's "use Tailwind v4 CSS-first @theme" spec but is what shadcn ships
out of the box now. Functional, just heads-up.

---

## D. Suggested message to Alan

A single message bundling Q1–Q3 is enough to unblock the PR:

> Hey Alan — scaffold is built locally on `feature/nextjs-scaffold` (Next 16 +
> Tailwind v4 + shadcn). Build / typecheck / dev server all green. Three things
> before I push:
>
> 1. Branch: `dev` is 9 commits behind `main` (Wei's PR #1 hits same issue).
>    Want me to PR to `dev` (after you sync) or to `main` (and we update the
>    workflow docs)?
>
> 2. Next.js version: `create-next-app@latest` gave me 16, docs say 15. I'd keep
>    16 and update the docs — agreed?
>
> 3. The c-version on marketing-cyber may end up being the final design, not
>    just a mockup to port from. If so, Phase 2b becomes a 1:1 rewrite, no
>    separate curated spec. Want to flag now or leave for Phase 2b kickoff?
>
> Payload install is deferred to a follow-up commit. Happy to push as soon as
> Q1 + Q2 are settled.
