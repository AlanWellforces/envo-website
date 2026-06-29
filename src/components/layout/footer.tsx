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
            <address className="footer-brand-contact">
              <a href="tel:+18882289138">888.228.9138</a>
            </address>
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
            <h5>Resources</h5>
            <ul>
              <li><Link href="/find-your-match">Find Your Match</Link></li>
              <li><Link href="/free-layout-design">Free Layout Design</Link></li>
              <li><Link href="/resources/downloads">Resources &amp; Downloads</Link></li>
              <li><Link href="/resources/tools">Tools &amp; Guides</Link></li>
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
          <p>© {new Date().getFullYear()} ENVO — Engineered Illumination</p>
          <div className="footer-legal">
            <Link href="/terms-of-service">Terms of Service</Link>
            <Link href="/shipping-policy">Shipping Policy</Link>
            <Link href="/cancellation-policy">Cancellation Policy</Link>
            <Link href="/return-policy">Return Policy</Link>
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/cookie-policy">Cookie Policy</Link>
            <Link href="/acceptable-use-policy">Acceptable Use Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
