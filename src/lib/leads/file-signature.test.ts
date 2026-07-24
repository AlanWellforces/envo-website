import { describe, it, expect } from 'vitest'
import { detectType, isAllowedUpload } from './file-signature'

const bytes = (...b: number[]) => new Uint8Array([...b, ...new Array(16).fill(0)])
const ascii = (s: string) => new Uint8Array([...s].map((c) => c.charCodeAt(0)).concat(new Array(16).fill(0)))

describe('detectType', () => {
  it('detects real signatures', () => {
    expect(detectType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('jpg')
    expect(detectType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe('png')
    expect(detectType(ascii('GIF89a'))).toBe('gif')
    expect(detectType(ascii('%PDF-1.7'))).toBe('pdf')
    expect(detectType(ascii('AC1027'))).toBe('dwg')
  })

  it('detects WEBP (RIFF….WEBP)', () => {
    const b = new Uint8Array(16)
    ;'RIFF'.split('').forEach((c, i) => (b[i] = c.charCodeAt(0)))
    ;'WEBP'.split('').forEach((c, i) => (b[8 + i] = c.charCodeAt(0)))
    expect(detectType(b)).toBe('webp')
  })

  it('rejects a renamed executable / unknown binary', () => {
    expect(detectType(bytes(0x4d, 0x5a, 0x90, 0x00))).toBeNull() // MZ = Windows PE
    expect(detectType(bytes(0x7f, 0x45, 0x4c, 0x46))).toBeNull() // ELF
  })

  it('rejects SVG and HTML (text, no binary signature)', () => {
    expect(detectType(ascii('<svg xmlns="http://www.w3.org/2000/svg"><script>'))).toBeNull()
    expect(detectType(ascii('<!DOCTYPE html><script>alert(1)</script>'))).toBeNull()
  })

  it('rejects too-short buffers', () => {
    expect(detectType(new Uint8Array([0xff, 0xd8]))).toBeNull()
  })

  it('isAllowedUpload mirrors detectType != null', () => {
    expect(isAllowedUpload(ascii('%PDF-1.4'))).toBe(true)
    expect(isAllowedUpload(ascii('<svg><script/></svg>'))).toBe(false)
  })
})
