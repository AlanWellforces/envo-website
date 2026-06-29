import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Shipping Policy — ENVO',
  description: 'How ENVO orders are shipped and delivered through our regional distributors.',
}

export default function ShippingPolicyPage() {
  return (
    <LegalPage title="Shipping Policy" updated="30 June 2026">
      <p>
        This is a brand and product-information site — it does not take orders or process payments.
        Purchases are completed through ENVO’s regional distributors, who pick, pack and ship your
        order and set their own shipping rates and delivery terms. This page explains, in general
        terms, how shipping typically works; your distributor’s confirmation is the authoritative
        source for your specific order.
      </p>

      <h2>Shipping rates &amp; delivery estimates</h2>
      <p>
        Shipping charges and delivery estimates are quoted and confirmed by your distributor at the
        time of order. Delivery timeframes are estimates and may be affected by customs or
        freight-forwarding delays outside our control.
      </p>

      <h2>Processing time</h2>
      <p>
        Orders are typically processed within 24–48 hours on business days; orders are not shipped
        or delivered on weekends or public holidays. High order volumes may add a short delay — your
        distributor will contact you by email or phone if a significant delay applies.
      </p>

      <h2>P.O. boxes and APO/FPO/DPO addresses</h2>
      <p>
        Many shipments cannot be delivered to P.O. boxes or to APO/FPO/DPO addresses. Please provide
        a physical street address; your distributor will advise if an address cannot be served.
      </p>

      <h2>Shipment confirmation &amp; tracking</h2>
      <p>
        Once your order ships, your distributor will send a shipment confirmation containing your
        tracking number(s). Tracking typically becomes active within 24 hours of dispatch.
      </p>

      <h2>Customs, duties and taxes</h2>
      <p>
        For international shipments, any customs charges, duties and import taxes are the
        responsibility of the recipient and are not included in the product or shipping price.
      </p>

      <h2>Damages</h2>
      <p>
        If your order arrives damaged, keep all packaging and contact your distributor promptly so a
        claim can be raised with the carrier. See our <a href="/return-policy">Return Policy</a> for
        how returns and replacements are handled.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about shipping? Email{' '}
        <a href="mailto:contact@envo-led.com">contact@envo-led.com</a> or call 888.228.9138
        (Mon–Fri, 9:00am–5:30pm EST). We’ll point you to the right regional distributor.
      </p>
    </LegalPage>
  )
}
