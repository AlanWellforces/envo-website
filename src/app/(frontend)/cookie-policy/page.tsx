import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Cookie Policy — ENVO',
  description: 'How and why ENVO uses cookies on this website.',
}

export default function CookiePolicyPage() {
  return (
    <LegalPage title="Cookie Policy" updated="30 June 2026">
      <p>
        We use cookies to help improve your experience of this website. This Cookie Policy is part
        of our <a href="/privacy-policy">Privacy Policy</a> and covers the use of cookies between
        your device and our site. We also use some third-party services that may set their own
        cookies; this policy does not cover those third parties’ cookies.
      </p>
      <p>
        If you do not wish to accept cookies, you can set your browser to refuse them. Some parts of
        the site may then work less well.
      </p>

      <h2>What is a cookie?</h2>
      <p>
        A cookie is a small piece of data a website stores on your device when you visit. It
        typically holds information about the site, a unique identifier that lets the site recognise
        your browser when you return, data that serves the cookie’s purpose, and the cookie’s
        lifespan. Cookies set by the site you are visiting are “first-party” cookies; cookies set by
        other companies are “third-party” cookies and may track you across other sites that use the
        same service.
      </p>

      <h2>Types of cookies we use</h2>
      <ul>
        <li><strong>Essential cookies</strong> — enable core functionality of the site.</li>
        <li><strong>Performance cookies</strong> — help us understand, usually anonymously and in aggregate, how the site is used so we can improve it.</li>
        <li><strong>Functionality cookies</strong> — remember settings such as your region or language to give you a more tailored experience.</li>
        <li><strong>Targeting / advertising cookies</strong> — help measure and improve the relevance of any marketing; these may be set by third parties.</li>
      </ul>

      <h2>Managing cookies</h2>
      <p>
        You can block or delete cookies through your browser settings at any time. Doing so may
        affect how some features of the site behave.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about our use of cookies? Email{' '}
        <a href="mailto:contact@envo-led.com">contact@envo-led.com</a> or call 888.228.9138.
      </p>
    </LegalPage>
  )
}
