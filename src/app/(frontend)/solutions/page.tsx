import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { EnvoButton } from '@/components/ui/envo-button'
import { getSolutions } from '@/lib/solutions'
import { metadataForRoute } from '@/lib/page-seo'
import '@/components/solutions/solutions-dark.css'

export async function generateMetadata(): Promise<Metadata> {
  return metadataForRoute('/solutions', {
    title: 'Solutions — ENVO',
    description:
      'Signage and architectural lighting solutions — channel letters, light boxes, edge-lit signage and facade lighting, with a matched module/driver kit for every build.',
  })
}

export default async function SolutionsPage() {
  const solutions = await getSolutions()
  return (
    <div className="sd-wrap">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">›</span>
          <span>Solutions</span>
        </div>
      </div>

      <section className="sd-hero">
        <div className="container">
          <span className="sd-eyebrow">Solutions · By application</span>
          <h1>Built for where light has to perform.</h1>
          <p className="sd-hero-desc">
            From storefront signage to full media facades — matched systems, engineered for the
            environment they live in.
          </p>
        </div>
      </section>

      <section className="sd-rows">
        <div className="container">
          {solutions.map((s) => (
            <article key={s.slug} className="sd-row">
              <div className="sd-media">
                <Image src={s.img} alt={s.name} fill sizes="(min-width: 900px) 40vw, 100vw" />
              </div>
              <div className="sd-body">
                <span className="sd-tag">{s.eyebrow}</span>
                <h2>{s.heroTitle}</h2>
                <p>{s.heroDesc}</p>
                <ul className="sd-checks">
                  {s.checklist.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
                <EnvoButton href={s.href} variant="primary" arrow className="sd-btn">
                  View solution &amp; kit
                </EnvoButton>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
