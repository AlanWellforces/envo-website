import { describe, expect, test } from 'vitest'
import { generateMetadata } from './page'

describe('blog tag page metadata', () => {
  test('tag pages are noindex,follow (deliberately excluded from sitemap — not SEO surfaces)', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ tag: 'color' }) })
    expect(meta.robots).toEqual({ index: false, follow: true })
  })

  test('keeps per-tag title and canonical', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ tag: 'color' }) })
    expect(meta.title).toBe('#color — ENVO Blog')
    expect(meta.alternates?.canonical).toBe('/blog/tag/color')
  })
})
