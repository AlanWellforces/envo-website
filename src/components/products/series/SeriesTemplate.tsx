'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { SeriesTemplateProps } from '@/lib/series-template'
import styles from './SeriesTemplate.module.css'

type Tab = 'overview' | 'specs' | 'solutions'

export default function SeriesTemplate(props: SeriesTemplateProps) {
  const [tab, setTab] = useState<Tab>('overview')
  const { label, headline, lede, stats, features, solutions, models, specs, heroImage } = props

  return (
    <div className={styles.seriesTpl}>
      <div className={styles.subnav}>
        <span className={styles.path}>{label}</span>
        <nav className={styles.tabs}>
          <button className={tab === 'overview' ? styles.active : ''} onClick={() => setTab('overview')}>Overview</button>
          <button className={tab === 'specs' ? styles.active : ''} onClick={() => setTab('specs')}>Specs</button>
          <button className={tab === 'solutions' ? styles.active : ''} onClick={() => setTab('solutions')}>Solutions</button>
        </nav>
      </div>

      {tab === 'overview' && (
        <section className={styles.pane}>
          {props.aiDraft && <div className={styles.draftFlag}>🟡 AI draft — pending review</div>}
          <h1 className={styles.h1}>{headline}</h1>
          <p className={styles.lede}>{lede}</p>
          <div className={styles.stats}>
            {stats.map((s) => (
              <div key={s.label} className={styles.stat}><strong>{s.value}</strong><span>{s.label}</span></div>
            ))}
          </div>
          {heroImage.src && (
            <div className={styles.heroImg}>
              {heroImage.isLocal
                ? <Image src={heroImage.src} alt={heroImage.alt} width={520} height={360} />
                : <img src={heroImage.src} alt={heroImage.alt} />}
            </div>
          )}
          <div className={styles.featureGrid}>
            {features.map((f) => (
              <div key={f.title} className={styles.featureCard}><h3>{f.title}</h3><p>{f.note}</p></div>
            ))}
          </div>
        </section>
      )}

      {tab === 'specs' && (
        <section className={styles.pane}>
          <h2 className={styles.h2}>Pick a model. Pick a colour.</h2>
          {specs.cctOptions.length > 0 && (
            <div className={styles.cctRow}>
              <span className={styles.cctLabel}>COLOUR TEMP · ALL MODELS</span>
              <div className={styles.cctPills}>
                {specs.cctOptions.map((c) => <span key={c}>{c.replace('=', ' · ')}</span>)}
              </div>
              <span className={styles.cctNote}>Same module, different colours — not separate products.</span>
            </div>
          )}
          <table className={styles.table}>
            <thead>
              <tr><th>Model</th><th>LED</th><th>Power</th><th>Output</th><th>Size (mm)</th><th>Datasheet</th></tr>
            </thead>
            <tbody>
              {models.map((m) => (
                <tr key={m.code}>
                  <td className={styles.modelCode}>{m.code}</td>
                  <td>{m.leds}</td>
                  <td>{m.powerW != null ? `${m.powerW} W` : '—'}</td>
                  <td>{m.lumens != null ? `${m.lumens} lm` : '—'}</td>
                  <td>{m.dimsMm ?? '—'}</td>
                  <td>{m.datasheetUrl ? <a href={m.datasheetUrl} target="_blank" rel="noreferrer">PDF →</a> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className={styles.specFoot}>
            All models · {[specs.beamDeg && `${specs.beamDeg}° beam`, specs.ip, specs.voltsDc && `${specs.voltsDc} V DC`, specs.lifetimeHrs && `${specs.lifetimeHrs.toLocaleString()} h`, ...specs.certs].filter(Boolean).join(' · ')}
          </p>
        </section>
      )}

      {tab === 'solutions' && (
        <section className={styles.pane}>
          <h2 className={styles.h2}>Where {label.replace(/ Series$/, '')} fits.</h2>
          <div className={styles.solGrid}>
            {solutions.map((s) => (
              <div key={s.title} className={styles.solCard}>
                <div className={styles.solImg}>SCENE PHOTO — TBD</div>
                <h3>{s.title}</h3>
                <p>{s.pick}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
