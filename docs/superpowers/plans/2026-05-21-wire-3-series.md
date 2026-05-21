# Wire 3 product series to Payload — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade three `href: '#'` placeholder entries in `src/data/product-families.ts` (Linear Series, Screw Terminal, Zigbee & Smart) into live series detail pages that render product imagery from Payload/Akeneo.

**Architecture:** Pure data change to one Git file. The series detail page (`src/app/(frontend)/products/[slug]/[series]/page.tsx`) and `resolveProductImage` in `src/lib/products.ts` already handle the rendering — they discover new pages by reading `PRODUCT_FAMILIES` and calling `getProduct(defaultSku)` per variant. No code, no schema, no UI work.

**Tech Stack:** Next.js 16 App Router, Payload CMS 3 (local API via `getPayload`), TypeScript discriminated union on `SeriesLink`, existing `resolveProductImage` priority chain (Akeneo S3 → Payload upload → Git fallback).

**Spec:** `docs/superpowers/specs/2026-05-21-wire-3-series-design.md`

---

## File Structure

Modified files (1):

- **`src/data/product-families.ts`** — three placeholder objects upgraded from `{ href: '#' }` to `{ href, slug, seriesCode, subtitle, description, variants[] }` in the live branch of the `SeriesLink` discriminated union. Existing fields (`label`, `productName`, `shortDesc`, `image`) retained.

No files created. No files deleted. No code changes outside this single file.

---

## Preflight assumptions

- Dev server running at http://localhost:3000 (`cat /tmp/envo-dev.pid` returns a live PID; spawn via [[reference-dev-server-runtime]] if not).
- Current branch is `feature/wire-3-series-2026-05-21` with the design spec already committed.
- Database (Supabase dev) reachable; `/api/products` returns docs.

If any of these fail, fix before starting Task 1.

---

### Task 1: Upgrade `Linear Series` → live (`envo_sl_us`, 8 SKUs)

