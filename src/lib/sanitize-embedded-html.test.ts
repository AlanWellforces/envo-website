import { describe, it, expect } from 'vitest'
import { sanitizeEmbeddedHtml } from './sanitize-embedded-html'

describe('sanitizeEmbeddedHtml', () => {
  it('strips <script> entirely, keeping surrounding layout', () => {
    const out = sanitizeEmbeddedHtml('<div class="wrap"><script>alert(1)</script><p>hi</p></div>')
    expect(out).not.toContain('script')
    expect(out).not.toContain('alert')
    expect(out).toContain('<div class="wrap"><p>hi</p></div>')
  })

  it('strips event-handler attributes', () => {
    const out = sanitizeEmbeddedHtml('<img src="https://x.test/a.png" onerror="alert(1)" alt="a">')
    expect(out).not.toContain('onerror')
    expect(out).toContain('src="https://x.test/a.png"')
  })

  it('strips javascript: hrefs but keeps https links', () => {
    expect(sanitizeEmbeddedHtml('<a href="javascript:alert(1)">x</a>')).not.toContain('javascript')
    expect(sanitizeEmbeddedHtml('<a href="https://envolighting.com/contact">x</a>')).toContain(
      'href="https://envolighting.com/contact"',
    )
  })

  it('keeps relative links and mailto', () => {
    expect(sanitizeEmbeddedHtml('<a href="/contact">x</a>')).toContain('href="/contact"')
    expect(sanitizeEmbeddedHtml('<a href="mailto:contact@envolighting.com">x</a>')).toContain('mailto:')
  })

  it('strips iframes, forms and inputs', () => {
    const out = sanitizeEmbeddedHtml('<iframe src="https://evil.test"></iframe><form><input value="x"></form><p>ok</p>')
    expect(out).not.toContain('iframe')
    expect(out).not.toContain('form')
    expect(out).not.toContain('input')
    expect(out).toContain('<p>ok</p>')
  })

  it('keeps layout structure: tables, headings, figure, class attributes', () => {
    const html =
      '<section class="specs"><h3>Specs</h3><table><tbody><tr><td>IP66</td></tr></tbody></table><figure><img src="/img.png" alt=""><figcaption>c</figcaption></figure></section>'
    // Output is re-serialized (img self-closes) but structurally identical.
    expect(sanitizeEmbeddedHtml(html)).toBe(html.replace('alt="">', 'alt="" />'))
  })

  it('keeps benign inline styles but drops position/z-index overlay tricks', () => {
    const out = sanitizeEmbeddedHtml('<div style="color: red; position: fixed; text-align: center">x</div>')
    expect(out).toContain('color:red')
    expect(out).toContain('text-align:center')
    expect(out).not.toContain('position')
  })

  it('handles empty and non-html input', () => {
    expect(sanitizeEmbeddedHtml('')).toBe('')
    expect(sanitizeEmbeddedHtml('plain text')).toBe('plain text')
  })
})
