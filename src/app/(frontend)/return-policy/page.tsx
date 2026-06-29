import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Return Policy — ENVO',
  description: 'How returns, warranty claims and repairs are handled for ENVO products.',
}

export default function ReturnPolicyPage() {
  return (
    <LegalPage title="Return Policy" updated="30 June 2026">
      <p>
        Purchases are completed through ENVO’s regional distributors, and returns are processed under
        a Return Merchandise Authorisation (RMA). Start any return with the distributor you bought
        from; the conditions below reflect ENVO’s standard RMA terms.
      </p>

      <h2>Returns for credit</h2>
      <p>
        Approval for a credit return must be requested on an ENVO Return Authorisation (RMA) request
        and is at ENVO’s discretion, subject to the following conditions:
      </p>
      <ul>
        <li>returned within 30 days of RMA approval and within 30 days of the invoice date;</li>
        <li>clearly labelled with the RMA number on the shipment packaging;</li>
        <li>in a condition fit for resale — in original packaging, unsoiled and undamaged;</li>
        <li>returned freight-paid, with all costs (including the original shipping cost) payable by the customer.</li>
      </ul>
      <p>
        Goods accepted under RMA are replaced or exchanged; refunds are not provided. No credit is
        issued for goods that were specially imported or manufactured to order, returned without an
        approved RMA number, or returned in a condition unfit for resale.
      </p>
      <p>
        Returns are not typically accepted beyond 30 days from invoice. Outside this window, a
        minimum 15% restocking and administration fee may apply at ENVO’s discretion.
      </p>

      <h2>Returns for warranty / repair</h2>
      <p>A warranty or repair return also requires an approved RMA. Please ensure that goods are:</p>
      <ul>
        <li>returned within 30 days of RMA approval and clearly labelled with the RMA number;</li>
        <li>complete, with all parts and accessories (cables, terminal covers, screws);</li>
        <li>returned freight-paid unless otherwise agreed.</li>
      </ul>
      <p>
        Typical turnaround for testing and repair is 3–5 working days, though this may be longer
        where sustained testing or replacement parts are required. When requesting an RMA, please
        provide a clear, specific fault description — we cannot accept descriptions such as “faulty”,
        “no go” or “doesn’t work”.
      </p>

      <h2>Incorrect shipping address</h2>
      <p>
        Please take care when entering a delivery address. We cannot credit freight costs incurred
        because of an incorrect address — double-check the address and add any delivery instructions
        when ordering.
      </p>

      <h2>Contact</h2>
      <p>
        To start a return or request an RMA, email{' '}
        <a href="mailto:contact@envo-led.com">contact@envo-led.com</a>, call 888.228.9138 (Mon–Fri,
        9:00am–5:30pm EST), or write to 409 Canton Street, Unit 5, Stoughton, MA 02072, USA.
      </p>
    </LegalPage>
  )
}
