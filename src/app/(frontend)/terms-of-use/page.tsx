import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Terms of Use — ENVO',
  description: 'The terms that govern your use of the ENVO website.',
}

export default function TermsOfUsePage() {
  return (
    <LegalPage title="Terms of Use" updated="4 June 2026">
      <p>
        These terms govern your use of the ENVO website. By using the site you agree to them. This
        is an informational brand site; it does not sell products. Any purchase you make is governed
        by the separate terms of the regional distributor you buy from.
      </p>

      <h2>Use of this site</h2>
      <p>You may view and download material from this site for your own reference. You must not:</p>
      <ul>
        <li>republish, sell or redistribute our material without permission;</li>
        <li>copy or reproduce content other than for your own legitimate use;</li>
        <li>use the site unlawfully, or in a way that harms or disrupts it or other users;</li>
        <li>harvest data from the site, or attempt to gain unauthorised access.</li>
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
        updated without notice. Always confirm critical specifications (such as load, voltage and
        IP rating) for your project — our free layout design service can help.
      </p>

      <h2>Disclaimer &amp; liability</h2>
      <p>
        The site and its materials are provided “as is”, without warranties of any kind. To the
        extent permitted by law, ENVO is not liable for any loss or damage arising from your use of,
        or inability to use, the site.
      </p>

      <h2>External links</h2>
      <p>
        We link to distributor and partner sites for your convenience. We do not control and are not
        responsible for their content or terms.
      </p>

      <h2>Changes &amp; termination</h2>
      <p>
        We may update these terms or the site at any time, and may restrict access where these terms
        are breached. If any provision is found unenforceable, the remaining terms still apply.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms? Email <a href="mailto:contact@envo-led.com">contact@envo-led.com</a> or
        call 888.228.9138.
      </p>
    </LegalPage>
  )
}
