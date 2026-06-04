import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Privacy Policy — ENVO',
  description:
    'How ENVO collects, uses and protects the information you share through this website.',
}

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="4 June 2026">
      <p>
        This Privacy Policy explains how ENVO (“we”, “us”) handles information you provide through
        this website. This is a brand and product-information site — it does not sell products or
        process payments. Purchases are completed through our regional distributors, who operate
        their own websites and privacy practices.
      </p>

      <h2>Information we collect</h2>
      <p>We collect only what you choose to share and basic technical data:</p>
      <ul>
        <li><strong>Enquiry details</strong> — the name, company, email, phone number and message you submit through our contact, free-layout-design or “find your match” forms.</li>
        <li><strong>Usage data</strong> — standard technical information your browser sends (IP address, device/browser type, pages viewed), and analytics gathered via cookies.</li>
      </ul>
      <p>We do not take payment, shipping or order information on this site.</p>

      <h2>How we use it</h2>
      <ul>
        <li>To respond to your enquiry and provide layout/selection advice.</li>
        <li>To route you to the right regional distributor.</li>
        <li>To maintain, secure and improve the website.</li>
        <li>To send you updates only where you have asked us to.</li>
      </ul>

      <h2>Cookies &amp; analytics</h2>
      <p>
        We use cookies for core functionality and to understand how the site is used. You can
        block or delete cookies in your browser settings; some features may then work less well.
      </p>

      <h2>Sharing</h2>
      <p>
        We do not sell your personal information. We share it only with service providers who help
        us run the site (e.g. hosting, email, analytics), with our regional distributors when we
        pass on an enquiry you have made, and where required by law.
      </p>

      <h2>Third-party links</h2>
      <p>
        Our site links to distributor and partner sites. We are not responsible for the privacy
        practices or content of those external sites.
      </p>

      <h2>Children</h2>
      <p>This site is intended for business users and is not directed at children. We do not knowingly collect children’s information.</p>

      <h2>Security &amp; retention</h2>
      <p>
        We take reasonable measures to protect your information but no method of transmission is
        completely secure. We keep enquiry data only as long as needed to respond to and follow up
        on your request, and as required by law.
      </p>

      <h2>Your rights</h2>
      <p>
        Depending on where you live, you may have the right to access, correct, delete or port your
        information, or to object to or restrict its use. To make a request, contact us using the
        details below. You can unsubscribe from any optional updates at any time.
      </p>

      <h2>International transfers</h2>
      <p>
        ENVO operates across multiple regions. Where information is transferred internationally, we
        use appropriate safeguards.
      </p>

      <h2>Changes</h2>
      <p>We may update this policy from time to time; the “last updated” date above reflects the latest version.</p>

      <h2>Contact</h2>
      <p>
        Questions about this policy? Email <a href="mailto:contact@envo-led.com">contact@envo-led.com</a>,
        call 888.228.9138, or write to 409 Canton Street, Unit 5, Stoughton, MA 02072, USA.
      </p>
    </LegalPage>
  )
}
