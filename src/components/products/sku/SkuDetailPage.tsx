import Link from 'next/link'
import Image from 'next/image'
import { SpecCompareTable } from './SpecCompareTable'
import type { SkuDetailProps } from '@/lib/sku-detail'
import './sku-detail.css'

export default function SkuDetailPage(props: SkuDetailProps) {
  const { breadcrumb, sku, name, image, coreSpecs, datasheetUrl, compare } = props
  return (
    <div className="theme-light pcat">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link><span className="sep">›</span>
          <Link href="/products">Products</Link><span className="sep">›</span>
          <Link href={breadcrumb.familyHref}>{breadcrumb.familyName}</Link><span className="sep">›</span>
          <span>{sku}</span>
        </div>

        <div className="sku-hero">
          <div className="sku-hero-media">
            {image.local
              ? <Image src={image.src} alt={image.alt} width={520} height={420} sizes="(max-width:720px) 100vw, 460px" />
              : /* eslint-disable-next-line @next/next/no-img-element */
                <img src={image.src} alt={image.alt} />}
          </div>
          <div className="sku-hero-body">
            <div className="sku-eyebrow">{breadcrumb.familyName} · {sku}</div>
            <h1 className="sku-name">{name}</h1>
            {coreSpecs.length > 0 && (
              <dl className="sku-specs">
                {coreSpecs.map((s) => (<div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>))}
              </dl>
            )}
            <div className="sku-cta">
              {datasheetUrl && <a className="sku-btn-blue" href={datasheetUrl} target="_blank" rel="noopener">↓ Datasheet (PDF)</a>}
              <Link className="sku-btn-outline" href="/contact">Ask our engineers</Link>
            </div>
          </div>
        </div>

        {compare.layout !== 'none' && (
          <section className="sku-section">
            <h2>Compare the series</h2>
            <SpecCompareTable compare={{ layout: compare.layout, columns: compare.columns.map((c) => ({ key: c.key, label: c.label })), rows: compare.rows, currentSku: compare.currentSku }} />
          </section>
        )}
      </div>
    </div>
  )
}
