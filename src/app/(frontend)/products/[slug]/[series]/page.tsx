import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import MergedSeriesPage from '@/components/products/merged/MergedSeriesPage'
import { PRODUCT_FAMILIES, type SeriesLink } from '@/data/product-families'
import { datasheetHref } from '@/lib/asset-url'
import { formatDims } from '@/lib/units'
import { getProduct, getProductsByMarketingFamily, resolveProductImage, type Product } from '@/lib/products'
import { seriesSlug as toSeriesSlug } from '@/data/family-map'
import { buildMergedSeriesProps } from '@/lib/merged-series'
import { buildSkuDetailProps } from '@/lib/sku-detail'
import { COMPLEMENT_FAMILIES, pickRelatedProducts } from '@/lib/related-series'
import { stripCctSuffix } from '@/components/products/catalogue-data'
import { SERIES_EDITORIAL } from '@/data/series-editorial.generated'
import { seriesPurchaseLinks } from '@/data/distributors'

type Params = Promise<{ slug: string; series: string }>

type LiveSeries = Extract<SeriesLink, { slug: string }>

function isLive(s: SeriesLink): s is LiveSeries {
  return s.href !== '#'
}

// Every family gets one SKU detail page per product (signage joined
// 2026-07-08 — its category cards are per-SKU too). Series pages stay and
// always win the URL segment; SKU is the fallback.
const SKU_DETAIL_FAMILIES = new Set(['led-drivers', 'control-gear', 'accessories', 'led-signage-modules'])

export async function generateStaticParams() {
  // DB-driven: every series that has products, across all 4 marketing families —
  // plus one SKU param per product for the spec-driven families.
  const params: { slug: string; series: string }[] = []
  for (const f of ['led-signage-modules', 'led-drivers', 'control-gear', 'accessories']) {
    const products = await getProductsByMarketingFamily(f, { depth: 0 })
    const slugs = new Set(products.map((p) => toSeriesSlug(p.series)))
    for (const s of slugs) params.push({ slug: f, series: s })
    if (SKU_DETAIL_FAMILIES.has(f)) {
      if (f === 'led-signage-modules') {
        // signage detail pages live at the MODEL grain (user 2026-07-09) —
        // one page per stripped code; the CCT-suffixed URLs stay as params
        // only so they can 301 to the model page.
        const codes = new Set(products.map((p) => stripCctSuffix(p.sku)))
        for (const c of codes) params.push({ slug: f, series: encodeURIComponent(c) })
        for (const p of products)
          if (stripCctSuffix(p.sku) !== p.sku) params.push({ slug: f, series: encodeURIComponent(p.sku) })
      } else {
        for (const p of products) params.push({ slug: f, series: encodeURIComponent(p.sku) })
      }
    }
  }
  return params
}

export const dynamicParams = false

// Site-wide share-image fallback — keep in sync with the root layout default.
const DEFAULT_OG_IMAGE = '/assets/images/hero-signage-poster.jpg'

