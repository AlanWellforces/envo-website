// src/app/(frontend)/resources/tools/signage-selector/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { getProductsForSelector } from '@/lib/product-selector'
import { SIGNAGE_SELECTOR } from '@/data/selector-config'
import { ProductSelectorTable } from '@/components/resources/ProductSelectorTable'

export const metadata: Metadata = {
  title: 'Signage module selector — ENVO',
  description:
    'Filter ENVO signage LED modules by output, beam, colour temperature, ingress rating and size, then download the datasheet.',
}

// Akeneo data changes only on sync — revalidate hourly.
export const revalidate = 3600

export default async function SignageSelectorPage() {
  const rows = await getProductsForSelector('signage')

  return (
    <div className="theme-light">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/resources">Resources</Link>
          <span className="sep">›</span>
          <Link href="/resources/tools">Tools</Link>
          <span className="sep">›</span>
          <span>Signage selector</span>
        </div>
        <h1>{SIGNAGE_SELECTOR.title}</h1>
        <p>{SIGNAGE_SELECTOR.intro}</p>
        <ProductSelectorTable rows={rows} config={SIGNAGE_SELECTOR} />
      </div>
    </div>
  )
}
