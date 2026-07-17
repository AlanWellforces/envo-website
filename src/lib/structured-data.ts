// JSON-LD (schema.org) builders for SEO. Pure functions → plain objects that a
// server component serialises into <script type="application/ld+json">.
//
// Constraints baked in (see CLAUDE.md copy rules + product-db memory):
//   - NO price / offers. This is a lead-gen site; price_nzd never surfaces.
//     Google's Product structured data is valid without `offers` — it just
//     won't earn a price/merchant rich result, which we don't want anyway.
//   - Brand is "ENVO"; the legal entity is "Envo". Contact contact@envolighting.com.
//   - Certifications only where the SKU actually carries `standards_met` — never
//     a blanket claim (certs cover selected ranges only).
//   - No aggregateRating / review: we have no genuine review data; fabricating
//     it violates Google's guidelines.

import type { Product } from './products'
import { resolveProductImage } from './products'
import { SITE_URL } from './site-url'
import { marketingFamilyToDbFamilies } from '@/data/family-map'

const CONTROL_GEAR_DB_FAMILIES = new Set(marketingFamilyToDbFamilies('control-gear'))

const SITE = SITE_URL.replace(/\/+$/, '')

/** Resolve a path or already-absolute URL to an absolute URL on the site origin. */
export function abs(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  return `${SITE}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`
}

// ---------------------------------------------------------------- Organization

/** Site-wide publisher node. Rendered once in the root layout. */
export function organizationLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE}/#organization`,
    name: 'ENVO',
    legalName: 'Envo',
    url: `${SITE}/`,
    logo: abs('/assets/images/logo-envo.png'),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'contact@envolighting.com',
      url: abs('/contact'),
    },
  }
}

// ---------------------------------------------------------------- Breadcrumb

export type Crumb = { name: string; url?: string }

/** BreadcrumbList from an ordered trail (root → current). */
export function breadcrumbLd(items: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      ...(it.url ? { item: abs(it.url) } : {}),
    })),
  }
}

// ---------------------------------------------------------------- Product specs

type Spec = { name: string; value: string | number; unitText?: string }

/** Map a product's real spec fields to schema PropertyValue nodes. Nulls are
 *  dropped, so a sparse SKU simply emits fewer properties — never blanks. */
export function specProperties(p: Product): Spec[] {
  const ip =
    p.waterproof && /^ip\d+$/i.test(p.waterproof) ? p.waterproof.toUpperCase() : undefined
  const specs: (Spec | null)[] = [
    p.power_w != null ? { name: 'Power', value: p.power_w, unitText: 'W' } : null,
    p.brightness_lm != null ? { name: 'Luminous flux', value: p.brightness_lm, unitText: 'lm' } : null,
    p.efficacy_lm_w != null ? { name: 'Efficacy', value: p.efficacy_lm_w, unitText: 'lm/W' } : null,
    p.cct_k != null ? { name: 'Colour temperature', value: p.cct_k, unitText: 'K' } : null,
    p.cri != null ? { name: 'CRI', value: p.cri } : null,
    p.beam_angle_deg != null ? { name: 'Beam angle', value: p.beam_angle_deg, unitText: '°' } : null,
    ip ? { name: 'Ingress protection', value: ip } : null,
    p.output_voltage_v != null ? { name: 'Output voltage', value: p.output_voltage_v, unitText: 'V' } : null,
    p.input_voltage_min_v != null && p.input_voltage_max_v != null
      ? { name: 'Input voltage', value: `${p.input_voltage_min_v}–${p.input_voltage_max_v}`, unitText: 'V' }
      : null,
    // Control gear carries a stray operation_mode in the PIM data —
    // "Operation mode: Constant voltage" on a gateway is nonsense, so the
    // property is limited to modules and drivers (mirrors merged-series).
    p.operation_mode && !CONTROL_GEAR_DB_FAMILIES.has(p.family ?? '')
      ? { name: 'Operation mode', value: p.operation_mode === 'cc' ? 'Constant current' : p.operation_mode === 'cv' ? 'Constant voltage' : 'CV/CC' }
      : null,
    p.length_mm != null ? { name: 'Length', value: p.length_mm, unitText: 'mm' } : null,
    p.width_mm != null ? { name: 'Width', value: p.width_mm, unitText: 'mm' } : null,
    p.height_mm != null ? { name: 'Height', value: p.height_mm, unitText: 'mm' } : null,
    p.weight_kg != null ? { name: 'Weight', value: p.weight_kg, unitText: 'kg' } : null,
    p.lifetime_hrs != null ? { name: 'Rated lifetime', value: p.lifetime_hrs, unitText: 'h' } : null,
    p.warranty_years != null ? { name: 'Warranty', value: p.warranty_years, unitText: 'yr' } : null,
  ]
  return specs.filter((s): s is Spec => s !== null)
}