function detailMetadata(title: string, description: string, canonical: string, image = DEFAULT_OG_IMAGE): Metadata {
  return {
    title,
    description,
    alternates: { canonical },
    // Page-level openGraph replaces the root default wholesale — restate siteName/type.
    openGraph: { type: 'website', siteName: 'ENVO', title, description, url: canonical, images: [{ url: image }] },
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, series } = await params
  const family = PRODUCT_FAMILIES.find((f) => f.slug === slug)
  if (!family) return {}
  const canonical = `/products/${slug}/${series}`
  const seriesObj = family.series.find((s): s is LiveSeries => isLive(s) && s.slug === series)
  if (seriesObj) {
    return detailMetadata(`${seriesObj.label} · ${seriesObj.productName} — ENVO`, seriesObj.description, canonical)
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorial = Object.entries(SERIES_EDITORIAL as Record<string, any>).find(
    ([code]) => toSeriesSlug(code) === series,
  )
  if (editorial) return detailMetadata(`${editorial[1].label} — ENVO`, editorial[1].lede, canonical)
  // SKU detail pages (spec-driven families): title on the product itself.
  if (SKU_DETAIL_FAMILIES.has(slug)) {
    const decoded = decodeURIComponent(series)
    if (slug === 'led-signage-modules') {
      // model-grain page — title/canonical on the stripped code (user 2026-07-09)
      const code = stripCctSuffix(decoded)
      const all = await getProductsByMarketingFamily(slug, { depth: 0 })
      const variants = all.filter((p) => stripCctSuffix(p.sku) === code)
      if (variants.length) {
        const rep = variants.find((v) => /-NW$/i.test(v.sku)) ?? variants[0]
        const img = resolveProductImage(rep, DEFAULT_OG_IMAGE)
        // tab/OG title carries the character too, not just the code
        const descriptor = rep.name.replace(/^\s*envo\s+/i, '').trim()
        return detailMetadata(
          `${code} · ${descriptor} — ENVO`,
          rep.short_description ?? `${descriptor} — specifications, datasheet and where to buy.`,
          `/products/${slug}/${encodeURIComponent(code)}`,
          img.src,
        )
      }
    } else {
      const product = await getProduct(decoded)
      if (product) {
        const img = resolveProductImage(product, DEFAULT_OG_IMAGE)
        return detailMetadata(
          `${product.name} — ENVO`,
          product.short_description ?? `${product.name} — specifications, datasheet and where to buy.`,
          canonical,
          img.src,
        )
      }
    }
  }
  return detailMetadata(`${family.name} — ENVO`, family.longDesc, canonical)
}

export default async function SeriesDetailPage({ params }: { params: Params }) {
  const { slug, series } = await params
  const family = PRODUCT_FAMILIES.find((f) => f.slug === slug)
  if (!family) notFound()

  // MiniLux keeps its hand-curated showcase merged page (richest editorial +
  // real specs); every other series renders the same merged template assembled
  // data-driven from live products (see buildMergedSeriesProps).
  if (series === 'mini-series') {
    // Merged single-page detail (one page = the whole MiniLux series). Per-variant
    // table cells prefer live Akeneo values (SKU/lumens/power/dimensions); shared
    // rows + editorial copy are curated real specs (the clean DB nulls these —
    // see memory project_envo-minilux-real-specs / mini-compare-shared-rows-wiring).
    const variantSkus = ['EV-BLML01LBY-NW', 'EV-BLML02LBY-NW', 'EV-BLML03LBY-NW']
    const live = await Promise.all(variantSkus.map((s) => getProduct(s)))
    // "Pairs with" — same concrete-product picks as every other detail page.
    // Sequential fetches on purpose — the dev pooler's connection cap.
    const productsByFamily: Record<string, Product[]> = {}
    for (const f of [slug, ...(COMPLEMENT_FAMILIES[slug] ?? [])]) {
      productsByFamily[f] = await getProductsByMarketingFamily(f, { depth: 0 })
    }
    const related = pickRelatedProducts(slug, live[2] ?? live.find(Boolean) ?? null, productsByFamily)
    // dual units — mm (国标) primary, inches (美标) in parens
    const dims = (pr: Product | null) => {
      const d = formatDims(pr?.length_mm, pr?.width_mm, pr?.height_mm)
      return d ? `${d.mm} (${d.in})` : undefined
    }

    const META = [
      { name: 'Single', beads: 1, img: 'mod-mini-single.png', output: '~ 29 lm', power: '0.24 W', size: '14 × 9 × 9 mm (0.55 × 0.35 × 0.35 in)', bestFor: 'Small letters, outline trim, tight detail' },
      { name: 'Duo', beads: 2, img: 'mod-mini-duo.png', output: '~ 55 lm', power: '0.48 W', size: '25.9 × 9 × 9 mm (1.02 × 0.35 × 0.35 in)', bestFor: 'Standard small-to-mid returns' },
      { name: 'Triple', beads: 3, star: true, img: 'mod-mini-triple.png', output: '~ 85 lm', power: '0.72 W', size: '38.1 × 9 × 9 mm (1.5 × 0.35 × 0.35 in)', bestFor: 'Larger faces, brighter fills, fewer modules' },
    ] as const
    const variants = META.map((m, i) => {
      const pr = live[i]
      return {
        name: m.name,
        beads: m.beads,
        star: 'star' in m ? m.star : undefined,
        image: { src: `/assets/images/${m.img}`, local: true, alt: `MiniLux ${m.name}` },
        modelCode: (pr?.sku ?? `EV-BLML0${m.beads}LBY-NW`).replace(/-NW$/i, ''),
        ledBeads: String(m.beads),
        output: pr?.brightness_lm != null ? `~ ${pr.brightness_lm} lm` : m.output,
        power: pr?.power_w != null ? `${pr.power_w} W` : m.power,
        size: dims(pr) ?? m.size,
        bestFor: m.bestFor,
      }
    })
    const datasheetUrl = datasheetHref(live.find((v) => v?.spec_sheet_url)?.sku ?? variantSkus[2]) ?? undefined
    const img = (src: string, alt: string, cover = false) => ({ src: `/assets/images/${src}`, local: true, alt, cover })

    return (
      <MergedSeriesPage
        breadcrumb={{ familyName: family.name, familyHref: family.href, seriesLabel: 'MiniLux Series' }}
        eyebrow="Signage modules · Backlit"
        title="MiniLux Series"
        heroSubtitle="Ultra-compact backlit modules for small letters and shallow, intricate depths — even spread with no hotspots."
        intro="The compact backlit module for small letters and intricate detail. A 180° × 140° Diamondback lens spreads light evenly with no hotspots, even on shallow returns — silicone-potted to IP66."
        beadtag="MiniLux range · 1–3 LED beads"
        checklist={[
          'Even spread, no hotspots — Diamondback 180° × 140° optic',
          'Silicone-potted IP66 — built for outdoor channel letters',
          'Up to ~40 modules per power-injection feed',
          '50,000-hour L70 rated life',
        ]}
        keySpecs={[
          { icon: 'power', label: 'Power', value: '0.24–0.72 W' },
          { icon: 'vsource', label: 'Input voltage', value: '12 V DC' },
          { icon: 'maxseries', label: 'Max series', value: '40' },
          { icon: 'waterproof', label: 'IP rating', value: 'IP66' },
          // mm line + imperial twin line — shared 9×9 profile once, the
          // varying lengths slash-listed
          { icon: 'dims', label: 'Dimensions', value: 'W9 × H9 × L14/26/38 mm\n(0.35 × 0.35 × 0.55/1.02/1.5 in)' },
          { icon: 'warranty', label: 'Warranty', value: '5 years' },
        ]}
        datasheetUrl={datasheetUrl}
        purchaseLinks={seriesPurchaseLinks('envo_minilux', 'MiniLux')}
        thumbs={[
          // gallery order: combined "All models" (auto-prepended by
          // SeriesGallery) → each product on its own → scene photos last
          { ...img('mod-mini-single.png', 'MiniLux Single'), label: 'Single' },
          { ...img('mod-mini-duo.png', 'MiniLux Duo'), label: 'Duo' },
          { ...img('mod-mini-triple.png', 'MiniLux Triple'), label: 'Triple' },
          img('app-mini-channel-letters.jpg', 'MiniLux in channel letters', true),
          img('app-mini-halo-letters.jpg', 'MiniLux halo-lit letters', true),
        ]}
        variants={variants}
        sharedRows={[
          { label: 'Colour temperature', value: '3000 K · 4000 K · 7000 K' },
          { label: 'Input voltage', value: '12 V DC · constant voltage' },
          { label: 'Beam angle', value: '180° × 140° · Diamondback optic' },
          { label: 'Efficacy', value: '~ 125 lm / W' },
          { label: 'IP rating', value: 'IP66 · silicone-potted' },
          {
            label: 'Operating temp',
            value: (
              <>
                −25 to +60 °C <em className="dim-imp">(−13 to 140 °F)</em>
              </>
            ),
          },
          { label: 'Lifetime', value: '50,000 h · L70' },
          {
            label: 'Certifications',
            value: (
              <span className="certs">
                {['UL', 'cUL', 'CE', 'TÜV', 'RoHS', 'CB', 'LM-80'].map((c) => (
                  <span key={c} className="c">
                    {c}
                  </span>
                ))}
              </span>
            ),
          },
        ]}
        overview={{
          heading: 'Engineered to specify with confidence.',
          body: 'The MiniLux range is one to three binned SMD LEDs behind a Diamondback lens that throws a 180° × 140° beam — so light reaches the face evenly with no scalloping, even on shallow returns and tight radii. Every module is silicone-potted to IP66 and rated for −25 °C to +60 °C, so the same part number performs across climates. Run up to ~40 modules per power-injection point on a 12 V constant-voltage feed.',
        }}
        solutions={[
          { title: 'Channel letters', pick: 'small & intricate faces', image: img('app-mini-channel-letters.jpg', 'Channel letters', true) },
          { title: 'Light boxes', pick: 'even backlight, no hotspots', image: img('app-mini-thin-lightbox.jpg', 'Thin light box', true) },
          { title: 'Outline & trim', pick: 'wide 180°×140° spread', image: img('app-mini-outline-trim.jpg', 'Outline trim', true) },
          { title: 'Outdoor signage', pick: 'IP66 · −25 to +60 °C', image: img('app-mini-hospitality-facade.jpg', 'Hospitality facade', true) },
        ]}
        downloads={[{ name: 'MiniLux datasheet', meta: 'PDF', href: datasheetUrl }]}
        related={related.length ? related : undefined}
      />
    )
  }

  // ── Every other series: generic, data-driven merged page ──
  const all = await getProductsByMarketingFamily(slug, { depth: 0 })
  const products = all.filter((p) => toSeriesSlug(p.series) === series)

  if (products.length === 0) {
    // Not a series slug — try it as a SKU (spec-driven families only). Series
    // always wins the segment; SKU is the fallback. (Design spec §3.)
    if (SKU_DETAIL_FAMILIES.has(slug)) {
      const decoded = decodeURIComponent(series)
      // Signage pages live at the MODEL grain (user 2026-07-09): CCT variants
      // are one page; legacy suffixed URLs 301 to the model page.
      let product: Product | null = null
      let sameSeries: Product[] = []
      if (slug === 'led-signage-modules') {
        const code = stripCctSuffix(decoded)
        if (code !== decoded && all.some((p) => p.sku === decoded)) {
          permanentRedirect(`/products/${slug}/${encodeURIComponent(code)}`)
        }
        const variants = all.filter((p) => stripCctSuffix(p.sku) === code)
        product = variants.find((v) => /-NW$/i.test(v.sku)) ?? variants[0] ?? null
        if (product) {
          const rep = product
          sameSeries = all.filter((p) => toSeriesSlug(p.series) === toSeriesSlug(rep.series))
        }
      } else {
        product = await getProduct(decoded)
        if (product && !all.some((p) => p.sku === product!.sku)) product = null
        if (product) {
          const rep = product
          sameSeries = all.filter((p) => toSeriesSlug(p.series) === toSeriesSlug(rep.series))
        }
      }
      if (product) {
        // "Pairs with" — same complementary-family picks as the series page.
        // Sequential fetches on purpose — the dev pooler's connection cap.
        const productsByFamily: Record<string, Product[]> = { [slug]: all }
        for (const comp of COMPLEMENT_FAMILIES[slug] ?? []) {
          productsByFamily[comp] = await getProductsByMarketingFamily(comp, { depth: 0 })
        }
        const related = pickRelatedProducts(slug, product, productsByFamily)
        return (
          <MergedSeriesPage
            {...buildSkuDetailProps(family, product, sameSeries)}
            related={related.length ? related : undefined}
          />
        )
      }
    }
    notFound()
  }

  // "Pairs with" cards need the complementary families' series lists too.
  // Fetched sequentially on purpose — the dev pooler's connection cap.
  const productsByFamily: Record<string, Product[]> = { [slug]: all }
  for (const comp of COMPLEMENT_FAMILIES[slug] ?? []) {
    productsByFamily[comp] = await getProductsByMarketingFamily(comp, { depth: 0 })
  }
  const related = pickRelatedProducts(slug, products[0], productsByFamily)

  return (
    <MergedSeriesPage
      {...buildMergedSeriesProps(family, products[0].series ?? series, products)}
      related={related.length ? related : undefined}
    />
  )
}
