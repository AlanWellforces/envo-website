import { describe, it, expect } from 'vitest'
import { resolveProductImage, type Product } from './products'

const base = {
  name: 'Test',
  clean_image: null,
  image: null,
  clean_image_url_fallback: null,
  image_url_fallback: null,
} as unknown as Product

const resolve = (over: Partial<Record<string, unknown>>) =>
  resolveProductImage({ ...base, ...over } as Product, '/fallback.png')

describe('resolveProductImage', () => {
  it('clean Payload upload wins over the clean Akeneo URL', () => {
    const r = resolve({
      clean_image: { url: '/api/media/file/a.png', alt: 'edited' },
      clean_image_url_fallback: 'https://s3.example/x.jpg',
    })
    expect(r).toEqual({ src: '/api/media/file/a.png', isLocal: true, alt: 'edited' })
  })

  it('clean beats regular even when the regular one is an upload', () => {
    const r = resolve({
      clean_image_url_fallback: 'https://s3.example/x.jpg',
      image: { url: '/api/media/file/b.png' },
    })
    expect(r).toEqual({ src: 'https://s3.example/x.jpg', isLocal: false, alt: 'Test' })
  })

  it('regular Payload upload wins over the regular Akeneo URL', () => {
    const r = resolve({
      image: { url: '/api/media/file/b.png' },
      image_url_fallback: 'https://s3.example/y.jpg',
    })
    expect(r).toEqual({ src: '/api/media/file/b.png', isLocal: true, alt: 'Test' })
  })

  it('falls back to the Akeneo URL when no uploads exist', () => {
    const r = resolve({ image_url_fallback: 'https://s3.example/y.jpg' })
    expect(r).toEqual({ src: 'https://s3.example/y.jpg', isLocal: false, alt: 'Test' })
  })

  it('falls back to the series Git asset when nothing is set', () => {
    expect(resolve({})).toEqual({ src: '/fallback.png', isLocal: true, alt: 'Test' })
  })
})
