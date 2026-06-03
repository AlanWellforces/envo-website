# Homepage v6 Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy catalogue-first homepage with the locked application-first **home-v6** redesign: 8 sections rebuilt as clean React components + one scoped global stylesheet.

**Architecture:** 8 no-props server components under `src/components/home/`, a verbatim scoped-global stylesheet `home-v6.css` (mockup CSS is already `.v4*`-namespaced → no leakage), and a recomposed `page.tsx`. Legacy single-use home components deleted. Hardcoded copy v1; Payload wiring deferred.

**Tech Stack:** Next.js 16 App Router, TypeScript, plain global CSS (not Tailwind utilities — the mockup ships its own bespoke CSS), Next `<Link>` for internal nav.

---

## Source of truth

Mockup file on disk: `.superpowers/brainstorm/33087-1780436613/content/home-v6.html`
- Main markup: lines 6745–6920 (the `<main class="v4">` … `</main>` block; the `</aside>` sidebar before it is NOT ported).
- Bespoke CSS: the `<style id="v6-redesign">` block, lines 6544–6742.
- Live preview for comparison: `http://localhost:65101/files/home-v6.html` (mockup server) — assets resolve via `<base href=:3000>`, so the dev server must be up.

## Testing approach (read first)

This is a static-markup visual port — there is **no business logic to unit-test**. TDD's red/green cycle does not apply; the equivalent verification is:
1. `npx tsc --noEmit` compiles clean (no NEW errors over the 5 pre-existing baseline).
2. The dev server renders the route without runtime errors (`curl` 200 + clean dev log).
3. A headless-Chrome screenshot at 1440×900 matches the mockup section-for-section.

Each component task ends by confirming tsc still compiles. The full visual + lint gate runs once in the final task.

## Conventions (apply in every component task)

- **Server components**, no `'use client'`, no props. Default-export a named function.
- **Class names:** transcribe the mockup's kebab classes **verbatim** as string literals — `className="v4-hero"`, `className="body"`, etc. Do NOT rename.
- **Internal links** (`/find-your-match`, `/solutions`, `/products`, `/projects`, `/blog`, `/free-layout-design`, `/contact`): use `import Link from 'next/link'` → `<Link href="…">`.
- **External links** (distributor buy links): plain `<a href="…" target="_blank" rel="noopener noreferrer">`.
- **Images:** plain `<img>` (the CSS uses absolute-fill `object-fit:cover` and `mix-blend-mode` patterns that next/image fights). Add `/* eslint-disable @next/next/no-img-element */` as the **first line** of every component file that contains an `<img>`.
- **SVG attributes** must be camelCased in JSX: `stroke-width`→`strokeWidth`, `stroke-linecap`→`strokeLinecap`, `stroke-linejoin`→`strokeLinejoin`. `viewBox` and `fill` stay as-is.
- **The repeated right-arrow SVG** (`M5 12h14M13 6l6 6-6 6`) appears 12+ times → extract once as `ArrowRight` (Task 1) and reuse. One-off icons (hero chips, shield) are inlined where they occur.
- **Entities:** write `&` and `'` literally in JSX text (`Retail & Hospitality`, `Let's`); write `↗` as the literal `↗` character.

---

### Task 1: Shared icon + scoped stylesheet

**Files:**
- Create: `src/components/home/icons.tsx`
- Create: `src/components/home/home-v6.css`

- [ ] **Step 1: Create the shared ArrowRight icon**

`src/components/home/icons.tsx`:

```tsx
export function ArrowRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}
```

- [ ] **Step 2: Create the scoped stylesheet from the mockup**

Copy the **contents** of the mockup's `<style id="v6-redesign">` block (file `.superpowers/brainstorm/33087-1780436613/content/home-v6.html`, the CSS between lines 6545 and 6741 — i.e. everything inside the tags) into `src/components/home/home-v6.css`, applying exactly these two edits and nothing else:

1. **Replace the opening `:root{…}` block** (mockup lines 6545–6550) with the version below — brand colours mapped to the existing global tokens, neutrals kept local:

