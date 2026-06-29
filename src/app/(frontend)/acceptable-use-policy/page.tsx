import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Acceptable Use Policy — ENVO',
  description: 'The acceptable use rules for ENVO’s website, products and services.',
}

export default function AcceptableUsePolicyPage() {
  return (
    <LegalPage title="Acceptable Use Policy" updated="30 June 2026">
      <p>
        This Acceptable Use Policy covers the website, products, services and technologies
        (collectively, the “Products”) provided by Envo. Its purpose is to protect Envo, our
        customers and the wider internet community from unethical, irresponsible or illegal activity.
        Violations may result in suspension or termination of access and, where appropriate, referral
        to the authorities.
      </p>

      <h2>Fair use</h2>
      <p>
        You must use the Products reasonably and as intended. Excessive or abusive use that affects
        other users or the operation of our services may be restricted.
      </p>

      <h2>Your responsibility</h2>
      <p>
        You are responsible for your own activity and for that of anyone you authorise to use the
        Products on your behalf. You must ensure they comply with this policy; serious or repeated
        violations may result in immediate termination of access without notice.
      </p>

      <h2>Prohibited activity</h2>
      <p>You must not use the Products to engage in or facilitate:</p>
      <ul>
        <li>copyright infringement or the distribution of unauthorised material;</li>
        <li>spam or unsolicited messaging;</li>
        <li>hacking, malware, or denial-of-service attacks;</li>
        <li>harassment, hate speech or discrimination;</li>
        <li>fraud or unauthorised access to systems or data;</li>
        <li>child exploitation material; or</li>
        <li>illegal gambling, terrorism, weapons trafficking or narcotics.</li>
      </ul>

      <h2>Unauthorised use of Envo property</h2>
      <p>
        You must not impersonate Envo or fraudulently represent a business relationship with Envo.
      </p>

      <h2>Contact</h2>
      <p>
        To report a violation or ask about this policy, email{' '}
        <a href="mailto:contact@envo-led.com">contact@envo-led.com</a>, call 888.228.9138 (Mon–Fri,
        9:00am–5:30pm EST), or write to 409 Canton Street, Unit 5, Stoughton, MA 02072, USA.
      </p>
    </LegalPage>
  )
}
