import Image from 'next/image'
import Link from 'next/link'
import { SOLUTIONS } from '@/data/solutions'
import { PURCHASE_CHANNELS } from '@/data/purchase-channels'
import { SolutionGallery } from './SolutionGallery'
import '@/components/solutions/solutions-dark.css'

export function SolutionDetail({ slug }: { slug: string }) {
  const s = SOLUTIONS.find((x) => x.slug === slug)
  if (!s) return null
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

      {/* recommended kit */}
      <section className="sd-sec sd-band sd-kit">
        <div className="container">
          <div className="kit-head">
            <span className="sd-tag">The recommended kit</span>
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
                      View product <span>→</span>
                    </Link>
                  ) : (
                    <span className="kc-note">Supplied via your distributor</span>
                  )}
                </div>
              </article>
            ))}
          </div>
          {hasCompat && (
            <p className="kit-legend">
              <span className="lg-dot lg-envo" /> ENVO products link to full specs.
              &nbsp;<span className="lg-dot lg-compat" /> &ldquo;Compatible&rdquo; parts aren&rsquo;t
              ENVO-branded — we spec them and your distributor supplies them in the same order.
            </p>
          )}
        </div>
      </section>

      {/* distributor CTA */}
      <section className="sd-sec sd-cta-sec">
        <div className="container">
          <div className="dist-cta">
            <div className="dist-cta-inner">
              <div>
                <h2>Source the complete kit from your regional distributor</h2>
                <p>
                  ENVO is a lead-gen brand — pricing and stock sit with our distributors, who supply
                  the ENVO products and the compatible parts together in one order. Pick your region,
                  or get a free layout from our engineers first.
                </p>
                <div className="dist-note">
                  New project?{' '}
                  <Link href="/free-layout-design">
                    Get a free layout — we&rsquo;ll spec the full bill of materials →
                  </Link>
                </div>
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
                      <span className="dist-region">{c.regionLabel}</span>
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