```css
:root{
  /* brand colours single-sourced from globals.css */
  --v4-blue: var(--envo-blue);
  --v4-lime: var(--envo-lime);
  /* v6 neutrals — local to the homepage look */
  --v4-blue-deep:#003a66;
  --v4-ink:#050b1a; --v4-ink-soft:#0a1a2e;
  --v4-paper:#ffffff; --v4-mist:#eef2f7; --v4-mist-line:#dde4ee;
  --v4-text:#14233b; --v4-muted:#5a6b82;
}
```

2. **Delete the homepage-only sidebar override block** (mockup lines 6551–6555: the `/* lighten homepage sidebar … */` comment and the 4 `.sidebar…` rules). These target the global sidebar and would leak to every page. Drop them entirely.

Everything else (`.v4`, `.v4-wrap`, `.v4-btn*`, all 8 section blocks, the `@media` queries at 1080/880/560px) is copied **verbatim**. Keep `--v4-blue`/`--v4-lime` defined so all downstream `var(--v4-blue)` references resolve.

- [ ] **Step 3: Verify it compiles (no consumer yet, just lint-parse)**

Run: `npx tsc --noEmit`
Expected: PASS (no new errors; the .css/.tsx aren't imported yet so this just confirms icons.tsx is valid TS).

- [ ] **Step 4: Commit**

```bash
git add src/components/home/icons.tsx src/components/home/home-v6.css
git commit -m "feat(home): v6 scoped stylesheet + shared ArrowRight icon"
```

---

### Task 2: Hero section

**Files:**
- Modify (overwrite): `src/components/home/hero.tsx`

- [ ] **Step 1: Overwrite `hero.tsx`**

```tsx
/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { ArrowRight } from './icons'

export function Hero() {
  return (
    <section className="v4-hero">
      <video
        className="v4-hero-bg"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/assets/images/hero-signage-poster.jpg"
      >
        <source src="/assets/videos/hero-signage.mp4" type="video/mp4" />
      </video>
      <div className="v4-wrap">
        <div className="v4-hero-col">
          <div className="v4-eyebrow">Engineered Illumination</div>
          <h1>
            Light that
            <br />
            performs.
          </h1>
          <p className="lead">
            Professional LED systems for <b>signage, facades, drivers and control</b> — engineered,
            certified, and supported end to end.
          </p>
          <div className="v4-chips">
            <span className="v4-chip">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7.5v5l3.2 2" />
              </svg>{' '}
              10+ years manufacturing
            </span>
            <span className="v4-chip">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3c2.6 2.8 2.6 15.2 0 18M12 3c-2.6 2.8-2.6 15.2 0 18" />
              </svg>{' '}
              60+ countries shipped
            </span>
            <span className="v4-chip">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l7.5 2.8v5.4c0 4.6-3.2 7.4-7.5 8.3-4.3-.9-7.5-3.7-7.5-8.3V5.8z" />
                <path d="M8.8 12l2.2 2.2 4.2-4.2" />
              </svg>{' '}
              CE · UL · RoHS · TÜV
            </span>
          </div>
          <div className="v4-cta-row">
            <Link className="v4-btn v4-btn-primary" href="/find-your-match">
              Find your match <ArrowRight />
            </Link>
            <Link className="v4-btn v4-btn-ghost" href="/free-layout-design">
              Get free layout design
            </Link>
          </div>
        </div>
        <div className="v4-quick">
          <div className="v4-quick-label">Or browse the catalogue</div>
          <div className="v4-quick-grid">
            <Link className="v4-ql" href="/products/led-signage-modules">
              <img src="/assets/images/cat-modules.png" alt="LED signage modules" />
              <span>Signage Modules</span>
            </Link>
            <Link className="v4-ql" href="/products/led-drivers">
              <img src="/assets/images/cat-drivers-line.png" alt="LED drivers" />
              <span>LED Drivers</span>
            </Link>
            <Link className="v4-ql" href="/products/control-gear">
              <img src="/assets/images/cat-controllers-line.png" alt="LED control gear" />
              <span>Control Gear</span>
            </Link>
            <Link className="v4-ql" href="/products/accessories">
              <img src="/assets/images/cat-sensors-line.png" alt="Signage accessories" />
              <span>Accessories</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify** — `npx tsc --noEmit` → PASS.

---

### Task 3: Applications section

**Files:**
- Create: `src/components/home/apps.tsx`

- [ ] **Step 1: Create `apps.tsx`**

```tsx
/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { ArrowRight } from './icons'

const APPS = [
  { img: '/assets/images/app-mini-channel-letters.jpg', alt: 'Illuminated channel-letter signage at night', h: 'Signage', p: 'Channel letters, light boxes & halo-lit builds.' },
  { img: '/assets/images/ind-architectural.jpg', alt: 'LED-lit architectural building facade', h: 'Architectural Facades', p: 'Even illumination across large surfaces.' },
  { img: '/assets/images/ind-retail.jpg', alt: 'Retail storefront with brand signage lighting', h: 'Retail & Hospitality', p: 'Brand-true colour for storefronts.' },
  { img: '/assets/images/ind-commercial.jpg', alt: 'Commercial signage with lighting control system', h: 'Control Systems', p: 'Dimming, Zigbee & RGB for whole installs.' },
]

export function Apps() {
  return (
    <section className="v4-apps">
      <div className="v4-wrap">
        <div className="v4-sec-head">
          <div>
            <div className="v4-eyebrow">Start from your application</div>
            <h2>Solutions for how the light is used.</h2>
          </div>
          <Link className="v4-seelink" href="/solutions">
            All solutions <ArrowRight />
          </Link>
        </div>
        <div className="v4-app-grid">
          {APPS.map((a) => (
            <Link className="v4-app" href="/solutions" key={a.h}>
              <img src={a.img} alt={a.alt} />
              <div className="body">
                <h3>{a.h}</h3>
                <p>{a.p}</p>
                <span className="go">
                  Explore <ArrowRight />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify** — `npx tsc --noEmit` → PASS.

---

### Task 4: Free layout section

**Files:**
- Create: `src/components/home/free-layout.tsx`

- [ ] **Step 1: Create `free-layout.tsx`**

```tsx
/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { ArrowRight } from './icons'

const STEPS = [
  { n: '1', h: 'Send your drawing', p: 'Elevation, sign face or facade plan — any common format.' },
  { n: '2', h: 'We engineer the layout', p: 'Module spacing, driver sizing and a brightness plan.' },
  { n: '3', h: 'You get a spec + BOM', p: 'A buildable layout and parts list, routed to your distributor.' },
]

export function FreeLayout() {
  return (
    <section className="v4-layout">
      <div className="v4-wrap">
        <div className="grid">
          <div className="pic">
            <img src="/assets/images/app-mini-wayfinding.jpg" alt="ENVO engineered signage layout in situ" />
          </div>
          <div>
            <div className="v4-eyebrow">Free engineering service</div>
            <h2>Free layout design.</h2>
            <p className="lead">
              <b style={{ color: 'var(--v4-ink)' }}>
                Get module spacing, driver sizing and a BOM — from your drawing.
              </b>{' '}
              Send an elevation or sign face; our engineers return a buildable layout. No commitment.
            </p>
            <div className="v4-steps">
              {STEPS.map((s) => (
                <div className="v4-step" key={s.n}>
                  <div className="n">{s.n}</div>
                  <div>
                    <h3>{s.h}</h3>
                    <p>{s.p}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link className="v4-btn v4-btn-primary" href="/free-layout-design">
              Get free layout design <ArrowRight />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify** — `npx tsc --noEmit` → PASS.

---

### Task 5: Featured project section

**Files:**
- Create: `src/components/home/featured-project.tsx`

- [ ] **Step 1: Create `featured-project.tsx`**

```tsx
/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { ArrowRight } from './icons'

const BADGES = ['Commissioned on schedule', 'Uniform brightness, full facade', 'No hot spots']
const USED = [
  { label: 'Pro Series modules', href: '/products' },
  { label: '24V Series', href: '/products' },
  { label: 'Outdoor IP67 driver', href: '/products' },
  { label: 'Zigbee controller', href: '/products' },
]
const MINI = [
  { img: '/assets/images/app-mini-pylon-monument.jpg', alt: 'Pylon and monument signage installation', label: 'Pylon & monument signage' },
  { img: '/assets/images/app-mini-hospitality-facade.jpg', alt: 'Hospitality venue illuminated facade', label: 'Hospitality facade' },
]

export function FeaturedProject() {
  return (
    <section className="v4-action">
      <div className="v4-wrap">
        <div className="v4-sec-head">
          <div>
            <div className="v4-eyebrow">ENVO in action</div>
            <h2>Specified. Installed. Still performing.</h2>
          </div>
          <Link className="v4-seelink" href="/projects">
            All projects <ArrowRight />
          </Link>
        </div>
        <div className="v4-case">
          <div className="pic">
            <img src="/assets/images/featured-project.jpg" alt="ENVO-lit retail facade at night" />
          </div>
          <div className="info">
            <div className="tag">Retail facade · Featured</div>
            <h3>A landmark frontage, lit to spec.</h3>
            <p>
              ENVO modules and drivers delivered uniform brightness across a full retail facade —
              commissioned on schedule and still running to spec.
            </p>
            <div className="v4-badges">
              {BADGES.map((b) => (
                <span key={b}>{b}</span>
              ))}
            </div>
            <div className="v4-used">
              <div className="lbl">Products used</div>
              <div className="row">
                {USED.map((u) => (
                  <Link href={u.href} key={u.label}>
                    {u.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="v4-mini-cases">
          {MINI.map((m) => (
            <Link className="v4-mini" href="/projects" key={m.label}>
              <img src={m.img} alt={m.alt} />
              <span>{m.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify** — `npx tsc --noEmit` → PASS.

---

### Task 6: Product range section

**Files:**
- Create: `src/components/home/product-range.tsx`

- [ ] **Step 1: Create `product-range.tsx`**

```tsx
/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { ArrowRight } from './icons'

const FAMILIES = [
  { img: '/assets/images/cat-modules.png', alt: 'Signage Modules', h: 'Signage Modules', p: 'LED modules for letters, boxes & facades.' },
  { img: '/assets/images/cat-drivers.png', alt: 'LED Drivers', h: 'LED Drivers', p: 'Stable indoor & IP67 outdoor power supplies.' },
  { img: '/assets/images/cat-controllers.png', alt: 'Control Gear', h: 'Control Gear', p: 'Dimming, Zigbee & RGB control.' },
  { img: '/assets/images/cat-sensors.png', alt: 'Accessories', h: 'Accessories', p: 'Connectors, mounting & sensors.' },
]

export function ProductRange() {
  return (
    <section className="v4-fam">
      <div className="v4-wrap">
        <div className="v4-sec-head">
          <div>
            <div className="v4-eyebrow">The range</div>
            <h2>One system, four families.</h2>
          </div>
          <Link className="v4-seelink" href="/products">
            Full catalogue <ArrowRight />
          </Link>
        </div>
        <div className="v4-fam-grid">
          {FAMILIES.map((f) => (
            <Link className="v4-famcard" href="/products" key={f.h}>
              <div className="ph">
                <img src={f.img} alt={f.alt} />
              </div>
              <div className="fb">
                <h3>{f.h}</h3>
                <p>{f.p}</p>
                <span className="go">
                  View range <ArrowRight />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify** — `npx tsc --noEmit` → PASS.

---

### Task 7: Trust (slim) section

**Files:**
- Create: `src/components/home/trust-slim.tsx`

- [ ] **Step 1: Create `trust-slim.tsx`**

```tsx
/* eslint-disable @next/next/no-img-element */

const CERTS = [
  { src: '/assets/images/certs/ce.png', alt: 'CE certified' },
  { src: '/assets/images/certs/ul.png', alt: 'UL listed' },
  { src: '/assets/images/certs/rohs.png', alt: 'RoHS compliant' },
  { src: '/assets/images/certs/tuv.png', alt: 'TÜV certified' },
]

export function TrustSlim() {
  return (
    <section className="v4-trust2">
      <div className="v4-wrap">
        <div className="row">
          <div className="promise">
            <div className="ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l7.5 2.8v5.4c0 4.6-3.2 7.4-7.5 8.3-4.3-.9-7.5-3.7-7.5-8.3V5.8z" />
                <path d="M8.8 12l2.2 2.2 4.2-4.2" />
              </svg>
            </div>
            <p>
              <b>Built in-house, tested to international standards.</b> Every ENVO system ships
              certified and QA-checked.
            </p>
          </div>
          <div className="logos">
            {CERTS.map((c) => (
              <img src={c.src} alt={c.alt} key={c.src} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify** — `npx tsc --noEmit` → PASS.

---

### Task 8: Guides section

**Files:**
- Create: `src/components/home/guides.tsx`

- [ ] **Step 1: Create `guides.tsx`**

```tsx
/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { ArrowRight } from './icons'

const GUIDES = [
  { img: '/assets/images/app-mini-thin-lightbox.jpg', alt: 'Slim LED light box signage', h: 'Understanding IP ratings for outdoor signage', p: 'What IP65 / IP67 mean for facade and exterior builds.' },
  { img: '/assets/images/ind-retail.jpg', alt: 'Retail storefront signage at dusk', h: 'Choosing CCT for storefront brand colour', p: 'How colour temperature changes how a sign reads.' },
  { img: '/assets/images/ind-architectural.jpg', alt: 'Large architectural facade lighting', h: 'Sizing drivers for long module runs', p: 'Avoid voltage drop and hot-spots on large facades.' },
]

export function Guides() {
  return (
    <section className="v4-guides">
      <div className="v4-wrap">
        <div className="v4-sec-head">
          <div>
            <div className="v4-eyebrow">Bright ideas by ENVO</div>
            <h2>Guides & industry notes.</h2>
          </div>
          <Link className="v4-seelink" href="/blog">
            View all guides <ArrowRight />
          </Link>
        </div>
        <div className="v4-guide-grid">
          {GUIDES.map((g) => (
            <Link className="v4-guide" href="/blog" key={g.h}>
              <div className="ph">
                <img src={g.img} alt={g.alt} />
              </div>
              <div className="gb">
                <h3>{g.h}</h3>
                <p>{g.p}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify** — `npx tsc --noEmit` → PASS.

---

### Task 9: Final CTA section

**Files:**
- Modify (overwrite): `src/components/home/final-cta.tsx`

- [ ] **Step 1: Overwrite `final-cta.tsx`**

```tsx
import Link from 'next/link'
import { ArrowRight } from './icons'

export function FinalCta() {
  return (
    <section className="v4-final">
      <div className="v4-wrap">
        <h2>Let's light your next project.</h2>
        <p className="lead">
          Find the right system in minutes, get a free layout, or talk to an ENVO engineer.
        </p>
        <div className="v4-cta-row">
          <Link className="v4-btn v4-btn-primary" href="/find-your-match">
            Find your match <ArrowRight />
          </Link>
          <Link className="v4-btn v4-btn-secondary" href="/free-layout-design">
            Get free layout design
          </Link>
          <Link className="v4-btn v4-btn-text" href="/contact">
            Talk to engineering <ArrowRight />
          </Link>
        </div>
        <p className="v4-buyline">
          Already specced it? Buy through your regional distributor —{' '}
          <a href="https://wellforces.co.nz" target="_blank" rel="noopener noreferrer">
            Wellforces↗
          </a>{' '}
          <span>·</span>{' '}
          <a href="https://powersupplymall.com" target="_blank" rel="noopener noreferrer">
            PowerSupplyMall↗
          </a>
        </p>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify** — `npx tsc --noEmit` → PASS.

---

### Task 10: Recompose `page.tsx`

**Files:**
- Modify (overwrite): `src/app/(frontend)/page.tsx`

- [ ] **Step 1: Overwrite `page.tsx`**

```tsx
import { Hero } from '@/components/home/hero'
import { Apps } from '@/components/home/apps'
import { FreeLayout } from '@/components/home/free-layout'
import { FeaturedProject } from '@/components/home/featured-project'
import { ProductRange } from '@/components/home/product-range'
import { TrustSlim } from '@/components/home/trust-slim'
import { Guides } from '@/components/home/guides'
import { FinalCta } from '@/components/home/final-cta'
import '@/components/home/home-v6.css'

export default function HomePage() {
  return (
    <main className="v4">
      <Hero />
      <Apps />
      <FreeLayout />
      <FeaturedProject />
      <ProductRange />
      <TrustSlim />
      <Guides />
      <FinalCta />
    </main>
  )
}
```

Note: the `<main className="v4">` wrapper is required — `home-v6.css` scopes typography/colour under `.v4`.

- [ ] **Step 2: Verify** — `npx tsc --noEmit` → PASS (page no longer imports the deleted components or `getHomePage`).

- [ ] **Step 3: Commit the components + page**

```bash
git add src/components/home/ "src/app/(frontend)/page.tsx"
git commit -m "feat(home): port home-v6 sections + recompose homepage"
```

---

### Task 11: Delete legacy components, commit assets, full verification

**Files:**
- Delete: `src/components/home/{impact,trust,product-families,solutions,projects,quote,featured-detail,process,resources,newsletter}.tsx`
- Add (assets): `public/assets/videos/hero-signage.mp4`, `public/assets/images/hero-signage-poster.jpg`

- [ ] **Step 1: Confirm the legacy components have no other importers**

Run:
```bash
grep -rn "components/home/\(impact\|trust\|product-families\|solutions\|projects\|quote\|featured-detail\|process\|resources\|newsletter\)" src --include="*.tsx" | grep -v "src/components/home/"
```
Expected: no output (only the now-overwritten page.tsx referenced them; if any other file appears, STOP and reassess before deleting).

- [ ] **Step 2: Delete the legacy components**

```bash
cd "$(git rev-parse --show-toplevel)"
git rm src/components/home/impact.tsx src/components/home/trust.tsx \
  src/components/home/product-families.tsx src/components/home/solutions.tsx \
  src/components/home/projects.tsx src/components/home/quote.tsx \
  src/components/home/featured-detail.tsx src/components/home/process.tsx \
  src/components/home/resources.tsx src/components/home/newsletter.tsx
```

- [ ] **Step 3: Stage the hero assets**

```bash
git add public/assets/videos/hero-signage.mp4 public/assets/images/hero-signage-poster.jpg
```

- [ ] **Step 4: Typecheck + lint against baseline**

Run: `npx tsc --noEmit`
Expected: no NEW errors beyond the 5 known pre-existing (in API routes/scripts/payload.config — unrelated to home).

Run: `npm run lint`
Expected: no NEW errors beyond the 42 known pre-existing. The `<img>` files are covered by their file-level eslint-disable; confirm no `no-img-element` errors surface.

- [ ] **Step 5: Visual verification (dev server must be running on :3000)**

Run:
```bash
curl -s -o /dev/null -w "home: %{http_code}\n" http://localhost:3000/
tail -20 /tmp/envo-dev.log   # confirm no runtime/compile errors
```
Expected: `home: 200`, clean log.

Then capture a headless screenshot at 1440×900 and compare against `http://localhost:65101/files/home-v6.html`:
```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --hide-scrollbars --window-size=1440,900 \
  --screenshot=/tmp/home-v6-live.png http://localhost:3000/
```
Check section-for-section: hero video + left scrim + chips + CTAs + quiet quick-grid; 4-up apps; free-layout 2-col + numbered steps; dark featured case + badges + mini tiles; 4 family cards; trust promise + 4 cert logos; 3 guide cards; gradient final CTA + buy-line. Spot-check responsive at ≤1080 and ≤560 if feasible.

- [ ] **Step 6: User visual confirmation**

Show the screenshot to the user and confirm it matches the mockup before considering the port done. (Headless cannot verify the auto-playing video frame reliably — note that the static poster is the fallback.)

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore(home): remove legacy homepage sections; add hero video assets"
```

---

## Self-review notes

- **Spec coverage:** all 8 sections (Tasks 2–9), shared CSS + tokens + dropped sidebar tweak (Task 1), page recompose with `.v4` wrapper + css import (Task 10), legacy deletion + asset commit + tsc/lint/screenshot verification (Task 11). Deferred items (Payload wiring, sidebar lightening, dedicated buy section) are intentionally out of scope per spec.
- **Name consistency:** component export names (`Hero`, `Apps`, `FreeLayout`, `FeaturedProject`, `ProductRange`, `TrustSlim`, `Guides`, `FinalCta`) match the imports in Task 10's `page.tsx`. File names match the spec's table. `ArrowRight` defined in Task 1, used Tasks 2–9.
- **No placeholders:** every component task contains full JSX; the CSS task specifies an exact two-edit transform over a stable on-disk source plus the literal token header.
