import Image from 'next/image'
import Link from 'next/link'

export function Footer() {
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
            <a href="mailto:contact@envo.com" className="footer-brand-email">
              contact@envo.com
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

          <div className="footer-col">
            <h5>Solutions</h5>
            <ul>
              <li><Link href="/solutions/signage-lighting">Signage Lighting</Link></li>
              <li><Link href="/solutions/architectural-lighting">Architectural Lighting</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>Support</h5>
            <ul>
              <li><Link href="/free-layout-design">Free Layout Design</Link></li>
              <li><Link href="/support/resources">Resources &amp; Downloads</Link></li>
              <li><Link href="/support/tools">Tools &amp; Guides</Link></li>
              <li><Link href="/contact">Contact Us</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>Company</h5>
            <ul>
              <li><Link href="/about">About ENVO</Link></li>
              <li><span aria-disabled="true">News</span></li>
              <li><span aria-disabled="true">Careers</span></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} ENVO — Engineered Illumination</p>
          <div className="footer-legal">
            <span aria-disabled="true">Privacy Policy</span>
            <span aria-disabled="true">Terms of Use</span>
            <span aria-disabled="true">Sitemap</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
