import type { Metadata } from 'next'
import Link from 'next/link'
import { ResourceLibrary } from '@/components/resources/resource-library'
import { getDatasheetLibrary } from '@/lib/resource-library'
import { metadataForRoute } from '@/lib/page-seo'
import '@/components/resources/resources.css'

export async function generateMetadata(): Promise<Metadata> {
  return metadataForRoute('/resources', {
    title: 'Resources — ENVO',
    description:
      'The ENVO technical library — datasheets, installation guides, certificates, CAD/IES files and warranty docs. Specify, quote and install in one place.',
  })
}

export default async function ResourcesPage() {
  const datasheets = await getDatasheetLibrary()
  return (
    <div className="rd-wrap">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">›</span>
          <span>Resources</span>
        </div>

        {/* ===== HEADER ===== */}
        <header className="rd-head">
          <span className="rd-eyebrow">Resources</span>
          <h1>Specs, drawings, downloads.</h1>
          <p className="rd-sub">
            Everything you need to specify, quote and install — in one place.
          </p>
        </header>

        {/* ===== LIBRARY (search + filters + list) ===== */}
        <ResourceLibrary docs={datasheets} />

        {/* ===== BOTTOM TRIPTYCH ===== */}
        <div className="rd-tri">
          <div className="rd-tile is-accent">
            <span className="rd-ti" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M4 4h16v16H4z" />
                <path d="M4 7l8 6 8-6" />
              </svg>
            </span>
            <h3>Request a document</h3>
            <p>
              Tell us the model — older versions, a certificate or a custom datasheet. Usually same
              day.
            </p>
            <Link className="rd-req-btn" href="/contact">
              Request →
            </Link>
          </div>

          <div className="rd-tile">
            <span className="rd-ti is-blue" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            </span>
            <h3>Browse by product</h3>
            <p>Every datasheet also lives on its own product page, next to the specs.</p>
            <Link className="rd-go" href="/products">
              View products <span>→</span>
            </Link>
          </div>

          <div className="rd-tile">
            <span className="rd-ti is-blue" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M21 11.5a8.38 8.38 0 0 1-9 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5z" />
              </svg>
            </span>
            <h3>Chat with support</h3>
            <p>Spec help, compatibility and lead-time questions — talk to our technical team.</p>
            <Link className="rd-go" href="/contact">
              Start a chat <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
