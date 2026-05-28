import Link from 'next/link'
import type { HomeProcessData } from '@/lib/home-page'

const DEFAULT_DATA: HomeProcessData = {
  heading: 'Free Layout Design & Expert Support',
  cta_label: 'Get free layout design',
  cta_url: '/free-layout-design',
  steps: [
    { name: 'Share Your Project',  desc: 'Send us drawings, ideas, or reference photos.' },
    { name: 'Layout & Proposal',   desc: 'Our engineers create a custom layout & proposal.' },
    { name: 'Solution & Quote',    desc: 'We provide the right products and a detailed quotation.' },
    { name: 'Support All the Way', desc: 'We support you from order to installation and beyond.' },
  ],
}

const STEP_ICONS = [
  <svg key={0} viewBox="0 0 24 24" aria-hidden="true">
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M9 7h6M9 11h6M9 15h3" />
    <path d="M16 17l2 2 3-3" />
  </svg>,
  <svg key={1} viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 10h18M9 4v16" />
  </svg>,
  <svg key={2} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
    <path d="M14 3v6h6" />
    <path d="M9 14l2 2 4-4" />
  </svg>,
  <svg key={3} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 14v-3a9 9 0 0 1 18 0v3" />
    <path d="M21 14v4a2 2 0 0 1-2 2h-1v-6h3z" />
    <path d="M3 14v4a2 2 0 0 0 2 2h1v-6H3z" />
  </svg>,
]

const NUMS = ['01', '02', '03', '04']

export function Process({ data }: { data?: HomeProcessData | null }) {
  const d = data ?? DEFAULT_DATA
  const steps = d.steps.length > 0 ? d.steps : DEFAULT_DATA.steps
  return (
    <section className="proc-section">
      <div className="proc-head">
        <h2 className="proc-heading">{d.heading}</h2>
        <Link href={d.cta_url} className="proc-cta">
          {d.cta_label} <span>→</span>
        </Link>
      </div>
      <div className="proc-grid">
        {steps.map((s, i) => (
          <div key={i} className="proc-step">
            <div className="proc-num">{NUMS[i]}</div>
            <div className="proc-icon-wrap">{STEP_ICONS[i]}</div>
            <div className="proc-name">{s.name}</div>
            <div className="proc-desc">{s.desc}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
