import { Lines } from './lines'
import type { HomeWhyData } from '@/lib/home-page'

// Pillar icons are fixed in code; CMS rows are matched to them by position.
const PILLAR_ICONS = [
  (
    <>
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M5 3h9l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M8 13h8M8 17h5" />
    </>
  ),
  (
    <>
      <path d="M12 3l7.5 2.8v5.4c0 4.6-3.2 7.4-7.5 8.3-4.3-.9-7.5-3.7-7.5-8.3V5.8z" />
      <path d="M8.8 12l2.2 2.2 4.2-4.2" />
    </>
  ),
  <path key="support" d="M21 11.5a8.4 8.4 0 0 1-9 8.4L3 21l1.1-3.2A8.4 8.4 0 1 1 21 11.5Z" />,
]

const DEFAULT_PILLARS = [
  {
    title: 'In-house engineering',
    desc: 'Binned LEDs, validated thermal design and consistent output batch after batch.',
  },
  {
    title: 'Independently certified',
    desc: 'CE, UL, RoHS and TÜV certifications on selected ranges — specs pass review, installs clear inspection.',
  },
  {
    title: 'End-to-end support',
    desc: 'Free layout design, wattage calculations and responsive technical help.',
  },
]

// Re-verified 2026-07-07 against the product DB (219 visible SKUs; all 73
// visible modules rate lifetime_hrs = 50,000 → 200+ and 50,000h stand as-is).
// Cert coverage is partial, NOT range-wide (CE 172/219, TÜV 107, RoHS 91,
// UL 69), so the cert claims say "selected ranges", not "across the range".
// Editable via the Homepage global (Why ENVO → Stats).
const DEFAULT_STATS = [
  { value: '200+', label: 'catalogue SKUs' },
  { value: '50,000h', label: 'rated module lifetime' },
  { value: '4', label: 'product families' },
  { value: 'CE·UL·TÜV', label: 'certified on selected ranges', lime: true },
]

export function WhyEnvo({ data }: { data?: HomeWhyData }) {
  const pillars = data?.pillars.length ? data.pillars : DEFAULT_PILLARS
  const stats = data?.stats.length ? data.stats : DEFAULT_STATS
  return (
    <section className="wd">
      <div className="v4-wrap">
        <div className="v4-eyebrow">{data?.eyebrow ?? 'Why ENVO'}</div>
        <h2>
          {data?.heading ? (
            <Lines text={data.heading} />
          ) : (
            <>
              Engineered, certified,
              <br />
              supported.
            </>
          )}
        </h2>
        <div className="wd-grid">
          {pillars.map((p, i) => (
            <div className="wd-pillar" key={p.title}>
              <div className="wd-ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {PILLAR_ICONS[i % PILLAR_ICONS.length]}
                </svg>
              </div>
              <h3>{p.title}</h3>
              <p>{p.desc}</p>
            </div>
          ))}
        </div>
        <div className="wd-stats">
          {stats.map((s) => (
            <div className="wd-stat" key={s.label}>
              <div className={s.lime ? 'num lime' : 'num'}>{s.value}</div>
              <div className="lbl">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
