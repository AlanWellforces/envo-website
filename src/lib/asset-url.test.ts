import { describe, expect, test } from 'vitest'
import { isAllowedAssetUrl, resolveAssetUrl } from './asset-url'

describe('isAllowedAssetUrl', () => {
  test('allows a resolved relative asset key (always lands on the bucket host)', () => {
    const src = resolveAssetUrl('e/d/d/8/abc123_ENC.pdf')
    expect(src).not.toBeNull()
    expect(isAllowedAssetUrl(src!)).toBe(true)
  })

  test('allows an absolute URL on the bucket host regardless of case', () => {
    const src = resolveAssetUrl('x/y/z.pdf')!
    const upper = src.replace(/^https:\/\/([^/]+)/, (_, host: string) => `https://${host.toUpperCase()}`)
    expect(isAllowedAssetUrl(upper)).toBe(true)
  })

  test('rejects arbitrary external hosts', () => {
    expect(isAllowedAssetUrl('https://evil.example.com/steal.pdf')).toBe(false)
  })

  test('rejects private/internal network targets', () => {
    expect(isAllowedAssetUrl('http://169.254.169.254/latest/meta-data/')).toBe(false)
    expect(isAllowedAssetUrl('http://localhost:3000/api/admin')).toBe(false)
    expect(isAllowedAssetUrl('http://10.0.0.5/internal')).toBe(false)
  })

  test('rejects the bucket host over plain http (protocol downgrade)', () => {
    const src = resolveAssetUrl('x/y/z.pdf')!
    expect(isAllowedAssetUrl(src.replace(/^https:/, 'http:'))).toBe(false)
  })

  test('rejects the bucket host with an explicit non-default port', () => {
    const src = resolveAssetUrl('x/y/z.pdf')!
    const withPort = src.replace(/^https:\/\/([^/]+)/, 'https://$1:8443')
    expect(isAllowedAssetUrl(withPort)).toBe(false)
  })

  test('rejects strings that are not valid URLs', () => {
    expect(isAllowedAssetUrl('not a url')).toBe(false)
    expect(isAllowedAssetUrl('')).toBe(false)
  })
})
