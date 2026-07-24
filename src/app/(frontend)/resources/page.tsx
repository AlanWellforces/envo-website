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
      'The ENVO technical library — product datasheets and spec sheets in one searchable place. Need another document? Request it from our team.',
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
          <h1>Product specs and datasheets.</h1>
          <p className="rd-sub">
            Find ENVO product datasheets and spec sheets in one searchable place.
          </p>
        </header>

        {/* Section nav — the hub's public entry to its sub-pages (previously
            only reachable via sitemap / direct URL). */}
        <nav className="rd-subnav" aria-label="Resources sections">
          <Link href="/resources/downloads">Downloads &amp; catalogues</Link>
          <Link href="/resources/tools/signage-selector">Signage selector</Link>
          <Link href="/resources/faq">FAQ</Link>
        </nav>

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
              Need an older version, a certificate, a custom datasheet or another file? Tell us the
              model and we&apos;ll send it over.
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
            <h3>Ask our engineers</h3>
            <p>Spec help, compatibility and lead-time questions — our technical team can help.</p>
            <Link className="rd-go" href="/contact">
              Contact us <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