function toPropertyValues(specs: Spec[]) {
  return specs.map((s) => ({
    '@type': 'PropertyValue',
    name: s.name,
    value: String(s.value),
    ...(s.unitText ? { unitText: s.unitText } : {}),
  }))
}

// ---------------------------------------------------------------- Product / Group

export type VariantRef = { name: string; sku: string; url: string }

type ProductPageParts = {
  /** Canonical page path, e.g. `/products/led-drivers/EV-SE-15-12US`. */
  url: string
  /** Schema product name (the full PIM name reads well as a schema name). */
  name: string
  description?: string | null
  imageUrl?: string | null
  /** Sibling models in the same series, each with its own canonical page. */
  variants?: VariantRef[]
  /** Series display label for the ProductGroup name, e.g. "Mini Series". */
  seriesName?: string | null
}

/**
 * Build the JSON-LD graph for a single SKU page: the Product itself, its parent
 * ProductGroup (when it has siblings) with the variant relationship wired both
 * ways, and a BreadcrumbList. Returns an array of nodes to render as separate
 * <script> tags.
 */
export function productPageLd(
  product: Product,
  breadcrumb: Crumb[],
  parts: ProductPageParts,
) {
  const productId = `${abs(parts.url)}#product`
  const hasGroup = !!(parts.variants && parts.variants.length > 1)
  const groupId = hasGroup ? `${abs(parts.url)}#productgroup` : undefined

  const image = parts.imageUrl ? abs(parts.imageUrl) : undefined

  const productNode = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': productId,
    name: parts.name,
    sku: product.sku,
    mpn: product.sku,
    brand: { '@type': 'Brand', name: 'ENVO' },
    url: abs(parts.url),
    ...(image ? { image } : {}),
    ...(parts.description ? { description: parts.description } : {}),
    ...(groupId ? { isVariantOf: { '@type': 'ProductGroup', '@id': groupId } } : {}),
    additionalProperty: toPropertyValues(specProperties(product)),
  }

  const nodes: object[] = [productNode]

  if (hasGroup && groupId) {
    nodes.push({
      '@context': 'https://schema.org',
      '@type': 'ProductGroup',
      '@id': groupId,
      name: parts.seriesName ? `ENVO ${parts.seriesName}` : parts.name,
      url: abs(parts.url),
      brand: { '@type': 'Brand', name: 'ENVO' },
      ...(image ? { image } : {}),
      ...(parts.description ? { description: parts.description } : {}),
      hasVariant: parts.variants!.map((v) => ({
        '@type': 'Product',
        name: v.name,
        sku: v.sku,
        url: abs(v.url),
        brand: { '@type': 'Brand', name: 'ENVO' },
      })),
    })
  }

  nodes.push(breadcrumbLd(breadcrumb))
  return nodes
}

/** Convenience: pull the best image for a product as an absolute URL. */
export function productImageUrl(product: Product): string | null {
  const { src } = resolveProductImage(product, '')
  return src ? abs(src) : null
}
