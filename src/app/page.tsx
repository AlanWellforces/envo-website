import { Container } from '@/components/layout/container'

export default function HomePage() {
  return (
    <section style={{ padding: '120px 0 80px' }}>
      <Container>
        <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <span
            style={{
              fontSize: 12,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: 'var(--envo-lime)',
            }}
          >
            Phase 2a · scaffold + Version C foundation
          </span>
          <h1 style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.05, color: 'var(--fg)' }}>
            Light that <em style={{ fontStyle: 'normal', color: 'var(--envo-lime)' }}>performs.</em>
          </h1>
          <p style={{ fontSize: 18, color: 'var(--fg-mute)', maxWidth: 560 }}>
            Placeholder homepage. Sidebar nav, light-bin top bar, cursor LED glow, dark theme
            tokens and the c-version (Version C · Sidebar Engineered) style sheet are wired. Real
            hero / impact / products / final-CTA sections come in Phase 2b.
          </p>
          <ul
            style={{
              fontSize: 14,
              color: 'var(--fg-mute)',
              listStyle: 'none',
              padding: 0,
              margin: 0,
              borderTop: '1px solid var(--line)',
              paddingTop: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <li>· Next.js 16 App Router + TypeScript</li>
            <li>· Tailwind v4 (CSS-first @theme) + envo.css (Version C source)</li>
            <li>· Payload CMS installed — /admin reachable once Postgres up</li>
            <li>· Inter Tight via next/font</li>
            <li>· Sidebar collapse state persisted in localStorage</li>
          </ul>
        </div>
      </Container>
    </section>
  )
}
