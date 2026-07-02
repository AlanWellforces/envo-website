import Image from 'next/image'
import Link from 'next/link'
import { getFooterLegalPages } from '@/lib/cms-pages'
import { getSolutions } from '@/lib/solutions'

export async function Footer() {
  const [legal, solutions] = await Promise.all([getFooterLegalPages(), getSolutions()])
  return (
    <footer>
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Image
              src="/assets/images/logo-envo-darkbg.svg"
              alt="ENVO"
              width={120}
              height={22}
            />
            <p>Engineered illumination to elevate performance.</p>
            <a href="mailto:contact@envo-led.com" className="footer-brand-email">
              contact@envo-led.com
            </a>
          </div>

          <div className="footer-col">
            <h5>Products</h5>
            <ul>
              <li><Link href="/products/led-signage-modules">Signage Module</Link></li>
              <li><Link href="/products/led-drivers">LED Driver</Link></li>
              <li><Link href="/products/control-gear">Control Gear</Link></li>
              <li><Link href="/products/accessories">Accessories</Link></li>
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
              <li><Link href="/find-your-match">Find Your Match</Link></li>
              <li><Link href="/free-layout-design">Free Layout Design</Link></li>
              <li><Link href="/resources/downloads">Resources &amp; Downloads</Link></li>
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
          <p>© {new Date().getFullYear()} Envo — Engineered Illumination</p>
          <div className="footer-legal">
            {legal.map((l) => (
              <Link key={l.href} href={l.href}>{l.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
