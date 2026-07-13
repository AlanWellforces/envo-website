import { describe, expect, it } from 'vitest'
import { relativeMediaUrl } from './media-url'

describe('relativeMediaUrl', () => {
  it('strips the origin from an absolute Payload media URL (the prod bug)', () => {
    expect(relativeMediaUrl('https://envolighting.com/api/media/file/blog-cover.jpg')).toBe(
      '/api/media/file/blog-cover.jpg',
    )
  })

  it('strips any origin, not just prod (serverURL varies per env)', () => {
    expect(relativeMediaUrl('http://localhost:3000/api/media/file/a.png')).toBe(
      '/api/media/file/a.png',
    )
  })

  it('keeps the query string', () => {
    expect(relativeMediaUrl('https://envolighting.com/api/media/file/a.jpg?v=2')).toBe(
      '/api/media/file/a.jpg?v=2',
    )
  })

  it('leaves an already-relative media path unchanged', () => {
    expect(relativeMediaUrl('/api/media/file/blog-cover.jpg')).toBe(
      '/api/media/file/blog-cover.jpg',
    )
  })

  it('leaves other hosts (Akeneo S3) unchanged', () => {
    const s3 = 'https://wellforces-akeneo-pim.s3.ap-southeast-2.amazonaws.com/e/d/d/8/x.jpg'
    expect(relativeMediaUrl(s3)).toBe(s3)
  })

  it('leaves same-origin non-media URLs unchanged', () => {
    expect(relativeMediaUrl('https://envolighting.com/blog/some-post')).toBe(
      'https://envolighting.com/blog/some-post',
    )
  })

  it('returns null for null/undefined/empty', () => {
    expect(relativeMediaUrl(null)).toBeNull()
    expect(relativeMediaUrl(undefined)).toBeNull()
    expect(relativeMediaUrl('')).toBeNull()
  })
})
