import Image from 'next/image'
import Link from 'next/link'
import { getFooterLegalPages } from '@/lib/cms-pages'
import { getSolutions } from '@/lib/solutions'
import { getSiteSettings } from '@/lib/site-settings'

const SOCIAL_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  facebook: 'Facebook',
  youtube: 'YouTube',
  twitter: 'X',
}

export async function Footer() {
  const [legal, solutions, settings] = await Promise.all([
    getFooterLegalPages(),
    getSolutions(),
    getSiteSettings(),
  ])
  const email = settings.contact?.email || 'contact@envolighting.com'
  const social = settings.footer?.social_links ?? []
  return (
    <footer>
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            {/* Attrs = the SVG's intrinsic size (923.42×170.9); CSS scales it
                to height 22px. Attrs that half-match the rendered size (the
                old 120×22 — height hit, width missed by the ~5.4 ratio)
                trip Next's dev aspect-ratio warning. */}
            <Image
              src="/assets/images/logo-envo-darkbg.svg"
              alt="ENVO"
              width={923}
              height={171}
              style={{ height: '22px', width: 'auto' }}
            />
            <p>{settings.footer?.tagline || 'Engineered illumination to elevate performance.'}</p>
            <a href={`mailto:${email}`} className="footer-brand-email">
              {email}
            </a>
          </div>

          <div className="footer-col">
            <h5>Products</h5>
            <ul>
              <li><Link href="/products/led-signage-modules">Signage Modules</Link></li>
              <li><Link href="/products/led-drivers">LED Drivers</Link></li>
              <li><Link href="/products/control-gear">Control Gear</Link></li>
              {/* Accessories hidden until it has live products — see
                  docs/superpowers/plans/2026-07-08-hidden-features.md
              <li><Link href="/products/accessories">Accessories</Link></li> */}
            </ul>
          </div>

          {solutions.length > 0 && (
            <div className="footer-col">
              <h5>Solutions</h5>
              <ul>
                {solutions.map((s) => (
                  <li key={s.slug}><Link href={s.href}>{s.name}</Link></li>
                ))}
              </ul>
            </div>
          )}

          <div className="footer-col">
            <h5>Resources</h5>
            <ul>
              <li><Link href="/free-layout-design">Free Layout Design</Link></li>
              {/* the datasheet library at /resources is the hub (post-#139);
                  /resources/downloads is just one of its sub-pages */}
              <li><Link href="/resources">Resources &amp; Downloads</Link></li>
              <li><Link href="/contact">Contact Us</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>Company</h5>
            <ul>
              <li><Link href="/about">About ENVO</Link></li>
              <li><Link href="/blog">Blog</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>{settings.footer?.legal_text || `© ${new Date().getFullYear()} Envo — Engineered Illumination`}</p>
          <div className="footer-legal">
            {social.map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">
                {SOCIAL_LABELS[s.platform] ?? s.platform}
              </a>
            ))}
            {legal.map((l) => (
              <Link key={l.href} href={l.href}>{l.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
