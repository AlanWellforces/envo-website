import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Cancellation Policy — ENVO',
  description: 'How to cancel an ENVO order placed through one of our regional distributors.',
}

export default function CancellationPolicyPage() {
  return (
    <LegalPage title="Cancellation Policy" updated="30 June 2026">
      <p>
        This site does not take orders — purchases are placed and fulfilled by Envo’s regional
        distributors, and cancellations are handled by the distributor you ordered from. This page
        explains how cancellation generally works; your distributor’s terms govern your specific
        order.
      </p>

      <h2>Cancelling an order</h2>
      <p>
        Orders begin processing soon after they are placed. While an order is still in processing it
        may be possible to cancel it, but once it moves into the shipping process it generally cannot
        be cancelled. Cancellation is not guaranteed.
      </p>

      <h2>How to request a cancellation</h2>
      <p>
        To attempt to cancel, contact your distributor as soon as possible. If you are unsure who to
        reach, email <a href="mailto:contact@envo-led.com">contact@envo-led.com</a> or call
        888.228.9138 (Mon–Fri, 9:00am–5:30pm EST) and we will direct you.
      </p>

      <h2>If an order cannot be cancelled</h2>
      <p>
        Where an order can no longer be cancelled, you may instead be able to return the goods once
        delivered — see our <a href="/return-policy">Return Policy</a> for the conditions that apply.
      </p>

      <h2>Contact</h2>
      <p>
        Email <a href="mailto:contact@envo-led.com">contact@envo-led.com</a>, call 888.228.9138, or
        write to 409 Canton Street, Unit 5, Stoughton, MA 02072, USA.
      </p>
    </LegalPage>
  )
}
