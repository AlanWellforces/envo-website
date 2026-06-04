import Image from 'next/image'
import Link from 'next/link'
import { EnvoButton } from '@/components/ui/envo-button'
import { SOLUTIONS } from '@/data/solutions'
import styles from './SolutionDetail.module.css'

type FamilyLink = { label: string; href: string }

// Product families that typically serve each solution — surfaced as quick links.
const FAMILIES_BY_SOLUTION: Record<string, FamilyLink[]> = {
  'signage-lighting': [
    { label: 'Signage Modules', href: '/products/led-signage-modules' },
    { label: 'LED Drivers', href: '/products/led-drivers' },
    { label: 'Control Gear', href: '/products/control-gear' },
  ],
  'architectural-lighting': [
    { label: 'LED Drivers', href: '/products/led-drivers' },
    { label: 'Control Gear', href: '/products/control-gear' },
    { label: 'Accessories', href: '/products/accessories' },
  ],
}

export function SolutionDetail({ slug, headline }: { slug: string; headline: string }) {
  const solution = SOLUTIONS.find((s) => s.slug === slug)
  if (!solution) return null
  const families = FAMILIES_BY_SOLUTION[slug] ?? []

  return (
    <div className="theme-light">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">›</span>
          <Link href="/solutions">Solutions</Link>
          <span className="sep">›</span>
          <span>{solution.name}</span>
        </div>

        <section className={styles.hero}>
          <span className={styles.eyebrow}>Solutions · {solution.name}</span>
          <h1 className={styles.title}>{headline}</h1>
          <p className={styles.desc}>{solution.longDesc}</p>
        </section>

        <div className={styles.imageBand}>
          <Image src={solution.img} alt={solution.name} fill sizes="(min-width: 1200px) 1100px, 100vw" />
        </div>

        <section className={styles.applies}>
          <h2 className={styles.appliesTitle}>Built from the ENVO system.</h2>
          <p className={styles.appliesLede}>
            Every {solution.name.toLowerCase()} project is specified from the same engineered range —
            modules, drivers and control matched to the install.
          </p>
          <div className={styles.famRow}>
            {families.map((f) => (
              <Link key={f.href} href={f.href} className={styles.famChip}>{f.label}</Link>
            ))}
          </div>
        </section>
      </div>

      <section className={styles.ctaBand}>
        <div className="container">
          <h2 className={styles.ctaTitle}>Planning a {solution.name.toLowerCase()} project?</h2>
          <p className={styles.ctaDesc}>
            Send us a sketch for a free layout design, or talk to an ENVO engineer.
          </p>
          <div className={styles.ctaRow}>
            <EnvoButton href="/free-layout-design" variant="primary" arrow>Get free layout design</EnvoButton>
            <EnvoButton href="/contact" variant="ghost">Talk to engineering</EnvoButton>
          </div>
        </div>
      </section>
    </div>
  )
}
