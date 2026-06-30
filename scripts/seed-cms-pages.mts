// Seed 4 policy pages into the Payload 'pages' collection.
// Run with: npx tsx --tsconfig tsconfig.json scripts/seed-cms-pages.mts
//
// Idempotent: update if a doc with the slug exists, create otherwise.

import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// Load .env.local BEFORE importing the payload config (buildConfig reads
// PAYLOAD_SECRET / DATABASE_URL at import time).
for (const line of fs.readFileSync(path.join(root, '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const payloadLoadEnvDir = path.join(root, 'node_modules/payload/dist/bin')
const _requireFromPayload = createRequire(path.join(payloadLoadEnvDir, 'dummy.js'))
const nextEnvExports = _requireFromPayload('@next/env')
if (!nextEnvExports.default) nextEnvExports.default = nextEnvExports

const configMod = await import('../src/payload.config.ts')
const config = await (configMod.default ?? configMod)
const { getPayload } = await import('payload')
const payload = await getPayload({ config })

const { doc, h2, p, ul, text, b, link } = await import('../src/lib/lexical-build.ts')

// ---------------------------------------------------------------------------
// Page definitions — content ported 1:1 from each route's JSX source of truth
// ---------------------------------------------------------------------------

const PAGES = [
  // -------------------------------------------------------------------------
  // Privacy Policy  (src/app/(frontend)/privacy-policy/page.tsx)
  // 12 sections: intro + 11 h2 sections
  // -------------------------------------------------------------------------
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    showInFooter: true,
    seoTitle: 'Privacy Policy — ENVO',
    metaDescription: 'How ENVO collects, uses and protects the information you share through this website.',
    content: doc(
      p(text('This Privacy Policy explains how Envo (“we”, “us”) handles information you provide through this website. This is a brand and product-information site — it does not sell products or process payments. Purchases are completed through our regional distributors, who operate their own websites and privacy practices.')),

      h2('Information we collect'),
      p(text('We collect only what you choose to share and basic technical data:')),
      ul([
        [b('Enquiry details'), text(' — the name, company, email, phone number and message you submit through our contact, free-layout-design or “find your match” forms.')],
        [b('Usage data'), text(' — standard technical information your browser sends (IP address, device/browser type, pages viewed), and analytics gathered via cookies.')],
      ]),
      p(text('We do not take payment, shipping or order information on this site.')),

      h2('How we use it'),
      ul([
        [text('To respond to your enquiry and provide layout/selection advice.')],
        [text('To route you to the right regional distributor.')],
        [text('To maintain, secure and improve the website.')],
        [text('To send you updates only where you have asked us to.')],
      ]),

      h2('Cookies & analytics'),
      p(text('We use cookies for core functionality and to understand how the site is used. You can block or delete cookies in your browser settings; some features may then work less well.')),

      h2('Sharing'),
      p(text('We do not sell your personal information. We share it only with service providers who help us run the site (e.g. hosting, email, analytics), with our regional distributors when we pass on an enquiry you have made, and where required by law.')),

      h2('Third-party links'),
      p(text('Our site links to distributor and partner sites. We are not responsible for the privacy practices or content of those external sites.')),

      h2('Children'),
      p(text('This site is intended for business users and is not directed at children. We do not knowingly collect children’s information.')),

      h2('Security & retention'),
      p(text('We take reasonable measures to protect your information but no method of transmission is completely secure. We keep enquiry data only as long as needed to respond to and follow up on your request, and as required by law.')),

      h2('Your rights'),
      p(text('Depending on where you live, you may have the right to access, correct, delete or port your information, or to object to or restrict its use. To make a request, contact us using the details below. You can unsubscribe from any optional updates at any time.')),

      h2('International transfers'),
      p(text('Envo operates across multiple regions. Where information is transferred internationally, we use appropriate safeguards.')),

      h2('Changes'),
      p(text('We may update this policy from time to time; the “last updated” date above reflects the latest version.')),

      h2('Contact'),
      p(text('Questions about this policy? Email '), link('contact@envo-led.com', 'mailto:contact@envo-led.com'), text(', call 888.228.9138, or write to 409 Canton Street, Unit 5, Stoughton, MA 02072, USA.')),
    ),
  },

  // -------------------------------------------------------------------------
  // Terms of Service  (src/app/(frontend)/terms-of-service/page.tsx)
  // 10 sections: 2 intro paras + 8 h2 sections
  // -------------------------------------------------------------------------
  {
    slug: 'terms-of-service',
    title: 'Terms of Service',
    showInFooter: true,
    seoTitle: 'Terms of Service — ENVO',
    metaDescription: 'The terms that govern your use of the ENVO website.',
    content: doc(
      p(text('These Terms of Service govern your use of this website and any related services provided by Envo. By accessing the site you agree to abide by these terms and to comply with all applicable laws and regulations. If you do not agree, you must not use the site. This is an informational brand site; it does not sell products or process payments. Any purchase you make is governed by the separate terms of the regional distributor you buy from.')),
      p(text('We may review and amend these terms at our discretion; changes take effect when posted here.')),

      h2('Limitations of use'),
      p(text('By using this website you warrant that you will not:')),
      ul([
        [text('modify, copy, prepare derivative works of, decompile or reverse engineer any materials or software on this site;')],
        [text('remove any copyright or proprietary notices from any materials on this site;')],
        [text('transfer the materials to another person or “mirror” them on any other server;')],
        [text('use the site in a way that abuses or disrupts our networks or any service we provide;')],
        [text('use the site to transmit or publish any harassing, indecent, obscene, fraudulent or unlawful material;')],
        [text('use the site in violation of any applicable laws or regulations, or to send unauthorised advertising or spam;')],
        [text('harvest or collect user data without consent; or')],
        [text('use the site in a way that may infringe the privacy, intellectual property or other rights of third parties.')],
      ]),

      h2('Intellectual property'),
      p(text('The content, branding, images and materials on this site are owned by or licensed to Envo. You are granted a limited, personal, non-commercial licence to view them; all other rights are reserved.')),

      h2('Accuracy of materials'),
      p(text('Product specifications and other information are provided for general guidance and may be updated without notice. We make no warranty as to the accuracy, completeness or reliability of the materials. Always confirm critical specifications (such as load, voltage and IP rating) for your project — our free layout design service can help.')),

      h2('Disclaimer & liability'),
      p(text('The site and its materials are provided “as is”, without warranties of any kind. To the extent permitted by law, Envo is not liable for any loss or damage arising from your use of, or inability to use, the site.')),

      h2('External links'),
      p(text('We link to distributor and partner sites for your convenience. We have not reviewed all linked sites and are not responsible for their content or terms; the inclusion of a link does not imply endorsement. Use of any linked site is at your own risk.')),

      h2('Right to terminate'),
      p(text('We may suspend or terminate your right to use the site immediately, upon written notice, for any breach of these terms.')),

      h2('Severance & governing law'),
      p(text('If any provision of these terms is wholly or partly unenforceable, it is severed to that extent and the remainder continues to apply. These terms are governed by the laws of the United States, and you submit to the exclusive jurisdiction of its courts.')),

      h2('Contact'),
      p(text('Questions about these terms? Email '), link('contact@envo-led.com', 'mailto:contact@envo-led.com'), text(', call 888.228.9138, or write to 409 Canton Street, Unit 5, Stoughton, MA 02072, USA.')),
    ),
  },

  // -------------------------------------------------------------------------
  // Cookie Policy  (src/app/(frontend)/cookie-policy/page.tsx)
  // 6 sections: 2 intro paras + 4 h2 sections
  // -------------------------------------------------------------------------
  {
    slug: 'cookie-policy',
    title: 'Cookie Policy',
    showInFooter: true,
    seoTitle: 'Cookie Policy — ENVO',
    metaDescription: 'How and why ENVO uses cookies on this website.',
    content: doc(
      p(
        text('We use cookies to help improve your experience of this website. This Cookie Policy is part of our '),
        link('Privacy Policy', '/privacy-policy'),
        text(' and covers the use of cookies between your device and our site. We also use some third-party services that may set their own cookies; this policy does not cover those third parties’ cookies.'),
      ),
      p(text('If you do not wish to accept cookies, you can set your browser to refuse them. Some parts of the site may then work less well.')),

      h2('What is a cookie?'),
      p(text('A cookie is a small piece of data a website stores on your device when you visit. It typically holds information about the site, a unique identifier that lets the site recognise your browser when you return, data that serves the cookie’s purpose, and the cookie’s lifespan. Cookies set by the site you are visiting are “first-party” cookies; cookies set by other companies are “third-party” cookies and may track you across other sites that use the same service.')),

      h2('Types of cookies we use'),
      ul([
        [b('Essential cookies'), text(' — enable core functionality of the site.')],
        [b('Performance cookies'), text(' — help us understand, usually anonymously and in aggregate, how the site is used so we can improve it.')],
        [b('Functionality cookies'), text(' — remember settings such as your region or language to give you a more tailored experience.')],
        [b('Targeting / advertising cookies'), text(' — help measure and improve the relevance of any marketing; these may be set by third parties.')],
      ]),

      h2('Managing cookies'),
      p(text('You can block or delete cookies through your browser settings at any time. Doing so may affect how some features of the site behave.')),

      h2('Contact'),
      p(text('Questions about our use of cookies? Email '), link('contact@envo-led.com', 'mailto:contact@envo-led.com'), text(' or call 888.228.9138.')),
    ),
  },

  // -------------------------------------------------------------------------
  // Acceptable Use Policy  (src/app/(frontend)/acceptable-use-policy/page.tsx)
  // 6 sections: intro + 5 h2 sections
  // -------------------------------------------------------------------------
  {
    slug: 'acceptable-use-policy',
    title: 'Acceptable Use Policy',
    showInFooter: true,
    seoTitle: 'Acceptable Use Policy — ENVO',
    metaDescription: 'The acceptable use rules for ENVO’s website, products and services.',
    content: doc(
      p(text('This Acceptable Use Policy covers the website, products, services and technologies (collectively, the “Products”) provided by Envo. Its purpose is to protect Envo, our customers and the wider internet community from unethical, irresponsible or illegal activity. Violations may result in suspension or termination of access and, where appropriate, referral to the authorities.')),

      h2('Fair use'),
      p(text('You must use the Products reasonably and as intended. Excessive or abusive use that affects other users or the operation of our services may be restricted.')),

      h2('Your responsibility'),
      p(text('You are responsible for your own activity and for that of anyone you authorise to use the Products on your behalf. You must ensure they comply with this policy; serious or repeated violations may result in immediate termination of access without notice.')),

      h2('Prohibited activity'),
      p(text('You must not use the Products to engage in or facilitate:')),
      ul([
        [text('copyright infringement or the distribution of unauthorised material;')],
        [text('spam or unsolicited messaging;')],
        [text('hacking, malware, or denial-of-service attacks;')],
        [text('harassment, hate speech or discrimination;')],
        [text('fraud or unauthorised access to systems or data;')],
        [text('child exploitation material; or')],
        [text('illegal gambling, terrorism, weapons trafficking or narcotics.')],
      ]),

      h2('Unauthorised use of Envo property'),
      p(text('You must not impersonate Envo or fraudulently represent a business relationship with Envo.')),

      h2('Contact'),
      p(text('To report a violation or ask about this policy, email '), link('contact@envo-led.com', 'mailto:contact@envo-led.com'), text(', call 888.228.9138 (Mon–Fri, 9:00am–5:30pm EST), or write to 409 Canton Street, Unit 5, Stoughton, MA 02072, USA.')),
    ),
  },
]

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

const run = async () => {
  for (const pg of PAGES) {
    const existing = await payload.find({
      collection: 'pages',
      where: { slug: { equals: pg.slug } },
      limit: 1,
    })
    const data = { ...pg, _status: 'published' as const }
    if (existing.docs[0]) {
      await payload.update({ collection: 'pages', id: existing.docs[0].id, data })
      console.log('updated', pg.slug)
    } else {
      await payload.create({ collection: 'pages', data })
      console.log('created', pg.slug)
    }
  }
  process.exit(0)
}

run()
