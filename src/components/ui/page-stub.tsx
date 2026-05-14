import Link from 'next/link'

export type Breadcrumb = { href?: string; label: string }

export function PageStub({
  eyebrow,
  title,
  description,
  breadcrumb,
}: {
  eyebrow: string
  title: string
  description: string
  breadcrumb?: Breadcrumb[]
}) {
  return (
    <div className="theme-light" style={{ minHeight: '70vh' }}>
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          {(breadcrumb ?? []).map((b, i) => (
            <span key={i}>
              <span className="sep">›</span>
              {b.href ? <Link href={b.href}>{b.label}</Link> : <span>{b.label}</span>}
            </span>
          ))}
        </div>
      </div>

      <section className="sig-hero">
        <div className="container">
          <div className="sig-hero-inner">
            <span className="sig-eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
            <p className="sig-hero-desc">{description}</p>
            <p
              style={{
                marginTop: 32,
                padding: '14px 18px',
                background: 'rgba(0,113,188,.06)',
                border: '1px solid rgba(0,113,188,.18)',
                borderRadius: 8,
                fontSize: 13,
                color: 'var(--color-on-light-mute)',
                maxWidth: 620,
              }}
            >
              <strong style={{ color: 'var(--color-on-light)' }}>Coming soon.</strong> This page is
              scaffolded but the full content has not been ported yet.{' '}
              <Link
                href="/"
                style={{ color: 'var(--color-envo-blue)', textDecoration: 'underline' }}
              >
                Back to home
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
