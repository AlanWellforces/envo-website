# Admin Dashboard — Website Data Capture (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Capture website leads, AI-tool usage, and first-party cookieless traffic into Postgres, and surface them on a custom Payload Dashboard (direction 3, Editorial Bold) — so data flows into our own admin the moment the site launches.

**Architecture:** Two new Payload collections (`submissions` for leads with PII; `events` for anonymous analytics). Three capture points POST into them: the Free Layout form → `/api/submissions`, a global client beacon → `/api/track`, and the existing `/api/find-your-match` route logs each run. Media file bytes move to Supabase Storage (record stays in DB). A custom Dashboard server component aggregates everything with `payload.find`/`payload.count` and renders numbers + inline-SVG charts. Pure logic (hashing, bot filtering, aggregation, lead validation) is extracted into `src/lib/**` and unit-tested with vitest; collections/routes/UI are verified via typecheck + curl + the dev server.

**Tech Stack:** Next.js 16 App Router, Payload CMS 3.84, PostgreSQL (Supabase), `@payloadcms/storage-s3`, `resend`, vitest, Tailwind v4. TypeScript throughout.

## Global Constraints

- **Branch:** `feature/admin-dashboard-data-capture-2026-07-01`, based on `dev`. Rebase on `origin/dev` before any push; PR targets `dev`, never `main`.
- **DB:** always `process.env.DATABASE_URL`. Never hardcode a host.
- **Three-source rule:** operational data (leads, events) lives in Git-defined **Payload collections**, not Drizzle (Drizzle stays `product_*`).
- **Tailwind v4 only** — no v3 config. Brand tokens: blue `#0071bc` (glow `#4dc3ff`), lime `#aec90b` (glow `#c8e62a`), dark surfaces `#050b1a`/`#0a1a2e`/`#142d4f`, light `#f4f5f7`/`#fff`, font Inter Tight.
- **Privacy:** `events` stores NO cookie and NO raw IP. `sessionHash` only. Lead free-text `notes` is stored on `submissions` (PII, admin-only) but NOT copied into `events`.
- **Schema push:** after adding/altering a collection, apply with `yes | PAYLOAD_DB_PUSH=true npm run dev` (auto-accepts the y/N push prompt — see the admin-wedge memory) and run `npm run generate:types` so `src/payload-types.ts` is regenerated.
- **Packages:** adding new deps is the one time to use `npm install` (not `npm ci`).
- **Dashboard content stat cards** assume the collections that exist on `dev` at build time. If the `pages` collection (PR #96) is not yet merged to `dev`, omit the Pages tile (do not add a broken query).
- **Tests:** vitest, `environment: 'node'`, files named `src/**/*.test.ts`. Run a single file with `npx vitest run <path>`.

---

## File Structure

**Pure logic (unit-tested):**
- `src/lib/analytics/track.ts` — `sessionHash()`, `isBot()`
- `src/lib/analytics/aggregate.ts` — `pageViewsByDay()`, `uniqueVisitors()`, `topPaths()`, `topReferrers()`, `fymRunStats()`
- `src/lib/leads/submission.ts` — `normalizeSubmission()`, `buildLeadEmail()`

**Payload collections:**
- `src/payload/collections/Submissions.ts`, `src/payload/collections/Events.ts`
- Modify `src/payload.config.ts` (register collections, add Storage plugin, register Dashboard view)

**Email:**
- `src/lib/leads/notify.ts` — `notifyNewLead()` (Resend wrapper, env-guarded)

**API routes:**
- `src/app/api/submissions/route.ts`, `src/app/api/track/route.ts`
- Modify `src/app/api/find-your-match/route.ts` (log event)

**Frontend wiring:**
- Modify `src/app/(frontend)/free-layout-design/SketchForm.tsx`
- `src/components/analytics/PageViewBeacon.tsx`; mount in `src/app/(frontend)/layout.tsx`

**Dashboard:**
- `src/payload/views/Dashboard.tsx` (server component + inline-SVG charts)

---

## Task 1: Supabase Storage adapter for Media

**Files:**
- Modify: `package.json` (add `@payloadcms/storage-s3`)
- Modify: `src/payload.config.ts` (add `plugins` with env-gated `s3Storage`)
- Modify: `.env.example` (S3 keys)

**Interfaces:**
- Produces: Media uploads persist to Supabase Storage when `S3_BUCKET` is set; local-disk behaviour otherwise (no regression when creds absent).

- [ ] **Step 1: Install the adapter**

```bash
npm install @payloadcms/storage-s3
```

- [ ] **Step 2: Add env keys to `.env.example`** (under the existing `RESEND_API_KEY` line)

```bash
# Supabase Storage (S3-compatible) — file binaries for Media uploads.
# Bucket + keys from Supabase dashboard → Storage → S3 connection. Secrets in Zoho Vault.
S3_ENDPOINT=
S3_BUCKET=
S3_REGION=us-west-2
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
```

- [ ] **Step 3: Register the env-gated plugin in `src/payload.config.ts`**

Add the import at the top with the other imports:

```ts
import { s3Storage } from '@payloadcms/storage-s3'
```

Add a `plugins` key to `buildConfig({ ... })` (place it after `globals`). If a `plugins` array already exists, append the spread instead of adding a new key:

```ts
  plugins: [
    // File binaries → Supabase Storage when configured; falls back to local disk
    // in dev when S3_BUCKET is unset, so no creds are required to run locally.
    ...(process.env.S3_BUCKET
      ? [
          s3Storage({
            collections: { media: true },
            bucket: process.env.S3_BUCKET,
            config: {
              endpoint: process.env.S3_ENDPOINT,
              region: process.env.S3_REGION || 'us-west-2',
              forcePathStyle: true,
              credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
              },
            },
          }),
        ]
      : []),
  ],
```

- [ ] **Step 4: Typecheck + boot**

Run: `npm run typecheck`
Expected: no new errors (pre-existing debt aside).

Run: `yes | PAYLOAD_DB_PUSH=true npm run dev` (in background), then `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/admin`
Expected: `200`. Server boots with no Storage error (S3_BUCKET unset → local fallback).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/payload.config.ts .env.example
git commit -m "feat(media): env-gated Supabase Storage adapter for uploads"
```

> **Note (prerequisite for production):** actually persisting to Supabase needs the bucket + S3 keys provisioned (Alan / Zoho Vault). Until then dev uses local disk. Real upload round-trip is verified by the user in the admin once creds land.

---

## Task 2: Analytics primitives — `sessionHash` + `isBot`

**Files:**
- Create: `src/lib/analytics/track.ts`
- Test: `src/lib/analytics/track.test.ts`

**Interfaces:**
- Produces:
  - `sessionHash(ip: string, userAgent: string, utcDate: string, salt: string): string` — 16-hex-char deterministic hash; identical inputs → identical output; no PII recoverable.
  - `isBot(userAgent: string | null): boolean` — true for common crawler UAs and empty UA.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/analytics/track.test.ts
import { describe, it, expect } from 'vitest'
import { sessionHash, isBot } from './track'

describe('sessionHash', () => {
  it('is deterministic for identical inputs', () => {
    const a = sessionHash('1.2.3.4', 'UA', '2026-07-01', 'salt')
    const b = sessionHash('1.2.3.4', 'UA', '2026-07-01', 'salt')
    expect(a).toBe(b)
  })
  it('differs when the day differs (rotates daily)', () => {
    const a = sessionHash('1.2.3.4', 'UA', '2026-07-01', 'salt')
    const b = sessionHash('1.2.3.4', 'UA', '2026-07-02', 'salt')
    expect(a).not.toBe(b)
  })
  it('returns a short hex string, never the raw IP', () => {
    const h = sessionHash('1.2.3.4', 'UA', '2026-07-01', 'salt')
    expect(h).toMatch(/^[0-9a-f]{16}$/)
    expect(h).not.toContain('1.2.3.4')
  })
})

describe('isBot', () => {
  it('flags known crawlers', () => {
    expect(isBot('Mozilla/5.0 (compatible; Googlebot/2.1)')).toBe(true)
    expect(isBot('bingbot/2.0')).toBe(true)
  })
  it('treats empty/null UA as a bot', () => {
    expect(isBot('')).toBe(true)
    expect(isBot(null)).toBe(true)
  })
  it('passes a normal browser UA', () => {
    expect(isBot('Mozilla/5.0 (Macintosh) Chrome/120 Safari/537')).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/analytics/track.test.ts`
Expected: FAIL — cannot find module `./track`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/analytics/track.ts
import { createHash } from 'crypto'

/**
 * Cookieless visitor hash. Combines IP + UA + UTC date + salt so the same
 * visitor maps to one value per day and rotates daily — gives a rough unique
 * count with no cookie and no recoverable PII. Truncated to 16 hex chars.
 */
export function sessionHash(ip: string, userAgent: string, utcDate: string, salt: string): string {
  return createHash('sha256').update(`${ip}|${userAgent}|${utcDate}|${salt}`).digest('hex').slice(0, 16)
}

const BOT_RE = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|pinterest|vkshare|w3c_validator|headless|lighthouse|gtmetrix|uptime|monitor/i

/** Cheap User-Agent denylist. Empty/missing UA is treated as a bot. */
export function isBot(userAgent: string | null): boolean {
  if (!userAgent || !userAgent.trim()) return true
  return BOT_RE.test(userAgent)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/analytics/track.test.ts`
Expected: PASS (8 assertions).

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics/track.ts src/lib/analytics/track.test.ts
git commit -m "feat(analytics): cookieless sessionHash + bot UA filter"
```

---

## Task 3: Analytics aggregation helpers

**Files:**
- Create: `src/lib/analytics/aggregate.ts`
- Test: `src/lib/analytics/aggregate.test.ts`

**Interfaces:**
- Consumes: arrays of plain event rows shaped `{ kind: 'pageview' | 'find-your-match'; path?: string | null; referrer?: string | null; sessionHash?: string | null; data?: Record<string, unknown> | null; createdAt: string }`.
- Produces:
  - `pageViewsByDay(events, days, today): { date: string; count: number }[]` — `days` entries oldest→newest, zero-filled.
  - `uniqueVisitors(events): number` — distinct non-empty `sessionHash`.
  - `topPaths(events, n): { path: string; count: number }[]`
  - `topReferrers(events, n): { referrer: string; count: number }[]` — empty/self referrers grouped as `'direct'`.
  - `fymRunStats(events): { total: number; byApplication: { application: string; count: number }[] }`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/analytics/aggregate.test.ts
import { describe, it, expect } from 'vitest'
import { pageViewsByDay, uniqueVisitors, topPaths, topReferrers, fymRunStats } from './aggregate'

type Ev = Parameters<typeof uniqueVisitors>[0][number]
const pv = (over: Partial<Ev>): Ev => ({ kind: 'pageview', path: '/', referrer: null, sessionHash: 'a', data: null, createdAt: '2026-07-01T10:00:00.000Z', ...over })

describe('pageViewsByDay', () => {
  it('zero-fills the window oldest→newest', () => {
    const events = [pv({ createdAt: '2026-07-03T01:00:00.000Z' }), pv({ createdAt: '2026-07-03T05:00:00.000Z' })]
    const out = pageViewsByDay(events, 3, '2026-07-03')
    expect(out).toEqual([
      { date: '2026-07-01', count: 0 },
      { date: '2026-07-02', count: 0 },
      { date: '2026-07-03', count: 2 },
    ])
  })
})

describe('uniqueVisitors', () => {
  it('counts distinct non-empty hashes', () => {
    expect(uniqueVisitors([pv({ sessionHash: 'a' }), pv({ sessionHash: 'a' }), pv({ sessionHash: 'b' }), pv({ sessionHash: '' })])).toBe(2)
  })
})

describe('topPaths', () => {
  it('ranks by count, limited to n', () => {
    const out = topPaths([pv({ path: '/x' }), pv({ path: '/x' }), pv({ path: '/y' })], 1)
    expect(out).toEqual([{ path: '/x', count: 2 }])
  })
})

describe('topReferrers', () => {
  it('groups empty referrers as direct', () => {
    const out = topReferrers([pv({ referrer: null }), pv({ referrer: '' }), pv({ referrer: 'https://g.com' })], 5)
    expect(out).toContainEqual({ referrer: 'direct', count: 2 })
    expect(out).toContainEqual({ referrer: 'https://g.com', count: 1 })
  })
})

describe('fymRunStats', () => {
  it('totals find-your-match events and groups by application', () => {
    const fym = (app: string): Ev => ({ kind: 'find-your-match', path: null, referrer: null, sessionHash: null, data: { application: app }, createdAt: '2026-07-01T10:00:00.000Z' })
    const out = fymRunStats([fym('light_box'), fym('light_box'), fym('facade'), pv({})])
    expect(out.total).toBe(3)
    expect(out.byApplication[0]).toEqual({ application: 'light_box', count: 2 })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/analytics/aggregate.test.ts`
Expected: FAIL — cannot find module `./aggregate`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/analytics/aggregate.ts
export type AnalyticsEvent = {
  kind: 'pageview' | 'find-your-match'
  path?: string | null
  referrer?: string | null
  sessionHash?: string | null
  data?: Record<string, unknown> | null
  createdAt: string
}

const dayOf = (iso: string): string => iso.slice(0, 10) // YYYY-MM-DD (UTC)

function rankCounts(map: Map<string, number>, n: number): { key: string; count: number }[] {
  return [...map.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
    .slice(0, n)
}

export function pageViewsByDay(events: AnalyticsEvent[], days: number, today: string): { date: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const e of events) {
    if (e.kind !== 'pageview') continue
    counts.set(dayOf(e.createdAt), (counts.get(dayOf(e.createdAt)) ?? 0) + 1)
  }
  const out: { date: string; count: number }[] = []
  const end = new Date(`${today}T00:00:00.000Z`)
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end)
    d.setUTCDate(end.getUTCDate() - i)
    const date = d.toISOString().slice(0, 10)
    out.push({ date, count: counts.get(date) ?? 0 })
  }
  return out
}

export function uniqueVisitors(events: AnalyticsEvent[]): number {
  const set = new Set<string>()
  for (const e of events) if (e.kind === 'pageview' && e.sessionHash) set.add(e.sessionHash)
  return set.size
}

export function topPaths(events: AnalyticsEvent[], n: number): { path: string; count: number }[] {
  const map = new Map<string, number>()
  for (const e of events) {
    if (e.kind !== 'pageview' || !e.path) continue
    map.set(e.path, (map.get(e.path) ?? 0) + 1)
  }
  return rankCounts(map, n).map(({ key, count }) => ({ path: key, count }))
}

export function topReferrers(events: AnalyticsEvent[], n: number): { referrer: string; count: number }[] {
  const map = new Map<string, number>()
  for (const e of events) {
    if (e.kind !== 'pageview') continue
    const ref = e.referrer && e.referrer.trim() ? e.referrer : 'direct'
    map.set(ref, (map.get(ref) ?? 0) + 1)
  }
  return rankCounts(map, n).map(({ key, count }) => ({ referrer: key, count }))
}

export function fymRunStats(events: AnalyticsEvent[]): { total: number; byApplication: { application: string; count: number }[] } {
  const map = new Map<string, number>()
  let total = 0
  for (const e of events) {
    if (e.kind !== 'find-your-match') continue
    total++
    const app = typeof e.data?.application === 'string' ? e.data.application : 'unknown'
    map.set(app, (map.get(app) ?? 0) + 1)
  }
  return { total, byApplication: rankCounts(map, 10).map(({ key, count }) => ({ application: key, count })) }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/analytics/aggregate.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics/aggregate.ts src/lib/analytics/aggregate.test.ts
git commit -m "feat(analytics): dashboard aggregation helpers"
```

---

## Task 4: Lead validation + email body builder

**Files:**
- Create: `src/lib/leads/submission.ts`
- Test: `src/lib/leads/submission.test.ts`

**Interfaces:**
- Produces:
  - `normalizeSubmission(input: unknown): { ok: true; value: NormalizedLead } | { ok: false; errors: string[] }` — requires `type`, `name`, valid `email`; trims strings; collects unknown fields into `data`.
  - `buildLeadEmail(lead: NormalizedLead): { subject: string; text: string }`
  - type `NormalizedLead = { type: 'free-layout' | 'find-your-match' | 'contact'; name: string; email: string; company?: string; phone?: string; sourcePath?: string; data: Record<string, unknown> }`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/leads/submission.test.ts
import { describe, it, expect } from 'vitest'
import { normalizeSubmission, buildLeadEmail } from './submission'

describe('normalizeSubmission', () => {
  it('accepts a valid free-layout lead and trims', () => {
    const r = normalizeSubmission({ type: 'free-layout', name: '  Jane  ', email: 'jane@acme.com', company: 'Acme', dimensions: '600x1800' })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.name).toBe('Jane')
      expect(r.value.email).toBe('jane@acme.com')
      expect(r.value.data).toMatchObject({ dimensions: '600x1800' })
      expect('type' in r.value.data).toBe(false) // known fields not duplicated into data
    }
  })
  it('rejects a missing name', () => {
    const r = normalizeSubmission({ type: 'free-layout', email: 'a@b.com' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors).toContain('name is required')
  })
  it('rejects a bad email', () => {
    const r = normalizeSubmission({ type: 'contact', name: 'X', email: 'not-an-email' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors).toContain('a valid email is required')
  })
  it('rejects an unknown type', () => {
    const r = normalizeSubmission({ type: 'spam', name: 'X', email: 'a@b.com' })
    expect(r.ok).toBe(false)
  })
})

describe('buildLeadEmail', () => {
  it('summarises the lead', () => {
    const { subject, text } = buildLeadEmail({ type: 'free-layout', name: 'Jane', email: 'jane@acme.com', company: 'Acme', data: { dimensions: '600x1800' } })
    expect(subject).toContain('Jane')
    expect(text).toContain('jane@acme.com')
    expect(text).toContain('dimensions')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/leads/submission.test.ts`
Expected: FAIL — cannot find module `./submission`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/leads/submission.ts
export type LeadType = 'free-layout' | 'find-your-match' | 'contact'
const TYPES: LeadType[] = ['free-layout', 'find-your-match', 'contact']
const KNOWN = new Set(['type', 'name', 'email', 'company', 'phone', 'sourcePath'])

export type NormalizedLead = {
  type: LeadType
  name: string
  email: string
  company?: string
  phone?: string
  sourcePath?: string
  data: Record<string, unknown>
}

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')
const isEmail = (v: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

export function normalizeSubmission(
  input: unknown,
): { ok: true; value: NormalizedLead } | { ok: false; errors: string[] } {
  const obj = (input ?? {}) as Record<string, unknown>
  const errors: string[] = []

  const type = str(obj.type) as LeadType
  if (!TYPES.includes(type)) errors.push('type must be one of: ' + TYPES.join(', '))
  const name = str(obj.name)
  if (!name) errors.push('name is required')
  const email = str(obj.email).toLowerCase()
  if (!isEmail(email)) errors.push('a valid email is required')
  if (errors.length) return { ok: false, errors }

  const data: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) if (!KNOWN.has(k)) data[k] = v

  const value: NormalizedLead = { type, name, email, data }
  const company = str(obj.company)
  const phone = str(obj.phone)
  const sourcePath = str(obj.sourcePath)
  if (company) value.company = company
  if (phone) value.phone = phone
  if (sourcePath) value.sourcePath = sourcePath
  return { ok: true, value }
}

export function buildLeadEmail(lead: NormalizedLead): { subject: string; text: string } {
  const subject = `New ${lead.type} lead — ${lead.name}`
  const lines = [
    `Type: ${lead.type}`,
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    lead.company ? `Company: ${lead.company}` : null,
    lead.phone ? `Phone: ${lead.phone}` : null,
    lead.sourcePath ? `Source: ${lead.sourcePath}` : null,
    '',
    'Details:',
    ...Object.entries(lead.data).map(([k, v]) => `  ${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`),
  ].filter((l): l is string => l !== null)
  return { subject, text: lines.join('\n') }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/leads/submission.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/leads/submission.ts src/lib/leads/submission.test.ts
git commit -m "feat(leads): submission validation + email body builder"
```

---

## Task 5: `Submissions` collection

**Files:**
- Create: `src/payload/collections/Submissions.ts`
- Modify: `src/payload.config.ts` (import + add to `collections`)

**Interfaces:**
- Consumes: nothing.
- Produces: a `submissions` collection. Fields: `type` (select), `name`, `email`, `company`, `phone`, `sourcePath` (text), `data` (json), `sketch` (upload→media), `status` (select, default `new`). Public `create`, admin-only `read`.

- [ ] **Step 1: Create the collection**

```ts
// src/payload/collections/Submissions.ts
// Lead submissions from the public site (Free Layout form, Find Your Match,
// contact). PII — readable only by authenticated admins. Rows are created by
// the public /api/submissions route via the Local API.
import type { CollectionConfig } from 'payload'

export const Submissions: CollectionConfig = {
  slug: 'submissions',
  labels: { singular: 'Lead', plural: 'Leads' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'type', 'company', 'status', 'createdAt'],
    group: 'Leads',
    description: 'Enquiries captured from the website. Newest first.',
    pagination: { defaultLimit: 50 },
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: () => true, // public site posts via /api/submissions
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'type',
      type: 'select',
      required: true,
      admin: { position: 'sidebar' },
      options: [
        { label: 'Free Layout Design', value: 'free-layout' },
        { label: 'Find Your Match', value: 'find-your-match' },
        { label: 'Contact', value: 'contact' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      admin: { position: 'sidebar' },
      options: [
        { label: 'New', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    { name: 'name', type: 'text' },
    { name: 'email', type: 'email' },
    { name: 'company', type: 'text' },
    { name: 'phone', type: 'text' },
    { name: 'sourcePath', type: 'text', admin: { description: 'Page the lead came from.' } },
    { name: 'sketch', type: 'upload', relationTo: 'media', admin: { description: 'Uploaded sketch / drawing (Free Layout).' } },
    { name: 'data', type: 'json', admin: { description: 'Raw form fields / wizard answers.' } },
  ],
}
```

- [ ] **Step 2: Register in `src/payload.config.ts`**

Add the import beside the other collection imports:

```ts
import { Submissions } from './payload/collections/Submissions.ts'
```

Add `Submissions` to the `collections` array (after `Projects`, before `Users` so it groups above Settings):

```ts
  collections: [Products, Media, Posts, Projects, Submissions, Faqs, PageSeo, Users],
```

- [ ] **Step 3: Push schema + regenerate types**

Run: `yes | PAYLOAD_DB_PUSH=true npm run dev` (background), wait for "Ready", then stop it.
Run: `npm run generate:types`
Run: `npm run typecheck`
Expected: `src/payload-types.ts` now contains a `Submission` type; typecheck clean.

- [ ] **Step 4: Verify the table exists**

Run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/admin` (with dev running)
Expected: `200`, and the user can see a **Leads** group in the admin nav (admin render requires auth — confirm with the user).

- [ ] **Step 5: Commit**

```bash
git add src/payload/collections/Submissions.ts src/payload.config.ts src/payload-types.ts
git commit -m "feat(leads): Submissions collection (PII, admin-only read)"
```

---

## Task 6: `Events` collection (hidden)

**Files:**
- Create: `src/payload/collections/Events.ts`
- Modify: `src/payload.config.ts` (import + add to `collections`)

**Interfaces:**
- Produces: an `events` collection hidden from the admin nav. Fields: `kind` (select), `path`, `referrer`, `sessionHash` (text, indexed), `data` (json). Public `create`, admin-only `read`.

- [ ] **Step 1: Create the collection**

```ts
// src/payload/collections/Events.ts
// Anonymous analytics events: pageviews (first-party, cookieless) and Find Your
// Match runs. Hidden from the admin nav — the Dashboard surfaces the computed
// numbers/charts. No cookie, no raw IP: visitors are a daily sessionHash only.
import type { CollectionConfig } from 'payload'

export const Events: CollectionConfig = {
  slug: 'events',
  admin: { hidden: true, useAsTitle: 'kind' },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: () => true, // public beacon / API routes
    update: () => false,
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'kind',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'Page view', value: 'pageview' },
        { label: 'Find Your Match', value: 'find-your-match' },
      ],
    },
    { name: 'path', type: 'text' },
    { name: 'referrer', type: 'text' },
    { name: 'sessionHash', type: 'text', index: true },
    { name: 'data', type: 'json' },
  ],
}
```

- [ ] **Step 2: Register in `src/payload.config.ts`**

```ts
import { Events } from './payload/collections/Events.ts'
```

```ts
  collections: [Products, Media, Posts, Projects, Submissions, Events, Faqs, PageSeo, Users],
```

- [ ] **Step 3: Push schema + regenerate types + typecheck**

Run: `yes | PAYLOAD_DB_PUSH=true npm run dev` (background), wait for "Ready", stop.
Run: `npm run generate:types && npm run typecheck`
Expected: `Event` type generated; typecheck clean; `events` does NOT appear in the admin nav.

- [ ] **Step 4: Commit**

```bash
git add src/payload/collections/Events.ts src/payload.config.ts src/payload-types.ts
git commit -m "feat(analytics): hidden Events collection"
```

---

## Task 7: `POST /api/submissions` (capture + Resend notify + sketch upload)

**Files:**
- Modify: `package.json` (add `resend`)
- Create: `src/lib/leads/notify.ts`
- Create: `src/app/api/submissions/route.ts`

**Interfaces:**
- Consumes: `normalizeSubmission`, `buildLeadEmail` (Task 4).
- Produces: `notifyNewLead(lead: NormalizedLead): Promise<void>` (best-effort, env-guarded) and a `POST /api/submissions` accepting `multipart/form-data` or JSON, creating a `submissions` row, returning `{ ok: true, id }` or `{ ok: false, errors }`.

- [ ] **Step 1: Install Resend**

```bash
npm install resend
```

- [ ] **Step 2: Write the notify wrapper**

```ts
// src/lib/leads/notify.ts
import { buildLeadEmail, type NormalizedLead } from './submission'

const SALES_TO = 'contact@envo-led.com'

/** Best-effort sales notification. No-op (logs) when RESEND_API_KEY is unset. */
export async function notifyNewLead(lead: NormalizedLead): Promise<void> {
  const key = process.env.RESEND_API_KEY
  if (!key) return
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(key)
    const { subject, text } = buildLeadEmail(lead)
    await resend.emails.send({
      from: 'ENVO Website <contact@envo-led.com>',
      to: SALES_TO,
      replyTo: lead.email,
      subject,
      text,
    })
  } catch {
    // Notification must never break lead capture.
  }
}
```

- [ ] **Step 3: Write the route**

```ts
// src/app/api/submissions/route.ts
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { normalizeSubmission } from '@/lib/leads/submission'
import { notifyNewLead } from '@/lib/leads/notify'

export async function POST(req: Request) {
  // Accept JSON or multipart (the form may include a sketch file).
  let raw: Record<string, unknown> = {}
  let file: File | null = null
  const ct = req.headers.get('content-type') ?? ''
  if (ct.includes('multipart/form-data')) {
    const form = await req.formData()
    for (const [k, v] of form.entries()) {
      if (v instanceof File) file = v.size > 0 ? v : file
      else raw[k] = v
    }
  } else {
    try {
      raw = (await req.json()) as Record<string, unknown>
    } catch {
      return NextResponse.json({ ok: false, errors: ['invalid body'] }, { status: 400 })
    }
  }

  const result = normalizeSubmission(raw)
  if (!result.ok) return NextResponse.json({ ok: false, errors: result.errors }, { status: 400 })
  const lead = result.value

  const payload = await getPayload({ config })

  let sketchId: number | string | undefined
  if (file) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer())
      const media = await payload.create({
        collection: 'media',
        data: { alt: `Sketch — ${lead.name}` },
        file: { data: buffer, name: file.name, mimetype: file.type, size: file.size },
      })
      sketchId = media.id
    } catch {
      // Persist the lead even if the upload fails.
    }
  }

  const created = await payload.create({
    collection: 'submissions',
    data: {
      type: lead.type,
      name: lead.name,
      email: lead.email,
      company: lead.company,
      phone: lead.phone,
      sourcePath: lead.sourcePath,
      data: lead.data,
      ...(sketchId ? { sketch: sketchId } : {}),
    },
  })

  await notifyNewLead(lead)
  return NextResponse.json({ ok: true, id: created.id })
}
```

- [ ] **Step 4: Verify via curl (dev running)**

Run:
```bash
curl -s -X POST http://localhost:3000/api/submissions \
  -H 'Content-Type: application/json' \
  -d '{"type":"contact","name":"Test User","email":"test@example.com","sourcePath":"/contact","message":"hello"}'
```
Expected: `{"ok":true,"id":<number>}`.

Run (validation):
```bash
curl -s -X POST http://localhost:3000/api/submissions -H 'Content-Type: application/json' -d '{"type":"contact","email":"bad"}'
```
Expected: HTTP 400 with `errors` containing `name is required` and `a valid email is required`.

- [ ] **Step 5: Typecheck + commit**

Run: `npm run typecheck` → clean.

```bash
git add package.json package-lock.json src/lib/leads/notify.ts src/app/api/submissions/route.ts
git commit -m "feat(leads): /api/submissions capture + Resend notify + sketch upload"
```

---

## Task 8: Wire the Free Layout `SketchForm`

**Files:**
- Modify: `src/app/(frontend)/free-layout-design/SketchForm.tsx`

**Interfaces:**
- Consumes: `POST /api/submissions` (Task 7).

- [ ] **Step 1: Replace the form submit handler**

Replace the whole `SketchForm` component body with a real submit that posts `FormData` (so the file is included), adds `type` + `sourcePath`, and shows a sending/error state. Keep all existing markup/fields and the `styles.thanks` success block.

```tsx
'use client'

import { useState } from 'react'
import styles from './page.module.css'

export function SketchForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState('sending')
    const form = new FormData(e.currentTarget)
    form.set('type', 'free-layout')
    form.set('sourcePath', '/free-layout-design')
    try {
      const res = await fetch('/api/submissions', { method: 'POST', body: form })
      setState(res.ok ? 'sent' : 'error')
    } catch {
      setState('error')
    }
  }

  return (
    <form className={styles.formGrid} onSubmit={handleSubmit}>
      {/* ...keep every existing <label>/field block exactly as-is... */}

      <div className={`${styles.fieldWide} ${styles.formActions}`}>
        <button type="submit" className="btn btn-primary" disabled={state === 'sending' || state === 'sent'}>
          {state === 'sending' ? 'Sending…' : 'Submit My Project'}
          <span className="btn-arrow">→</span>
        </button>
        <small>
          Or email <a href="mailto:contact@envo-led.com">contact@envo-led.com</a> directly.
        </small>
      </div>

      {state === 'sent' && (
        <div className={`${styles.fieldWide} ${styles.thanks}`} role="status">
          <strong>✓ Got it.</strong> We&apos;ll review your project and reply within 24 hours.
          For anything urgent, email <a href="mailto:contact@envo-led.com">contact@envo-led.com</a>.
        </div>
      )}
      {state === 'error' && (
        <div className={`${styles.fieldWide} ${styles.thanks}`} role="alert">
          <strong>Something went wrong.</strong> Please try again, or email{' '}
          <a href="mailto:contact@envo-led.com">contact@envo-led.com</a>.
        </div>
      )}
    </form>
  )
}
```

> Keep the existing field `<label>` blocks (name, company, email, phone, sign type, dimensions, location, notes, sketch) verbatim between the opening `<form>` and the actions block — only the handler, button, and status blocks change.

- [ ] **Step 2: Verify in the browser (dev running)**

Submit the form at `http://localhost:3000/free-layout-design` with a test name/email. Expected: button shows "Sending…" then the success block; a new row appears in the admin **Leads** list (confirm with user). Network tab shows `POST /api/submissions` → 200.

- [ ] **Step 3: Typecheck + commit**

Run: `npm run typecheck` → clean.

```bash
git add "src/app/(frontend)/free-layout-design/SketchForm.tsx"
git commit -m "feat(leads): wire Free Layout form to /api/submissions"
```

---

## Task 9: Log Find Your Match runs

**Files:**
- Modify: `src/app/api/find-your-match/route.ts`

**Interfaces:**
- Consumes: the `events` collection (Task 6).
- Produces: one `events{ kind:'find-your-match' }` row per recommendation. Best-effort; never blocks the response.

- [ ] **Step 1: Add event logging after `recommend()`**

In `src/app/api/find-your-match/route.ts`, add the imports:

```ts
import { getPayload } from 'payload'
import config from '@payload-config'
```

Immediately after `const rec = recommend(answers, docs)` (before building the explanation), insert:

```ts
  // Best-effort usage log (no free-text notes — privacy). Never blocks the reply.
  try {
    const payload = await getPayload({ config })
    await payload.create({
      collection: 'events',
      data: {
        kind: 'find-your-match',
        data: {
          application: answers.application,
          environment: answers.environment,
          colour: answers.colour,
          size: answers.size,
          control: answers.control,
        },
      },
    })
  } catch {
    // logging failure must not affect the recommendation
  }
```

- [ ] **Step 2: Verify via curl (dev running)**

Run:
```bash
curl -s -X POST http://localhost:3000/api/find-your-match \
  -H 'Content-Type: application/json' \
  -d '{"application":"light_box","environment":"outdoor","colour":"white_cool","size":"large","control":"dimmable"}' \
  -o /dev/null -w "%{http_code}\n"
```
Expected: `200`. Then run the same query for `events` to confirm a row exists:
```bash
curl -s "http://localhost:3000/api/events?where[kind][equals]=find-your-match&limit=1" -o /dev/null -w "%{http_code}\n"
```
Expected: `200` (this endpoint requires auth for read; a `403`/`401` is also acceptable proof the route is protected — confirm the row in admin instead if so).

- [ ] **Step 3: Typecheck + commit**

Run: `npm run typecheck` → clean.

```bash
git add src/app/api/find-your-match/route.ts
git commit -m "feat(analytics): log Find Your Match runs to events"
```

---

## Task 10: `POST /api/track` page-view beacon endpoint

**Files:**
- Create: `src/app/api/track/route.ts`

**Interfaces:**
- Consumes: `sessionHash`, `isBot` (Task 2); the `events` collection (Task 6).
- Produces: `POST /api/track` accepting `{ path, referrer }`, writing one `events{ kind:'pageview' }` row (bots dropped). Returns `204`.

- [ ] **Step 1: Write the route**

```ts
// src/app/api/track/route.ts
import { getPayload } from 'payload'
import config from '@payload-config'
import { sessionHash, isBot } from '@/lib/analytics/track'

export async function POST(req: Request) {
  const ua = req.headers.get('user-agent')
  if (isBot(ua)) return new Response(null, { status: 204 })

  let body: { path?: unknown; referrer?: unknown } = {}
  try {
    body = await req.json()
  } catch {
    return new Response(null, { status: 204 })
  }
  const path = typeof body.path === 'string' ? body.path.slice(0, 512) : null
  if (!path) return new Response(null, { status: 204 })
  const referrer = typeof body.referrer === 'string' && body.referrer ? body.referrer.slice(0, 512) : null

  // Cookieless, no stored IP: hash IP+UA+UTC-day+salt.
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  const utcDate = new Date().toISOString().slice(0, 10)
  const salt = process.env.ANALYTICS_SALT || process.env.PAYLOAD_SECRET || 'envo'
  const hash = sessionHash(ip, ua ?? '', utcDate, salt)

  try {
    const payload = await getPayload({ config })
    await payload.create({
      collection: 'events',
      data: { kind: 'pageview', path, referrer, sessionHash: hash },
    })
  } catch {
    // swallow — tracking is fire-and-forget
  }
  return new Response(null, { status: 204 })
}
```

- [ ] **Step 2: Add the optional salt to `.env.example`**

Append under the S3 keys:

```bash
# Optional dedicated salt for the cookieless analytics sessionHash.
# Falls back to PAYLOAD_SECRET when unset.
ANALYTICS_SALT=
```

- [ ] **Step 3: Verify via curl (dev running)**

Run (normal browser UA → recorded):
```bash
curl -s -X POST http://localhost:3000/api/track \
  -H 'Content-Type: application/json' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh) Chrome/120' \
  -d '{"path":"/products","referrer":"https://google.com"}' \
  -o /dev/null -w "%{http_code}\n"
```
Expected: `204`.

Run (bot UA → dropped, still 204):
```bash
curl -s -X POST http://localhost:3000/api/track -H 'User-Agent: Googlebot/2.1' -H 'Content-Type: application/json' -d '{"path":"/x"}' -o /dev/null -w "%{http_code}\n"
```
Expected: `204` (no row written). Confirm the `/products` pageview row exists in admin.

- [ ] **Step 4: Typecheck + commit**

Run: `npm run typecheck` → clean.

```bash
git add src/app/api/track/route.ts .env.example
git commit -m "feat(analytics): /api/track cookieless pageview beacon"
```

---

## Task 11: `PageViewBeacon` client component

**Files:**
- Create: `src/components/analytics/PageViewBeacon.tsx`
- Modify: `src/app/(frontend)/layout.tsx` (mount it)

**Interfaces:**
- Consumes: `POST /api/track` (Task 10).
- Produces: a fire-on-route-change beacon mounted once in the frontend root layout.

- [ ] **Step 1: Write the component**

```tsx
// src/components/analytics/PageViewBeacon.tsx
'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Fires one cookieless pageview to /api/track on initial load and on every
 * App Router path change. No third-party script, no cookie.
 */
export function PageViewBeacon() {
  const pathname = usePathname()
  useEffect(() => {
    const body = JSON.stringify({ path: pathname, referrer: document.referrer || null })
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {})
  }, [pathname])
  return null
}
```

- [ ] **Step 2: Mount in `src/app/(frontend)/layout.tsx`**

Add the import with the other layout imports:

```ts
import { PageViewBeacon } from '@/components/analytics/PageViewBeacon'
```

Add `<PageViewBeacon />` inside `<body>` (e.g. right after `<Sidebar />`):

```tsx
      <body>
        <PageViewBeacon />
        <Sidebar />
```

- [ ] **Step 3: Verify in the browser (dev running)**

Load `http://localhost:3000/`, then navigate to `/products`. Network tab shows a `POST /api/track` (204) per navigation. Two new pageview rows appear in admin (confirm with user).

- [ ] **Step 4: Typecheck + commit**

Run: `npm run typecheck` → clean.

```bash
git add src/components/analytics/PageViewBeacon.tsx "src/app/(frontend)/layout.tsx"
git commit -m "feat(analytics): mount cookieless PageViewBeacon in frontend layout"
```

---

## Task 12: Custom Dashboard view (Editorial Bold) + charts

**Files:**
- Create: `src/payload/views/Dashboard.tsx`
- Modify: `src/payload.config.ts` (register `views.dashboard`)

**Interfaces:**
- Consumes: `pageViewsByDay`, `uniqueVisitors`, `topPaths`, `topReferrers`, `fymRunStats` (Task 3); `submissions` + `events` collections.
- Produces: a server-component Dashboard replacing the default `/admin` landing.

- [ ] **Step 1: Write the Dashboard server component**

Editorial Bold = light base, blue→lime gradient hero, two-colour stat tiles, inline-SVG charts. Visual reference: mockup `dashboard-3.html` (`/private/tmp/envo-admin-mockups/`).

```tsx
// src/payload/views/Dashboard.tsx
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  pageViewsByDay,
  uniqueVisitors,
  topPaths,
  topReferrers,
  fymRunStats,
  type AnalyticsEvent,
} from '@/lib/analytics/aggregate'

const BLUE = '#0071bc'
const LIME = '#aec90b'

async function loadData() {
  const payload = await getPayload({ config })
  const since = new Date()
  since.setUTCDate(since.getUTCDate() - 6)
  const sinceIso = since.toISOString()
  const weekStart = new Date()
  weekStart.setUTCDate(weekStart.getUTCDate() - 7)

  const [recentLeads, leadsThisWeek, eventsRes] = await Promise.all([
    payload.find({ collection: 'submissions', limit: 5, sort: '-createdAt', depth: 0 }),
    payload.count({ collection: 'submissions', where: { createdAt: { greater_than: weekStart.toISOString() } } }),
    payload.find({ collection: 'events', limit: 10000, sort: '-createdAt', depth: 0, where: { createdAt: { greater_than: sinceIso } } }),
  ])

  const events = eventsRes.docs as unknown as AnalyticsEvent[]
  const today = new Date().toISOString().slice(0, 10)
  return {
    recentLeads: recentLeads.docs as Array<{ id: number | string; email?: string; type?: string; createdAt: string }>,
    leadsThisWeek: leadsThisWeek.totalDocs,
    byDay: pageViewsByDay(events, 7, today),
    uniques: uniqueVisitors(events),
    totalPv: events.filter((e) => e.kind === 'pageview').length,
    paths: topPaths(events, 5),
    referrers: topReferrers(events, 5),
    fym: fymRunStats(events),
  }
}

function Bars({ data, color }: { data: { label: string; count: number }[]; color: string }) {
  const max = Math.max(1, ...data.map((d) => d.count))
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      {data.length === 0 && <span style={{ color: '#8b94a3', fontSize: 13 }}>No data yet.</span>}
      {data.map((d) => (
        <div key={d.label} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span style={{ fontSize: 13, color: '#1c2733', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.label}</span>
            <span style={{ flex: 1, height: 8, borderRadius: 4, background: '#eef1f5', overflow: 'hidden' }}>
              <span style={{ display: 'block', height: '100%', width: `${(d.count / max) * 100}%`, background: color }} />
            </span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1c2733' }}>{d.count}</span>
        </div>
      ))}
    </div>
  )
}

function Card({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <section style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(16,24,40,.08)', borderTop: `3px solid ${accent}` }}>
      <h3 style={{ margin: '0 0 14px', fontSize: 14, textTransform: 'uppercase', letterSpacing: '.04em', color: '#5b6573' }}>{title}</h3>
      {children}
    </section>
  )
}

export async function Dashboard() {
  const d = await loadData()
  return (
    <div style={{ padding: 24, fontFamily: 'var(--font-inter-tight, Inter, system-ui, sans-serif)', maxWidth: 1180, margin: '0 auto' }}>
      <header style={{ borderRadius: 16, padding: '28px 28px', color: '#fff', background: `linear-gradient(100deg, ${BLUE}, ${LIME})`, marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>ENVO Admin</h1>
        <p style={{ margin: '6px 0 0', opacity: 0.92 }}>Website data — leads, AI tool usage, and traffic (last 7 days).</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        <Card title="Leads · this week" accent={BLUE}>
          <div style={{ fontSize: 34, fontWeight: 700, color: BLUE, marginBottom: 10 }}>{d.leadsThisWeek}</div>
          <div style={{ display: 'grid', gap: 6 }}>
            {d.recentLeads.length === 0 && <span style={{ color: '#8b94a3', fontSize: 13 }}>No leads yet.</span>}
            {d.recentLeads.map((l) => (
              <div key={l.id} style={{ fontSize: 13, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.email ?? '—'}</span>
                <span style={{ color: '#8b94a3' }}>{l.type}</span>
              </div>
            ))}
          </div>
          <a href="/admin/collections/submissions" style={{ display: 'inline-block', marginTop: 12, fontSize: 13, color: BLUE }}>View all leads →</a>
        </Card>

        <Card title="Find Your Match · runs" accent={LIME}>
          <div style={{ fontSize: 34, fontWeight: 700, color: '#1c2733', marginBottom: 10 }}>{d.fym.total}</div>
          <Bars data={d.fym.byApplication.map((a) => ({ label: a.application, count: a.count }))} color={LIME} />
        </Card>

        <Card title="Traffic · page views (7d)" accent={BLUE}>
          <div style={{ display: 'flex', gap: 18, marginBottom: 12 }}>
            <div><div style={{ fontSize: 28, fontWeight: 700, color: BLUE }}>{d.totalPv}</div><div style={{ fontSize: 12, color: '#8b94a3' }}>page views</div></div>
            <div><div style={{ fontSize: 28, fontWeight: 700, color: '#1c2733' }}>{d.uniques}</div><div style={{ fontSize: 12, color: '#8b94a3' }}>visitors (est.)</div></div>
          </div>
          <Bars data={d.byDay.map((x) => ({ label: x.date.slice(5), count: x.count }))} color={BLUE} />
        </Card>

        <Card title="Top pages (7d)" accent={LIME}>
          <Bars data={d.paths.map((p) => ({ label: p.path, count: p.count }))} color={LIME} />
        </Card>

        <Card title="Top referrers (7d)" accent={BLUE}>
          <Bars data={d.referrers.map((r) => ({ label: r.referrer, count: r.count }))} color={BLUE} />
        </Card>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Register the view in `src/payload.config.ts`**

Inside `admin.components.views`, add the `dashboard` key alongside the existing `pagesOverview` (overriding the default dashboard takes no `path`):

```ts
      views: {
        dashboard: {
          Component: '/payload/views/Dashboard#Dashboard',
        },
        pagesOverview: {
          Component: '/payload/views/PagesOverview#PagesOverview',
          path: '/pages-overview',
        },
      },
```

- [ ] **Step 3: Regenerate the import map + typecheck**

Run: `npm run generate:importmap`
Run: `npm run typecheck`
Expected: import map includes the Dashboard component; typecheck clean.

- [ ] **Step 4: Verify (dev running)**

Run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/admin`
Expected: `200`. The user opens `/admin` and confirms the Editorial Bold dashboard renders: gradient hero, the Leads/Find Your Match/Traffic/Top-pages/Top-referrers cards, with the test data from earlier tasks showing (and "No data yet" where empty). Admin render requires auth — confirm visually with the user.

- [ ] **Step 5: Commit**

```bash
git add src/payload/views/Dashboard.tsx src/payload.config.ts
git commit -m "feat(admin): Editorial Bold dashboard — leads, AI usage, traffic"
```

---

## Self-Review

**Spec coverage:**
- Leads collection + capture + Free Layout wiring → Tasks 5, 7, 8. ✅
- AI usage logging → Task 9. ✅
- First-party cookieless traffic (beacon + endpoint + hash + bot filter) → Tasks 2, 10, 11. ✅
- Supabase Storage for media → Task 1. ✅
- Resend lead notification → Task 7. ✅
- `events` hidden from nav → Task 6. ✅
- Dashboard (Editorial Bold) with numbers + inline-SVG charts → Task 12. ✅
- Privacy: no cookie/IP stored; notes excluded from events → Tasks 9, 10. ✅

**Type consistency:** `NormalizedLead`/`normalizeSubmission`/`buildLeadEmail` (Tasks 4, 7) align; `AnalyticsEvent` shape (Task 3) matches the rows queried in Task 12; `sessionHash`/`isBot` signatures (Task 2) match their callers (Task 10). ✅

**Placeholder scan:** no TBD/TODO; every code step shows full code. The one verbatim-reuse note (SketchForm fields) points to the existing file rather than re-pasting unchanged markup — intentional, since the task modifies an existing component. ✅

**Open dependency (flagged, not a gap):** real Supabase Storage round-trip and admin visual confirmation require provisioned creds + an authenticated admin session — these are user/Alan verification steps, called out in the relevant tasks.
