import { describe, it, expect } from 'vitest'
import { optimizeMockupImages, MOCKUP_BODY_FOR_TESTS } from './MiniSeriesPage'

describe('optimizeMockupImages', () => {
  it('rewrites every /assets/images src to the Next optimizer endpoint', () => {
    const out = optimizeMockupImages(MOCKUP_BODY_FOR_TESTS)
    // No raw asset srcs may survive — they'd serve original multi-hundred-KB files.
    expect(out).not.toMatch(/src="\/assets\/images\//)
    // And the rewritten form is present.
    expect(out).toMatch(/src="\/_next\/image\?url=%2Fassets%2Fimages%2F/)
  })

  it('uses only widths allowed by next.config (deviceSizes/imageSizes)', () => {
    const out = optimizeMockupImages(MOCKUP_BODY_FOR_TESTS)
    const widths = [...out.matchAll(/[?&]w=(\d+)/g)].map((m) => Number(m[1]))
    expect(widths.length).toBeGreaterThan(0)
    // Next's defaults: deviceSizes [640,750,828,1080,1200,1920,2048,3840],
    // imageSizes [16,32,48,64,96,128,256,384]. Unknown widths 400 at runtime.
    const allowed = new Set([16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840])
    for (const w of widths) expect(allowed).toContain(w)
  })

  it('leaves non-asset srcs and other attributes alone', () => {
    const html = '<img src="https://example.com/x.png" alt="a"><img loading="lazy" src="/assets/images/y.png" alt="b">'
    const out = optimizeMockupImages(html)
    expect(out).toContain('src="https://example.com/x.png"')
    expect(out).toContain('loading="lazy"')
    expect(out).toContain('alt="b"')
  })
})
