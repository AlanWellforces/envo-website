import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Terms of Service — ENVO',
  description: 'The terms that govern your use of the ENVO website.',
}

export default function TermsOfServicePage() {
  return (
    <LegalPage title="Terms of Service" updated="30 June 2026">
      <p>
        These Terms of Service govern your use of this website and any related services provided by
        ENVO. By accessing the site you agree to abide by these terms and to comply with all
        applicable laws and regulations. If you do not agree, you must not use the site. This is an
        informational brand site; it does not sell products or process payments. Any purchase you
        make is governed by the separate terms of the regional distributor you buy from.
      </p>
      <p>We may review and amend these terms at our discretion; changes take effect when posted here.</p>

      <h2>Limitations of use</h2>
      <p>By using this website you warrant that you will not:</p>
      <ul>
        <li>modify, copy, prepare derivative works of, decompile or reverse engineer any materials or software on this site;</li>
        <li>remove any copyright or proprietary notices from any materials on this site;</li>
        <li>transfer the materials to another person or “mirror” them on any other server;</li>
        <li>use the site in a way that abuses or disrupts our networks or any service we provide;</li>
        <li>use the site to transmit or publish any harassing, indecent, obscene, fraudulent or unlawful material;</li>
        <li>use the site in violation of any applicable laws or regulations, or to send unauthorised advertising or spam;</li>
        <li>harvest or collect user data without consent; or</li>
        <li>use the site in a way that may infringe the privacy, intellectual property or other rights of third parties.</li>
      </ul>

      <h2>Intellectual property</h2>
      <p>
        The content, branding, images and materials on this site are owned by or licensed to ENVO.
        You are granted a limited, personal, non-commercial licence to view them; all other rights
        are reserved.
      </p>

      <h2>Accuracy of materials</h2>
      <p>
        Product specifications and other information are provided for general guidance and may be
        updated without notice. We make no warranty as to the accuracy, completeness or reliability
        of the materials. Always confirm critical specifications (such as load, voltage and IP
        rating) for your project — our free layout design service can help.
      </p>

      <h2>Disclaimer &amp; liability</h2>
      <p>
        The site and its materials are provided “as is”, without warranties of any kind. To the
        extent permitted by law, ENVO is not liable for any loss or damage arising from your use of,
        or inability to use, the site.
      </p>

      <h2>External links</h2>
      <p>
        We link to distributor and partner sites for your convenience. We have not reviewed all
        linked sites and are not responsible for their content or terms; the inclusion of a link
        does not imply endorsement. Use of any linked site is at your own risk.
      </p>

      <h2>Right to terminate</h2>
      <p>
        We may suspend or terminate your right to use the site immediately, upon written notice, for
        any breach of these terms.
      </p>

      <h2>Severance &amp; governing law</h2>
      <p>
        If any provision of these terms is wholly or partly unenforceable, it is severed to that
        extent and the remainder continues to apply. These terms are governed by the laws of the
        United States, and you submit to the exclusive jurisdiction of its courts.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms? Email{' '}
        <a href="mailto:contact@envo-led.com">contact@envo-led.com</a>, call 888.228.9138, or write
        to 409 Canton Street, Unit 5, Stoughton, MA 02072, USA.
      </p>
    </LegalPage>
  )
}
