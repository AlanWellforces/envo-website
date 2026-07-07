import Image from 'next/image'
import Link from 'next/link'
import type { Solution } from '@/lib/solutions'
import { PURCHASE_CHANNELS } from '@/data/purchase-channels'
import { EnvoButton } from '@/components/ui/envo-button'
import { SolutionGallery } from './SolutionGallery'
import '@/components/solutions/solutions-dark.css'

export function SolutionDetail({ solution: s }: { solution: Solution }) {
  const hasCompat = s.kit.some((k) => !k.envo)

  return (
    <div className="sd-wrap">
      {/* intro — side-by-side hero: text + checklist left, gallery right */}
      <section className="sd-sec sd-intro">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep">›</span>
            <Link href="/solutions">Solutions</Link>
            <span className="sep">›</span>
            <span>{s.name}</span>
          </div>
        </div>
        <div className="container">
          <div className="sd-hero-2col">
            <div className="sd-hero-text">
              <span className="sd-eyebrow">{s.eyebrow}</span>
              <h1>{s.heroTitle}</h1>
              <p className="sd-hero-desc">{s.heroDesc}</p>
              <ul className="sd-hero-checks">
                {s.checklist.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
            <div className="sd-hero-media">
              <SolutionGallery images={s.gallery} />
            </div>
          </div>
        </div>
      </section>

      {/* best for */}
      {s.bestFor.length > 0 && (
        <section className="sd-sec sd-band">
          <div className="container">
            <div className="sd-sechead">
              <span className="sd-tag">Best for</span>
              <h2>Where this solution fits</h2>
            </div>
            <div className="bf-grid">
              {s.bestFor.map((b) => (
                <article key={b.scenario} className="bf-card">
                  <h3>{b.scenario}</h3>
                  <p>{b.note}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* design considerations */}
      {s.considerations.length > 0 && (
        <section className="sd-sec">
          <div className="container">
            <div className="sd-sechead">
              <span className="sd-tag">Design considerations</span>
              <h2>What we check before speccing the build</h2>
            </div>
            <div className="dc-grid">
              {s.considerations.map((c, i) => (
                <article key={c.title} className="dc-item">
                  <span className="dc-num">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3>{c.title}</h3>
                    <p>{c.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* recommended ENVO series */}
      {s.series.length > 0 && (
        <section className="sd-sec sd-band">
          <div className="container">
            <div className="sd-sechead">
              <span className="sd-tag">Recommended ENVO series</span>
              <h2>Start with these series</h2>
            </div>
            <div className="sr-grid">
              {s.series.map((r) => (
                <Link key={r.name} href={r.href} className="sr-card">
                  <div className={r.img.endsWith('.png') ? 'sr-img is-contain' : 'sr-img'}>
                    <Image src={r.img} alt={r.name} fill sizes="(min-width: 900px) 25vw, 100vw" />
                  </div>
                  <div className="sr-body">
                    <span className="sr-name">{r.name}</span>
                    <p className="sr-blurb">{r.blurb}</p>
                    <span className="sr-link">
                      View series <span>→</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* typical kit */}
      <section className="sd-sec sd-kit">
        <div className="container">
          <div className="kit-head">
            <span className="sd-tag">The typical kit</span>
            <h2>{s.kitHeading}</h2>
            <p>{s.kitLede}</p>
          </div>
          <div className="kit-grid">
            {s.kit.map((k) => (
              <article key={k.name} className={k.envo ? 'kc' : 'kc is-compat'}>
                <div className="kc-img">
                  <Image src={k.img} alt={k.name} width={180} height={120} />
                </div>
                <div className="kc-body">
                  <span className={k.envo ? 'kc-role' : 'kc-role is-compat'}>
                    {k.envo ? k.role : `${k.role} · compatible`}
                  </span>
                  <div className="kc-name">{k.name}</div>
                  <p className="kc-desc">{k.desc}</p>
                  <ul className="kc-spec">
                    {k.spec.map(([key, val]) => (
                      <li key={key}>
                        <span className="k">{key}</span>
                        <span className="v">{val}</span>
                      </li>
                    ))}
                  </ul>
                  {k.envo && k.href ? (
                    <Link href={k.href} className="kc-details">
                      View series <span>→</span>
                    </Link>
                  ) : (
                    <span className="kc-note">Supplied via authorised channels</span>
                  )}
                </div>
              </article>
            ))}
          </div>
          {hasCompat && (
            <p className="kit-legend">
              <span className="lg-dot lg-envo" /> ENVO products link to full specs.
              &nbsp;<span className="lg-dot lg-compat" /> &ldquo;Compatible&rdquo; parts aren&rsquo;t
              ENVO-branded — we spec them and an authorised purchasing channel supplies them in the same order.
            </p>
          )}
        </div>
      </section>

      {/* when to choose alternatives */}
      {s.alternatives.length > 0 && (
        <section className="sd-sec">
          <div className="container">
            <div className="sd-sechead">
              <span className="sd-tag">When to choose alternatives</span>
              <h2>When another fit is better</h2>
            </div>
            <div className="alt-rows">
              {s.alternatives.map((a) => (
                <div key={a.when} className="alt-row">
                  <span className="alt-when">{a.when}</span>
                  <span className="alt-arrow">→</span>
                  {a.href ? (
                    <Link href={a.href} className="alt-choose">
                      {a.choose}
                    </Link>
                  ) : (
                    <span className="alt-choose is-plain">{a.choose}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* free layout design CTA */}
      <section className="sd-sec sd-fld-sec">
        <div className="container">
          <div className="fld-cta">
            <div>
              <h2>Not sure where to start? Get a free layout.</h2>
              <p>
                Send your dimensions or elevation and our engineers return a module layout with a
                full bill of materials — free, no commitment.
              </p>
            </div>
            <EnvoButton href="/free-layout-design" variant="primary" arrow className="fld-btn">
              Get a free layout design
            </EnvoButton>
          </div>
        </div>
      </section>

      {/* distributor CTA */}
      <section className="sd-sec sd-cta-sec">
        <div className="container">
          <div className="dist-cta">
            <div className="dist-cta-inner">
              <div>
                <h2>Source the complete kit through authorised purchasing channels</h2>
                <p>
                  ENVO products are supplied through authorised purchasing channels worldwide, which
                  hold pricing and stock and ship the ENVO products and the compatible parts together
                  in one order. Choose a channel to get started.
                </p>
              </div>
              <div className="dist-actions">
                {PURCHASE_CHANNELS.map((c) => (
                  <a
                    key={c.id}
                    href={c.url}
                    className="dist-chan"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>
                      <span className="dist-region">{c.channelLabel}</span>
                      <br />
                      <span className="dist-name">{c.urlLabel}</span>
                    </span>
                    <span className="dist-arrow">→</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
