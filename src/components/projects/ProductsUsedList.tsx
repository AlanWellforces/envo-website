// Server component: resolves each SKU via Akeneo-backed getProduct().
// SKUs that don't resolve render as a muted pill — protects against rot.

import Image from 'next/image'
import { getProduct, resolveProductImage } from '@/lib/products'
import { datasheetHref } from '@/lib/asset-url'

type Props = { skus: string[] }

export async function ProductsUsedList({ skus }: Props) {
  if (skus.length === 0) return null

  const items = await Promise.all(
    skus.map(async (sku) => ({ sku, product: await getProduct(sku) })),
  )

  return (
    <section className="products-used">
      <h2 className="products-used-heading">Products used</h2>
      <ul className="products-used-grid">
        {items.map(({ sku, product }) => {
          if (!product) {
            return (
              <li key={sku} className="products-used-item products-used-item-muted">
                <span className="products-used-sku">ENVO {sku}</span>
                <span className="products-used-status">SKU not in catalog</span>
              </li>
            )
          }
          const img = resolveProductImage(product, '')
          return (
            <li key={sku} className="products-used-item">
              <div className="products-used-thumb">
                {img.src &&
                  (img.isLocal ? (
                    <Image src={img.src} alt={img.alt} width={200} height={200} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img.src} alt={img.alt} loading="lazy" />
                  ))}
              </div>
              <div className="products-used-body">
                <div className="products-used-name">{product.name ?? product.sku}</div>
                <div className="products-used-sku">{product.sku}</div>
                {product.spec_sheet_url && (
                  <a
                    href={datasheetHref(product.sku)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="products-used-link"
                  >
                    Datasheet PDF ↗
                  </a>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