**Files:**
- Modify: `src/data/product-families.ts` (the `label: 'Linear Series'` entry inside the `led-drivers` family's `series` array)

- [ ] **Step 1: Apply the edit**

Use the Edit tool. The current placeholder entry is unique by `label: 'Linear Series'` plus its `shortDesc` — that combination only appears once in the file.

Replace this `old_string`:

```ts
      {
        label: 'Linear Series',
        productName: 'Linear Driver',
        shortDesc: 'Slim linear-form drivers for surface-mount and channel-letter installs.',
        image: '/assets/images/cat-drivers.png',
        href: '#',
      },
```

With this `new_string`:

```ts
      {
        label: 'Linear Series',
        productName: 'Linear Driver',
        shortDesc: 'Slim linear-form drivers for surface-mount and channel-letter installs.',
        image: '/assets/images/cat-drivers.png',
        href: '/products/led-drivers/linear-series',
        slug: 'linear-series',
        seriesCode: 'envo_sl_us',
        subtitle: 'Linear-form driver · LED Drivers',
        description:
          'Slim linear-form drivers for surface-mount and channel-letter installs.',
        variants: [
          { name: 'ENVO EV-SL-100-12 Linear Type LED Driver 100W 12V', defaultSku: 'EV-SL-100-12', specs: [] },
          { name: 'ENVO EV-SL-100-24 Linear Type LED Driver 100W 24V', defaultSku: 'EV-SL-100-24', specs: [] },
          { name: 'ENVO EV-SL-100-48 Linear Type LED Driver 100W 48V', defaultSku: 'EV-SL-100-48', specs: [] },
          { name: 'ENVO EV-SL-150-12 Linear Type LED Driver 150W 12V', defaultSku: 'EV-SL-150-12', specs: [] },
          { name: 'ENVO EV-SL-150-24 Linear Type LED Driver 150W 24V', defaultSku: 'EV-SL-150-24', specs: [] },
          { name: 'ENVO EV-SL-150-48 Linear Type LED Driver 150W 48V', defaultSku: 'EV-SL-150-48', specs: [] },
          { name: 'ENVO EV-SL-60-12US Linear Type LED Driver 60W 12V', defaultSku: 'EV-SL-60-12US', specs: [] },
          { name: 'ENVO EV-SL-60-24US Linear Type LED Driver 60W 24V', defaultSku: 'EV-SL-60-24US', specs: [] },
        ],
      },
```

- [ ] **Step 2: TypeScript check**

Run:

```bash
npm run typecheck
```

Expected: PASS (no errors). The `SeriesLink` discriminated union's live branch requires `slug` / `seriesCode` / `subtitle` / `description` — all four are present, so TS is happy. If TS errors, the most likely cause is a typo in a property name.

- [ ] **Step 3: Smoke probe the new page**

Run:

```bash
/usr/bin/curl -sS -m 30 "http://localhost:3000/products/led-drivers/linear-series" \
  | grep -oE 'wellforces-akeneo-pim[^"]+\.jpg' | sort -u | wc -l
```

Expected: at least **9** (1 hero + 8 variant cards). If 0, dev server might need a fresh request after the edit — try once more.

Also visually confirm in the browser if available: http://localhost:3000/products/led-drivers/linear-series should render a hero image + 8 product cards.

- [ ] **Step 4: Confirm family page row went live**

Run:

```bash
/usr/bin/curl -sS -m 30 "http://localhost:3000/products/led-drivers" \
  | grep -oE 'href="/products/led-drivers/linear-series"' | head -1
```

Expected: at least one match (the row in the compare table is now a link).

- [ ] **Step 5: Commit**

```bash
git add src/data/product-families.ts
git commit -m "$(cat <<'EOF'
feat(products): wire Linear Series to Payload (envo_sl_us, 8 SKUs)

Upgrades the Linear Series placeholder to a live series detail page.
Hero + 8 variant cards now pull images from Akeneo S3 via
resolveProductImage. No code changes — pure data flip.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Upgrade `Screw Terminal` → live (`envo_se_us`, 10 SKUs)

**Files:**
- Modify: `src/data/product-families.ts` (the `label: 'Screw Terminal'` entry inside the `led-drivers` family's `series` array)

- [ ] **Step 1: Apply the edit**

Replace this `old_string`:

```ts
      {
        label: 'Screw Terminal',
        productName: 'Screw-Terminal Driver',
        shortDesc: 'Panel-mount drivers with screw terminals for tidy in-cabinet wiring.',
        image: '/assets/images/cat-drivers.png',
        href: '#',
      },
```

With this `new_string`:

```ts
      {
        label: 'Screw Terminal',
        productName: 'Screw-Terminal Driver',
        shortDesc: 'Panel-mount drivers with screw terminals for tidy in-cabinet wiring.',
        image: '/assets/images/cat-drivers.png',
        href: '/products/led-drivers/screw-terminal',
        slug: 'screw-terminal',
        seriesCode: 'envo_se_us',
        subtitle: 'Panel-mount driver · LED Drivers',
        description:
          'Panel-mount drivers with screw terminals for tidy in-cabinet wiring.',
        variants: [
          { name: 'ENVO EV-SE-15-12US LED Driver 15W 12V', defaultSku: 'EV-SE-15-12US', specs: [] },
          { name: 'ENVO EV-SE-15-24US LED Driver 15W 24V', defaultSku: 'EV-SE-15-24US', specs: [] },
          { name: 'ENVO EV-SE-20-12US LED Driver 20W 12V', defaultSku: 'EV-SE-20-12US', specs: [] },
          { name: 'ENVO EV-SE-20-24US LED Driver 20W 24V', defaultSku: 'EV-SE-20-24US', specs: [] },
          { name: 'ENVO EV-SE-30-12US LED Driver 30W 12V', defaultSku: 'EV-SE-30-12US', specs: [] },
          { name: 'ENVO EV-SE-30-24US LED Driver 30W 24V', defaultSku: 'EV-SE-30-24US', specs: [] },
          { name: 'ENVO EV-SE-50-12US LED Driver 50W 12V', defaultSku: 'EV-SE-50-12US', specs: [] },
          { name: 'ENVO EV-SE-50-24US LED Driver 50W 24V', defaultSku: 'EV-SE-50-24US', specs: [] },
          { name: 'ENVO EV-SE-75-12US LED Driver 75W 12V', defaultSku: 'EV-SE-75-12US', specs: [] },
          { name: 'ENVO EV-SE-75-24US LED Driver 75W 24V', defaultSku: 'EV-SE-75-24US', specs: [] },
        ],
      },
```

- [ ] **Step 2: TypeScript check**

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 3: Smoke probe**

```bash
/usr/bin/curl -sS -m 30 "http://localhost:3000/products/led-drivers/screw-terminal" \
  | grep -oE 'wellforces-akeneo-pim[^"]+\.jpg' | sort -u | wc -l
```

Expected: at least **11** (1 hero + 10 variants).

- [ ] **Step 4: Confirm family page link**

```bash
/usr/bin/curl -sS -m 30 "http://localhost:3000/products/led-drivers" \
  | grep -oE 'href="/products/led-drivers/screw-terminal"' | head -1
```

Expected: at least one match.

- [ ] **Step 5: Commit**

```bash
git add src/data/product-families.ts
git commit -m "$(cat <<'EOF'
feat(products): wire Screw Terminal to Payload (envo_se_us, 10 SKUs)

Upgrades the Screw Terminal placeholder to a live series detail page.
Hero + 10 variant cards now pull images from Akeneo S3 via
resolveProductImage.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Upgrade `Zigbee & Smart` → live (`envo_zigbee`, 17 SKUs)

**Files:**
- Modify: `src/data/product-families.ts` (the `label: 'Zigbee & Smart'` entry inside the `control-gear` family's `series` array)

> **Note (from spec risk #2):** The placeholder `productName: 'Zigbee Gateway'` undersells the actual series content (17 SKUs include DALI controllers, gateways, and remotes). Plan keeps the placeholder verbatim — this is Wei's content fix, NOT a code fix.

- [ ] **Step 1: Apply the edit**

Replace this `old_string`:

```ts
      {
        label: 'Zigbee & Smart',
        productName: 'Zigbee Gateway',
        shortDesc: 'Connect ENVO drivers to Zigbee-based smart-home systems.',
        image: '/assets/images/cat-controllers.png',
        href: '#',
      },
```

With this `new_string`:

```ts
      {
        label: 'Zigbee & Smart',
        productName: 'Zigbee Gateway',
        shortDesc: 'Connect ENVO drivers to Zigbee-based smart-home systems.',
        image: '/assets/images/cat-controllers.png',
        href: '/products/control-gear/zigbee-smart',
        slug: 'zigbee-smart',
        seriesCode: 'envo_zigbee',
        subtitle: 'Zigbee gateway & controllers · Control Gear',
        description:
          'Connect ENVO drivers to Zigbee-based smart-home systems.',
        variants: [
          { name: 'ENVO PRO DALI2 DT8 LED Controller RGBWW 5 CH 12-36VDC', defaultSku: 'SR-2309PRO-5C', specs: [] },
          { name: 'ENVO ZigbBee Mini In Wall AC Phase Smart Dimmer', defaultSku: 'EV-ZB9041A-D', specs: [] },
          { name: 'ENVO ZigBee 2Gang In-wall Switch - On/Off Control', defaultSku: 'EV-ZB9101SAC-HPS2CH', specs: [] },
          { name: 'ENVO ZigBee 5 Channel Controller 12-48V 4-8A per Channel', defaultSku: 'EV-ZB9101EA-5C', specs: [] },
          { name: 'ENVO ZigBee AC Phase Dimmer', defaultSku: 'EV-ZB9101SAC-HP', specs: [] },
          { name: 'ENVO ZigBee Blinds Controller - On/Off and Level Control', defaultSku: 'EV-ZB9080A', specs: [] },
          { name: 'ENVO ZigBee Classic Remote 3-in-1 - 4 Zones', defaultSku: 'EV-ZB2803-G4-5C', specs: [] },
          { name: 'ENVO ZigBee Classic Remote Single Colour - 4 Zones', defaultSku: 'EV-ZB9001K12-DIM-Z4', specs: [] },
          { name: 'ENVO ZigBee Economic RGB+CCT Color Remote', defaultSku: 'EV-ZB2868K7-5C', specs: [] },
          { name: 'ENVO ZigBee Economic Single Color Remote', defaultSku: 'EV-ZB2868K7-DIM', specs: [] },
          { name: 'ENVO ZigBee Gateway Smart Hub', defaultSku: 'EV-ZBGW', specs: [] },
          { name: 'ENVO ZigBee In-wall Switch - On/Off Control, 16A', defaultSku: 'EV-ZB9101SAC-HPB', specs: [] },
          { name: 'ENVO ZigBee Self-powered Remote', defaultSku: 'EV-ZBP2801KS', specs: [] },
          { name: 'ENVO ZigBee Single Colour Mini Controller 12-36V 8A 1 Channel', defaultSku: 'EV-ZB9101CS', specs: [] },
          { name: 'ENVO ZigBee Super Thin 5 Channel Controller 12-24V 4A per Channel', defaultSku: 'EV-ZB1029-5C', specs: [] },
          { name: 'ENVO ZigBee to DALI + 0/1-10V 2-in-1 Conveter', defaultSku: 'EV-ZBDA-2421', specs: [] },
          { name: 'ENVO ZigBee US Standard Push Button Smart Dimmer', defaultSku: 'EV-ZB2835PAC(US)', specs: [] },
        ],
      },
```

Note: The product name "ENVO ZigbBee Mini..." (note the typo — `ZigbBee` not `ZigBee`) and "ENVO ZigBee to DALI + 0/1-10V 2-in-1 Conveter" (typo `Conveter` not `Converter`) are copied verbatim from the database. **Do not "fix" them in this PR** — those are Akeneo-side content issues; the website's product-families.ts must mirror what's in the PIM. Flag them to Alan/Wei separately.

- [ ] **Step 2: TypeScript check**

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 3: Smoke probe**

```bash
/usr/bin/curl -sS -m 30 "http://localhost:3000/products/control-gear/zigbee-smart" \
  | grep -oE 'wellforces-akeneo-pim[^"]+\.jpg' | sort -u | wc -l
```

Expected: at least **18** (1 hero + 17 variants). Some variants may share an image (e.g., the same product photo across SKU colour variants), so the dedup'd count could be lower than 18 but should not be lower than ~10. If lower than 10, check that Akeneo has images for these SKUs:

```bash
/usr/bin/curl -sS -m 30 "http://localhost:3000/api/products?where%5Bseries%5D%5Bequals%5D=envo_zigbee&limit=20&depth=0" \
  | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); for(const p of d.docs) console.log(p.sku, p.image_url_fallback?'OK':'MISSING')"
```

- [ ] **Step 4: Confirm family page link**

```bash
/usr/bin/curl -sS -m 30 "http://localhost:3000/products/control-gear" \
  | grep -oE 'href="/products/control-gear/zigbee-smart"' | head -1
```

Expected: at least one match.

- [ ] **Step 5: Commit**

```bash
git add src/data/product-families.ts
git commit -m "$(cat <<'EOF'
feat(products): wire Zigbee & Smart to Payload (envo_zigbee, 17 SKUs)

Upgrades the Zigbee & Smart placeholder to a live series detail page.
Hero + 17 variant cards now pull images from Akeneo S3.

Known content gap (deferred to Wei): the productName 'Zigbee Gateway'
under-describes the actual series content, which includes DALI
controllers, gateways, and remotes. See spec risk #2.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Full-codebase verification

**Files:** none modified. Pure verification.

- [ ] **Step 1: Run typecheck**

```bash
npm run typecheck
```

Expected: PASS. Should already pass after Tasks 1-3 individually but confirm cumulative state.

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: PASS (no new errors introduced). If pre-existing warnings exist, leave them — don't widen scope.

- [ ] **Step 3: All 3 series pages render with Akeneo URLs**

```bash
for path in led-drivers/linear-series led-drivers/screw-terminal control-gear/zigbee-smart; do
  n=$(/usr/bin/curl -sS -m 30 "http://localhost:3000/products/$path" | grep -oE 'wellforces-akeneo-pim[^"]+\.jpg' | sort -u | wc -l)
  echo "$path: $n unique Akeneo image URLs"
done
```

Expected output:
```
led-drivers/linear-series: 9+
led-drivers/screw-terminal: 11+
control-gear/zigbee-smart: 10+
```

Exact numbers may vary if some SKUs share photos. The hard floor is "at least 1 unique Akeneo URL per series". If any series shows 0, that's a regression.

- [ ] **Step 4: Static generation still works**

```bash
/usr/bin/curl -sS -m 30 "http://localhost:3000/products/led-signage-modules/eco-series" \
  | grep -oE 'wellforces-akeneo-pim[^"]+\.jpg' | sort -u | wc -l
```

Expected: ≥ 5 (eco-series unchanged, should still render its Akeneo URLs). Confirms we didn't break the existing live series.

- [ ] **Step 5: Build smoke test (optional but recommended)**

```bash
npm run build 2>&1 | tail -40
```

Expected: completes without TS or build errors. If `next build` already runs in this repo's CI, this catches anything `next dev` (with Turbopack) might have masked.

If build succeeds, no commit needed — verification only.

---

### Task 5: Push & open PR

**Files:** none modified. Branch operations.

> **⚠️ Confirmation gate:** This task pushes to the shared remote and opens a PR — both are visible to the team. Before executing, confirm with the user that the local verification (Task 4) looked good and they're ready to publish.

- [ ] **Step 1: Rebase on latest origin/dev**

```bash
git fetch origin
git rebase origin/dev
```

Per [[feedback-git-rebase-before-push]]. If conflicts arise in `product-families.ts` (someone else touched it), resolve manually — these 3 entries should not have conflicts since they're upgrades-in-place of placeholder entries.

- [ ] **Step 2: Push branch**

```bash
git push -u origin feature/wire-3-series-2026-05-21
```

(First push, so `-u`. If a subsequent push is needed after review feedback, use `git push --force-with-lease`.)

- [ ] **Step 3: Open PR against `dev`**

```bash
gh pr create --base dev --title "Wire 3 product series to Payload (drivers + zigbee)" --body "$(cat <<'EOF'
## Summary

Promotes three `href: '#'` placeholder series in `src/data/product-families.ts` to live `/products/[family]/[series]` detail pages, backed by Payload product data and Akeneo S3 imagery via the existing `resolveProductImage` chain.

- `led-drivers` / Linear Series → `envo_sl_us` (8 SKUs)
- `led-drivers` / Screw Terminal → `envo_se_us` (10 SKUs)
- `control-gear` / Zigbee & Smart → `envo_zigbee` (17 SKUs)

Total: 35 SKUs newly visible on the website.

Pure data change. No code, schema, or UI work. The series detail page (`[series]/page.tsx`) already supports everything via conditional rendering — sections without data (features, specifications, applications, FAQ, etc.) simply don't render. Wei can fill those in incrementally without code changes.

Spec: `docs/superpowers/specs/2026-05-21-wire-3-series-design.md`
Plan: `docs/superpowers/plans/2026-05-21-wire-3-series.md`

## Out of scope (deferred)

- `sc_envo` (77 SKUs) — needs grouping decision from Wei + Alan
- Editorial enrichment (features, specs, applications) — Wei
- Splitting / regrouping the `envo_zigbee` series, which mixes DALI controllers + gateways + remotes — Wei + Alan structural call

## Test plan

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] Visit `/products/led-drivers/linear-series` — hero + 8 variant cards render with `wellforces-akeneo-pim.s3.*` URLs
- [ ] Visit `/products/led-drivers/screw-terminal` — hero + 10 variant cards
- [ ] Visit `/products/control-gear/zigbee-smart` — hero + 17 variant cards
- [ ] Visit `/products/led-drivers` — Linear Series and Screw Terminal rows in compare table now clickable
- [ ] Visit `/products/control-gear` — Zigbee & Smart row now clickable
- [ ] Visit `/products/led-signage-modules/eco-series` — still works (no regression)
- [ ] `npm run build` completes without errors

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 4: Return the PR URL**

The `gh pr create` command prints the URL. Share it with the user.

---

## Self-review

After completing all tasks, run a final spot check:

- [ ] All 3 series have correct `seriesCode` (envo_sl_us / envo_se_us / envo_zigbee — not envo_se / envo_sl / etc.)
- [ ] All 3 series have URL-safe `slug` (kebab-case, no underscores in URLs)
- [ ] All 3 series have `subtitle` and `description` — the spec calls for both, both render in different places
- [ ] No series got `compareSpec` added (the placeholders didn't have it; we didn't add it to keep family-table layout consistent)
- [ ] No series got a `badge: 'Most popular'` variant (Hero falls through to first variant per spec)
- [ ] Akeneo product-name typos (`ZigbBee`, `Conveter`) preserved verbatim — don't fix here

## Definition of done

- 3 commits on `feature/wire-3-series-2026-05-21`, one per series, plus the spec commit already there
- PR open against `dev` with passing typecheck/lint/build
- All 4 verification curls return their expected URL counts
- No regression on eco-series
